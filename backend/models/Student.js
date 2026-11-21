const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Student model with class-section roster details, JSON kit checklist and fee accounting
const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  entry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  school_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  school_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  program: {
    type: DataTypes.STRING,
    allowNull: true
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  class_grade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  section_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  section: {
    type: DataTypes.STRING,
    defaultValue: 'A'
  },
  book_category: {
    type: DataTypes.STRING,
    defaultValue: 'NCERT'
  },
  student_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  student_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  father_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  items_json: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  total_payment: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  concession: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  concession_reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  net_payable: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  paid_amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  due_amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  payment_status: {
    type: DataTypes.STRING,
    defaultValue: 'UNPAID'
  },
  delivery_status: {
    type: DataTypes.STRING,
    defaultValue: 'PENDING'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'students',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['school_id', 'student_id']
    }
  ]
});

module.exports = Student;
