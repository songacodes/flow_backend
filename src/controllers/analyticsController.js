const Transaction = require('../models/Transaction');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

/**
 * @desc    Get financial analytics summary
 * @route   GET /api/analytics/summary
 * @access  Private
 */
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Total Income and Total Expense
    const incomeResult = await Transaction.sum('amount', {
      where: { userId, type: 'income' }
    }) || 0;

    const expenseResult = await Transaction.sum('amount', {
      where: { userId, type: 'expense' }
    }) || 0;

    // 2. Spending by Category
    const categoryResult = await Transaction.findAll({
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
      ],
      where: { userId, type: 'expense' },
      group: ['category'],
      order: [[sequelize.literal('total_amount'), 'DESC']]
    });

    // 3. Last 30 days trend (Daily totals)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrend = await Transaction.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('date')), 'day'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'daily_total'],
        'type'
      ],
      where: {
        userId,
        date: { [Op.gte]: thirtyDaysAgo }
      },
      group: [sequelize.fn('DATE', sequelize.col('date')), 'type'],
      order: [[sequelize.literal('day'), 'ASC']]
    });

    res.json({
      total_income: incomeResult,
      total_expense: expenseResult,
      balance: incomeResult - expenseResult,
      by_category: categoryResult,
      daily_trend: dailyTrend
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getSummary };
