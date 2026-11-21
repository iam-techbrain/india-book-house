const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// 1. Item Type Master (e.g. BOOK, COPY, PEN, STATIONERY, KIT, UNIFORM)
const ItemType = sequelize.define('ItemType', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'master_item_types',
  timestamps: true
});

// 2. Class Master (e.g. Class 1 to Class 12, Nursery, LKG, UKG)
const ClassGrade = sequelize.define('ClassGrade', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  class_number: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'master_classes',
  timestamps: true
});

// 3. Subject Master (e.g. Mathematics, Science, English, Hindi, Social Science)
const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'master_subjects',
  timestamps: true
});

// 4. Author / Publisher Master (e.g. NCERT, Classmate, Reynolds, Oxford)
const AuthorPublisher = sequelize.define('AuthorPublisher', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'PUBLISHER'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'master_authors_publishers',
  timestamps: true
});

// 5. Board Type Master (e.g. CBSE, ICSE, State Board, IB)
const BoardType = sequelize.define('BoardType', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'master_board_types',
  timestamps: true
});

// 6. Curriculum Master (e.g. NCERT, Private Publisher)
const Curriculum = sequelize.define('Curriculum', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'master_curriculums',
  timestamps: true
});

// 7. Role Master (e.g. admin, staff, accountant, teacher)
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'master_roles',
  timestamps: true
});

module.exports = {
  ItemType,
  ClassGrade,
  Subject,
  AuthorPublisher,
  BoardType,
  Curriculum,
  Role
};
