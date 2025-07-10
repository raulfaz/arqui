// routes/tasks.js
const express = require('express');
const taskController = require('../controllers/taskController');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de tareas requieren autenticación
router.use(authenticateToken);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;