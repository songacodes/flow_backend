const Transaction = require('../models/Transaction');

// @desc    Get all transactions for the logged-in user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']],
    });
    res.json(transactions);
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
  const { amount, category, type, note, date } = req.body;

  try {
    if (!amount || !type) {
      return res.status(400).json({ message: 'Amount and type are required' });
    }

    const transaction = await Transaction.create({
      amount,
      category,
      type,
      note,
      date: date || new Date(),
      userId: req.user.id,
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await transaction.destroy();
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error('Delete Transaction Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  deleteTransaction,
};
