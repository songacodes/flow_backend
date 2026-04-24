const mysql = require('mysql2/promise');
const { sequelize } = require('../src/config/db');
require('dotenv').config();

// Load models to ensure they are registered with sequelize
require('../src/models/User');
require('../src/models/Transaction');
require('../src/models/ShoppingItem');
require('../src/models/Goal');
require('../src/models/BusinessProfile');
require('../src/models/CoachChat');

async function initializeDatabase() {
  try {
    // 1. Create database if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`);
    console.log(`✅ Database "${process.env.DB_NAME}" verified/created.`);
    await connection.end();

    // 2. Sync models
    console.log('⏳ Syncing models with the database...');
    await sequelize.sync({ alter: true }); // Use alter to keep data but update schema
    console.log('✅ All models synced successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
