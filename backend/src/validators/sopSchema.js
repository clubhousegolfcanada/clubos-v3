const Ajv = require('ajv');
const ajv = new Ajv();

// JSON Schema for SOP validation
const sopSchema = {
  type: 'object',
  required: ['title', 'category', 'trigger_phrases', 'primary_action'],
  properties: {
    title: {
      type: 'string',
      minLength: 3,
      maxLength: 255
    },
    category: {
      type: 'string',
      enum: ['tech_issue', 'booking', 'access', 'faq']
    },
    trigger_phrases: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 2
      }
    },
    primary_action: {
      type: 'string',
      enum: ['reset_trackman', 'unlock_door', 'escalate', 'send_message']
    },
    fallback_action: {
      type: 'string',
      enum: ['reset_trackman', 'unlock_door', 'escalate', 'send_message'],
      default: 'escalate'
    },
    status: {
      type: 'string',
      enum: ['draft', 'live'],
      default: 'draft'
    },
    timeout_seconds: {
      type: 'integer',
      minimum: 1,
      maximum: 300,
      default: 30
    },
    max_retries: {
      type: 'integer',
      minimum: 0,
      maximum: 5,
      default: 2
    },
    prerequisites: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['booking_active', 'within_time_window', 'device_online']
      },
      default: []
    },
    context: {
      type: 'object',
      properties: {
        location: {
          type: 'array',
          items: { type: 'string' }
        },
        time_restrictions: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'time' },
            end: { type: 'string', format: 'time' }
          }
        }
      },
      default: {}
    },
    source_metadata: {
      type: 'object',
      properties: {
        created_by: { type: 'string' },
        source: { type: 'string' }
      },
      default: {}
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        pattern: '^[a-zA-Z0-9_-]+$' // Alphanumeric with _ and -
      },
      default: []
    }
  }
};

const validateSop = ajv.compile(sopSchema);

module.exports = {
  validateSop,
  sopSchema
};