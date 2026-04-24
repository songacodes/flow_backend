const express = require('express');
const {
  getTransactions,
  createTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getTransactions)
  .post(protect, createTransaction);

router.route('/:id')
  .delete(protect, deleteTransaction);

module.exports = router;
