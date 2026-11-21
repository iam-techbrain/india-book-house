const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Ensure SQLite database storage directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dbDir, 'library.db');

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
