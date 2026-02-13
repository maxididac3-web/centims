// src/routes/proposals.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Límits
const MAX_PENDING = 2;
const MAX_CREATED = 5;
const MAX_DESCRIPTION = 800;

// ============================================
// POST /proposals
// Crear nova proposta de token
// ============================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, emoji, ticker, description } = req.body;
    const userId = req.user.id;

    // Validacions
    if (!name || !emoji || !ticker || !description) {
      return res.status(400).json({
        error: 'Tots els camps són obligatoris: name, emoji, ticker, description'
      });
    }

    if (description.length > MAX_DESCRIPTION) {
      return res.status(400).json({
        error: `La descripció no pot superar ${MAX_DESCRIPTION} caràcters`
      });
    }

    // Verificar límit de propostes pendents
    const pendingCount = await prisma.tokenProposal.count({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    if (pendingCount >= MAX_PENDING) {
      return res.status(400).json({
        error: `Ja tens ${MAX_PENDING} propostes pendents. Espera que siguin revisades.`
      });
    }

    // Verificar límit de tokens creats (acceptats)
    const acceptedCount = await prisma.tokenProposal.count({
      where: {
        userId,
        status: 'ACCEPTED'
      }
    });

    if (acceptedCount >= MAX_CREATED) {
      return res.status(400).json({
        error: `Ja has creat ${MAX_CREATED} tokens. Màxim permès.`
      });
    }

    // Verificar que el ticker no existeix (ni en productes ni en propostes pendents)
    const [existingProduct, existingProposal] = await Promise.all([
      prisma.product.findFirst({
        where: { ticker: ticker.toUpperCase() }
      }),
      prisma.tokenProposal.findFirst({
        where: {
          ticker: ticker.toUpperCase(),
          status: 'PENDING'
        }
      })
    ]);

    if (existingProduct) {
      return res.status(400).json({
        error: 'Aquest ticker ja existeix en un token actiu'
      });
    }

    if (existingProposal) {
      return res.status(400).json({
        error: 'Aquest ticker ja està en una proposta pendent'
      });
    }

    // Verificar que el nom no existeix
    const existingName = await prisma.product.findFirst({
      where: { name }
    });

    if (existingName) {
      return res.status(400).json({
        error: 'Aquest nom ja existeix'
      });
    }

    // Crear proposta
    const proposal = await prisma.tokenProposal.create({
      data: {
        userId,
        name,
        emoji,
        ticker: ticker.toUpperCase(),
        description,
        status: 'PENDING'
      }
    });

    return res.status(201).json({
      message: 'Proposta enviada correctament! Estarà en revisió.',
      proposal
    });

  } catch (error) {
    console.error('Error creating proposal:', error);
    return res.status(500).json({
      error: 'Error intern del servidor'
    });
  }
});

// ============================================
// GET /proposals
// Llistar propostes de l'usuari
// ============================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const proposals = await prisma.tokenProposal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      proposals
    });

  } catch (error) {
    console.error('Error fetching proposals:', error);
    return res.status(500).json({
      error: 'Error intern del servidor'
    });
  }
});

module.exports = router;
