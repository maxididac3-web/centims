// src/middleware/admin.js

const adminMiddleware = (req, res, next) => {
  try {
    // Aquest middleware s'ha d'usar DESPRÉS de authMiddleware
    // req.user ja existeix gràcies a authMiddleware

    if (!req.user) {
      return res.status(401).json({
        error: 'No autoritzat. Cal fer login primer.'
      });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Accés denegat. Necessites permisos d\'administrador.'
      });
    }

    next();

  } catch (error) {
    return res.status(500).json({
      error: 'Error intern del servidor.'
    });
  }
};

module.exports = adminMiddleware;