const OpenAI = require('openai');

async function generateAIResponse(message, knowledgeBase, businessName, apiKey) {
  const client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful customer service assistant for ${businessName}. Use the following business information to answer questions:\n\n${knowledgeBase}\n\nBe concise and friendly. If you don't know the answer, say so honestly.`
      },
      { role: 'user', content: message }
    ],
    max_tokens: 400
  });
  return completion.choices[0].message.content;
}

async function testOpenAIKey(apiKey) {
  const client = new OpenAI({ apiKey });
  await client.models.list();
  return true;
}

module.exports = { generateAIResponse, testOpenAIKey };
