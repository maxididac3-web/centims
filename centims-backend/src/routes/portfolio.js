// src/routes/portfolio.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { calculatePrice, calculateEURFromFractions } = require('../utils/bondingCurve');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// GET /portfolio
// Cartera completa de l'usuari
// ============================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtenir usuari amb saldo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        balanceEUR: true,
      }
    });

    // Obtenir portfolio amb productes
    const portfolios = await prisma.portfolio.findMany({
      where: {
        userId,
        fractions: { gt: 0 }
      },
      include: {
        product: true,
      }
    });

    // Calcular valors actuals
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalLiquidationValue = 0;

    const portfolioWithValues = portfolios.map(p => {
      const currentPrice = calculatePrice(
        p.product.p0,
        p.product.k,
        p.product.supply
      );

      const spotValue = p.fractions * currentPrice;

      const liquidationValue = calculateEURFromFractions(
        p.fractions,
        p.product.p0,
        p.product.k,
        p.product.supply
      );

      const profit = liquidationValue - p.investedEUR;
      const profitPercent = p.investedEUR > 0
        ? (profit / p.investedEUR) * 100
        : 0;

      totalInvested += p.investedEUR;
      totalCurrentValue += spotValue;
      totalLiquidationValue += liquidationValue;

      return {
        productId: p.productId,
        productName: p.product.name,
        productEmoji: p.product.emoji,
        fractions: p.fractions,
        investedEUR: p.investedEUR,
        avgPrice: p.avgPrice,
        currentPrice,
        spotValue,
        liquidationValue,
        profit,
        profitPercent: parseFloat(profitPercent.toFixed(2)),
      };
    });

    const totalProfit = totalLiquidationValue - totalInvested;
    const totalProfitPercent = totalInvested > 0
      ? (totalProfit / totalInvested) * 100
      : 0;

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balanceEUR: user.balanceEUR,
      },
      portfolio: portfolioWithValues,
      summary: {
        totalInvested,
        totalSpotValue: totalCurrentValue,
        totalLiquidationValue,
        totalProfit,
        totalProfitPercent: parseFloat(totalProfitPercent.toFixed(2)),
        totalPatrimoni: user.balanceEUR + totalLiquidationValue,
      }
    });

  } catch (error) {
    console.error('Error portfolio:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

// ============================================
// GET /portfolio/balance
// Saldo actual de l'usuari
// ============================================
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        balanceEUR: true,
      }
    });

    return res.status(200).json({
      balanceEUR: user.balanceEUR,
    });

  } catch (error) {
    console.error('Error balance:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

module.exports = router;