/**
 * Mike Brain Implementation
 * Practical implementation with real examples
 */

const { MikeBrainEngine, BusinessStrategy, CustomerDecisionEngine } = require('./mike-brain-engine')

// Initialize engines
const mikeBrain = new MikeBrainEngine()
const businessBrain = new BusinessStrategy()
const customerBrain = new CustomerDecisionEngine()

// Example 1: Customer asks about automating bookings
async function customerAutomationExample() {
  const customerQuery = "We spend 2 hours daily managing bookings manually"
  
  const decision = await customerBrain.handleCustomerQuery(customerQuery)
  
  console.log('Customer Decision:', decision)
  /* Output:
  {
    recommendation: 'Set up automatic handling',
    reasoning: 'Time saved on repetition is compounding gain',
    nextSteps: [
      { order: 1, action: 'Identify most repeated task', timeframe: 'Today' },
      { order: 2, action: 'Set up simple but working automation', timeframe: 'Day 2' },
      { order: 3, action: 'Use immediately', timeframe: 'Day 3' },
      { order: 4, action: 'Improve based on what breaks', timeframe: 'Day 4' }
    ]
  }
  */
}

// Example 2: Business strategy decision
async function businessStrategyExample() {
  const businessContext = {
    problem: "Need to scale but our system is getting slow",
    runway: 8, // months
    customerComplaints: 25,
    competitors: 3,
    automationLevel: 60,
    customization: 40
  }
  
  const strategy = await businessBrain.makeStrategicDecision(businessContext)
  
  console.log('Strategic Decision:', strategy)
  /* Output:
  {
    action: 'automate',
    approach: 'Build minimal automation for biggest pain point',
    timeframe: 'Start today, ship within week',
    competitiveAdvantage: 'efficiency'
  }
  */
}

// Example 3: Internal tool decision
async function internalToolExample() {
  const problem = "Customer support keeps asking the same questions about bookings"
  
  const decision = await mikeBrain.makeDecision(problem)
  
  console.log('Tool Decision:', decision)
  /* Output:
  {
    action: 'connect_and_extend',
    approach: 'Extend support to handle this',
    steps: [
      'Look at how support works',
      'Add minimal changes to cover new case',
      'Keep systems connected, not isolated',
      'One improvement helps multiple areas'
    ],
    reasoning: 'Everything connects - isolated solutions are waste',
    timeframe: 'Faster than building new'
  }
  */
}

// Advanced: Decision with learning
class LearningMikeBrain extends MikeBrainEngine {
  constructor() {
    super()
    this.outcomes = new Map()
  }
  
  async makeDecisionWithLearning(input) {
    const decision = await this.makeDecision(input)
    
    // Track decision for learning
    const decisionId = this.generateId(input, decision)
    
    return {
      ...decision,
      id: decisionId,
      trackOutcome: (outcome) => this.recordOutcome(decisionId, outcome)
    }
  }
  
  recordOutcome(decisionId, outcome) {
    this.outcomes.set(decisionId, {
      success: outcome.success,
      timesSaved: outcome.timesSaved,
      painReduced: outcome.painReduced,
      timestamp: Date.now()
    })
    
    // Learn from outcome
    this.updatePatterns(decisionId, outcome)
  }
  
  updatePatterns(decisionId, outcome) {
    if (outcome.success && outcome.timesSaved > 2) {
      // This pattern worked well, prioritize similar decisions
      this.patterns.successful_patterns = this.patterns.successful_patterns || []
      this.patterns.successful_patterns.push({
        decision: decisionId,
        timeSaved: outcome.timesSaved
      })
    }
  }
  
  generateId(input, decision) {
    return `${Date.now()}-${decision.action}-${input.slice(0, 20)}`
  }
}

// Real-world integration example
class ClubOSDecisionEngine {
  constructor() {
    this.brain = new LearningMikeBrain()
    this.cache = new Map() // Cache decisions for speed
  }
  
  async handleRequest(request) {
    // Check cache first (time is everything)
    const cacheKey = this.getCacheKey(request)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
    
    // Categorize request
    const category = this.categorizeRequest(request)
    
    // Get decision
    const decision = await this.getDecision(category, request)
    
    // Convert to action
    const action = this.convertToAction(decision)
    
    // Cache for next time
    this.cache.set(cacheKey, action)
    
    // Execute and track
    const result = await this.execute(action)
    
    // Learn from result
    if (decision.trackOutcome) {
      decision.trackOutcome({
        success: result.success,
        timesSaved: result.timeSaved,
        painReduced: result.painPointsResolved
      })
    }
    
    return result
  }
  
  categorizeRequest(request) {
    if (request.type === 'customer_support') {
      return 'support'
    } else if (request.type === 'booking') {
      return 'operations'
    } else if (request.type === 'technical') {
      return 'development'
    }
    return 'general'
  }
  
  async getDecision(category, request) {
    const input = `${category}: ${request.description}`
    return await this.brain.makeDecisionWithLearning(input)
  }
  
  convertToAction(decision) {
    return {
      type: decision.action,
      steps: decision.steps.map(step => ({
        action: step,
        automated: step.includes('automat'),
        priority: step.includes('biggest pain') ? 'high' : 'normal'
      })),
      expectedOutcome: decision.reasoning,
      implementation: this.getImplementation(decision.action)
    }
  }
  
  getImplementation(action) {
    const implementations = {
      'automate': 'Create bot for repeated tasks',
      'build': 'Develop minimal custom solution',
      'connect_and_extend': 'Add to existing system',
      'skip_to_end': 'Implement final architecture',
      'simple_solution': 'Quick fix with monitoring'
    }
    
    return implementations[action] || 'Manual handling'
  }
  
  async execute(action) {
    // This would actually execute the decision
    console.log('Executing:', action)
    
    // Simulate execution
    return {
      success: true,
      timeSaved: 2.5, // hours per day
      painPointsResolved: 3,
      implementation: action.type
    }
  }
  
  getCacheKey(request) {
    return `${request.type}-${request.description.slice(0, 50)}`
  }
}

// Usage in production
async function productionExample() {
  const clubOS = new ClubOSDecisionEngine()
  
  // Customer support request
  const supportRequest = {
    type: 'customer_support',
    description: 'Customers keep asking about gift card balance'
  }
  
  const result = await clubOS.handleRequest(supportRequest)
  console.log('Handled request:', result)
  
  // Same request again - will use cache (time is everything)
  const cachedResult = await clubOS.handleRequest(supportRequest)
  console.log('Cached response (faster):', cachedResult)
}

// Export everything
module.exports = {
  mikeBrain,
  businessBrain,
  customerBrain,
  LearningMikeBrain,
  ClubOSDecisionEngine,
  
  // Example functions for testing
  examples: {
    customerAutomationExample,
    businessStrategyExample,
    internalToolExample,
    productionExample
  }
}