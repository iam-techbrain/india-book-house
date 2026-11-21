const sequelize = require('../database');
const User = require('./User');
const School = require('./School');
const Item = require('./Item');
const Student = require('./Student');
const {
  ItemType,
  ClassGrade,
  Subject,
  AuthorPublisher,
  BoardType,
  Curriculum,
  Role
} = require('./masters');

// Export all database models and connection instance
module.exports = {
  sequelize,
  User,
  School,
  Item,
  Student,
  ItemType,
  ClassGrade,
  Subject,
  AuthorPublisher,
  BoardType,
  Curriculum,
  Role
};
