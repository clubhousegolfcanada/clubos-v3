const db = require('../db/pool');

class EnhancedSOPMatcher {
  constructor() {
    // Decision cache from mike-brain pattern
    this.decisionCache = new Map();
    this.CACHE_TTL = 3600000; // 1 hour
    this.patternTracker = new Map();
  }

  async findMatchingSOP(intent, content, customerId) {
    // Generate cache key
    const cacheKey = `${intent}-${content.slice(0, 50)}`;
    
    // Check cache first (mike-brain optimization)
    const cached = this.decisionCache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - this.CACHE_TTL) {
      console.log(`Cache hit for: ${cacheKey}`);
      return cached.sop;
    }

    try {
      // Find matching SOPs based on intent
      const query = `
        SELECT * FROM sops 
        WHERE intent_category = $1 
        AND enabled = true
        ORDER BY priority DESC, created_at DESC
      `;
      const result = await db.query(query, [intent]);

      if (result.rows.length === 0) {
        return null;
      }

      // Score each SOP
      const scoredSOPs = result.rows.map(sop => ({
        ...sop,
        score: this.calculateScore(sop, content),
        timeImpact: this.assessTimeImpact(content, sop)
      }));

      // Sort by score and time impact
      scoredSOPs.sort((a, b) => {
        if (a.timeImpact === 'high_waste' && b.timeImpact !== 'high_waste') return -1;
        if (b.timeImpact === 'high_waste' && a.timeImpact !== 'high_waste') return 1;
        return b.score - a.score;
      });

      const bestSOP = scoredSOPs[0];

      // Cache the result
      if (bestSOP) {
        this.decisionCache.set(cacheKey, {
          sop: bestSOP,
          timestamp: Date.now()
        });

        // Track pattern
        this.trackPattern(intent, bestSOP.id);
      }

      return bestSOP;
    } catch (error) {
      console.error('Error finding SOP:', error);
      return null;
    }
  }

  calculateScore(sop, content) {
    let score = 0;

    // Check keyword matches
    if (sop.keywords) {
      const keywords = sop.keywords.split(',').map(k => k.trim().toLowerCase());
      const contentLower = content.toLowerCase();
      
      keywords.forEach(keyword => {
        if (contentLower.includes(keyword)) {
          score += 10;
        }
      });
    }

    // Boost score for frequently successful SOPs
    const patternKey = `success-${sop.id}`;
    const successCount = this.patternTracker.get(patternKey) || 0;
    score += Math.min(successCount * 2, 20); // Cap at 20 bonus points

    return score;
  }

  assessTimeImpact(content, sop) {
    // Mike-brain time assessment logic
    const highImpactPhrases = [
      'every day', 'constantly', 'always', 'multiple times',
      'urgent', 'asap', 'immediately', 'right now'
    ];

    const contentLower = content.toLowerCase();
    const hasHighImpact = highImpactPhrases.some(phrase => 
      contentLower.includes(phrase)
    );

    // Time saved estimates (in minutes)
    const timeSavedByCategory = {
      'password_reset': 5,
      'trackman_reset': 15,
      'booking_modification': 10,
      'refund_request': 20,
      'technical_support': 10,
      'account_issue': 8
    };

    sop.estimatedTimeSaved = timeSavedByCategory[sop.intent_category] || 5;

    return hasHighImpact ? 'high_waste' : 'normal';
  }

  trackPattern(intent, sopId) {
    const patternKey = `${intent}-${sopId}`;
    const count = this.patternTracker.get(patternKey) || 0;
    this.patternTracker.set(patternKey, count + 1);
  }

  async trackOutcome(threadId, sopId, success) {
    try {
      // Record outcome
      await db.query(
        `INSERT INTO sop_outcomes 
         (thread_id, sop_id, success, timestamp) 
         VALUES ($1, $2, $3, NOW())`,
        [threadId, sopId, success]
      );

      // Update pattern tracker
      const successKey = `success-${sopId}`;
      if (success) {
        const count = this.patternTracker.get(successKey) || 0;
        this.patternTracker.set(successKey, count + 1);
      }

      // Check if SOP needs review
      const stats = await this.getSOPStats(sopId);
      if (stats.successRate < 0.5 && stats.attempts > 10) {
        console.warn(`SOP ${sopId} has low success rate: ${stats.successRate}`);
        // Could trigger notification to ops team
      }
    } catch (error) {
      console.error('Error tracking outcome:', error);
    }
  }

  async getSOPStats(sopId) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as attempts,
        SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
       FROM sop_outcomes
       WHERE sop_id = $1
       AND timestamp > NOW() - INTERVAL '30 days'`,
      [sopId]
    );

    return {
      attempts: parseInt(result.rows[0].attempts),
      successRate: parseFloat(result.rows[0].success_rate) || 0
    };
  }

  // Clear old cache entries periodically
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.decisionCache.entries()) {
      if (value.timestamp < now - this.CACHE_TTL) {
        this.decisionCache.delete(key);
      }
    }
  }
}

module.exports = new EnhancedSOPMatcher();