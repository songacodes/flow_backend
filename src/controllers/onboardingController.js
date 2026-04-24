const { getAIResponse } = require('../utils/aiHelper');
const User = require('../models/User');
const BusinessProfile = require('../models/BusinessProfile');

/**
 * @desc    Get the introductory onboarding message from the AI Coach
 * @route   GET /api/onboarding/intro
 * @access  Private
 */
const getIntroMessage = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const prompt = `
      You are "Briant AI", the AI financial sidekick built into Flow. Use a warm, professional, confident tone.
      Greet ${user.name} for the first time. Tell them:
      1. You are here to help them manage their finances and reach their business goals.
      2. They should start by clicking the '+' button to log their first expense or income.
      3. Tell them that you will watch their spending and give them personalized tips regularly.
      Keep it very concise (max 3 sentences). Sign off as "— Briant AI".
    `;

    const message = await getAIResponse(prompt);

    res.json({ message });
  } catch (error) {
    console.error('Onboarding Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Submit business survey & Mark the user as onboarded
 * @route   POST /api/onboarding/survey
 * @access  Private
 */
const completeOnboarding = async (req, res) => {
  const { businessName, industry, currency, monthlyRevenueGoal } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Attempt to upsert existing business profile or create new
    let profile = await BusinessProfile.findOne({ where: { userId: user.id } });
    if (profile) {
      profile.businessName = businessName;
      profile.industry = industry;
      profile.currency = currency || 'RWF';
      profile.monthlyRevenueGoal = monthlyRevenueGoal;
      await profile.save();
    } else {
      profile = await BusinessProfile.create({
        userId: user.id,
        businessName,
        industry,
        currency: currency || 'RWF',
        monthlyRevenueGoal,
      });
    }

    user.is_onboarded = true;
    await user.save();
    
    res.json({ message: 'Onboarding completed', profile });
  } catch (error) {
    console.error('Complete Onboarding Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getIntroMessage, completeOnboarding, getProfile };
