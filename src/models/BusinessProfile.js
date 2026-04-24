const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BusinessProfile = sequelize.define('BusinessProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'RWF',
  },
  monthlyRevenueGoal: {
    type: DataTypes.FLOAT,
    allowNull: true,
  }
}, {
  timestamps: true,
});

const User = require('./User');
User.hasOne(BusinessProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
BusinessProfile.belongsTo(User, { foreignKey: 'userId' });

module.exports = BusinessProfile;
