const Joi = require('joi');

/**
 * Creates a validation middleware for the given schema
 * @param {Object} schema - Joi validation schema object with body, query, params
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors, not just the first
      allowUnknown: false, // Fail on unknown keys
      stripUnknown: true // Remove unknown keys
    };

    // Compile the schema
    const compiledSchema = Joi.object(schema);
    
    // Combine all inputs for validation
    const dataToValidate = {
      ...(schema.body && { body: req.body }),
      ...(schema.query && { query: req.query }),
      ...(schema.params && { params: req.params })
    };

    // Validate
    const { error, value } = compiledSchema.validate(dataToValidate, validationOptions);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        error: 'Validation failed',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    // Replace request data with validated values
    if (value.body) req.body = value.body;
    if (value.query) req.query = value.query;
    if (value.params) req.params = value.params;

    next();
  };
};

// Common validation schemas
const schemas = {
  // ID parameter validation
  idParam: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  // UUID parameter validation
  uuidParam: Joi.object({
    id: Joi.string().uuid().required()
  }),

  // Pagination query params
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Common string validations
  string: {
    email: Joi.string().email().lowercase().trim(),
    username: Joi.string().alphanum().min(3).max(30),
    password: Joi.string().min(8).max(128),
    url: Joi.string().uri(),
    phone: Joi.string().pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/),
    content: Joi.string().max(5000).trim()
  }
};

// Validation schemas for each route
const validationSchemas = {
  // Message routes
  messages: {
    create: {
      body: Joi.object({
        customer_id: Joi.number().integer().positive().required(),
        booking_id: Joi.number().integer().positive().optional(),
        content: schemas.string.content.required()
      })
    },
    list: {
      query: schemas.pagination
    }
  },

  // Auth routes
  auth: {
    login: {
      body: Joi.object({
        username: schemas.string.username.required(),
        password: schemas.string.password.required()
      })
    },
    register: {
      body: Joi.object({
        username: schemas.string.username.required(),
        email: schemas.string.email.required(),
        password: schemas.string.password.required(),
        role: Joi.string().valid('admin', 'operator', 'viewer').default('operator')
      })
    }
  },

  // SOP routes
  sops: {
    create: {
      body: Joi.object({
        title: Joi.string().max(200).required(),
        category: Joi.string().valid('tech_issue', 'booking', 'access', 'faq').required(),
        trigger_phrases: Joi.array().items(Joi.string()).min(1).required(),
        response_template: Joi.string().max(5000).required(),
        requires_action: Joi.boolean().default(false),
        action_type: Joi.when('requires_action', {
          is: true,
          then: Joi.string().valid('email', 'sms', 'ticket', 'remote_action').required(),
          otherwise: Joi.forbidden()
        }),
        action_config: Joi.when('requires_action', {
          is: true,
          then: Joi.object().required(),
          otherwise: Joi.forbidden()
        }),
        prerequisites: Joi.array().items(Joi.string()).optional(),
        valid_until: Joi.date().iso().optional()
      })
    },
    update: {
      params: schemas.idParam,
      body: Joi.object({
        title: Joi.string().max(200),
        trigger_phrases: Joi.array().items(Joi.string()).min(1),
        response_template: Joi.string().max(5000),
        requires_action: Joi.boolean(),
        action_type: Joi.string().valid('email', 'sms', 'ticket', 'remote_action'),
        action_config: Joi.object(),
        prerequisites: Joi.array().items(Joi.string()),
        valid_until: Joi.date().iso(),
        active: Joi.boolean()
      }).min(1) // At least one field must be provided
    }
  },

  // Thread routes
  threads: {
    create: {
      body: Joi.object({
        customer_id: Joi.number().integer().positive().required(),
        booking_id: Joi.number().integer().positive().optional(),
        intent: Joi.string().valid('tech_issue', 'booking', 'access', 'faq').required(),
        initial_message: schemas.string.content.optional()
      })
    },
    update: {
      params: schemas.idParam,
      body: Joi.object({
        status: Joi.string().valid('pending', 'in_progress', 'resolved', 'escalated').required()
      })
    }
  },

  // Action routes
  actions: {
    create: {
      body: Joi.object({
        thread_id: Joi.number().integer().positive().required(),
        action_type: Joi.string().valid('email', 'sms', 'ticket', 'remote_action').required(),
        payload: Joi.object().required(),
        scheduled_for: Joi.date().iso().optional()
      })
    },
    retry: {
      params: schemas.idParam
    }
  }
};

// Helper to get validation middleware for a specific route
const getValidator = (route, operation) => {
  const schema = validationSchemas[route]?.[operation];
  if (!schema) {
    throw new Error(`No validation schema found for ${route}.${operation}`);
  }
  return validate(schema);
};

module.exports = {
  validate,
  schemas,
  validationSchemas,
  getValidator
};