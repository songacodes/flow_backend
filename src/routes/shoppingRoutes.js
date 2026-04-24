const express = require('express');
const {
  getShoppingItems,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
} = require('../controllers/shoppingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getShoppingItems)
  .post(protect, createShoppingItem);

router.route('/:id')
  .put(protect, updateShoppingItem)
  .delete(protect, deleteShoppingItem);

module.exports = router;
