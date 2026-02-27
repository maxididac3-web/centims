// src/routes/rankings.js
// Endpoints per consultar classificacions mensuals

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getCurrentMonth } = require('../utils/helpers');
const { calculatePriceWithBoosts } = require('../utils/pricing');

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * GET /rankings/current
 * Classificació temps real del mes actual
 */
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const currentMonth = getCurrentMonth();
    
    // Obtenir tots els usuaris amb portfolios
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: 'USER'
      },
      include: {
        portfolios: {
          include: {
            product: true
          }
        }
      }
    });
    
    const rankings = [];
    
    for (const user of users) {
      let spotValue = 0;
      let investedValue = 0;
      const tokensOwned = [];
      
      for (const portfolio of user.portfolios) {
        const currentPrice = calculatePriceWithBoosts(portfolio.product);
        spotValue += portfolio.fractions * currentPrice;
        investedValue += portfolio.fractions * portfolio.averageBuyPrice;
        tokensOwned.push(`${portfolio.product.emoji} ${portfolio.product.name}`);
      }
      
      const totalValue = user.balanceEUR + spotValue;
      const gainPercent = ((totalValue - 150) / 150) * 100;
      
      rankings.push({
        position: 0, // S'assignarà després
        userId: user.id,
        username: user.username,
        tokensOwned,
        balanceEUR: user.balanceEUR,
        investedValue,
        spotValue,
        totalValue,
        gainPercent
      });
    }
    
    // Ordenar per totalValue
    rankings.sort((a, b) => b.totalValue - a.totalValue);
    
    // Assignar posicions
    rankings.forEach((rank, index) => {
      rank.position = index + 1;
    });
    
    res.json({
      month: currentMonth,
      rankings: rankings.slice(0, 50), // Top 50
      total: rankings.length
    });
    
  } catch (error) {
    console.error('Error obtenint classificació actual:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * GET /rankings/:month
 * Classificació d'un mes específic (històric)
 */
router.get('/:month', authenticateToken, async (req, res) => {
  try {
    const { month } = req.params;
    
    // Validar format mes
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Format mes invàlid (usa YYYY-MM)' });
    }
    
    const rankings = await prisma.monthlyRanking.findMany({
      where: { month },
      orderBy: { position: 'asc' }
    });
    
    if (rankings.length === 0) {
      return res.status(404).json({ error: 'No hi ha dades per aquest mes' });
    }
    
    res.json({
      month,
      rankings,
      total: rankings.length
    });
    
  } catch (error) {
    console.error('Error obtenint classificació:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * GET /rankings/user/:userId
 * Històric de posicions d'un usuari
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const history = await prisma.monthlyRanking.findMany({
      where: { userId },
      orderBy: { month: 'desc' }
    });
    
    res.json({
      userId,
      history
    });
    
  } catch (error) {
    console.error('Error obtenint històric usuari:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * GET /rankings/months
 * Llista de mesos disponibles
 */
router.get('/months/available', authenticateToken, async (req, res) => {
  try {
    const months = await prisma.monthlyRanking.findMany({
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'desc' }
    });
    
    res.json({
      months: months.map(m => m.month)
    });
    
  } catch (error) {
    console.error('Error obtenint mesos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
