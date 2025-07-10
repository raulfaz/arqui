// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const logger = require('../config/logger');

const authController = {
  // Registro de usuario
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validar datos de entrada
      if (!username || !email || !password) {
        logger.warn('Intento de registro con datos faltantes', { username, email });
        return res.status(400).json({ error: 'Username, email y password son requeridos' });
      }

      // Verificar si el usuario ya existe
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUsers.length > 0) {
        logger.warn('Intento de registro con usuario/email existente', { username, email });
        return res.status(400).json({ error: 'El usuario o email ya existe' });
      }

      // Encriptar password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insertar nuevo usuario
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      const userId = result.insertId;

      // Generar JWT
      const token = jwt.sign(
        { id: userId, username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      logger.info('Usuario registrado exitosamente', { userId, username, email });

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token,
        user: { id: userId, username, email }
      });

    } catch (error) {
      logger.error('Error en registro de usuario', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Login de usuario
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        logger.warn('Intento de login con datos faltantes', { username });
        return res.status(400).json({ error: 'Username y password son requeridos' });
      }

      // Buscar usuario
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        logger.warn('Intento de login con usuario inexistente', { username });
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = users[0];

      // Verificar password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        logger.warn('Intento de login con password incorrecta', { username, userId: user.id });
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar JWT
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      logger.info('Login exitoso', { userId: user.id, username: user.username });

      res.json({
        message: 'Login exitoso',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });

    } catch (error) {
      logger.error('Error en login', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = authController;