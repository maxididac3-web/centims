// src/routes/transactions.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { processBuy, processSell, calculatePrice } = require('../utils/bondingCurve');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const SELL_SPREAD = 0.015; // 1.5%

// ============================================
// POST /transactions/buy
// Comprar fraccions d'un producte
// ============================================
router.post('/buy', authMiddleware, async (req, res) => {
  try {
    const { productId, amountEUR } = req.body;
    const userId = req.user.id;

    // Validacions
    if (!productId || !amountEUR) {
      return res.status(400).json({
        error: 'ProductId i amountEUR són obligatoris.'
      });
    }

    if (amountEUR <= 0) {
      return res.status(400).json({
        error: "L'import ha de ser positiu."
      });
    }

    if (amountEUR < 0.01) {
      return res.status(400).json({
        error: "L'import mínim és 0.01€."
      });
    }

    // Obtenir usuari actualitzat
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Verificar saldo
    if (user.balanceEUR < amountEUR) {
      return res.status(400).json({
        error: `Saldo insuficient. Tens ${user.balanceEUR.toFixed(2)}€`
      });
    }

    // Obtenir producte
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        error: 'Producte no trobat o inactiu.'
      });
    }

    // Calcular la compra
    const result = processBuy(amountEUR, product);
    const priceBefore = calculatePrice(product.p0, product.k, product.supply);

    // Executar tot en una transacció SQL
    const [updatedUser, updatedProduct, transaction] = await prisma.$transaction([

      // 1. Descomptar EUR a l'usuari
      prisma.user.update({
        where: { id: userId },
        data: {
          balanceEUR: { decrement: amountEUR }
        }
      }),

      // 2. Actualitzar supply del producte
      prisma.product.update({
        where: { id: parseInt(productId) },
        data: {
          supply: result.newSupply
        }
      }),

      // 3. Crear registre de transacció
      prisma.transaction.create({
        data: {
          userId,
          productId: parseInt(productId),
          type: 'BUY',
          status: 'COMPLETED',
          amountEUR,
          fractions: result.userFractions,
          adminFractions: result.adminFractions,
          priceAtTime: priceBefore,
          supplyBefore: product.supply,
          supplyAfter: result.newSupply,
          completedAt: new Date(),
        }
      }),
    ]);

    // 4. Actualitzar o crear portfolio
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: parseInt(productId),
        }
      }
    });

    if (existingPortfolio) {
      const newFractions = existingPortfolio.fractions + result.userFractions;
      const newInvested = existingPortfolio.investedEUR + amountEUR;
      await prisma.portfolio.update({
        where: {
          userId_productId: {
            userId,
            productId: parseInt(productId),
          }
        },
        data: {
          fractions: newFractions,
          investedEUR: newInvested,
          avgPrice: newInvested / newFractions,
        }
      });
    } else {
      await prisma.portfolio.create({
        data: {
          userId,
          productId: parseInt(productId),
          fractions: result.userFractions,
          investedEUR: amountEUR,
          avgPrice: result.avgPurchasePrice,
        }
      });
    }

    // 5. Actualitzar buffer admin
    const existingBuffer = await prisma.adminBuffer.findUnique({
      where: { productId: parseInt(productId) }
    });

    if (existingBuffer) {
      await prisma.adminBuffer.update({
        where: { productId: parseInt(productId) },
        data: {
          fractions: { increment: result.adminFractions }
        }
      });
    } else {
      await prisma.adminBuffer.create({
        data: {
          productId: parseInt(productId),
          fractions: result.adminFractions,
        }
      });
    }

    // 6. Guardar historial de preus
    await prisma.priceHistory.create({
      data: {
        productId: parseInt(productId),
        price: result.newPrice,
        supply: result.newSupply,
      }
    });

    return res.status(200).json({
      message: 'Compra realitzada correctament!',
      transaction: {
        id: transaction.id,
        type: 'BUY',
        amountEUR,
        userFractions: result.userFractions,
        adminFractions: result.adminFractions,
        priceBefore,
        priceAfter: result.newPrice,
        supplyBefore: product.supply,
        supplyAfter: result.newSupply,
      },
      newBalance: updatedUser.balanceEUR,
    });

  } catch (error) {
    console.error('Error buy:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

// ============================================
// POST /transactions/sell
// Vendre fraccions d'un producte
// ============================================
router.post('/sell', authMiddleware, async (req, res) => {
  try {
    const { productId, fractions } = req.body;
    const userId = req.user.id;

    // Validacions
    if (!productId || !fractions) {
      return res.status(400).json({
        error: 'ProductId i fractions són obligatoris.'
      });
    }

    if (fractions <= 0) {
      return res.status(400).json({
        error: 'Les fraccions han de ser positives.'
      });
    }

    // Obtenir producte
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        error: 'Producte no trobat o inactiu.'
      });
    }

    // Obtenir portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: parseInt(productId),
        }
      }
    });

    if (!portfolio || portfolio.fractions < fractions) {
      return res.status(400).json({
        error: `No tens suficients fraccions. Tens ${portfolio?.fractions || 0}`
      });
    }

    // Calcular la venda
    const result = processSell(fractions, product);
    const priceBefore = calculatePrice(product.p0, product.k, product.supply);
    
    // Aplicar spread (1.5%)
    const grossEUR = result.eurRecovered;
    const spreadEUR = grossEUR * SELL_SPREAD;
    const netEUR = grossEUR - spreadEUR;

    // Trobar admin (role = ADMIN)
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      return res.status(500).json({
        error: 'No s\'ha trobat l\'admin del sistema'
      });
    }

    // Executar tot en una transacció SQL
    const [updatedUser, updatedProduct, transaction, updatedAdmin] = await prisma.$transaction([

      // 1. Afegir EUR NET a l'usuari (descomptant spread)
      prisma.user.update({
        where: { id: userId },
        data: {
          balanceEUR: { increment: netEUR }
        }
      }),

      // 2. Actualitzar supply del producte
      prisma.product.update({
        where: { id: parseInt(productId) },
        data: {
          supply: result.newSupply
        }
      }),

      // 3. Crear registre de transacció
      prisma.transaction.create({
        data: {
          userId,
          productId: parseInt(productId),
          type: 'SELL',
          status: 'COMPLETED',
          fractions,
          eurRecovered: netEUR,
          priceAtTime: priceBefore,
          supplyBefore: product.supply,
          supplyAfter: result.newSupply,
          completedAt: new Date(),
        }
      }),
      
      // 4. Spread va directe al compte EMPRESA de l'admin
      prisma.user.update({
        where: { id: admin.id },
        data: {
          adminBalanceEUR: { increment: spreadEUR },
          adminSpreadEarned: { increment: spreadEUR }
        }
      }),
    ]);

    // 5. Actualitzar portfolio (o esborrar si queda a 0)
    const remainingFractions = portfolio.fractions - fractions;
    const proportionSold = fractions / portfolio.fractions;
    const investedSold = portfolio.investedEUR * proportionSold;
    const remainingInvested = portfolio.investedEUR - investedSold;

    if (remainingFractions < 0.01) {
      await prisma.portfolio.delete({
        where: {
          userId_productId: {
            userId,
            productId: parseInt(productId),
          }
        }
      });
    } else {
      await prisma.portfolio.update({
        where: {
          userId_productId: {
            userId,
            productId: parseInt(productId),
          }
        },
        data: {
          fractions: remainingFractions,
          investedEUR: remainingInvested,
          avgPrice: remainingInvested / remainingFractions,
        }
      });
    }

    // 6. Guardar historial de preus
    await prisma.priceHistory.create({
      data: {
        productId: parseInt(productId),
        price: result.newPrice,
        supply: result.newSupply,
      }
    });

    return res.status(200).json({
      message: 'Venda realitzada correctament!',
      transaction: {
        id: transaction.id,
        type: 'SELL',
        fractions,
        grossEUR,
        spreadEUR,
        netEUR,
        priceBefore,
        priceAfter: result.newPrice,
        supplyBefore: product.supply,
        supplyAfter: result.newSupply,
      },
      newBalance: updatedUser.balanceEUR,
    });

  } catch (error) {
    console.error('Error sell:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

// ============================================
// GET /transactions
// Historial de transaccions de l'usuari
// ============================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              name: true,
              emoji: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({
        where: { userId }
      }),
    ]);

    return res.status(200).json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      }
    });

  } catch (error) {
    console.error('Error transactions:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

module.exports = router;