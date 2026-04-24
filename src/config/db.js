const { Sequelize } = require('sequelize');

// Only load dotenv in development, not on Render
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log(`Attempting to connect to DB: ${process.env.DB_NAME} at ${process.env.DB_HOST}`);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      connectTimeout: 60000 
    },
    // Useful for FreeDB which can be slow to respond
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database Connected successfully');
  } catch (error) {
    // This will print the actual HOST it's trying to hit
    console.error(`❌ Connection failed for ${process.env.DB_HOST}:`, error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };