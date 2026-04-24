const ShoppingItem = require('../models/ShoppingItem');

// @desc    Get all shopping items for the logged-in user
// @route   GET /api/shopping
// @access  Private
const getShoppingItems = async (req, res) => {
  try {
    const items = await ShoppingItem.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(items);
  } catch (error) {
    console.error('Get Shopping Items Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add a new shopping item
// @route   POST /api/shopping
// @access  Private
const createShoppingItem = async (req, res) => {
  const { item_name, estimated_price } = req.body;

  try {
    if (!item_name) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    const item = await ShoppingItem.create({
      item_name,
      estimated_price,
      userId: req.user.id,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create Shopping Item Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a shopping item (e.g., mark as bought)
// @route   PUT /api/shopping/:id
// @access  Private
const updateShoppingItem = async (req, res) => {
  const { item_name, estimated_price, status } = req.body;

  try {
    const item = await ShoppingItem.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.item_name = item_name || item.item_name;
    item.estimated_price = estimated_price !== undefined ? estimated_price : item.estimated_price;
    item.status = status || item.status;

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Update Shopping Item Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a shopping item
// @route   DELETE /api/shopping/:id
// @access  Private
const deleteShoppingItem = async (req, res) => {
  try {
    const item = await ShoppingItem.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.destroy();
    res.json({ message: 'Item removed' });
  } catch (error) {
    console.error('Delete Shopping Item Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getShoppingItems,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
};
