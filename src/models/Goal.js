const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Goal = sequelize.define('Goal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  target_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  current_savings: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
  },
  deadline: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.ENUM('in-progress', 'completed'),
    defaultValue: 'in-progress',
  },
}, {
  timestamps: true,
});

// Associations
User.hasMany(Goal, { foreignKey: 'userId', onDelete: 'CASCADE' });
Goal.belongsTo(User, { foreignKey: 'userId' });

module.exports = Goal;
