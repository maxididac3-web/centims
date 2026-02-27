// src/routes/achievements.js
// Endpoints per consultar achievements

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * GET /achievements/:month
 * Obtenir achievements d'un mes específic
 */
router.get('/:month', authenticateToken, async (req, res) => {
  try {
    const { month } = req.params;
    
    // Validar format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Format mes invàlid (usa YYYY-MM)' });
    }
    
    const achievements = await prisma.monthlyAchievement.findMany({
      where: { month },
      orderBy: { achievementType: 'asc' }
    });
    
    res.json({
      month,
      achievements
    });
    
  } catch (error) {
    console.error('Error obtenint achievements:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * GET /achievements/user/:userId
 * Obtenir tots els achievements d'un usuari
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const achievements = await prisma.monthlyAchievement.findMany({
      where: { userId },
      orderBy: { month: 'desc' }
    });
    
    res.json({
      userId,
      achievements,
      total: achievements.length
    });
    
  } catch (error) {
    console.error('Error obtenint achievements usuari:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
