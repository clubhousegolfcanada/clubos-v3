const BasePatternModule = require('./BasePatternModule');
const logger = require('../../../utils/logger');

/**
 * Decision Pattern Module
 * Handles general business decisions and operational patterns
 */
class DecisionPatternModule extends BasePatternModule {
  constructor() {
    super('decision', {
      minConfidenceForSuggestion: 0.5,
      learningEnabled: true,
      crossDomainLearning: true,
      // Decision-specific config
      decisionCategories: {
        operational: ['schedule', 'assign', 'prioritize', 'route'],
        customer: ['approve', 'deny', 'escalate', 'resolve'],
        resource: ['allocate', 'reserve', 'release', 'optimize'],
        financial: ['charge', 'refund', 'discount', 'invoice']
      }
    });
    
    // Decision context weights
    this.contextWeights = {
      customerHistory: 0.3,
      resourceAvailability: 0.2,
      businessRules: 0.4,
      temporalFactors: 0.1
    };
  }

  /**
   * Check if this module can handle the event
   */
  canHandle(eventType) {
    return eventType === 'decision' || 
           eventType === 'general' ||
           eventType === 'business' ||
           !eventType; // Handle undefined types as general decisions
  }

  /**
   * Generate decision-specific signature
   */
  async generateSignature(event) {
    const components = [
      'decision',
      event.decisionType || event.type || 'general',
      event.category || this.categorizeDecision(event),
      event.subject || '',
      event.action || ''
    ];
    
    return components.filter(Boolean).join(':').toLowerCase();
  }

