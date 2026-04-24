const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const CoachChat = sequelize.define('CoachChat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'ai'),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

CoachChat.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(CoachChat, { foreignKey: 'userId' });

module.exports = CoachChat;
