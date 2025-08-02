const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const INTENTS = {
  TECH_ISSUE: 'tech_issue',
  BOOKING: 'booking', 
  ACCESS: 'access',
  FAQ: 'faq'
};

async function classifyIntent(message) {
  try {
    const systemPrompt = `You are an intent classifier for a golf simulator facility.
    
Classify customer messages into one of these intents:
- tech_issue: Equipment problems, TrackMan issues, screen problems, etc.
- booking: Reservation questions, scheduling, cancellations
- access: Door access, entry issues, unlock requests
- faq: General questions, policies, hours, pricing

Respond ONLY with valid JSON in this format:
{"intent": "tech_issue", "confidence": 0.95}

Confidence should be between 0 and 1.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Validate response
    if (!result.intent || !Object.values(INTENTS).includes(result.intent)) {
      throw new Error('Invalid intent classification');
    }
    
    return {
      intent: result.intent,
      confidence: result.confidence || 0.5
    };
  } catch (error) {
    console.error('Intent classification error:', error);
    // Fallback to FAQ with low confidence
    return {
      intent: INTENTS.FAQ,
      confidence: 0.3
    };
  }
}

module.exports = { classifyIntent, INTENTS };