  /**
   * Categorize decision type
   */
  categorizeDecision(event) {
    const eventStr = JSON.stringify(event).toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.config.decisionCategories)) {
      if (keywords.some(keyword => eventStr.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  /**
   * Calculate context match for decisions
   */
  async calculateContextMatch(pattern, event) {
    if (!pattern.logic?.context || !event.context) return 0;
    
    let totalScore = 0;
    
    // Customer history matching
    if (event.context.customerId && pattern.logic.context.customerType) {
      const customerScore = await this.matchCustomerContext(
        event.context.customerId,
        pattern.logic.context.customerType
      );
      totalScore += customerScore * this.contextWeights.customerHistory;
    }
    
    // Resource availability matching
    if (event.context.resources && pattern.logic.context.resourceRequirements) {
      const resourceScore = this.matchResourceContext(
        event.context.resources,
        pattern.logic.context.resourceRequirements
      );
      totalScore += resourceScore * this.contextWeights.resourceAvailability;
    }
    
    // Business rules matching
    if (event.context.rules && pattern.logic.context.applicableRules) {
      const rulesScore = this.matchBusinessRules(
        event.context.rules,
        pattern.logic.context.applicableRules
      );
      totalScore += rulesScore * this.contextWeights.businessRules;
    }
    
    // Temporal factors
    const temporalScore = this.matchTemporalContext(event, pattern);
    totalScore += temporalScore * this.contextWeights.temporalFactors;
    
    return totalScore;
  }

  /**
   * Match customer context
   */
  async matchCustomerContext(customerId, expectedType) {
    try {
      // In a real implementation, this would query customer data
      // For now, return a moderate score
      return 0.7;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Match resource availability
   */
  matchResourceContext(available, required) {
    if (!required || required.length === 0) return 1.0;
    
    const matchedResources = required.filter(req => 
      available.some(avail => 
        avail.type === req.type && avail.quantity >= req.quantity
      )
    );
    
    return matchedResources.length / required.length;
  }

  /**
   * Match business rules
   */
  matchBusinessRules(activeRules, applicableRules) {
    if (!applicableRules || applicableRules.length === 0) return 1.0;
    
    const matchedRules = applicableRules.filter(rule => 
      activeRules.includes(rule)
    );
    
    return matchedRules.length / applicableRules.length;
  }

  /**
   * Match temporal context
   */
  matchTemporalContext(event, pattern) {
    const eventTime = new Date(event.timestamp || Date.now());
    const hour = eventTime.getHours();
    const dayOfWeek = eventTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (!pattern.logic?.temporalPreferences) return 0.5;
    
    const prefs = pattern.logic.temporalPreferences;
    let score = 0;
    
    // Business hours preference
    if (prefs.businessHoursOnly && hour >= 9 && hour < 17 && !isWeekend) {
      score += 0.5;
    } else if (!prefs.businessHoursOnly) {
      score += 0.5;
    }
    
    // Peak hours handling
    if (prefs.peakHours && prefs.peakHours.includes(hour)) {
      score += 0.5;
    } else if (!prefs.peakHours) {
      score += 0.5;
    }
    
    return score;
  }

  /**
   * Calculate semantic match for decisions
   */
  async calculateSemanticMatch(pattern, event) {
    let score = 0;
    
    // Decision type matching
    if (event.decisionType && pattern.logic?.decisionType) {
      if (event.decisionType === pattern.logic.decisionType) {
        score += 0.4;
      }
    }
    
    // Outcome preference matching
    if (event.desiredOutcome && pattern.logic?.typicalOutcome) {
      const outcomeSimilarity = this.calculateSimilarity(
        event.desiredOutcome,
        pattern.logic.typicalOutcome
      );
      score += outcomeSimilarity * 0.3;
    }
    
    // Stakeholder matching
    if (event.stakeholders && pattern.logic?.stakeholders) {
      const stakeholderMatch = this.matchStakeholders(
        event.stakeholders,
        pattern.logic.stakeholders
      );
      score += stakeholderMatch * 0.3;
    }
    
    return score;
  }

  /**
   * Match stakeholders involved
   */
  matchStakeholders(eventStakeholders, patternStakeholders) {
    if (!eventStakeholders || !patternStakeholders) return 0;
    
    const eventSet = new Set(eventStakeholders);
    const patternSet = new Set(patternStakeholders);
    
    const intersection = [...eventSet].filter(x => patternSet.has(x));
    const union = new Set([...eventSet, ...patternSet]);
    
    return intersection.length / union.size;
  }

  /**
   * Extract key attributes for decision patterns
   */
  extractKeyAttributes(event) {
    return {
      decisionType: event.decisionType || event.type,
      category: this.categorizeDecision(event),
      stakeholders: event.stakeholders || [],
      impact: event.impact || 'medium',
      urgency: event.urgency || 'normal',
      requiredBy: event.requiredBy || null
    };
  }

  /**
   * Extract conditions for decision patterns
   */
  extractConditions(event, outcome) {
    return {
      preconditions: event.preconditions || [],
      constraints: event.constraints || [],
      dependencies: event.dependencies || [],
      decisionCriteria: outcome.criteria || [],
      alternativesConsidered: outcome.alternatives || [],
      riskFactors: outcome.risks || []
    };
  }

  /**
   * Create a decision tree from patterns
   */
  async buildDecisionTree(event) {
    const patterns = await this.findPatterns(event);
    
    if (patterns.length === 0) return null;
    
    // Build tree structure
    const tree = {
      root: {
        question: 'What type of decision is needed?',
        event: event,
        branches: []
      }
    };
    
    // Group patterns by decision type
    const grouped = patterns.reduce((acc, p) => {
      const type = p.pattern.logic?.decisionType || 'general';
      if (!acc[type]) acc[type] = [];
      acc[type].push(p);
      return acc;
    }, {});
    
    // Create branches
    for (const [type, typePatterns] of Object.entries(grouped)) {
      const branch = {
        condition: `Decision type is ${type}`,
        patterns: typePatterns,
        subBranches: this.createSubBranches(typePatterns)
      };
      tree.root.branches.push(branch);
    }
    
    return tree;
  }

  /**
   * Create sub-branches for decision tree
   */
  createSubBranches(patterns) {
    // Group by confidence levels
    const highConfidence = patterns.filter(p => p.confidence >= 0.8);
    const mediumConfidence = patterns.filter(p => p.confidence >= 0.5 && p.confidence < 0.8);
    const lowConfidence = patterns.filter(p => p.confidence < 0.5);
    
    const branches = [];
    
    if (highConfidence.length > 0) {
      branches.push({
        condition: 'High confidence match',
        recommendation: 'Auto-execute or quick approval',
        patterns: highConfidence
      });
    }
    
    if (mediumConfidence.length > 0) {
      branches.push({
        condition: 'Medium confidence match',
        recommendation: 'Review and approve',
        patterns: mediumConfidence
      });
    }
    
    if (lowConfidence.length > 0) {
      branches.push({
        condition: 'Low confidence match',
        recommendation: 'Manual decision required',
        patterns: lowConfidence
      });
    }
    
    return branches;
  }

  /**
   * Special handling for complex decisions
   */
  async handleComplexDecision(event) {
    // Check if decision is complex
    const complexityFactors = [
      event.stakeholders && event.stakeholders.length > 3,
      event.impact === 'high',
      event.constraints && event.constraints.length > 5,
      event.dependencies && event.dependencies.length > 0
    ];
    
    const complexityScore = complexityFactors.filter(Boolean).length / complexityFactors.length;
    
    if (complexityScore >= 0.5) {
      // Build decision tree for complex decisions
      const decisionTree = await this.buildDecisionTree(event);
      
      return {
        pattern: {
          id: 'complex-decision-handler',
          logic: {
            type: 'decision_tree',
            tree: decisionTree,
            requiresAnalysis: true,
            suggestedApproach: 'structured_decision_making'
          },
          confidence_score: 0.7,
          auto_executable: false
        },
        confidence: 0.7,
        matchDetails: {
          type: 'complex_decision',
          complexity: complexityScore,
          decisionTree: decisionTree
        }
      };
    }
    
    return null;
  }

  /**
   * Learn from decision outcomes
   */
  async learnFromOutcome(patternId, event, outcome) {
    // Call base learning
    await super.learnFromOutcome(patternId, event, outcome);
    
    // Decision-specific learning
    if (outcome.success) {
      // Capture successful decision criteria
      await this.captureDecisionCriteria(patternId, event, outcome);
      
      // Update decision effectiveness metrics
      await this.updateDecisionMetrics(patternId, outcome);
    } else {
      // Analyze why decision failed
      await this.analyzeDecisionFailure(patternId, event, outcome);
    }
  }

  /**
   * Capture successful decision criteria
   */
  async captureDecisionCriteria(patternId, event, outcome) {
    const query = `
      INSERT INTO decision_criteria_log (
        pattern_id,
        event_context,
        criteria_used,
        outcome_quality,
        stakeholder_satisfaction,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    
    try {
      await db.query(query, [
        patternId,
        JSON.stringify(event),
        JSON.stringify(outcome.criteria || []),
        outcome.quality || 'good',
        outcome.satisfaction || 0.8
      ]);
    } catch (error) {
      logger.error('Error capturing decision criteria', error);
    }
  }

  /**
   * Update decision effectiveness metrics
   */
  async updateDecisionMetrics(patternId, outcome) {
    const query = `
      UPDATE decision_patterns
      SET avg_execution_time_ms = 
        CASE 
          WHEN avg_execution_time_ms IS NULL THEN $2
          ELSE (avg_execution_time_ms * execution_count + $2) / (execution_count + 1)
        END
      WHERE id = $1
    `;
    
    try {
      await db.query(query, [patternId, outcome.executionTime || 0]);
    } catch (error) {
      logger.error('Error updating decision metrics', error);
    }
  }

  /**
   * Analyze decision failure
   */
  async analyzeDecisionFailure(patternId, event, outcome) {
    // Log failure analysis
    logger.info('Analyzing decision failure', {
      patternId,
      failureReason: outcome.failureReason,
      event: event
    });
    
    // This could trigger pattern adjustment or create new pattern variant
  }
}

module.exports = DecisionPatternModule;