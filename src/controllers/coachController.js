const { getAIResponse } = require('../utils/aiHelper');
const { getIndustryBenchmarks } = require('../services/aggregatorService');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const BusinessProfile = require('../models/BusinessProfile');
const User = require('../models/User');
const CoachChat = require('../models/CoachChat');

// @desc    Get a smart financial coaching tip based on user data
// @route   GET /api/coach/insight
// @access  Private
const getCoachingInsight = async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Fetch Community Benchmarks
    const benchmarks = await getIndustryBenchmarks(profile.industry);
    const benchmarkText = benchmarks.map(b => `${b.category}: Avg ${b.avg}`).join(', ');

    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']],
      limit: 15
    });

    const user = await User.findByPk(req.user.id);
    const userName = user ? user.name : 'Entrepreneur';

    const prompt = `You are Briant AI, a business coach for ${userName}. They run a ${profile.industry} business.
    COMMUNITY BENCHMARKS for this sector: ${benchmarkText}.
    Provide ONE tactical, 2-sentence strategy tip. Compare user data to benchmarks if relevant. Focus on profit gap.`;

    // REAL-TIME AI AUDIT LOGIC
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const personalSpending = transactions.filter(t => t.category === 'Personal').reduce((acc, t) => acc + t.amount, 0);
    const personalRatio = totalIncome > 0 ? (personalSpending / totalIncome) : 0;
    
    let healthStatus = 'optimal';
    let riskLabel = 'Optimal';
    if (personalRatio > 0.3) { healthStatus = 'risk'; riskLabel = 'High Risk'; }
    else if (personalRatio > 0.15) { healthStatus = 'caution'; riskLabel = 'Caution'; }

    try {
      const insight = await getAIResponse(prompt);
      res.json({ 
        insight, 
        healthReport: { status: healthStatus, label: riskLabel, personalRatio: (personalRatio * 100).toFixed(1) } 
      });
    } catch (apiError) {
      // SAFE-MODE STRATEGIC FALLBACK
      const fallbacks = [
        `As a ${profile.industry} owner, prioritize your 'Inventory' quality—it's the heart of ${profile.businessName}. — Briant AI`,
        `Briant Strategy: Every RWF saved in 'Transport' is another RWF toward your ${profile.monthlyRevenueGoal} goal. — Briant AI`,
        "Insight: Consistency in daily logging is your greatest competitive advantage in the Kigali market. — Briant AI",
        `Welcome to Flow. Tracking your small expenses this week will reveal your true profit margin. — Briant AI`
      ];
      res.json({ 
        insight: fallbacks[Math.floor(Math.random() * fallbacks.length)],
        healthReport: { status: healthStatus, label: riskLabel, personalRatio: (personalRatio * 100).toFixed(1) }
      });
    }
  } catch (error) {
    console.error('Briant AI Insight Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Interactive Chat with Briant AI
// @route   POST /api/coach/chat
// @access  Private
const chatWithCoach = async (req, res) => {
  const { message, context } = req.body;

  try {
    await CoachChat.create({ role: 'user', message, userId: req.user.id });

    const profile = await BusinessProfile.findOne({ where: { userId: req.user.id } });
    const goals = await Goal.findAll({ where: { userId: req.user.id } });
    const activeGoals = goals.map(g => `${g.title} (${g.current_savings}/${g.target_amount})`).join(', ');
    
    // Fetch recent 10 history docs
    const history = await CoachChat.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']], limit: 10 });
    const formattedHistory = history.reverse().map(h => `${h.role === 'ai' ? 'Briant' : 'User'}: ${h.message}`).join('\n');

    const systemPrompt = `You are Briant AI, a professional business coach for ${profile?.industry || 'artisans'} in the East African market. 
    The user's monthly revenue goal is ${profile?.monthlyRevenueGoal} ${profile?.currency}.
    Current business name: ${profile?.businessName}.
    CRITICAL: The user has specific financial targets they are saving for: ${activeGoals || 'General business growth'}. You MUST always remind them to save money and stay disciplined for these targets!
    Provide short, tactical, and encouraging advice. Be specific to their data.
    Previous Context:
    ${formattedHistory}`;

    try {
      const response = await getAIResponse(`${systemPrompt}`);
      await CoachChat.create({ role: 'ai', message: response, userId: req.user.id });
      res.json({ reply: response });
    } catch (apiError) {
      // SAFE-MODE FALLBACK
      res.json({ 
        reply: `Briant (Safe-Mode) here: My connection to the deep analysis cloud is unstable, but based on your ${profile?.industry} business, my tactical advice is to log every transaction and stay focused on your ${profile?.monthlyRevenueGoal} ${profile?.currency} target. What specific feature can I explain for you?` 
      });
    }
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBenchmarks = async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const benchmarks = await getIndustryBenchmarks(profile.industry);
    res.json(benchmarks);
  } catch (error) {
    console.error('Get Benchmarks Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const aiLogTransaction = async (req, res) => {
  const { prompt } = req.body;

  try {
    const goals = await Goal.findAll({ where: { userId: req.user.id } });
    const activeGoals = goals.map(g => g.title).join(', ');

    const systemPrompt = `You are a strict data extraction AI. The user wants to log a financial transaction.
Extract the data into EXACT JSON FORMAT (NO Markdown, NO extra text):
{ "amount": number|null, "category": string|null, "type": "income"|"expense"|null, "note": string|null, "customReply": string|null }

Rules:
1. Identify if it's earning money (income) or spending money (expense).
2. If ANY of amount, category, or type are missing from the prompt, return this EXACT JSON instead: 
{ "missingItem": true, "question": "Ask the user specifically for the missing info in one short conversational sentence." }
3. If ALL info is present, generate a 'customReply'. E.g. "Logged 5000 RWF for bag. Careful with expenses, remember you are saving for ${activeGoals || 'your goals'}!"
4. Return ONLY valid JSON, starting with { and ending with }. NO markdown ticks.`;

    const aiResponse = await getAIResponse(`${systemPrompt}\n\nUser Context:\n${prompt}`);
    
    // Robust JSON extraction
    let parsedData;
    try {
      const cleanText = aiResponse.replace(/```(?:json)?/gi, '').trim();
      const startIdx = cleanText.indexOf('{');
      const endIdx = cleanText.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) throw new Error("No JSON found");
      const validJson = cleanText.substring(startIdx, endIdx + 1);
      parsedData = JSON.parse(validJson);
    } catch (parseError) {
      console.error('JSON Extraction Error:', aiResponse);
      return res.json({ success: false, reply: "I couldn't understand those numbers. Can you restate it with a clear amount and category?" });
    }

    if (parsedData.missingItem) {
      return res.json({ success: false, reply: parsedData.question });
    }

    // Insert into database
    const transaction = await Transaction.create({
      amount: parsedData.amount,
      category: parsedData.category,
      type: parsedData.type,
      note: parsedData.note || 'Logged via Briant AI',
      date: new Date(),
      userId: req.user.id
    });

    res.json({ 
      success: true, 
      transaction, 
      reply: parsedData.customReply || `Successfully logged ${parsedData.type} of ${parsedData.amount} for ${parsedData.category}.` 
    });

  } catch (error) {
    console.error('AI Log System Error:', error);
    res.json({ success: false, reply: "Deep systemic error. I had trouble connecting to the logic core." });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const history = await CoachChat.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']]
    });
    res.json(history.map(h => ({ id: h.id, type: h.role, text: h.message })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const generateReport = async (req, res) => {
  const { transactions, startDate, endDate, goalTarget } = req.body;
  try {
    const profile = await BusinessProfile.findOne({ where: { userId: req.user.id } });
    const systemPrompt = `You are an expert Data Analyst summarizing financial statistics.
    The user operates a ${profile?.industry || 'business'}. Their monthly revenue goal is ${goalTarget}.
    Here are their filtered transactions from ${startDate} to ${endDate}:
    ${JSON.stringify(transactions)}
    
    Write a cohesive 2-paragraph "Zero to Hero" executive briefing analyzing their performance compared to their goal. Point out their biggest expense and praise strong income sources. Don't use markdown formatting, just plain text.`;
    
    const insight = await getAIResponse(systemPrompt);
    res.json({ report: insight });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCoachingInsight, chatWithCoach, getBenchmarks, aiLogTransaction, getChatHistory, generateReport };
