// src/routes/admin.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { calculatePrice, processSell } = require('../utils/bondingCurve');
const { grantCreatorReward } = require('../services/tokenmanagement');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();
const prisma = new PrismaClient();

// SUBSTITUIR GET /admin/dashboard (línia ~12-130) a centims-backend/src/routes/admin.js

// ============================================
// GET /admin/dashboard
// Resum global del sistema
// ============================================
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Estadístiques generals
    const [
      totalUsers,
      totalTransactions,
      totalProducts,
      recentTransactions,
      allBuffers,
      allProducts,
      adminUser,
      allUsers,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.transaction.count(), // Compte TOTES les transaccions
      prisma.product.count({ where: { isActive: true } }),
      prisma.transaction.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { name: true, emoji: true } },
        }
      }),
      prisma.adminBuffer.findMany({
        include: { product: true }
      }),
      prisma.product.findMany({
        where: { isActive: true }
      }),
      prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: {
          balanceEUR: true,
          adminBalanceEUR: true,
          adminSpreadEarned: true,
          adminCapitalInjected: true,
        }
      }),
      prisma.user.findMany({
        select: {
          balanceEUR: true,
          portfolios: {
            select: {
              fractions: true,
              product: {
                select: { p0: true, k: true, supply: true }
              }
            }
          }
        }
      }),
    ]);

    // Calcular volum total (suma de totes les compres)
    const volumeResult = await prisma.transaction.aggregate({
      where: { type: 'BUY', status: 'COMPLETED' },
      _sum: { amountEUR: true }
    });

    const totalVolume = volumeResult._sum.amountEUR || 0;

    // Calcular TVL (Total Value Locked) - capital invertit per usuaris
    const tvlResult = await prisma.portfolio.aggregate({
      _sum: { investedEUR: true }
    });
    const totalTVL = tvlResult._sum.investedEUR || 0;

    // Calcular valor buffer admin per producte
    const bufferDetails = allBuffers.map(buffer => {
      const product = allProducts.find(p => p.id === buffer.productId);
      if (!product) return null;

      const currentPrice = calculatePrice(
        product.p0,
        product.k,
        product.supply
      );

      const bufferValue = buffer.fractions * currentPrice;

      return {
        productId: product.id,
        productName: product.name,
        productEmoji: product.emoji,
        fractions: buffer.fractions,
        currentPrice,
        bufferValue,
      };
    }).filter(Boolean);

    const totalBufferValue = bufferDetails.reduce(
      (sum, b) => sum + b.bufferValue, 0
    );
    
    // Buffer consolidat (EUR recuperats de consolidacions)
    const totalConsolidatedEUR = allBuffers.reduce(
      (sum, b) => sum + (b.consolidatedEUR || 0), 0
    );

    // Volum últimes 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const volume24hResult = await prisma.transaction.aggregate({
      where: {
        type: 'BUY',
        status: 'COMPLETED',
        createdAt: { gte: twentyFourHoursAgo }
      },
      _sum: { amountEUR: true }
    });

    const volume24h = volume24hResult._sum.amountEUR || 0;

    // ══════════════════════════════════════════
    // CÀLCUL LIQUIDITAT
    // ══════════════════════════════════════════
    
    // Deute REAL = Cash dels usuaris (excloent admin)
    // NO comptem valor portfolios perquè no és deute immediat
    let totalUserCash = 0;
    for (const user of allUsers) {
      if (user.role !== 'ADMIN') {  // Excloure admin
        totalUserCash += parseFloat(user.balanceEUR);
      }
    }

    // Capital disponible empresa
    const adminCapital = adminUser?.adminBalanceEUR || 0;
    const adminCapitalTotal = adminCapital + totalBufferValue;

    // Ràtio liquiditat CORRECTE
    // (Capital admin) / (Cash usuaris que poden retirar)
    const liquidityRatio = totalUserCash > 0 
      ? (adminCapitalTotal / totalUserCash) * 100 
      : 200;

    // Determinar estat
    let liquidityStatus = 'HEALTHY';
    if (liquidityRatio < 120) liquidityStatus = 'CRITICAL';
    else if (liquidityRatio < 150) liquidityStatus = 'ACCEPTABLE';

    // ══════════════════════════════════════════
    // CÀLCUL RATIOS CLAU
    // ══════════════════════════════════════════
    
    // 1. Cobertura liquiditat (ja calculat)
    const coberturaLiquiditat = liquidityRatio;
    
    // 2. ROI capital
    const beneficiNet = (adminUser?.adminSpreadEarned || 0) + totalConsolidatedEUR - (adminUser?.adminCapitalWithdrawn || 0);
    const capitalInjectat = adminUser?.adminCapitalInjected || 1000;
    const ROI = capitalInjectat > 0 ? (beneficiNet / capitalInjectat) * 100 : 0;
    
    // 3. Activitat mercat
    const activitatMercat = totalTVL > 0 ? (volume24h / totalTVL) * 100 : 0;
    
    // 4. Eficiència spread
    const eficienciaSpread = totalVolume > 0 ? ((adminUser?.adminSpreadEarned || 0) / totalVolume) * 100 : 0;
    
    // 5. Health Score (0-100)
    const healthScore = Math.round(
      (Math.min(coberturaLiquiditat / 2, 50) * 0.3) +  // Cobertura max 50 punts
      (Math.min(Math.max(ROI, 0), 50) * 0.3) +          // ROI max 50 punts
      (Math.min(activitatMercat * 2, 50) * 0.2) +       // Activitat max 50 punts
      (Math.min(eficienciaSpread * 20, 50) * 0.2)       // Eficiència max 50 punts
    );

    // Debug
    console.log('[ADMIN DASHBOARD] Total transaccions:', totalTransactions);
    console.log('[ADMIN DASHBOARD] Total usuaris:', totalUsers);
    console.log('[ADMIN DASHBOARD] TVL:', totalTVL.toFixed(2), '€');
    console.log('[ADMIN DASHBOARD] Health Score:', healthScore);

    return res.status(200).json({
      stats: {
        totalUsers,
        totalTransactions,
        totalProducts,
        totalVolume,
        volume24h,
        totalBufferValue,
        totalConsolidatedEUR,
        totalTVL,
      },
      
      // Compte empresa
      adminBalanceEUR: adminUser?.adminBalanceEUR || 0,
      adminSpreadEarned: adminUser?.adminSpreadEarned || 0,
      adminCapitalInjected: adminUser?.adminCapitalInjected || 0,
      adminCapitalWithdrawn: 0, // TODO: Afegir camp a DB quan implementem withdraw
      
      // Compte personal admin
      adminPersonalBalance: adminUser?.balanceEUR || 0,
      
      // Liquiditat
      liquidity: {
        totalUserCash,  // Cash usuaris (deute real)
        adminCapitalTotal,
        ratio: liquidityRatio,
        status: liquidityStatus,
      },

      // Ratios
      ratios: {
        healthScore,
        coberturaLiquiditat,
        ROI,
        activitatMercat,
        eficienciaSpread,
        
        // Detalls per UI
        adminCapitalTotal,
        totalUserCash,
        beneficiNet,
        adminCapitalInjected: capitalInjectat,
        volume24h,
        totalTVL,
        totalVolume,
        adminSpreadEarned: adminUser?.adminSpreadEarned || 0,
      },
      
      bufferDetails,
      recentTransactions,
      totalTransactions, // Per paginació
    });

  } catch (error) {
    console.error('Error dashboard:', error);
    return res.status(500).json({
      error: 'Error intern del servidor'
    });
  }
});



