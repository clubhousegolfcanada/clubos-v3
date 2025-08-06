const db = require('../../db/pool');
const logger = require('../../utils/logger');

class AnomalyDetector {
  constructor() {
    this.riskThresholds = {
      critical: 0.9,
      high: 0.7,
      medium: 0.5,
      low: 0.3
    };
    
    this.anomalyTypes = {
      NEW_PATTERN: 'new_pattern',
      EDGE_CASE: 'edge_case',
      UNUSUAL_CONTEXT: 'unusual_context',
      HIGH_RISK: 'high_risk',
      SECURITY_THREAT: 'security_threat',
      DATA_QUALITY: 'data_quality'
    };
    
    this.contextWindow = 60 * 60 * 1000; // 1 hour for context analysis
  }

  /**
   * Detect if an event is anomalous
   */
  async detectAnomaly(event, patternMatches = []) {
    try {
      const anomalyChecks = await Promise.all([
        this.checkForNewPattern(event, patternMatches),
        this.checkForEdgeCase(event),
        this.checkForUnusualContext(event),
        this.checkForSecurityThreat(event),
        this.checkForDataQuality(event)
      ]);
      
      const detectedAnomalies = anomalyChecks.filter(check => check.isAnomaly);
      
      if (detectedAnomalies.length === 0) {
        return {
          isAnomaly: false,
          confidence: 1.0
        };
      }
      
      // Combine anomalies and determine overall risk
      const combinedAnomaly = this.combineAnomalies(detectedAnomalies, event);
      
      // Log anomaly if significant
      if (combinedAnomaly.isAnomaly && combinedAnomaly.severity !== 'low') {
        await this.logAnomaly(combinedAnomaly, event);
      }
      
      return combinedAnomaly;
      
    } catch (error) {
      logger.error('Error detecting anomaly', error);
      return {
        isAnomaly: true,
        type: this.anomalyTypes.DATA_QUALITY,
        reason: 'Error during anomaly detection',
        requiresHuman: true
      };
    }
  }

  /**
   * Check if event represents a new pattern
   */
  async checkForNewPattern(event, patternMatches) {
    if (!patternMatches || patternMatches.length === 0) {
      return {
        isAnomaly: true,
        type: this.anomalyTypes.NEW_PATTERN,
        reason: 'No matching patterns found',
        severity: await this.assessNewPatternSeverity(event),
        confidence: 0.95
      };
    }
    
    const bestMatch = patternMatches[0];
    if (bestMatch.confidence < 0.3) {
      return {
        isAnomaly: true,
        type: this.anomalyTypes.NEW_PATTERN,
        reason: 'Very low pattern match confidence',
        severity: 'medium',
        confidence: 0.85,
        nearestMatch: bestMatch
      };
    }
    
    return { isAnomaly: false };
  }

  /**
   * Check for edge cases
   */
  async checkForEdgeCase(event) {
    const edgeCaseIndicators = [
      await this.hasUnusualValues(event),
      await this.hasRareCombination(event),
      await this.exceedsNormalBounds(event),
      await this.hasConflictingData(event)
    ];
    
    const edgeCaseCount = edgeCaseIndicators.filter(Boolean).length;
    
    if (edgeCaseCount >= 2) {
      return {
        isAnomaly: true,
        type: this.anomalyTypes.EDGE_CASE,
        reason: 'Multiple edge case indicators detected',
        severity: edgeCaseCount >= 3 ? 'high' : 'medium',
        confidence: 0.8,
        indicators: edgeCaseIndicators
      };
    }
    
    return { isAnomaly: false };
  }

  /**
   * Check for unusual context
   */
  async checkForUnusualContext(event) {
    try {
      // Get historical context patterns
      const contextPattern = await this.getContextPattern(event);
      
      const unusualFactors = [];
      
      // Check time-based anomalies
      if (await this.isUnusualTime(event)) {
        unusualFactors.push('unusual_time');
      }
      
      // Check frequency anomalies
      if (await this.isUnusualFrequency(event)) {
        unusualFactors.push('unusual_frequency');
      }
      
      // Check user behavior anomalies
      if (await this.isUnusualUserBehavior(event)) {
        unusualFactors.push('unusual_user_behavior');
      }
      
      // Check system state anomalies
      if (await this.isUnusualSystemState(event)) {
        unusualFactors.push('unusual_system_state');
      }
      
      if (unusualFactors.length >= 2) {
        return {
          isAnomaly: true,
          type: this.anomalyTypes.UNUSUAL_CONTEXT,
          reason: `Unusual context detected: ${unusualFactors.join(', ')}`,
          severity: this.assessContextSeverity(unusualFactors),
          confidence: 0.75,
          factors: unusualFactors
        };
      }
      
      return { isAnomaly: false };
      
    } catch (error) {
      logger.error('Error checking context', error);
      return { isAnomaly: false };
    }
  }

