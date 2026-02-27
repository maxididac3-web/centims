// src/routes/users.js
// Routes per gestió d'usuaris (perfil, username, stats)

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateUsername } = require('../utils/helpers');

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * PUT /users/me/username
 * Canviar el username (màxim 1 cop cada 3 mesos)
 */
router.put('/me/username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;
    
    // Validar format username
    const validation = validateUsername(username);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    // Obtenir usuari actual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    // Comprovar si pot canviar (cada 3 mesos)
    if (user.usernameUpdatedAt) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      if (user.usernameUpdatedAt > threeMonthsAgo) {
        const nextChange = new Date(user.usernameUpdatedAt);
        nextChange.setMonth(nextChange.getMonth() + 3);
        
        return res.status(400).json({
          error: 'Només pots canviar el username cada 3 mesos',
          nextChangeDate: nextChange.toISOString()
        });
      }
    }
    
    // Comprovar que no existeix
    const existing = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: 'Aquest username ja està en ús' });
    }
    
    // Actualitzar
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        usernameUpdatedAt: new Date(),
        usernameChangeCount: {
          increment: 1
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        balanceEUR: true,
        usernameUpdatedAt: true,
        usernameChangeCount: true
      }
    });
    
    res.json({
      message: 'Username actualitzat correctament',
      user: updated
    });
    
  } catch (error) {
    console.error('Error canviant username:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * GET /users/me/stats
 * Obtenir estadístiques de l'usuari
 */
router.get('/me/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtenir dades usuari
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalTransactions: true,
        totalAchievements: true,
        bestPosition: true,
        bestPositionMonth: true,
        createdAt: true
      }
    });
    
    // Comptar mesos actiu (mesos amb transaccions)
    const monthsActive = await prisma.transaction.findMany({
      where: { userId },
      select: {
        createdAt: true
      }
    });
    
    const uniqueMonths = new Set();
    monthsActive.forEach(tx => {
      const month = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, '0')}`;
      uniqueMonths.add(month);
    });
    
    res.json({
      totalTransactions: user.totalTransactions,
      totalAchievements: user.totalAchievements,
      bestPosition: user.bestPosition,
      bestPositionMonth: user.bestPositionMonth,
      monthsActive: uniqueMonths.size,
      memberSince: user.createdAt
    });
    
  } catch (error) {
    console.error('Error obtenint stats:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;