// ============================================
// POST /admin/consolidate/:productId
// Consolidar buffer admin d'un producte
// ============================================
router.post('/consolidate/:productId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    const buffer = await prisma.adminBuffer.findUnique({
      where: { productId: parseInt(productId) },
      include: { product: true }
    });

    if (!buffer || buffer.fractions <= 0) {
      return res.status(400).json({
        error: 'No hi ha fraccions al buffer per consolidar.'
      });
    }

    const product = buffer.product;

    // Calcular EUR recuperats (burn fraccions)
    const result = processSell(buffer.fractions, product);

    // Trobar admin
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      return res.status(500).json({
        error: 'No s\'ha trobat l\'admin del sistema'
      });
    }

    // Actualitzar DB
    await prisma.$transaction([

      // 1. Actualitzar supply del producte
      prisma.product.update({
        where: { id: parseInt(productId) },
        data: { supply: result.newSupply }
      }),

      // 2. Actualitzar buffer admin (buidar fraccions, sumar consolidatedEUR)
      prisma.adminBuffer.update({
        where: { productId: parseInt(productId) },
        data: {
          fractions: 0,
          consolidatedEUR: { increment: result.eurRecovered }
        }
      }),

      // 3. Afegir EUR al compte EMPRESA admin (NO personal!)
      prisma.user.update({
        where: { id: admin.id },
        data: { 
          adminBalanceEUR: { increment: result.eurRecovered }  // ← CANVI AQUÍ
        }
      }),

      // 4. Guardar historial de preus
      prisma.priceHistory.create({
        data: {
          productId: parseInt(productId),
          price: result.newPrice,
          supply: result.newSupply,
        }
      }),
    ]);

    return res.status(200).json({
      message: `Buffer consolidat correctament!`,
      fractionsSold: buffer.fractions,
      eurRecovered: result.eurRecovered,
      newPrice: result.newPrice,
    });

  } catch (error) {
    console.error('Error consolidate:', error);
    return res.status(500).json({
      error: 'Error intern del servidor'
    });
  }
});