  /**
   * Check for security threats
   */
  async checkForSecurityThreat(event) {
    const threatIndicators = [];
    
    // Check for injection attempts
    if (this.detectInjectionAttempt(event)) {
      threatIndicators.push('injection_attempt');
    }
    
    // Check for suspicious patterns
    if (this.detectSuspiciousPattern(event)) {
      threatIndicators.push('suspicious_pattern');
    }
    
    // Check for privilege escalation
    if (await this.detectPrivilegeEscalation(event)) {
      threatIndicators.push('privilege_escalation');
    }
    
    // Check for data exfiltration
    if (await this.detectDataExfiltration(event)) {
      threatIndicators.push('data_exfiltration');
    }
    
    if (threatIndicators.length > 0) {
      return {
        isAnomaly: true,
        type: this.anomalyTypes.SECURITY_THREAT,
        reason: `Security threat detected: ${threatIndicators.join(', ')}`,
        severity: 'critical',
        confidence: 0.9,
        requiresHuman: true,
        requiresImmediate: true,
        indicators: threatIndicators
      };
    }
    
    return { isAnomaly: false };
  }

  /**
   * Check for data quality issues
   */
  async checkForDataQuality(event) {
    const qualityIssues = [];
    
    // Check for missing required fields
    if (this.hasMissingRequiredFields(event)) {
      qualityIssues.push('missing_required_fields');
    }
    
    // Check for invalid data types
    if (this.hasInvalidDataTypes(event)) {
      qualityIssues.push('invalid_data_types');
    }
    
    // Check for inconsistent data
    if (this.hasInconsistentData(event)) {
      qualityIssues.push('inconsistent_data');
    }
    
    if (qualityIssues.length > 0) {
      return {
        isAnomaly: true,
        type: this.anomalyTypes.DATA_QUALITY,
        reason: `Data quality issues: ${qualityIssues.join(', ')}`,
        severity: 'low',
        confidence: 0.95,
        issues: qualityIssues
      };
    }
    
    return { isAnomaly: false };
  }

  /**
   * Combine multiple anomalies into a single assessment
   */
  combineAnomalies(anomalies, event) {
    if (anomalies.length === 0) {
      return { isAnomaly: false };
    }
    
    // Find highest severity
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    const highestSeverity = anomalies.reduce((max, anomaly) => {
      const maxIndex = severityOrder.indexOf(max);
      const currentIndex = severityOrder.indexOf(anomaly.severity);
      return currentIndex < maxIndex ? anomaly.severity : max;
    }, 'low');
    
    // Calculate combined confidence
    const combinedConfidence = anomalies.reduce((sum, anomaly) => 
      sum + anomaly.confidence, 0) / anomalies.length;
    
    // Determine if human intervention required
    const requiresHuman = anomalies.some(a => a.requiresHuman) ||
                         highestSeverity === 'critical' ||
                         anomalies.length >= 3;
    
    const requiresImmediate = anomalies.some(a => a.requiresImmediate);
    
    return {
      isAnomaly: true,
      types: anomalies.map(a => a.type),
      reasons: anomalies.map(a => a.reason),
      severity: highestSeverity,
      confidence: combinedConfidence,
      requiresHuman,
      requiresImmediate,
      riskLevel: this.calculateRiskLevel(highestSeverity, combinedConfidence),
      anomalyCount: anomalies.length,
      details: anomalies
    };
  }

