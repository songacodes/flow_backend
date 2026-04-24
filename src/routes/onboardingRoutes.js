const express = require('express');
const { getIntroMessage, completeOnboarding, getProfile } = require('../controllers/onboardingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/intro', protect, getIntroMessage);
router.post('/survey', protect, completeOnboarding);
router.get('/profile', protect, getProfile);

module.exports = router;
