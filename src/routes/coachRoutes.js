const express = require('express');
const { getCoachingInsight, chatWithCoach, getBenchmarks, aiLogTransaction, getChatHistory, generateReport } = require('../controllers/coachController');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/insight', protect, getCoachingInsight);
router.get('/benchmarks', protect, getBenchmarks);
router.get('/chat-history', protect, getChatHistory);
router.post('/chat', protect, chatWithCoach);
router.post('/ai-log', protect, aiLogTransaction);
router.post('/report', protect, generateReport);

module.exports = router;
