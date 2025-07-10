// middleware/auth.js
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Acceso denegado - No se proporcionó token', {
      ip: req.ip,
      url: req.originalUrl
    });
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Token inválido', {
        ip: req.ip,
        url: req.originalUrl,
        error: err.message
      });
      return res.status(403).json({ error: 'Token inválido.' });
    }
    
    req.user = user;
    logger.info('Token validado exitosamente', {
      userId: user.id,
      username: user.username
    });
    next();
  });
};

module.exports = authenticateToken;