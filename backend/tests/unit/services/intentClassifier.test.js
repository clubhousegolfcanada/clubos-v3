// Use manual mock
jest.mock('openai');

const OpenAI = require('openai');
const { classifyIntent } = require('../../../src/services/intentClassifier');

describe('Intent Classifier Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('classifyIntent', () => {
    it('should classify tech issue intent correctly', async () => {
      OpenAI.mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'tech_issue',
              confidence: 0.92
            })
          }
        }]
      });

      const result = await classifyIntent('The TrackMan is not working properly');
      
      expect(result).toEqual({
        intent: 'tech_issue',
        confidence: 0.92
      });
      
      expect(OpenAI.mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          { role: 'system', content: expect.stringContaining('intent classifier') },
          { role: 'user', content: 'The TrackMan is not working properly' }
        ]),
        temperature: 0.3,
        max_tokens: 50
      });
    });

    it('should classify booking intent correctly', async () => {
      OpenAI.mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'booking',
              confidence: 0.88
            })
          }
        }]
      });

      const result = await classifyIntent('I want to book a session for tomorrow');
      
      expect(result).toEqual({
        intent: 'booking',
        confidence: 0.88
      });
    });

    it('should handle invalid intent responses', async () => {
      OpenAI.mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'invalid_intent',
              confidence: 0.9
            })
          }
        }]
      });

      const result = await classifyIntent('Test message');
      
      expect(result).toEqual({
        intent: 'faq',
        confidence: 0.3
      });
    });

    it('should handle missing confidence scores', async () => {
      OpenAI.mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: 'access'
            })
          }
        }]
      });

      const result = await classifyIntent('I cannot get into the building');
      
      expect(result).toEqual({
        intent: 'access',
        confidence: 0.5
      });
    });

    it('should handle API errors gracefully', async () => {
      OpenAI.mockCreate.mockRejectedValueOnce(
        new Error('OpenAI API error')
      );

      const result = await classifyIntent('Test message');
      
      expect(result).toEqual({
        intent: 'faq',
        confidence: 0.3
      });
    });

    it('should handle malformed JSON responses', async () => {
      OpenAI.mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'Not valid JSON'
          }
        }]
      });

      const result = await classifyIntent('Test message');
      
      expect(result).toEqual({
        intent: 'faq',
        confidence: 0.3
      });
    });
  });
});