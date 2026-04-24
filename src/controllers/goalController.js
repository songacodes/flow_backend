const Goal = require('../models/Goal');

// @desc    Get all goals for the logged-in user
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { userId: req.user.id },
      order: [['deadline', 'ASC']],
    });
    res.json(goals);
  } catch (error) {
    console.error('Get Goals Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new financial goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res) => {
  const { title, target_amount, deadline } = req.body;

  try {
    if (!title || !target_amount) {
      return res.status(400).json({ message: 'Title and target amount are required' });
    }

    const goal = await Goal.create({
      title,
      target_amount,
      deadline,
      userId: req.user.id,
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Create Goal Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update goal progress
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res) => {
  const { current_savings, status, title, target_amount, deadline } = req.body;

  try {
    const goal = await Goal.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.title = title || goal.title;
    goal.target_amount = target_amount || goal.target_amount;
    goal.current_savings = current_savings !== undefined ? current_savings : goal.current_savings;
    goal.deadline = deadline || goal.deadline;
    goal.status = status || goal.status;

    await goal.save();
    res.json(goal);
  } catch (error) {
    console.error('Update Goal Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    await goal.destroy();
    res.json({ message: 'Goal removed' });
  } catch (error) {
    console.error('Delete Goal Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
};
