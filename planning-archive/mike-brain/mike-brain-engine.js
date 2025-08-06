/**
 * Mike's Brain - Decision Making Engine
 * A strategic decision engine based on Mike's actual thinking patterns
 */

class MikeBrainEngine {
  constructor() {
    this.patterns = this.loadPatterns()
    this.decisions = []
    this.learnings = new Map()
  }

  /**
   * Main decision-making function
   */
  async makeDecision(input) {
    const context = this.analyzeContext(input)
    const decision = await this.processDecision(context)
    
    // Track for learning
    this.decisions.push({ input, context, decision, timestamp: Date.now() })
    
    return decision
  }

  /**
   * Analyze what type of problem this is
   */
  analyzeContext(input) {
    const context = {
      type: this.categorizeProble(input),
      timeImpact: this.assessTimeImpact(input),
      existingSolution: this.checkExistingSolutions(input),
      complexity: this.assessComplexity(input),
      connections: this.findConnections(input)
    }
    
    return context
  }

  /**
   * Categorize the problem type
   */
  categorizeProble(input) {
    const text = input.toLowerCase()
    
    if (text.includes('automat') || text.includes('manual')) {
      return 'automation'
    } else if (text.includes('customer') || text.includes('support')) {
      return 'customer_service'
    } else if (text.includes('slow') || text.includes('scale')) {
      return 'performance'
    } else if (text.includes('build') || text.includes('create')) {
      return 'building'
    } else if (text.includes('learn') || text.includes('understand')) {
      return 'learning'
    }
    
    return 'general'
  }

  /**
   * Core decision logic based on Mike's patterns
   */
  async processDecision(context) {
    // Time is everything
    if (context.timeImpact === 'high_waste') {
      return this.automateDecision(context)
    }
    
    // Build what's missing
    if (!context.existingSolution) {
      return this.buildDecision(context)
    }
    
    // Skip middle steps
    if (this.canSkipSteps(context)) {
      return this.skipToFinalDecision(context)
    }
    
    // Connect to existing solutions
    if (context.connections.length > 0) {
      return this.leverageExistingDecision(context)
    }
    
    // Default: simple solution
    return this.simpleDecision(context)
  }

  /**
   * Automation decision logic
   */
  automateDecision(context) {
    return {
      action: 'automate',
      approach: 'Build minimal automation for biggest pain point',
      steps: [
        'Identify most repeated task',
        'Build ugly but working automation',
        'Use immediately',
        'Improve based on what breaks'
      ],
      reasoning: 'Time wasted on repetition is compounding loss',
      timeframe: 'Start today, ship within week'
    }
  }

  /**
   * Build new solution decision
   */
  buildDecision(context) {
    return {
      action: 'build',
      approach: context.complexity === 'high' 
        ? 'Break into smallest useful piece' 
        : 'Build complete minimal version',
      steps: [
        'Define minimum that solves YOUR problem',
        'Build ugliest working version',
        'Use it tomorrow',
        'Fix what actually breaks',
        'Share when it works for you'
      ],
      reasoning: 'Waiting for others to build = wasted time',
      timeframe: 'Ship v0.1 within days'
    }
  }

  /**
   * Skip intermediate steps
   */
  skipToFinalDecision(context) {
    return {
      action: 'skip_to_end',
      approach: 'Jump directly to final architecture',
      steps: [
        'Identify what V2 would look like',
        'Identify what would replace V2',
        'Build that instead',
        'Use lessons from V1 but skip the middle'
      ],
      reasoning: 'Why build what you will replace?',
      timeframe: 'Same as V2 but get V3'
    }
  }

  /**
   * Leverage existing connections
   */
  leverageExistingDecision(context) {
    const connection = context.connections[0]
    
    return {
      action: 'connect_and_extend',
      approach: `Extend ${connection} to handle this`,
      steps: [
        `Look at how ${connection} works`,
        'Add minimal changes to cover new case',
        'Keep systems connected, not isolated',
        'One improvement helps multiple areas'
      ],
      reasoning: 'Everything connects - isolated solutions are waste',
      timeframe: 'Faster than building new'
    }
  }

  /**
   * Simple default decision
   */
  simpleDecision(context) {
    return {
      action: 'simple_solution',
      approach: 'Simplest thing that could work',
      steps: [
        'What is absolute minimum solution?',
        'Build that',
        'Use it',
        'Only add complexity when it hurts'
      ],
      reasoning: 'Simple > Complex, always',
      timeframe: 'Ship today'
    }
  }

  /**
   * Check if we can skip steps
   */
  canSkipSteps(context) {
    // If we can see the end state clearly
    // and intermediate would be replaced
    return context.complexity === 'high' && 
           context.type === 'building' &&
           this.hasLearningsFrom(context.type)
  }

  /**
   * Assess time impact
   */
  assessTimeImpact(input) {
    const text = input.toLowerCase()
    
    if (text.includes('every day') || text.includes('constantly')) {
      return 'high_waste'
    } else if (text.includes('sometimes') || text.includes('weekly')) {
      return 'medium_waste'
    }
    
    return 'low_waste'
  }