// ============================================
// GET /admin/users
// Llistar tots els usuaris
// ============================================
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          balanceEUR: true,
          role: true,
          isActive: true,
          isBanned: true,
          createdAt: true,
          _count: {
            select: { transactions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count(),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      }
    });

  } catch (error) {
    console.error('Error users:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

// ============================================
// PUT /admin/users/:id/ban
// Bannejar/desbannejar usuari
// ============================================
router.put('/users/:id/ban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isBanned },
      select: {
        id: true,
        email: true,
        name: true,
        isBanned: true,
      }
    });

    return res.status(200).json({
      message: isBanned ? 'Usuari banjat.' : 'Usuari desbanjat.',
      user,
    });

  } catch (error) {
    console.error('Error ban user:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

// ============================================
// PUT /admin/users/:id/balance
// Afegir saldo a un usuari (per testing)
// ============================================
router.put('/users/:id/balance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "L'import ha de ser positiu."
      });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        balanceEUR: { increment: parseFloat(amount) }
      },
      select: {
        id: true,
        email: true,
        name: true,
        balanceEUR: true,
      }
    });

    return res.status(200).json({
      message: `Afegits ${amount}€ a ${user.name}`,
      user,
    });

  } catch (error) {
    console.error('Error balance:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

// ============================================
// GET /admin/transactions
// Totes les transaccions del sistema
// ============================================
router.get('/transactions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { name: true, emoji: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count(),
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
    console.error('Error admin transactions:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});
// AFEGIR A: centims-backend/src/routes/admin.js
// (Afegir aquestes routes al final del fitxer, abans del module.exports)

// ============================================
// GET /admin/proposals
// Llistar totes les propostes (pendents dalt, refusades baix)
// ============================================
router.get('/proposals', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [pending, accepted, rejected] = await Promise.all([
      prisma.tokenProposal.findMany({
        where: { status: 'PENDING' },
        include: {
          proposer: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.tokenProposal.findMany({
        where: { status: 'ACCEPTED' },
        include: {
          proposer: {
            select: { id: true, name: true, email: true }
          },
          reviewer: {
            select: { name: true }
          }
        },
        orderBy: { reviewedAt: 'desc' }
      }),
      prisma.tokenProposal.findMany({
        where: { status: 'REJECTED' },
        include: {
          proposer: {
            select: { id: true, name: true, email: true }
          },
          reviewer: {
            select: { name: true }
          }
        },
        orderBy: { reviewedAt: 'desc' }
      })
    ]);

    return res.status(200).json({
      pending,
      accepted,
      rejected
    });

  } catch (error) {
    console.error('Error fetching proposals:', error);
    return res.status(500).json({
      error: 'Error intern del servidor'
    });
  }
});

// ============================================
// PUT /admin/proposals/:id/accept
// Acceptar proposta i crear token + 100 fraccions gratis
// ============================================
router.put('/proposals/:id/accept', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { p0, k } = req.body;
    const adminId = req.user.id;

    // Validacions
    if (!p0 || !k) {
      return res.status(400).json({
        error: 'p0 i k són obligatoris'
      });
    }

    if (parseFloat(p0) <= 0 || parseFloat(k) <= 0) {
      return res.status(400).json({
        error: 'p0 i k han de ser positius'
      });
    }

    // Obtenir proposta
    const proposal = await prisma.tokenProposal.findUnique({
      where: { id: parseInt(id) },
      include: { proposer: true }
    });

    if (!proposal) {
      return res.status(404).json({
        error: 'Proposta no trobada'
      });
    }

    if (proposal.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Aquesta proposta ja ha estat revisada'
      });
    }

    // Verificar ticker únic (per si de cas)
    const existingProduct = await prisma.product.findFirst({
      where: { ticker: proposal.ticker }
    });

    if (existingProduct) {
      return res.status(400).json({
        error: 'Aquest ticker ja existeix'
      });
    }

    // Crear token + donar 100 fraccions + actualitzar proposta
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Crear producte ACTIU
      const product = await tx.product.create({
        data: {
          name: proposal.name,
          emoji: proposal.emoji,
          ticker: proposal.ticker,
          description: proposal.description,
          p0: parseFloat(p0),
          k: parseFloat(k),
          supply: 0, // grantCreatorReward incrementarà el supply
          isActive: true,
          createdBy: adminId
        }
      });

            // 2. Crear buffer admin buit
      await tx.adminBuffer.create({
        data: {
          productId: product.id,
          fractions: 0,
          consolidatedEUR: 0
        }
      });

      // 3. Registrar preu inicial
      await tx.priceHistory.create({
        data: {
          productId: product.id,
          price: parseFloat(p0),
          supply: 10 // Supply real amb fraccions del creador
        }
      });

      // 4. Actualitzar proposta a ACCEPTED
      const updatedProposal = await tx.tokenProposal.update({
        where: { id: parseInt(id) },
        data: {
          status: 'ACCEPTED',
          reviewedAt: new Date(),
          reviewedBy: adminId
        }
      });

      return { product, updatedProposal };
    });

    // Donar 10 fraccions gratis al creador via service
    await grantCreatorReward(result.product.id, proposal.proposedBy);

    return res.status(200).json({
      message: `Token "${result.product.name}" creat i activat! L'usuari ha rebut 10 fraccions.`,
      product: result.product,
      proposal: result.updatedProposal
    });

  } catch (error) {
    console.error('Error accepting proposal:', error);
    return res.status(500).json({
      error: 'Error intern del servidor'
    });
  }
});

