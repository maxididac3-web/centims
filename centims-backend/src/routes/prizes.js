// src/routes/prizes.js
// Endpoints per gestionar premis mensuals

const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/auth');

const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || new PrismaClient();
if (!global.prisma) global.prisma = prisma;

/**
 * GET /prizes/:month
 * Obtenir premis d'un mes específic
 */
router.get('/:month', authenticateToken, async (req, res) => {
  try {
    const { month } = req.params;
    
    // Validar format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Format mes invàlid (usa YYYY-MM)' });
    }
    
    const prizes = await prisma.monthlyPrize.findMany({
      where: { month },
      orderBy: { position: 'asc' }
    });
    
    res.json({
      month,
      prizes
    });
    
  } catch (error) {
    console.error('Error obtenint premis:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * POST /prizes/:month (ADMIN)
 * Crear o actualitzar premis d'un mes
 * Body: { prizes: [{ position, prizeName, sponsorName, sponsorLink }, ...] }
 */
router.post('/:month', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { month } = req.params;
    const { prizes } = req.body;
    
    // Validar format mes
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Format mes invàlid (usa YYYY-MM)' });
    }
    
    // Validar prizes array
    if (!Array.isArray(prizes)) {
      return res.status(400).json({ error: 'El camp prizes ha de ser un array' });
    }
    
    // Validar que les posicions siguin 1-10
    for (const prize of prizes) {
      if (prize.position < 1 || prize.position > 10) {
        return res.status(400).json({ error: 'Les posicions han de ser entre 1 i 10' });
      }
    }
    
    // Upsert cada premi
    const results = [];
    
    for (const prize of prizes) {
      const result = await prisma.monthlyPrize.upsert({
        where: {
          month_position: {
            month,
            position: prize.position
          }
        },
        update: {
          prizeName: prize.prizeName || null,
          sponsorName: prize.sponsorName || null,
          sponsorLink: prize.sponsorLink || null
        },
        create: {
          month,
          position: prize.position,
          prizeName: prize.prizeName || null,
          sponsorName: prize.sponsorName || null,
          sponsorLink: prize.sponsorLink || null
        }
      });
      
      results.push(result);
    }
    
    res.json({
      message: `${results.length} premis guardats per ${month}`,
      prizes: results
    });
    
  } catch (error) {
    console.error('Error guardant premis:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * PUT /prizes/:month/:position (ADMIN)
 * Actualitzar un premi específic
 */
router.put('/:month/:position', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { month, position } = req.params;
    const { prizeName, sponsorName, sponsorLink } = req.body;
    
    const pos = parseInt(position);
    
    if (pos < 1 || pos > 10) {
      return res.status(400).json({ error: 'La posició ha de ser entre 1 i 10' });
    }
    
    const prize = await prisma.monthlyPrize.upsert({
      where: {
        month_position: {
          month,
          position: pos
        }
      },
      update: {
        prizeName: prizeName || null,
        sponsorName: sponsorName || null,
        sponsorLink: sponsorLink || null
      },
      create: {
        month,
        position: pos,
        prizeName: prizeName || null,
        sponsorName: sponsorName || null,
        sponsorLink: sponsorLink || null
      }
    });
    
    res.json({
      message: 'Premi actualitzat',
      prize
    });
    
  } catch (error) {
    console.error('Error actualitzant premi:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * DELETE /prizes/:month/:position (ADMIN)
 * Esborrar un premi
 */
router.delete('/:month/:position', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { month, position } = req.params;
    const pos = parseInt(position);
    
    await prisma.monthlyPrize.delete({
      where: {
        month_position: {
          month,
          position: pos
        }
      }
    });
    
    res.json({
      message: 'Premi esborrat'
    });
    
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Premi no trobat' });
    }
    console.error('Error esborrant premi:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
