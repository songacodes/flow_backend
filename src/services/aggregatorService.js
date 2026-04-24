const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const BusinessProfile = require('../models/BusinessProfile');
const { sequelize } = require('../config/db');

/**
 * Calculates anonymized spending benchmarks for a specific industry
 * returns averages for each category
 */
const getIndustryBenchmarks = async (industry) => {
  try {
    // Join Transactions with BusinessProfiles to filter by industry
    const results = await Transaction.findAll({
      attributes: [
        'category',
        [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount'],
        [sequelize.fn('COUNT', sequelize.col('Transaction.id')), 'totalLogs']
      ],
      include: [{
        model: require('../models/User'),
        required: true,
        include: [{
          model: BusinessProfile,
          where: { industry: industry },
          required: true
        }]
      }],
      group: ['category'],
      raw: true
    });

    // If we have real crowd data, use it. Otherwise, return synthetic expert data
    if (results.length > 5) {
      return results.map(r => ({
        category: r.category,
        avg: parseFloat(r.averageAmount).toFixed(0),
        count: r.totalLogs
      }));
    }

    // SYNTHETIC SECTOR BENCHMARKS (Rwandan Market Experts)
    const sectorDefaults = {
      'Bakery': [
        { category: 'Inventory', avg: '45000', percentage: 45 },
        { category: 'Transport', avg: '12000', percentage: 12 },
        { category: 'Rent', avg: '20000', percentage: 20 },
        { category: 'Marketing', avg: '5000', percentage: 5 }
      ],
      'Retail': [
        { category: 'Inventory', avg: '60000', percentage: 60 },
        { category: 'Transport', avg: '8000', percentage: 8 },
        { category: 'Rent', avg: '15000', percentage: 15 }
      ]
    };

    return sectorDefaults[industry] || sectorDefaults['Retail'];
  } catch (error) {
    console.error('Benchmarking Error:', error);
    return [];
  }
};

module.exports = { getIndustryBenchmarks };