// ============================================
// PUT /admin/proposals/:id/reject
// Refusar proposta
// ============================================
router.put('/proposals/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const proposal = await prisma.tokenProposal.findUnique({
      where: { id: parseInt(id) }
    });

    if (!proposal) {
      return res.status(404).json({
        error: 'Proposta no trobada'
      });
    }

    if (proposal.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Aquesta proposta ja ha estat revisada'
      });
    }

    const updated = await prisma.tokenProposal.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        reviewNotes: reason || null,
        reviewedAt: new Date(),
        reviewedBy: adminId
      }
    });

    return res.status(200).json({
      message: 'Proposta refusada',
      proposal: updated
    });

  } catch (error) {
    console.error('Error rejecting proposal:', error);
    return res.status(500).json({
      error: 'Error intern del servidor'
    });
  }
});

// AFEGIR A: centims-backend/src/routes/admin.js
// (SUBSTITUEIX la versió anterior)

// ============================================
// DELETE /admin/products/:id
// Eliminar token (només si no té holders)
// ============================================
router.delete('/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    // 1. Verificar que el token existeix
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Token no trobat'
      });
    }

    // 2. Verificar que NO tingui holders actius
    const holdersCount = await prisma.portfolio.count({
      where: { 
        productId,
        fractions: { gt: 0 }
      }
    });

    if (holdersCount > 0) {
      return res.status(400).json({
        error: `No pots eliminar aquest token. Té ${holdersCount} holders amb fraccions actives.`,
        holders: holdersCount
      });
    }

    // 3. Verificar buffer admin
    const buffer = await prisma.adminBuffer.findUnique({
      where: { productId }
    });

    if (buffer && parseFloat(buffer.fractions) > 0) {
      return res.status(400).json({
        error: 'El token té fraccions al buffer admin. Consolida primer.',
        bufferFractions: buffer.fractions
      });
    }

    // 4. Buscar proposta associada (si existeix)
    const proposal = await prisma.tokenProposal.findFirst({
      where: {
        ticker: product.ticker,
        status: 'ACCEPTED'
      }
    });

    // 5. Eliminar en transacció
    await prisma.$transaction(async (tx) => {
      // Eliminar historial de preus
      await tx.priceHistory.deleteMany({
        where: { productId }
      });
      
      // Eliminar portfolios buits
      await tx.portfolio.deleteMany({
        where: { productId }
      });
      
      // Eliminar buffer admin
      await tx.adminBuffer.delete({
        where: { productId }
      });
      
      // Marcar proposta com a eliminada (si existeix)
      if (proposal) {
        await tx.tokenProposal.update({
          where: { id: proposal.id },
          data: {
            status: 'REJECTED',
            reviewNotes: 'Token eliminat per l\'administrador',
            reviewedAt: new Date(),
            reviewedBy: req.user.id
          }
        });
      }
      
      // Eliminar producte
      await tx.product.delete({
        where: { id: productId }
      });
    });

    return res.status(200).json({
      message: `Token "${product.name}" eliminat correctament`,
      deletedTokenId: productId,
      proposalUpdated: !!proposal
    });

  } catch (error) {
    console.error('Error eliminant token:', error);
    return res.status(500).json({
      error: 'Error intern del servidor'
    });
  }
});

