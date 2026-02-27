// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No autoritzat. Token no trobat.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        error: 'No autoritzat. Usuari no trobat.'
      });
    }

    if (!user.isActive || user.isBanned) {
      return res.status(403).json({
        error: 'Compte desactivat o banjat.'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invàlid.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirat. Torna a fer login.' });
    }
    return res.status(500).json({ error: 'Error intern del servidor.' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accés restringit a administradors.' });
  }
  next();
};

module.exports = authMiddleware;
module.exports.authenticateToken = authMiddleware;
module.exports.adminOnly = adminOnly;
