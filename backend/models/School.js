const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// School model for tracking affiliated schools, board type and curriculum
const School = sequelize.define('School', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  board_type: {
    type: DataTypes.STRING,
    defaultValue: 'CBSE'
  },
  curriculum: {
    type: DataTypes.STRING,
    defaultValue: 'NCERT'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE'
  },
  entry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'schools',
  timestamps: true
});

module.exports = School;