// ============================================
// PUT /admin/products/:id/boost
// Aplicar/eliminar boost temporal a un token
// ============================================
router.put('/products/:id/boost', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { boostValue, boostDescription, boostHours, active } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Token no trobat' });
    }

    let updateData;

    if (active === false) {
      // Desactivar boost
      updateData = {
        boostActive: false,
        boostValue: 1.0,
        boostExpiresAt: null,
        boostDescription: null,
      };
    } else {
      // Activar boost
      if (!boostValue || boostValue <= 0) {
        return res.status(400).json({ error: 'boostValue ha de ser positiu' });
      }
      if (!boostHours || boostHours <= 0) {
        return res.status(400).json({ error: 'boostHours ha de ser positiu' });
      }

      const boostExpiresAt = new Date(Date.now() + boostHours * 60 * 60 * 1000);

      updateData = {
        boostActive: true,
        boostValue: parseFloat(boostValue),
        boostExpiresAt,
        boostDescription: boostDescription || null,
      };
    }

    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    const { calculatePriceWithBoosts } = require('../utils/pricing');
    const newPrice = calculatePriceWithBoosts(updated);

    return res.status(200).json({
      message: active === false
        ? `Boost desactivat per "${updated.name}"`
        : `Boost x${boostValue} activat per "${updated.name}" durant ${boostHours}h`,
      product: {
        id: updated.id,
        name: updated.name,
        boostActive: updated.boostActive,
        boostValue: updated.boostValue,
        boostDescription: updated.boostDescription,
        boostExpiresAt: updated.boostExpiresAt,
        newPrice: parseFloat(newPrice.toFixed(6)),
      },
    });

  } catch (error) {
    console.error('Error boost:', error);
    return res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// ============================================
// PUT /admin/products/:id/seasonal-boost
// Aplicar/eliminar boost estacional a un token
// ============================================
router.put('/products/:id/seasonal-boost', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { multiplier, notes } = req.body;

    const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!product) return res.status(404).json({ error: 'Token no trobat' });

    const mult = parseFloat(multiplier);
    if (isNaN(mult) || mult <= 0) {
      return res.status(400).json({ error: 'El multiplicador ha de ser un número positiu (ex: 1.5 o 0.85)' });
    }

    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        seasonalMultiplier: mult,
        seasonalNotes: notes || null,
      },
    });

    const { calculatePriceWithBoosts } = require('../utils/pricing');
    const newPrice = calculatePriceWithBoosts(updated);

    return res.status(200).json({
      message: mult === 1.0
        ? `Boost estacional desactivat per "${updated.name}"`
        : `Boost estacional x${mult} aplicat a "${updated.name}"`,
      product: {
        id: updated.id,
        name: updated.name,
        seasonalMultiplier: updated.seasonalMultiplier,
        seasonalNotes: updated.seasonalNotes,
        newPrice: parseFloat(newPrice.toFixed(6)),
      },
    });

  } catch (error) {
    console.error('Error boost estacional:', error);
    return res.status(500).json({ error: 'Error intern del servidor' });
  }
});

module.exports = router;