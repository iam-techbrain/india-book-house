const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const { sequelize } = require('./models');
const { responseMiddleware, sendSuccess, sendError } = require('./utils/response');

// Route controllers
const authRoutes = require('./routes/auth');
const schoolRoutes = require('./routes/schools');
const itemRoutes = require('./routes/items');
const studentRoutes = require('./routes/students');
const masterRoutes = require('./routes/masters');
const syncRoutes = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 5000;

// Application middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseMiddleware);

// Core API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/sync', syncRoutes);

// Interactive Swagger UI documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'India Book House - API Documentation'
}));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve static production build from frontend/dist if available
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Health status check endpoint
app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    app: 'India Book House',
    status: 'ONLINE',
    docs: `http://localhost:${PORT}/docs`,
    timestamp: new Date().toISOString()
  }, 'India Book House Server is healthy and running', 200);
});

// Single Page Application (SPA) fallback for client router
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/docs') || req.path.startsWith('/api-docs')) {
    return next();
  }
  if (fs.existsSync(frontendDist)) {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  return res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 60px 20px;">
      <h1 style="color: #1e3a8a;">📚 India Book House Backend</h1>
      <p style="color: #475569; font-size: 16px;">Server is running with Express, SQLite & Master Lookup Tables.</p>
      <div style="margin-top: 30px;">
        <a href="/docs" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          📖 Open Interactive API Docs (/docs)
        </a>
      </div>
    </div>
  `);
});

// Fallback 404 handler for unrecognized routes
app.use((req, res) => {
  return sendError(res, `Endpoint '${req.originalUrl}' not found`, 404);
});

// Global internal server error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  return sendError(res, 'Internal Server Error', 500, err.message);
});

// Synchronize database tables and start HTTP server
sequelize.sync().then(() => {
  console.log('✅ All Sequelize Models & Masters synchronized with database.');
  app.listen(PORT, () => {
    console.log(`📚 India Book House Server is running on: http://localhost:${PORT}`);
    console.log(`📖 API Documentation available at: http://localhost:${PORT}/docs`);
  });
}).catch((err) => {
  console.error('❌ Failed to sync database models:', err.message);
});
