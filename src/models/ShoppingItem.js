const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const ShoppingItem = sequelize.define('ShoppingItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  item_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  estimated_price: {
    type: DataTypes.DECIMAL(15, 2),
  },
  status: {
    type: DataTypes.ENUM('pending', 'bought'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
});

// Associations
User.hasMany(ShoppingItem, { foreignKey: 'userId', onDelete: 'CASCADE' });
ShoppingItem.belongsTo(User, { foreignKey: 'userId' });

module.exports = ShoppingItem;
