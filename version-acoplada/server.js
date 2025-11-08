// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');  
const planetRoutes = require('./src/routes/planetRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'planets-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/', planetRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejador de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
    ========================================
     API de Planetas iniciada
     Puerto: ${PORT}
     Endpoints disponibles:
     - POST   /planets
     - GET    /planets
     - GET    /planets/:id
     - PUT    /planets/:id
     - DELETE /planets/:id
    ========================================
  `);
});
