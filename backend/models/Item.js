const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Inventory item model covering Books, Copies, Pens, Stationery and Kits
const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  item_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  item_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'BOOK'
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  class_grade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  curriculum: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'NCERT'
  },
  author_publisher: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  stock_qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'items',
  timestamps: true
});

module.exports = Item;
