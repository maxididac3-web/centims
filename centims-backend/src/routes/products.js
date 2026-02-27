// src/routes/products.js - VERSIO COMPLETA
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { calculatePriceWithBoosts } = require('../utils/pricing');
const isAdmin = require('../middleware/admin');

const prisma = new PrismaClient();

// GET /products - Llistar tots els productes actius
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        priceHistory: {
          orderBy: { createdAt: 'desc' },
          take: 7,
        },
        adminBuffer: true,
      },
    });

    const now = new Date();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);

    const productsWithData = await Promise.all(products.map(async (product) => {
      const currentPrice = calculatePriceWithBoosts(product);

      // Preu fa 24h
      const priceYesterday = await prisma.priceHistory.findFirst({
        where: {
          productId: product.id,
          createdAt: { lte: yesterday },
        },
        orderBy: { createdAt: 'desc' },
      });

      const oldPrice = priceYesterday ? parseFloat(priceYesterday.price) : currentPrice;
      const changePercent24h = ((currentPrice - oldPrice) / oldPrice) * 100;

      return {
        id: product.id,
        name: product.name,
        emoji: product.emoji,
        ticker: product.ticker,
        description: product.description,
        p0: product.p0,
        k: product.k,
        supply: product.supply,
        isActive: product.isActive,
        currentPrice,
        changePercent24h: parseFloat(changePercent24h.toFixed(2)),
        priceHistory: product.priceHistory.reverse(),
        bufferFractions: product.adminBuffer?.fractions || 0,
      };
    }));

    res.json({ products: productsWithData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error intern' });
  }
});

// GET /products/all - Tots els productes (admin, inclou inactius)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        adminBuffer: true,
        _count: {
          select: { transactions: true, portfolios: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    const productsWithData = products.map(product => {
      const currentPrice = calculatePriceWithBoosts(product);
      return {
        id: product.id,
        name: product.name,
        emoji: product.emoji,
        ticker: product.ticker,
        description: product.description,
        p0: parseFloat(product.p0),
        k: parseFloat(product.k),
        supply: parseFloat(product.supply),
        isActive: product.isActive,
        isTemporary: !product.isPermanent,
        currentPrice: parseFloat(currentPrice.toFixed(6)),
        bufferFractions: parseFloat(product.adminBuffer?.fractions || 0),
        totalTransactions: product._count.transactions,
        totalHolders: product._count.portfolios,
        // Boost temporal
        boostActive: product.boostActive,
        boostValue: parseFloat(product.boostValue || 1),
        boostExpiresAt: product.boostExpiresAt,
        boostDescription: product.boostDescription,
        // Boost estacional
        seasonalMultiplier: parseFloat(product.seasonalMultiplier || 1),
        seasonalNotes: product.seasonalNotes,
      };
    });

    res.json({ products: productsWithData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error intern' });
  }
});

// GET /products/:id - Detall producte
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        priceHistory: {
          orderBy: { createdAt: 'asc' },
          take: 30,
        },
        adminBuffer: true,
      },
    });

    if (!product) return res.status(404).json({ error: 'Producte no trobat' });

    const currentPrice = calculatePriceWithBoosts(product);

    res.json({
      product: {
        ...product,
        currentPrice: parseFloat(currentPrice.toFixed(6)),
        bufferFractions: product.adminBuffer?.fractions || 0,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error intern' });
  }
});

// POST /products - Crear nou token (admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, emoji, ticker, description, p0, k, isTemporary } = req.body;

    if (!name || !emoji || !ticker || !p0 || !k) {
      return res.status(400).json({ error: 'Falten camps obligatoris: name, emoji, ticker, p0, k' });
    }

    if (parseFloat(p0) <= 0 || parseFloat(k) <= 0) {
      return res.status(400).json({ error: 'P0 i k han de ser positius' });
    }

    // Verificar que el ticker no existeix
    const existing = await prisma.product.findFirst({
      where: { ticker: ticker.toUpperCase() }
    });
    if (existing) {
      return res.status(400).json({ error: 'Aquest ticker ja existeix' });
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          emoji,
          ticker: ticker.toUpperCase(),
          description: description || '',
          p0: parseFloat(p0),
          k: parseFloat(k),
          supply: 0,
          isActive: true,
          isPermanent: !(isTemporary === true || isTemporary === 'true'),
        }
      });

      // Crear buffer buit
      await tx.adminBuffer.create({
        data: {
          productId: newProduct.id,
          fractions: 0,
        }
      });

      // Registrar preu inicial
      await tx.priceHistory.create({
        data: {
          productId: newProduct.id,
          price: parseFloat(p0),
          supply: 0,
        }
      });

      return newProduct;
    });

    res.status(201).json({
      message: 'Token creat correctament',
      product: {
        ...product,
        currentPrice: parseFloat(product.p0),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error intern' });
  }
});

// PUT /products/:id - Editar token (admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, emoji, ticker, description, p0, k, isActive, isTemporary } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    if (!product) return res.status(404).json({ error: 'Producte no trobat' });

    // Si canviem ticker, verificar que no existeix
    if (ticker && ticker.toUpperCase() !== product.ticker) {
      const existing = await prisma.product.findFirst({
        where: { ticker: ticker.toUpperCase(), id: { not: parseInt(id) } }
      });
      if (existing) return res.status(400).json({ error: 'Aquest ticker ja existeix' });
    }

    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(emoji && { emoji }),
        ...(ticker && { ticker: ticker.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(p0 && { p0: parseFloat(p0) }),
        ...(k && { k: parseFloat(k) }),
        ...(isActive !== undefined && { isActive }),
        ...(isTemporary !== undefined && { isPermanent: !(isTemporary === true || isTemporary === 'true') }),
      }
    });

    const currentPrice = calculatePriceWithBoosts(updated);

    res.json({
      message: 'Token actualitzat',
      product: { ...updated, currentPrice: parseFloat(currentPrice.toFixed(6)) }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error intern' });
  }
});

module.exports = router;
