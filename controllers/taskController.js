// controllers/taskController.js
const { pool } = require('../config/database');
const logger = require('../config/logger');

const taskController = {
  // Obtener todas las tareas del usuario
  async getTasks(req, res) {
    try {
      const userId = req.user.id;

      const [tasks] = await pool.execute(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      logger.info('Tareas obtenidas exitosamente', { userId, taskCount: tasks.length });

      res.json({
        message: 'Tareas obtenidas exitosamente',
        tasks
      });

    } catch (error) {
      logger.error('Error al obtener tareas', { 
        userId: req.user.id, 
        error: error.message, 
        stack: error.stack 
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Crear nueva tarea
  async createTask(req, res) {
    try {
      const { title, description } = req.body;
      const userId = req.user.id;

      if (!title) {
        logger.warn('Intento de crear tarea sin título', { userId });
        return res.status(400).json({ error: 'El título es requerido' });
      }

      const [result] = await pool.execute(
        'INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)',
        [title, description || '', userId]
      );

      const taskId = result.insertId;

      // Obtener la tarea creada
      const [tasks] = await pool.execute(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
      );

      const newTask = tasks[0];

      logger.info('Tarea creada exitosamente', { 
        userId, 
        taskId, 
        title: newTask.title 
      });

      res.status(201).json({
        message: 'Tarea creada exitosamente',
        task: newTask
      });

    } catch (error) {
      logger.error('Error al crear tarea', { 
        userId: req.user.id, 
        error: error.message, 
        stack: error.stack 
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar tarea
  async updateTask(req, res) {
    try {
      const taskId = req.params.id;
      const userId = req.user.id;
      const { title, description, completed } = req.body;

      // Verificar que la tarea pertenece al usuario
      const [existingTasks] = await pool.execute(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
        [taskId, userId]
      );

      if (existingTasks.length === 0) {
        logger.warn('Intento de actualizar tarea inexistente o no autorizada', { 
          userId, 
          taskId 
        });
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      const existingTask = existingTasks[0];

      // Actualizar campos
      const updatedTitle = title !== undefined ? title : existingTask.title;
      const updatedDescription = description !== undefined ? description : existingTask.description;
      const updatedCompleted = completed !== undefined ? completed : existingTask.completed;

      await pool.execute(
        'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ? AND user_id = ?',
        [updatedTitle, updatedDescription, updatedCompleted, taskId, userId]
      );

      // Obtener la tarea actualizada
      const [updatedTasks] = await pool.execute(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
      );

      const updatedTask = updatedTasks[0];

      logger.info('Tarea actualizada exitosamente', { 
        userId, 
        taskId, 
        title: updatedTask.title 
      });

      res.json({
        message: 'Tarea actualizada exitosamente',
        task: updatedTask
      });

    } catch (error) {
      logger.error('Error al actualizar tarea', { 
        userId: req.user.id, 
        taskId: req.params.id,
        error: error.message, 
        stack: error.stack 
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Eliminar tarea
  async deleteTask(req, res) {
    try {
      const taskId = req.params.id;
      const userId = req.user.id;

      // Verificar que la tarea pertenece al usuario
      const [existingTasks] = await pool.execute(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
        [taskId, userId]
      );

      if (existingTasks.length === 0) {
        logger.warn('Intento de eliminar tarea inexistente o no autorizada', { 
          userId, 
          taskId 
        });
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      const task = existingTasks[0];

      await pool.execute(
        'DELETE FROM tasks WHERE id = ? AND user_id = ?',
        [taskId, userId]
      );

      logger.info('Tarea eliminada exitosamente', { 
        userId, 
        taskId, 
        title: task.title 
      });

      res.json({
        message: 'Tarea eliminada exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar tarea', { 
        userId: req.user.id, 
        taskId: req.params.id,
        error: error.message, 
        stack: error.stack 
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = taskController;