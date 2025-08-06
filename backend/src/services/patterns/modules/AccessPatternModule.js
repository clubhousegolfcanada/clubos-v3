const BasePatternModule = require('./BasePatternModule');
const logger = require('../../../utils/logger');

/**
 * Access Pattern Module
 * Handles door access, authentication, and security-related patterns
 */
class AccessPatternModule extends BasePatternModule {
  constructor() {
    super('access', {
      minConfidenceForSuggestion: 0.7, // Higher threshold for security
      learningEnabled: true,
      crossDomainLearning: true,
      // Access-specific config
      accessTypes: {
        physical: ['door', 'gate', 'entrance', 'bay'],
        digital: ['login', 'system', 'app', 'portal'],
        resource: ['equipment', 'facility', 'area'],
        emergency: ['override', 'force', 'emergency']
      },
      securityLevels: {
        public: 1,
        member: 2,
        staff: 3,
        admin: 4,
        emergency: 5
      }
    });
    
    // Security-specific weights
    this.securityWeights = {
      userVerification: 0.4,
      timeRestrictions: 0.2,
      locationContext: 0.2,
      accessHistory: 0.2
    };
  }

  /**
   * Check if this module can handle the event
   */
  canHandle(eventType) {
    const accessTypes = ['access', 'authentication', 'security', 'entry', 'unlock'];
    return accessTypes.includes(eventType) || 
           (eventType === 'general' && this.isAccessRelated(eventType));
  }

  /**
   * Check if event is access-related
   */
  isAccessRelated(event) {
    const accessKeywords = ['unlock', 'access', 'door', 'entry', 'scan', 'badge', 'code'];
    const eventStr = JSON.stringify(event).toLowerCase();
    return accessKeywords.some(keyword => eventStr.includes(keyword));
  }

  /**
   * Generate access-specific signature
   */
  async generateSignature(event) {
    const components = [
      'access',
      event.accessType || this.categorizeAccess(event),
      event.location || event.door || '',
      event.method || 'unknown',
      this.getAccessTimeCategory(event.timestamp)
    ];
    
    return components.filter(Boolean).join(':').toLowerCase();
  }

  /**
   * Categorize access type
   */
  categorizeAccess(event) {
    const eventStr = JSON.stringify(event).toLowerCase();
    
    for (const [type, keywords] of Object.entries(this.config.accessTypes)) {
      if (keywords.some(keyword => eventStr.includes(keyword))) {
        return type;
      }
    }
    
    return 'general';
  }

  /**
   * Get access time category
   */
  getAccessTimeCategory(timestamp) {
    const date = new Date(timestamp || Date.now());
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'weekend';
    }
    
