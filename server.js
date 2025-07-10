// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const logger = require('./config/logger');

// Importar rutas
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana de tiempo
});
app.use(limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  logger.info('Solicitud recibida', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente', timestamp: new Date().toISOString() });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  logger.warn('Ruta no encontrada', { url: req.originalUrl, method: req.method });
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  logger.error('Error no manejado', { 
    error: err.message, 
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicializar servidor
async function startServer() {
  try {
    // Crear directorio de logs si no existe
    const fs = require('fs');
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }

    // Inicializar base de datos
    await initDatabase();

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Servidor iniciado en puerto ${PORT}`);
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Error al iniciar servidor', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();

// Manejo de señales para cierre graceful
process.on('SIGINT', () => {
  logger.info('Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Cerrando servidor...');
  process.exit(0);
});