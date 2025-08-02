/**
 * Claude API Helper
 * Migrated from V1 - Handles Claude (Anthropic) API interactions
 */

const axios = require('axios');

class ClaudeClient {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.baseUrl = 'https://api.anthropic.com';
    this.model = process.env.CLAUDE_MODEL || 'claude-3-opus-20240229';
    this.enabled = Boolean(this.apiKey);
    
    if (this.enabled) {
      this.client = axios.create({
        baseURL: this.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      });
    } else {
      console.warn('Claude API key not configured');
    }
  }

  /**
   * Suggest a new SOP based on a customer interaction
   * @param {string} prompt - Description of the interaction
   * @param {Object} context - Additional context
   * @returns {Object} SOP draft or null
   */
  async claudeSuggestSOP(prompt, context = {}) {
    if (!this.enabled) {
      console.log('[Claude Disabled] Would suggest SOP for:', prompt);
      return null;
    }

    try {
      const systemPrompt = `You are an AI assistant helping to create Standard Operating Procedures (SOPs) for a golf simulator facility management system.

Given a customer interaction or issue, suggest a new SOP in the following JSON format:
{
  "title": "Brief descriptive title",
  "category": "tech_issue|booking|access|faq",
  "trigger_phrases": ["phrase1", "phrase2", "phrase3"],
  "primary_action": "reset_trackman|unlock_door|escalate|send_message",
  "fallback_action": "escalate",
  "prerequisites": ["booking_active", "device_online"],
  "timeout_seconds": 30,
  "max_retries": 2,
  "tags": ["relevant", "tags"],
  "context": {
    "location": ["all"],
    "notes": "Any additional context"
  }
}

Only suggest SOPs for repeatable issues that can be automated. 
Ensure trigger phrases are specific and unlikely to cause false matches.
Primary actions must be one of: reset_trackman, unlock_door, escalate, send_message.`;

      const userPrompt = `Customer interaction: ${prompt}

Additional context: ${JSON.stringify(context)}

Suggest an appropriate SOP for handling this type of request in the future.`;

      const response = await this.client.post('/v1/messages', {
        model: this.model,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const content = response.data.content[0]?.text;
      if (!content) {
        throw new Error('No content in Claude response');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const sopDraft = JSON.parse(jsonMatch[0]);
      
      // Add metadata
      sopDraft.source_metadata = {
        created_by: 'claude',
        source: 'ai_suggestion',
        prompt: prompt.substring(0, 100),
        model: this.model,
        timestamp: new Date().toISOString()
      };
      
      sopDraft.status = 'draft'; // Always start as draft
      
      return sopDraft;

    } catch (error) {
      console.error('Claude SOP suggestion error:', error.message);
      return null;
    }
  }

  /**
   * Suggest merging similar SOPs
   * @param {Array} existingSOPs - Array of existing SOPs
   * @returns {Object} Merge proposal or null
   */
  async claudeSuggestMerge(existingSOPs) {
    if (!this.enabled || !existingSOPs || existingSOPs.length < 2) {
      return null;
    }

    try {
      const systemPrompt = `You are an AI assistant helping to optimize Standard Operating Procedures (SOPs).

Analyze the provided SOPs and identify any that should be merged due to:
1. Similar trigger phrases
2. Same primary action
3. Overlapping purpose

Return a JSON object with merge suggestions:
{
  "merge_groups": [
    {
      "sop_ids": [1, 2, 3],
      "reason": "Why these should be merged",
      "suggested_merged_sop": {
        "title": "Merged title",
        "trigger_phrases": ["combined", "phrases"],
        "primary_action": "action",
        "tags": ["combined", "tags"]
      }
    }
  ],
  "confidence": 0.85
}

Only suggest merges with high confidence (>0.8).`;

      const sopsForAnalysis = existingSOPs.map(sop => ({
        id: sop.id,
        title: sop.title,
        trigger_phrases: sop.trigger_phrases,
        primary_action: sop.primary_action,
        tags: sop.tags || []
      }));

      const response = await this.client.post('/v1/messages', {
        model: this.model,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze these SOPs for potential merges:\n\n${JSON.stringify(sopsForAnalysis, null, 2)}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      const content = response.data.content[0]?.text;
      if (!content) {
        return null;
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const mergeProposal = JSON.parse(jsonMatch[0]);
      
      // Only return if we have high-confidence suggestions
      if (mergeProposal.confidence >= 0.8 && mergeProposal.merge_groups?.length > 0) {
        return mergeProposal;
      }

      return null;

    } catch (error) {
      console.error('Claude merge suggestion error:', error.message);
      return null;
    }
  }

  /**
   * Analyze a failed action and suggest improvements
   * @param {Object} failedAction - Details of the failed action
   * @returns {Object} Improvement suggestions
   */
  async analyzeFailure(failedAction) {
    if (!this.enabled) {
      return null;
    }

    try {
      const systemPrompt = `You are an AI assistant analyzing failed actions in a golf simulator facility system.

Given a failed action, suggest improvements in this format:
{
  "likely_cause": "Brief description of why it failed",
  "suggested_fixes": [
    "Specific actionable fix 1",
    "Specific actionable fix 2"
  ],
  "sop_improvements": {
    "add_prerequisites": ["new_prerequisite"],
    "increase_timeout": true,
    "add_retry_logic": true,
    "alternative_action": "escalate"
  }
}`;

      const response = await this.client.post('/v1/messages', {
        model: this.model,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Failed action: ${JSON.stringify(failedAction, null, 2)}`
          }
        ],
        max_tokens: 400,
        temperature: 0.3
      });

      const content = response.data.content[0]?.text;
      if (!content) {
        return null;
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Claude failure analysis error:', error.message);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new ClaudeClient();