    // Weekday categories
    if (hour >= 6 && hour < 9) return 'morning_rush';
    if (hour >= 9 && hour < 17) return 'business_hours';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 6) return 'after_hours';
    
    return 'normal';
  }

  /**
   * Calculate semantic match for access patterns
   */
  async calculateSemanticMatch(pattern, event) {
    let score = 0;
    
    // Location matching
    if (event.location && pattern.logic?.location) {
      if (event.location === pattern.logic.location) {
        score += 0.3;
      } else if (this.areLocationsNearby(event.location, pattern.logic.location)) {
        score += 0.15;
      }
    }
    
    // Access method matching
    if (event.method && pattern.logic?.method) {
      if (event.method === pattern.logic.method) {
        score += 0.2;
      }
    }
    
    // Security level matching
    const eventSecurityLevel = this.determineSecurityLevel(event);
    const patternSecurityLevel = pattern.logic?.securityLevel || 'member';
    
    if (eventSecurityLevel === patternSecurityLevel) {
      score += 0.3;
    }
    
    // Time pattern matching
    const timeMatch = this.matchTimePattern(event, pattern);
    score += timeMatch * 0.2;
    
    return score;
  }

  /**
   * Check if locations are nearby
   */
  areLocationsNearby(location1, location2) {
    // Simple proximity check - could be enhanced with actual distance calculation
    const l1 = location1.toLowerCase();
    const l2 = location2.toLowerCase();
    
    // Check if same building/area
    const areas = ['north', 'south', 'east', 'west', 'main', 'annex'];
    for (const area of areas) {
      if (l1.includes(area) && l2.includes(area)) {
        return true;
      }
    }
    
    // Check if same type
    const types = ['bay', 'door', 'gate', 'entrance'];
    for (const type of types) {
      if (l1.includes(type) && l2.includes(type)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Determine security level required
   */
  determineSecurityLevel(event) {
    if (event.securityLevel) return event.securityLevel;
    
    // Infer from context
    if (event.emergency) return 'emergency';
    if (event.admin || event.override) return 'admin';
    if (event.staff) return 'staff';
    if (event.member || event.customerId) return 'member';
    
    return 'public';
  }

  /**
   * Match time-based access patterns
   */
  matchTimePattern(event, pattern) {
    if (!pattern.logic?.timeRestrictions) return 0.5;
    
    const eventTime = new Date(event.timestamp || Date.now());
    const restrictions = pattern.logic.timeRestrictions;
    
    let score = 0;
    
    // Check allowed hours
    if (restrictions.allowedHours) {
      const hour = eventTime.getHours();
      if (restrictions.allowedHours.includes(hour)) {
        score += 0.5;
      }
    }
    
    // Check allowed days
    if (restrictions.allowedDays) {
      const day = eventTime.getDay();
      if (restrictions.allowedDays.includes(day)) {
        score += 0.5;
      }
    }
    
    return score;
  }

  /**
   * Calculate context match with security considerations
   */
  async calculateContextMatch(pattern, event) {
    let totalScore = 0;
    
    // User verification
    if (event.userId || event.customerId) {
      const verificationScore = await this.verifyUserAccess(
        event.userId || event.customerId,
        pattern.logic?.allowedUsers || []
      );
      totalScore += verificationScore * this.securityWeights.userVerification;
    }
    
    // Time restrictions
    const timeScore = this.checkTimeRestrictions(event, pattern);
    totalScore += timeScore * this.securityWeights.timeRestrictions;
    
    // Location context
    const locationScore = await this.checkLocationContext(event, pattern);
    totalScore += locationScore * this.securityWeights.locationContext;
    
    // Access history
    const historyScore = await this.checkAccessHistory(event, pattern);
    totalScore += historyScore * this.securityWeights.accessHistory;
    
    return totalScore;
  }

  /**
   * Verify user access permissions
   */
  async verifyUserAccess(userId, allowedUsers) {
    if (allowedUsers.length === 0) return 0.5; // No restrictions
    
    if (allowedUsers.includes(userId)) {
      return 1.0;
    }
    
    // Check if user belongs to allowed groups
    // In real implementation, this would query user groups
    return 0.0;
  }

  /**
   * Check time-based restrictions
   */
  checkTimeRestrictions(event, pattern) {
    if (!pattern.logic?.timeRestrictions) return 1.0;
    
    const eventTime = new Date(event.timestamp || Date.now());
    const restrictions = pattern.logic.timeRestrictions;
    
    // Check blackout periods
    if (restrictions.blackoutPeriods) {
      for (const period of restrictions.blackoutPeriods) {
        const start = new Date(period.start);
        const end = new Date(period.end);
        
        if (eventTime >= start && eventTime <= end) {
          return 0.0; // Access denied during blackout
        }
      }
    }
    
    // Check business hours only
    if (restrictions.businessHoursOnly) {
      const hour = eventTime.getHours();
      const dayOfWeek = eventTime.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) return 0.2; // Weekend
      if (hour < 8 || hour > 18) return 0.3; // Outside business hours
    }
    
    return 1.0;
  }

  /**
   * Check location context for access
   */
  async checkLocationContext(event, pattern) {
    if (!event.location || !pattern.logic?.locationRestrictions) return 0.5;
    
    const restrictions = pattern.logic.locationRestrictions;
    
    // Check if location is in allowed list
    if (restrictions.allowedLocations) {
      if (restrictions.allowedLocations.includes(event.location)) {
        return 1.0;
      }
      return 0.0;
    }
    
    // Check if location is restricted
    if (restrictions.restrictedLocations) {
      if (restrictions.restrictedLocations.includes(event.location)) {
        return 0.0;
      }
      return 1.0;
    }
    
    return 0.5;
  }

  /**
   * Check user's access history
   */
  async checkAccessHistory(event, pattern) {
    if (!event.userId && !event.customerId) return 0.5;
    
    // In real implementation, query access history
    // For now, simulate based on pattern
    if (pattern.logic?.requiresCleanHistory) {
      // Check for recent violations
      return 0.8; // Assume mostly clean history
    }
    
    return 0.5;
  }

  /**
   * Extract key attributes for access patterns
   */
  extractKeyAttributes(event) {
    return {
      accessType: this.categorizeAccess(event),
      location: event.location || event.door,
      method: event.method || 'unknown',
      userId: event.userId || event.customerId,
      securityLevel: this.determineSecurityLevel(event),
      timestamp: event.timestamp,
      deviceId: event.deviceId,
      ipAddress: event.ipAddress
    };
  }

  /**
   * Handle access denial patterns
   */
  async handleAccessDenial(event, reason) {
    const denialPatterns = {
      invalid_credentials: {
        action: 'log_attempt',
        notify: false,
        lockout_threshold: 5
      },
      expired_access: {
        action: 'notify_user',
        notify: true,
        message: 'Your access has expired. Please renew.'
      },
      restricted_time: {
        action: 'log_attempt',
        notify: false,
        message: 'Access not permitted at this time.'
      },
      suspicious_activity: {
        action: 'alert_security',
        notify: true,
        lockout_threshold: 1,
        escalate: true
      }
    };
    
    const pattern = denialPatterns[reason] || denialPatterns.invalid_credentials;
    
    return {
      pattern: {
        id: 'access-denial-handler',
        logic: {
          type: 'access_denial',
          reason: reason,
          action: pattern.action,
          notify: pattern.notify,
          escalate: pattern.escalate || false,
          message: pattern.message
        },
        confidence_score: 0.95,
        auto_executable: !pattern.escalate
      },
      confidence: 0.95,
      matchDetails: {
        type: 'access_denial',
        reason: reason,
        severity: pattern.escalate ? 'high' : 'medium'
      }
    };
  }

  /**
   * Handle suspicious access patterns
   */
  async detectSuspiciousAccess(event) {
    const suspiciousIndicators = [];
    
    // Unusual time
    const timeCategory = this.getAccessTimeCategory(event.timestamp);
    if (timeCategory === 'after_hours' && !event.override) {
      suspiciousIndicators.push('after_hours_access');
    }
    
    // Rapid attempts
    if (event.attemptCount > 3) {
      suspiciousIndicators.push('multiple_attempts');
    }
    
    // Unknown device
    if (event.deviceId && !event.knownDevice) {
      suspiciousIndicators.push('unknown_device');
    }
    
    // Geographic anomaly
    if (event.geoAnomaly) {
      suspiciousIndicators.push('location_anomaly');
    }
    
    if (suspiciousIndicators.length === 0) return null;
    
    const severity = suspiciousIndicators.length >= 3 ? 'high' : 
                    suspiciousIndicators.length >= 2 ? 'medium' : 'low';
    
    return {
      pattern: {
        id: 'suspicious-access-detector',
        logic: {
          type: 'suspicious_access',
          indicators: suspiciousIndicators,
          severity: severity,
          actions: this.getSuspiciousAccessActions(severity)
        },
        confidence_score: 0.85,
        auto_executable: severity !== 'high'
      },
      confidence: 0.85,
      matchDetails: {
        type: 'suspicious_access',
        indicators: suspiciousIndicators,
        severity: severity
      }
    };
  }

  /**
   * Get actions for suspicious access
   */
  getSuspiciousAccessActions(severity) {
    const actions = {
      low: [
        { type: 'log_detailed', priority: 'normal' },
        { type: 'monitor_session', duration: 3600 }
      ],
      medium: [
        { type: 'log_detailed', priority: 'high' },
        { type: 'notify_security', delay: 0 },
        { type: 'require_2fa', immediate: true }
      ],
      high: [
        { type: 'block_access', immediate: true },
        { type: 'alert_security', priority: 'urgent' },
        { type: 'capture_evidence', includeVideo: true },
        { type: 'lockdown_area', radius: 'immediate' }
      ]
    };
    
    return actions[severity] || actions.low;
  }

  /**
   * Special handling for emergency access
   */
  async handleEmergencyAccess(event) {
    if (!event.emergency) return null;
    
    return {
      pattern: {
        id: 'emergency-access-handler',
        logic: {
          type: 'emergency_access',
          overrideAll: true,
          logLevel: 'critical',
          notifications: [
            { recipient: 'security_team', immediate: true },
            { recipient: 'management', immediate: true },
            { recipient: 'emergency_services', condition: 'if_needed' }
          ],
          actions: [
            { type: 'unlock_all_doors', area: event.area || 'all' },
            { type: 'disable_security_protocols', duration: 3600 },
            { type: 'enable_emergency_lighting', immediate: true },
            { type: 'broadcast_announcement', message: event.emergencyMessage }
          ]
        },
        confidence_score: 1.0,
        auto_executable: true // Emergency overrides need immediate action
      },
      confidence: 1.0,
      matchDetails: {
        type: 'emergency_access',
        override: true,
        reason: event.emergencyReason || 'Emergency protocol activated'
      }
    };
  }

  /**
   * Learn from access outcomes
   */
  async learnFromOutcome(patternId, event, outcome) {
    // Call base learning
    await super.learnFromOutcome(patternId, event, outcome);
    
    // Access-specific learning
    if (outcome.success) {
      // Update allowed access patterns
      await this.updateAllowedPatterns(event, outcome);
    } else {
      // Learn from denied access
      await this.learnFromDeniedAccess(event, outcome);
    }
    
    // Update security scores
    await this.updateSecurityScores(event, outcome);
  }

  /**
   * Update allowed access patterns
   */
  async updateAllowedPatterns(event, outcome) {
    const query = `
      INSERT INTO allowed_access_patterns (
        user_id, location, method, time_category,
        success_count, last_successful_access
      ) VALUES ($1, $2, $3, $4, 1, NOW())
      ON CONFLICT (user_id, location, method, time_category)
      DO UPDATE SET
        success_count = allowed_access_patterns.success_count + 1,
        last_successful_access = NOW()
    `;
    
    try {
      await db.query(query, [
        event.userId || event.customerId,
        event.location,
        event.method,
        this.getAccessTimeCategory(event.timestamp)
      ]);
    } catch (error) {
      logger.error('Error updating allowed patterns', error);
    }
  }

  /**
   * Learn from denied access
   */
  async learnFromDeniedAccess(event, outcome) {
    // Log denial pattern
    logger.info('Access denied pattern captured', {
      reason: outcome.denialReason,
      location: event.location,
      method: event.method
    });
    
    // This could trigger additional security measures
    if (outcome.suspiciousActivity) {
      await this.escalateSecurityConcern(event, outcome);
    }
  }

  /**
   * Update security scores
   */
  async updateSecurityScores(event, outcome) {
    // Update location security score
    // Update user trust score
    // Update device trust score
    // These would be implemented based on specific requirements
  }

  /**
   * Escalate security concern
   */
  async escalateSecurityConcern(event, outcome) {
    const query = `
      INSERT INTO security_escalations (
        event_type, severity, location, user_id,
        details, escalated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    
    try {
      await db.query(query, [
        'access_denied',
        outcome.severity || 'medium',
        event.location,
        event.userId || event.customerId,
        JSON.stringify({
          event: event,
          outcome: outcome,
          timestamp: new Date()
        })
      ]);
    } catch (error) {
      logger.error('Error escalating security concern', error);
    }
  }
}

module.exports = AccessPatternModule;