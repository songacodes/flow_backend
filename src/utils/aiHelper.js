const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Sends a prompt to the Gemini AI and returns the text response.
 * @param {string} prompt - The question or instructions for the AI.
 * @returns {Promise<string>} - The AI's response text.
 */
const getAIResponse = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    if (!text) throw new Error('Empty AI response');
    return text;
  } catch (error) {
    console.error('AI Helper Error:', error.message);
    throw error;
  }
};

module.exports = { getAIResponse };