  /**
   * Log anomaly to database
   */
  async logAnomaly(anomaly, event) {
    try {
      const query = `
        INSERT INTO anomalies (
          anomaly_type, severity, event_data,
          detection_reason, similar_patterns,
          confidence_gap
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const result = await db.query(query, [
        Array.isArray(anomaly.types) ? anomaly.types[0] : anomaly.type,
        anomaly.severity,
        JSON.stringify(event),
        Array.isArray(anomaly.reasons) ? anomaly.reasons.join('; ') : anomaly.reason,
        JSON.stringify(anomaly.details || []),
        anomaly.confidence ? (1 - anomaly.confidence) : null
      ]);
      
      logger.warn('Anomaly detected and logged', {
        anomalyId: result.rows[0].id,
        type: anomaly.type,
        severity: anomaly.severity
      });
      
      return result.rows[0].id;
      
    } catch (error) {
      logger.error('Error logging anomaly', error);
      throw error;
    }
  }

  /**
   * Assess severity of new pattern
   */
  async assessNewPatternSeverity(event) {
    // Check if event has urgent indicators
    if (event.urgent || event.priority === 'high') {
      return 'high';
    }
    
    // Check if it affects critical systems
    if (event.module && ['payment', 'access', 'security'].includes(event.module)) {
      return 'high';
    }
    
    // Check historical impact of similar events
    const impact = await this.checkHistoricalImpact(event);
    if (impact === 'high') {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Check for unusual values in event
   */
  async hasUnusualValues(event) {
    // Implementation would check for outliers in numeric fields
    // For now, simplified check
    if (event.amount && (event.amount < 0 || event.amount > 10000)) {
      return true;
    }
    
    if (event.duration && (event.duration < 0 || event.duration > 86400)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check for rare combinations
   */
  async hasRareCombination(event) {
    // Check if this combination of attributes is rare
    if (!event.type || !event.category) {
      return false;
    }
    
    const query = `
      SELECT COUNT(*) as count
      FROM decision_patterns
      WHERE decision_type = $1
      AND trigger_signature LIKE $2
    `;
    
    const result = await db.query(query, [
      event.type,
      `%${event.category}%`
    ]);
    
    return result.rows[0].count < 5;
  }

  /**
   * Check if event exceeds normal bounds
   */
  async exceedsNormalBounds(event) {
    // Would implement statistical analysis
    // For now, simplified checks
    const bounds = {
      messageLength: { min: 1, max: 1000 },
      responseTime: { min: 10, max: 5000 }
    };
    
    if (event.content && 
        (event.content.length < bounds.messageLength.min || 
         event.content.length > bounds.messageLength.max)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check for conflicting data
   */
  async hasConflictingData(event) {
    // Check for logical conflicts in the data
    if (event.startTime && event.endTime && event.startTime > event.endTime) {
      return true;
    }
    
    if (event.quantity && event.quantity < 0) {
      return true;
    }
    
    return false;
  }

  /**
   * Get context pattern for event
   */
  async getContextPattern(event) {
    const query = `
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM events
      WHERE type = $1
      AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM created_at)
    `;
    
    try {
      const result = await db.query(query, [event.type]);
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if event occurs at unusual time
   */
  async isUnusualTime(event) {
    const hour = new Date(event.timestamp || Date.now()).getHours();
    
    // Business hours check (customize based on business)
    if (event.businessHoursOnly && (hour < 8 || hour > 20)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check for unusual frequency
   */
  async isUnusualFrequency(event) {
    if (!event.userId && !event.customerId) {
      return false;
    }
    
    const identifier = event.userId || event.customerId;
    const query = `
      SELECT COUNT(*) as recent_count
      FROM events
      WHERE (user_id = $1 OR customer_id = $1)
      AND created_at > NOW() - INTERVAL '1 hour'
    `;
    
    try {
      const result = await db.query(query, [identifier]);
      return result.rows[0].recent_count > 50; // Threshold
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect injection attempts
   */
  detectInjectionAttempt(event) {
    const suspiciousPatterns = [
      /(\b|')(OR|AND)\s+\d+\s*=\s*\d+/i,
      /(\b|')DROP\s+TABLE/i,
      /<script[^>]*>/i,
      /javascript:/i,
      /\$\{.*\}/,
      /__proto__/,
      /constructor\[/
    ];
    
    const checkString = (str) => {
      if (typeof str !== 'string') return false;
      return suspiciousPatterns.some(pattern => pattern.test(str));
    };
    
    // Check all string fields
    const hasInjection = Object.values(event).some(value => {
      if (typeof value === 'string') return checkString(value);
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => 
          typeof v === 'string' && checkString(v)
        );
      }
      return false;
    });
    
    return hasInjection;
  }

  /**
   * Calculate overall risk level
   */
  calculateRiskLevel(severity, confidence) {
    const severityScores = {
      critical: 1.0,
      high: 0.75,
      medium: 0.5,
      low: 0.25
    };
    
    const riskScore = severityScores[severity] * confidence;
    
    if (riskScore >= this.riskThresholds.critical) return 'critical';
    if (riskScore >= this.riskThresholds.high) return 'high';
    if (riskScore >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Assess context severity
   */
  assessContextSeverity(factors) {
    if (factors.includes('unusual_user_behavior') && 
        factors.includes('unusual_system_state')) {
      return 'high';
    }
    
    if (factors.length >= 3) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Additional helper methods would go here
   */
  detectSuspiciousPattern(event) {
    // Simplified implementation
    return false;
  }

  async detectPrivilegeEscalation(event) {
    // Would check for unauthorized access attempts
    return false;
  }

  async detectDataExfiltration(event) {
    // Would check for bulk data access patterns
    return false;
  }

  hasMissingRequiredFields(event) {
    const requiredFields = ['type', 'timestamp'];
    return requiredFields.some(field => !event[field]);
  }

  hasInvalidDataTypes(event) {
    // Type checking logic
    return false;
  }

  hasInconsistentData(event) {
    // Data consistency checks
    return false;
  }

  async checkHistoricalImpact(event) {
    // Would analyze historical impact
    return 'medium';
  }

  async isUnusualUserBehavior(event) {
    // User behavior analysis
    return false;
  }

  async isUnusualSystemState(event) {
    // System state analysis
    return false;
  }
}

module.exports = new AnomalyDetector();