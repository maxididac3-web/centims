// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { generateUsername, validateUsername } = require('../utils/helpers');
const { sendWelcomeEmail } = require('../services/emails');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// POST /auth/register
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { email, name, password, username } = req.body;
    
    // Validacions
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Tots els camps són obligatoris' });
    }
    
    // Comprovar si l'email ja existeix
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Aquest email ja està registrat' });
    }
    
    // Generar o validar username
    let finalUsername = username;
    
    if (username) {
      // Validar username proporcionat
      const validation = validateUsername(username);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      
      // Comprovar que no existeix
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });
      
      if (existingUsername) {
        return res.status(400).json({ error: 'Aquest username ja està en ús' });
      }
    } else {
      // Generar username automàtic
      finalUsername = generateUsername(name);
      
      // Assegurar que sigui únic
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.user.findUnique({
          where: { username: finalUsername }
        });
        
        if (!existing) break;
        
        finalUsername = generateUsername(name);
        attempts++;
      }
    }
    
    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuari
    const user = await prisma.user.create({
      data: {
        email,
        name,
        username: finalUsername,
        password: hashedPassword,
        balanceEUR: 150.00, // Saldo inicial
        usernameUpdatedAt: new Date() // Marcar com a "ja canviat" per primer cop
      }
    });
    
    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Enviar email benvinguda (async, no bloqueja el registre)
    sendWelcomeEmail(user).catch(err => {
      console.error('Error enviant email benvinguda:', err);
    });

    res.status(201).json({
      message: 'Usuari registrat correctament',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        balanceEUR: user.balanceEUR
      }
    });
    
  } catch (error) {
    console.error('Error registrant usuari:', error);
    res.status(500).json({ error: 'Error del servidor' });
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
        username: user.username,
        balanceEUR: user.balanceEUR,
        role: user.role,
        createdAt: user.createdAt,
        usernameUpdatedAt: user.usernameUpdatedAt,
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
        username: true,
        balanceEUR: true,
        role: true,
        createdAt: true,
        usernameUpdatedAt: true,
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