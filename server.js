const express = require('express');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Importar cors
const app = express();
const PORT = 5000;

app.use(cors()); // Usar cors
app.use(express.json());

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).send({ error: 'No autorizado' });
  }
  try {
    const decoded = jwt.verify(token, 'secretKey');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: 'No autorizado' });
  }
};

// Rutas para gestionar tareas
app.get('/tareas', async (req, res) => {
  try {
    const data = await fs.readFile('./tareas.json', 'utf8');
    const tareas = JSON.parse(data);
    res.status(200).json(tareas);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer las tareas' });
  }
});

app.post('/tareas', authMiddleware, async (req, res) => {
  const { titulo, descripcion } = req.body;
  try {
    const data = await fs.readFile('./tareas.json', 'utf8');
    const tareas = JSON.parse(data);
    const nuevaTarea = { id: tareas.length + 1, titulo, descripcion };
    tareas.push(nuevaTarea);
    await fs.writeFile('./tareas.json', JSON.stringify(tareas));
    res.status(201).json(nuevaTarea);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar la tarea' });
  }
});

app.put('/tareas/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion } = req.body;
  try {
    const data = await fs.readFile('./tareas.json', 'utf8');
    const tareas = JSON.parse(data);
    const tareaIndex = tareas.findIndex(t => t.id === parseInt(id));
    if (tareaIndex !== -1) {
      tareas[tareaIndex] = { id: parseInt(id), titulo, descripcion };
      await fs.writeFile('./tareas.json', JSON.stringify(tareas));
      res.status(200).json(tareas[tareaIndex]);
    } else {
      res.status(404).json({ error: 'Tarea no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
});

app.delete('/tareas/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const data = await fs.readFile('./tareas.json', 'utf8');
    const tareas = JSON.parse(data);
    const nuevaListaTareas = tareas.filter(t => t.id !== parseInt(id));
    await fs.writeFile('./tareas.json', JSON.stringify(nuevaListaTareas));
    res.status(200).json({ message: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

// Rutas de autenticación
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 8);
  // Aquí deberías guardar el usuario en una base de datos
  res.status(201).send({ username, password: hashedPassword });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Aquí deberías verificar el usuario en una base de datos
  const token = jwt.sign({ username }, 'secretKey');
  res.status(200).send({ token });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});