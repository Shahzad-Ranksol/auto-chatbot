const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateGeminiResponse(message, knowledgeBase, businessName, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a helpful customer service assistant for ${businessName}. Use the following business information to answer questions:\n\n${knowledgeBase}\n\nBe concise and friendly. If you don't know the answer, say so honestly.\n\nCustomer: ${message}\nAssistant:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function testGeminiKey(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  await model.generateContent('Reply with the word OK only.');
  return true;
}

module.exports = { generateGeminiResponse, testGeminiKey };
