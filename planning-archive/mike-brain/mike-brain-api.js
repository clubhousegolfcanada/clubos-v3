/**
 * Mike Brain API
 * REST API for the decision engine
 */

const express = require('express')
const { ClubOSDecisionEngine } = require('./mike-brain-implementation')

const app = express()
app.use(express.json())

// Initialize decision engine
const decisionEngine = new ClubOSDecisionEngine()

/**
 * Main decision endpoint
 */
app.post('/api/decision', async (req, res) => {
  try {
    const { problem, context } = req.body
    
    const request = {
      type: context?.type || 'general',
      description: problem,
      ...context
    }
    
    const decision = await decisionEngine.handleRequest(request)
    
    res.json({
      success: true,
      decision,
      explanation: "Based on Mike's thinking patterns"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * Business strategy endpoint
 */
app.post('/api/strategy', async (req, res) => {
  try {
    const { businessBrain } = require('./mike-brain-implementation')
    const strategy = await businessBrain.makeStrategicDecision(req.body)
    
    res.json({
      success: true,
      strategy,
      priority: strategy.timeframe.includes('today') ? 'immediate' : 'planned'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * Customer decision helper
 */
app.post('/api/customer/help', async (req, res) => {
  try {
    const { customerBrain } = require('./mike-brain-implementation')
    const { query } = req.body
    
    const decision = await customerBrain.handleCustomerQuery(query)
    
    res.json({
      success: true,
      recommendation: decision.recommendation,
      explanation: decision.reasoning,
      steps: decision.nextSteps,
      estimatedTimeSaved: '2-5 hours per week'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * Batch decision endpoint
 */
app.post('/api/decisions/batch', async (req, res) => {
  try {
    const { problems } = req.body
    
    const decisions = await Promise.all(
      problems.map(problem => 
        decisionEngine.handleRequest({
          type: problem.type || 'general',
          description: problem.description
        })
      )
    )
    
    res.json({
      success: true,
      decisions,
      summary: {
        automated: decisions.filter(d => d.implementation.includes('bot')).length,
        built: decisions.filter(d => d.implementation.includes('custom')).length,
        extended: decisions.filter(d => d.implementation.includes('existing')).length
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * Decision tree visualization
 */
app.get('/api/decision-tree', (req, res) => {
  res.json({
    tree: {
      root: 'Is this wasting time?',
      branches: {
        yes: {
          question: 'Repeatedly?',
          branches: {
            yes: 'Automate it now',
            no: 'Fix it simple'
          }
        },
        no: {
          question: 'Will we need it later?',
          branches: {
            yes: 'Build for future',
            no: 'Skip it'
          }
        }
      }
    },
    explanation: 'Mike\'s decision process in tree form'
  })
})

/**
 * Get thinking patterns
 */
app.get('/api/patterns', (req, res) => {
  res.json({
    patterns: {
      core_beliefs: [
        'Time is everything',
        'Manual work teaches what to automate',
        'Perfect does not ship',
        'Everything connects',
        'Build what is missing'
      ],
      decision_flow: [
        'Feel pain → Build fix → Use immediately → Find new pain',
        'If tool missing → Build it',
        'If V2 replaceable → Skip to V3',
        'If works ugly → Ship it'
      ],
      implementation_rules: [
        'Cache everything (time matters)',
        'Connect systems (no isolation)',
        'Log for patterns (learn from usage)',
        'Minimal first (complexity later)',
        'Automate pain (manual teaches)'
      ]
    }
  })
})

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    engine: 'Mike Brain v1.0',
    decisions_cached: decisionEngine.cache.size,
    thinking_speed: 'instant (cached) or <100ms (new)'
  })
})

// Example integrations
app.get('/api/examples', (req, res) => {
  res.json({
    examples: [
      {
        problem: "Customers asking same questions daily",
        decision: "Build FAQ bot for top 5 questions",
        reasoning: "Time wasted on repetition",
        outcome: "2-3 hours saved daily"
      },
      {
        problem: "Need to add payment processing",
        decision: "Use Stripe, simplest integration",
        reasoning: "Don't build what exists well",
        outcome: "Launched in 2 days vs 2 weeks"
      },
      {
        problem: "System architecture getting complex",
        decision: "Skip refactor, jump to final design",
        reasoning: "V2 would be replaced anyway",
        outcome: "Saved month of throwaway work"
      }
    ]
  })
})

// Integration with ClubOS
app.post('/api/clubos/integrate', async (req, res) => {
  const { module, problem } = req.body
  
  const decision = await decisionEngine.handleRequest({
    type: module,
    description: problem
  })
  
  // Generate integration code
  const integration = {
    module,
    approach: decision.implementation,
    code: generateIntegrationCode(module, decision),
    timeToImplement: decision.steps.length + ' days'
  }
  
  res.json({
    success: true,
    integration,
    decision
  })
})

function generateIntegrationCode(module, decision) {
  // Simple code generation based on decision
  return `
// ${module} Integration - ${decision.type}
class ${module}Integration {
  constructor() {
    this.approach = '${decision.implementation}'
  }
  
  async execute() {
    ${decision.steps.map(step => `
    // ${step.action}
    await this.${step.automated ? 'automate' : 'handle'}('${step.action}')
    `).join('')}
  }
}

module.exports = ${module}Integration
  `.trim()
}

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Mike Brain API running on port ${PORT}`)
  console.log('Endpoints:')
  console.log('  POST /api/decision - Get decision for any problem')
  console.log('  POST /api/strategy - Business strategy decisions')
  console.log('  POST /api/customer/help - Customer-friendly decisions')
  console.log('  GET /api/patterns - View thinking patterns')
})

module.exports = app