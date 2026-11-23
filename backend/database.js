const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Database file path (configurable via DB_STORAGE_PATH for Desktop App AppData persistence)
const defaultDbDir = path.join(__dirname, 'data');
const dbPath = process.env.DB_STORAGE_PATH || path.join(defaultDbDir, 'library.db');
const dbDir = path.dirname(dbPath);

// Ensure SQLite database storage directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize Sequelize ORM connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

// Verify database connection
sequelize.authenticate()
  .then(() => {
    console.log(' Connected to SQLite database with Sequelize ORM at:', dbPath);
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err.message);
  });

module.exports = sequelize;
