// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// POST /auth/register
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // Validacions
    if (!email || !name || !password) {
      return res.status(400).json({
        error: 'Email, nom i password són obligatoris.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'El password ha de tenir mínim 6 caràcters.'
      });
    }

    // Verificar si l'email ja existeix
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Aquest email ja està registrat.'
      });
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuari
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        balanceEUR: 0,
      }
    });

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      message: 'Usuari creat correctament!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balanceEUR: user.balanceEUR,
        role: user.role,
      },
      token,
    });

  } catch (error) {
    console.error('Error register:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

// ============================================
// POST /auth/login
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validacions
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email i password són obligatoris.'
      });
    }

    // Buscar usuari
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Email o password incorrectes.'
      });
    }

    // Verificar password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: 'Email o password incorrectes.'
      });
    }

    // Verificar que el compte està actiu
    if (!user.isActive || user.isBanned) {
      return res.status(403).json({
        error: 'Compte desactivat o banjat.'
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login correcte!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balanceEUR: user.balanceEUR,
        role: user.role,
      },
      token,
    });

  } catch (error) {
    console.error('Error login:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

// ============================================
// GET /auth/me (ruta protegida)
// ============================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        balanceEUR: true,
        role: true,
        createdAt: true,
      }
    });

    return res.status(200).json({ user });

  } catch (error) {
    console.error('Error me:', error);
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
});

module.exports = router;