  /**
   * Check for existing solutions
   */
  checkExistingSolutions(input) {
    // Check if we've solved similar before
    for (const decision of this.decisions) {
      if (this.isSimilar(input, decision.input)) {
        return decision.decision
      }
    }
    
    return null
  }

  /**
   * Find connections to existing systems
   */
  findConnections(input) {
    const connections = []
    
    // Check what this could connect to
    const systems = ['booking', 'support', 'analytics', 'automation']
    
    for (const system of systems) {
      if (input.toLowerCase().includes(system)) {
        connections.push(system)
      }
    }
    
    return connections
  }

  /**
   * Check if we have learnings
   */
  hasLearningsFrom(type) {
    return this.learnings.has(type)
  }

  /**
   * Check similarity between problems
   */
  isSimilar(input1, input2) {
    // Simple similarity check
    const words1 = new Set(input1.toLowerCase().split(' '))
    const words2 = new Set(input2.toLowerCase().split(' '))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    
    return intersection.size > Math.min(words1.size, words2.size) * 0.5
  }

  /**
   * Load Mike's thinking patterns
   */
  loadPatterns() {
    return {
      core_beliefs: [
        'Time is everything',
        'Manual work teaches what to automate',
        'Perfect does not ship',
        'Everything connects',
        'Build what is missing'
      ],
      
      decision_rules: [
        'If wastes time repeatedly -> Automate it',
        'If tool missing -> Build it',
        'If V2 will be replaced -> Skip to V3',
        'If works ugly -> Ship it',
        'If stuck > 30min -> Ship what works'
      ],
      
      problem_approach: [
        'Feel pain personally',
        'Build minimal fix',
        'Use immediately',
        'Find new pain',
        'Connect solutions',
        'Extract patterns'
      ]
    }
  }

  /**
   * Assess complexity
   */
  assessComplexity(input) {
    const complexIndicators = ['system', 'architecture', 'scale', 'integrate']
    const simpleIndicators = ['fix', 'add', 'change', 'update']
    
    const text = input.toLowerCase()
    
    const complexCount = complexIndicators.filter(i => text.includes(i)).length
    const simpleCount = simpleIndicators.filter(i => text.includes(i)).length
    
    if (complexCount > simpleCount) return 'high'
    if (simpleCount > complexCount) return 'low'
    return 'medium'
  }
}

// Strategy modules for specific domains
class BusinessStrategy extends MikeBrainEngine {
  makeStrategicDecision(businessContext) {
    const augmentedInput = {
      ...businessContext,
      timeHorizon: this.assessTimeHorizon(businessContext),
      marketPain: this.assessMarketPain(businessContext),
      competitiveAdvantage: this.findAdvantage(businessContext)
    }
    
    return this.makeDecision(augmentedInput)
  }
  
  assessTimeHorizon(context) {
    // Quick wins vs long-term plays
    if (context.runway < 6) return 'immediate'
    if (context.runway < 12) return 'short'
    return 'long'
  }
  
  assessMarketPain(context) {
    // How painful is this problem for customers?
    if (context.customerComplaints > 50) return 'severe'
    if (context.customerComplaints > 10) return 'moderate'
    return 'mild'
  }
  
  findAdvantage(context) {
    // What makes us different?
    if (context.competitors === 0) return 'first_mover'
    if (context.automationLevel > 80) return 'efficiency'
    if (context.customization > 80) return 'flexibility'
    return 'execution'
  }
}

// Customer decision engine
class CustomerDecisionEngine extends MikeBrainEngine {
  async handleCustomerQuery(query) {
    const decision = await this.makeDecision(query)
    
    // Convert to customer-friendly response
    return {
      recommendation: this.simplifyDecision(decision),
      reasoning: this.explainSimply(decision.reasoning),
      nextSteps: this.makeActionable(decision.steps)
    }
  }
  
  simplifyDecision(decision) {
    // Convert internal decision to customer language
    const translations = {
      'automate': 'Set up automatic handling',
      'build': 'Create custom solution',
      'skip_to_end': 'Go directly to best option',
      'connect_and_extend': 'Use existing system',
      'simple_solution': 'Start with basics'
    }
    
    return translations[decision.action] || decision.action
  }
  
  explainSimply(reasoning) {
    // Make reasoning customer-friendly
    return reasoning
      .replace(/waste/g, 'save time')
      .replace(/ship/g, 'get started')
      .replace(/ugly/g, 'simple')
  }
  
  makeActionable(steps) {
    // Convert to clear customer actions
    return steps.map((step, idx) => ({
      order: idx + 1,
      action: step.replace(/build/gi, 'set up')
                  .replace(/ship/gi, 'launch'),
      timeframe: idx === 0 ? 'Today' : `Day ${idx + 1}`
    }))
  }
}

// Export for use
module.exports = {
  MikeBrainEngine,
  BusinessStrategy,
  CustomerDecisionEngine
}