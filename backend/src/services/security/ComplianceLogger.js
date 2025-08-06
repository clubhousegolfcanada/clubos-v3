const db = require('../../db/pool');
const logger = require('../../utils/logger');

class ComplianceLogger {
  constructor() {
    this.retentionDays = parseInt(process.env.COMPLIANCE_RETENTION_DAYS || '365');
    this.logTypes = {
      DATA_ACCESS: 'data_access',
      DATA_MODIFICATION: 'data_modification',
      DATA_EXPORT: 'data_export',
      DATA_DELETION: 'data_deletion',
      CONSENT_CHANGE: 'consent_change',
      AUTH_EVENT: 'auth_event',
      PERMISSION_CHANGE: 'permission_change'
    };
    this.dataCategories = {
      PERSONAL: 'personal_data',
      SENSITIVE: 'sensitive_data',
      FINANCIAL: 'financial_data',
      BEHAVIORAL: 'behavioral_data',
      TECHNICAL: 'technical_data'
    };
  }

  /**
   * Log data access for compliance
   */
  async logDataAccess(req, resourceType, resourceIds, fields = []) {
    try {
      const dataCategories = this.categorizeFields(fields);
      
      const logEntry = {
        logType: this.logTypes.DATA_ACCESS,
        resourceType,
        resourceIds: Array.isArray(resourceIds) ? resourceIds : [resourceIds],
        operation: 'read',
        dataCategories,
        fieldsAccessed: fields,
        dataVolume: resourceIds.length,
        userId: req.user?.id || null,
        userRole: req.user?.role || 'anonymous',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.session?.id || req.headers['x-session-id'],
        requestId: req.id,
        endpoint: req.originalUrl,
        method: req.method,
        purpose: this.inferPurpose(req),
        legalBasis: this.determineLegalBasis(req, resourceType)
      };
      
      await this.createLogEntry(logEntry);
      
      // Check for suspicious access patterns
      await this.checkAccessPatterns(logEntry);
      
    } catch (error) {
      logger.error('Error logging data access', error);
      // Don't throw - compliance logging should not break the application
    }
  }

  /**
   * Log data modification
   */
  async logDataModification(req, resourceType, resourceId, changes) {
    try {
      const fieldsModified = Object.keys(changes.new || changes);
      const dataCategories = this.categorizeFields(fieldsModified);
      
      const logEntry = {
        logType: this.logTypes.DATA_MODIFICATION,
        resourceType,
        resourceIds: [resourceId],
        operation: changes.deleted ? 'delete' : 'update',
        dataCategories,
        fieldsAccessed: fieldsModified,
        dataVolume: 1,
        userId: req.user?.id,
        userRole: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.session?.id || req.headers['x-session-id'],
        requestId: req.id,
        endpoint: req.originalUrl,
        method: req.method,
        purpose: this.inferPurpose(req),
        legalBasis: this.determineLegalBasis(req, resourceType),
        changeDetails: {
          before: changes.old,
          after: changes.new
        }
      };
      
      await this.createLogEntry(logEntry);
      
      // Check if modification requires special handling
      if (dataCategories.includes(this.dataCategories.SENSITIVE)) {
        await this.handleSensitiveDataModification(logEntry);
      }
      
    } catch (error) {
      logger.error('Error logging data modification', error);
    }
  }

  /**
   * Log data export for GDPR compliance
   */
  async logDataExport(req, subject, dataExported) {
    try {
      const logEntry = {
        logType: this.logTypes.DATA_EXPORT,
        resourceType: 'customer',
        resourceIdentifier: subject.email || subject.id,
        operation: 'export',
        dataCategories: this.categorizeExportedData(dataExported),
        dataVolume: this.calculateDataVolume(dataExported),
        userId: req.user?.id,
        userRole: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
        endpoint: req.originalUrl,
        method: req.method,
        purpose: 'data_subject_request',
        legalBasis: 'legal_obligation',
        isExported: true,
        exportRequestId: req.body?.requestId
      };
      
      await this.createLogEntry(logEntry);
      
      // Update data subject request if applicable
      if (req.body?.requestId) {
        await this.updateDataSubjectRequest(req.body.requestId, logEntry.id);
      }
      
    } catch (error) {
      logger.error('Error logging data export', error);
    }
  }

  /**
   * Log consent changes
   */
  async logConsentChange(subject, consentType, consentGiven, details = {}) {
    try {
      const consentRecord = {
        subjectIdentifier: subject.email || subject.id,
        consentType,
        consentGiven,
        consentScope: details.scope || {},
        purpose: details.purpose || 'Not specified',
        controllerIdentity: 'The Clubhouse Golf',
        retentionPeriod: details.retentionPeriod || 'Until withdrawn',
        thirdParties: details.thirdParties || [],
        givenAt: consentGiven ? new Date() : null,
        withdrawnAt: !consentGiven ? new Date() : null,
        collectionMethod: details.method || 'web_form',
        collectionPoint: details.collectionPoint || 'unknown',
        consentText: details.consentText || '',
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        doubleOptIn: details.doubleOptIn || false
      };
      
      // Create consent record
      const query = `
        INSERT INTO consent_records (
          subject_identifier, consent_type, consent_given,
          consent_scope, purpose, controller_identity,
          retention_period, third_parties, given_at,
          withdrawn_at, collection_method, collection_point,
          consent_text, ip_address, user_agent, double_opt_in
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
      `;
      
      const result = await db.query(query, [
        consentRecord.subjectIdentifier,
        consentRecord.consentType,
        consentRecord.consentGiven,
        JSON.stringify(consentRecord.consentScope),
        consentRecord.purpose,
        consentRecord.controllerIdentity,
        consentRecord.retentionPeriod,
        JSON.stringify(consentRecord.thirdParties),
        consentRecord.givenAt,
        consentRecord.withdrawnAt,
        consentRecord.collectionMethod,
        consentRecord.collectionPoint,
        consentRecord.consentText,
        consentRecord.ipAddress,
        consentRecord.userAgent,
        consentRecord.doubleOptIn
      ]);
      
      // Also log in compliance log
      await this.createLogEntry({
        logType: this.logTypes.CONSENT_CHANGE,
        resourceType: 'consent',
        resourceIds: [result.rows[0].id],
        operation: consentGiven ? 'grant' : 'withdraw',
        dataCategories: [this.dataCategories.PERSONAL],
        purpose: 'consent_management',
        legalBasis: 'consent'
      });
      
      return result.rows[0].id;
      
    } catch (error) {
      logger.error('Error logging consent change', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate, endDate) {
    try {
      const report = {
        period: { start: startDate, end: endDate },
        dataAccess: await this.getDataAccessSummary(startDate, endDate),
        dataModifications: await this.getDataModificationSummary(startDate, endDate),
        dataExports: await this.getDataExportSummary(startDate, endDate),
        consentStatus: await this.getConsentStatus(),
        dataSubjectRequests: await this.getDataSubjectRequestSummary(startDate, endDate),
        retentionCompliance: await this.checkRetentionCompliance(),
        violations: await this.getComplianceViolations(startDate, endDate),
        generatedAt: new Date()
      };
      
      // Check for any compliance issues
      report.issues = this.identifyComplianceIssues(report);
      
      return report;
      
    } catch (error) {
      logger.error('Error generating compliance report', error);
      throw error;
    }
  }

  /**
   * Handle data subject request
   */
  async handleDataSubjectRequest(request) {
    try {
      const query = `
        INSERT INTO data_subject_requests (
          request_type, subject_email, subject_phone,
          subject_name, request_details, data_categories,
          specific_data_requested, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING id, response_due_date
      `;
      
      const result = await db.query(query, [
        request.type,
        request.email,
        request.phone,
        request.name,
        request.details,
        JSON.stringify(request.dataCategories || []),
        JSON.stringify(request.specificData || {})
      ]);
      
      const requestId = result.rows[0].id;
      const dueDate = result.rows[0].response_due_date;
      
      // Log the request
      await this.createLogEntry({
        logType: 'data_subject_request',
        resourceType: 'dsr',
        resourceIds: [requestId],
        operation: 'create',
        dataCategories: request.dataCategories || [],
        purpose: `GDPR Article ${this.getGDPRArticle(request.type)}`,
        legalBasis: 'legal_obligation'
      });
      
      // Send notification to compliance team
      await this.notifyComplianceTeam(request, requestId, dueDate);
      
      return {
        requestId,
        dueDate,
        status: 'pending'
      };
      
    } catch (error) {
      logger.error('Error handling data subject request', error);
      throw error;
    }
  }

  /**
   * Check retention compliance
   */
  async checkRetentionCompliance() {
    try {
      const violations = await db.query(
        'SELECT * FROM check_retention_compliance()'
      );
      
      for (const violation of violations.rows) {
        await this.handleRetentionViolation(violation);
      }
      
      return {
        checked: violations.rows.length,
        violations: violations.rows.filter(v => v.action_required === 'delete').length,
        anonymized: violations.rows.filter(v => v.action_required === 'anonymize').length
      };
      
    } catch (error) {
      logger.error('Error checking retention compliance', error);
      throw error;
    }
  }

  /**
   * Create compliance log entry
   */
  async createLogEntry(entry) {
    const query = `
      INSERT INTO compliance_log (
        log_type, severity, resource_type, resource_id,
        resource_identifier, operation, data_categories,
        fields_accessed, data_volume, user_id, user_role,
        ip_address, user_agent, session_id, request_id,
        endpoint, method, purpose, legal_basis,
        retention_period_days, is_exported, export_request_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22
      )
      RETURNING id
    `;
    
    const params = [
      entry.logType,
      entry.severity || 'info',
      entry.resourceType,
      entry.resourceIds?.[0] || null,
      entry.resourceIdentifier || null,
      entry.operation,
      JSON.stringify(entry.dataCategories || []),
      entry.fieldsAccessed || [],
      entry.dataVolume || 1,
      entry.userId,
      entry.userRole,
      entry.ipAddress,
      entry.userAgent,
      entry.sessionId,
      entry.requestId,
      entry.endpoint,
      entry.method,
      entry.purpose,
      entry.legalBasis,
      this.retentionDays,
      entry.isExported || false,
      entry.exportRequestId || null
    ];
    
    const result = await db.query(query, params);
    return result.rows[0].id;
  }

  /**
   * Categorize fields by data type
   */
  categorizeFields(fields) {
    const categories = new Set();
    
    const fieldMappings = {
      [this.dataCategories.PERSONAL]: ['name', 'email', 'phone', 'address'],
      [this.dataCategories.SENSITIVE]: ['ssn', 'health', 'religion', 'ethnicity'],
      [this.dataCategories.FINANCIAL]: ['payment', 'card', 'bank', 'amount'],
      [this.dataCategories.BEHAVIORAL]: ['preferences', 'history', 'activity'],
      [this.dataCategories.TECHNICAL]: ['ip', 'device', 'browser', 'session']
    };
    
    for (const field of fields) {
      const fieldLower = field.toLowerCase();
      for (const [category, keywords] of Object.entries(fieldMappings)) {
        if (keywords.some(keyword => fieldLower.includes(keyword))) {
          categories.add(category);
        }
      }
    }
    
    return Array.from(categories);
  }

  /**
   * Infer purpose from request
   */
  inferPurpose(req) {
    if (req.body?.purpose) return req.body.purpose;
    
    const endpoint = req.originalUrl.toLowerCase();
    if (endpoint.includes('export')) return 'data_export';
    if (endpoint.includes('delete')) return 'data_deletion';
    if (endpoint.includes('consent')) return 'consent_management';
    if (endpoint.includes('profile')) return 'profile_management';
    
    return 'service_delivery';
  }

  /**
   * Determine legal basis
   */
  determineLegalBasis(req, resourceType) {
    // GDPR Article 6 legal bases
    if (req.body?.legalBasis) return req.body.legalBasis;
    
    if (resourceType === 'consent') return 'consent';
    if (req.method === 'DELETE') return 'legal_obligation';
    if (resourceType === 'payment') return 'contract';
    
    return 'legitimate_interest';
  }

  /**
   * Check for suspicious access patterns
   */
  async checkAccessPatterns(logEntry) {
    try {
      // Check for bulk data access
      const recentAccess = await db.query(`
        SELECT COUNT(*) as access_count,
               SUM(data_volume) as total_volume
        FROM compliance_log
        WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '1 hour'
        AND log_type = 'data_access'
      `, [logEntry.userId]);
      
      const { access_count, total_volume } = recentAccess.rows[0];
      
      if (access_count > 100 || total_volume > 10000) {
        await this.createComplianceViolation({
          violationType: 'excessive_data_access',
          severity: 'high',
          resourceType: logEntry.resourceType,
          details: `User ${logEntry.userId} accessed ${total_volume} records in 1 hour`,
          userId: logEntry.userId
        });
      }
      
    } catch (error) {
      logger.error('Error checking access patterns', error);
    }
  }

  /**
   * Create compliance violation
   */
  async createComplianceViolation(violation) {
    const query = `
      INSERT INTO compliance_violations (
        violation_type, severity, resource_type,
        violation_details, detected_by, affected_subjects
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    await db.query(query, [
      violation.violationType,
      violation.severity,
      violation.resourceType,
      violation.details,
      'automated_scan',
      violation.affectedSubjects || 1
    ]);
    
    // Notify compliance team for high severity
    if (violation.severity === 'high' || violation.severity === 'critical') {
      await this.notifyComplianceTeam(violation);
    }
  }

  /**
   * Get data access summary
   */
  async getDataAccessSummary(startDate, endDate) {
    const query = `
      SELECT 
        resource_type,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) as total_accesses,
        SUM(data_volume) as records_accessed,
        array_agg(DISTINCT unnest(data_categories)) as data_categories
      FROM compliance_log
      WHERE log_type = 'data_access'
      AND created_at BETWEEN $1 AND $2
      GROUP BY resource_type
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Handle sensitive data modification
   */
  async handleSensitiveDataModification(logEntry) {
    // Additional logging for sensitive data
    logger.warn('Sensitive data modified', {
      resourceType: logEntry.resourceType,
      resourceId: logEntry.resourceIds[0],
      userId: logEntry.userId,
      fields: logEntry.fieldsAccessed
    });
    
    // Check if user has permission for sensitive data
    // This would integrate with your permission system
  }

  /**
   * Get GDPR article for request type
   */
  getGDPRArticle(requestType) {
    const articles = {
      access: '15',
      rectification: '16',
      erasure: '17',
      portability: '20',
      restriction: '18',
      objection: '21',
      automated_decision: '22'
    };
    
    return articles[requestType] || 'Unknown';
  }

  /**
   * Calculate data volume for export
   */
  calculateDataVolume(data) {
    let volume = 0;
    
    const countRecords = (obj) => {
      if (Array.isArray(obj)) {
        volume += obj.length;
        obj.forEach(item => countRecords(item));
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(value => countRecords(value));
      }
    };
    
    countRecords(data);
    return volume;
  }

  /**
   * Categorize exported data
   */
  categorizeExportedData(data) {
    const categories = new Set();
    
    if (data.profile) categories.add(this.dataCategories.PERSONAL);
    if (data.bookings) categories.add(this.dataCategories.BEHAVIORAL);
    if (data.payments) categories.add(this.dataCategories.FINANCIAL);
    if (data.messages) categories.add(this.dataCategories.PERSONAL);
    
    return Array.from(categories);
  }

  /**
   * Notify compliance team
   */
  async notifyComplianceTeam(item, requestId = null, dueDate = null) {
    // In production, this would send actual notifications
    logger.info('Compliance notification', {
      type: item.violationType || item.type,
      severity: item.severity || 'info',
      requestId,
      dueDate
    });
  }

  /**
   * Update data subject request
   */
  async updateDataSubjectRequest(requestId, logId) {
    await db.query(`
      UPDATE data_subject_requests
      SET related_log_ids = array_append(related_log_ids, $2)
      WHERE id = $1
    `, [requestId, logId]);
  }

  /**
   * Handle retention violation
   */
  async handleRetentionViolation(violation) {
    if (violation.action_required === 'delete') {
      // Schedule deletion
      logger.info('Scheduling data deletion', violation);
    } else if (violation.action_required === 'anonymize') {
      // Schedule anonymization
      logger.info('Scheduling data anonymization', violation);
    }
  }

  /**
   * Get various summaries for compliance report
   */
  async getDataModificationSummary(startDate, endDate) {
    const query = `
      SELECT 
        resource_type,
        operation,
        COUNT(*) as count
      FROM compliance_log
      WHERE log_type = 'data_modification'
      AND created_at BETWEEN $1 AND $2
      GROUP BY resource_type, operation
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }

  async getDataExportSummary(startDate, endDate) {
    const query = `
      SELECT 
        COUNT(*) as total_exports,
        COUNT(DISTINCT resource_identifier) as unique_subjects,
        SUM(data_volume) as total_records
      FROM compliance_log
      WHERE log_type = 'data_export'
      AND created_at BETWEEN $1 AND $2
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    return result.rows[0];
  }

  async getConsentStatus() {
    const query = `
      SELECT 
        consent_type,
        SUM(CASE WHEN consent_given = true THEN 1 ELSE 0 END) as granted,
        SUM(CASE WHEN consent_given = false THEN 1 ELSE 0 END) as withdrawn
      FROM consent_records
      WHERE created_at = (
        SELECT MAX(created_at)
        FROM consent_records cr2
        WHERE cr2.subject_identifier = consent_records.subject_identifier
        AND cr2.consent_type = consent_records.consent_type
      )
      GROUP BY consent_type
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  async getDataSubjectRequestSummary(startDate, endDate) {
    const query = `
      SELECT 
        request_type,
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completed_at - received_at))/86400)::INTEGER as avg_days_to_complete
      FROM data_subject_requests
      WHERE received_at BETWEEN $1 AND $2
      GROUP BY request_type, status
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }

  async getComplianceViolations(startDate, endDate) {
    const query = `
      SELECT 
        violation_type,
        severity,
        status,
        COUNT(*) as count
      FROM compliance_violations
      WHERE detected_at BETWEEN $1 AND $2
      GROUP BY violation_type, severity, status
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Identify compliance issues from report data
   */
  identifyComplianceIssues(report) {
    const issues = [];
    
    // Check for overdue data subject requests
    const overdueRequests = report.dataSubjectRequests
      .filter(r => r.status === 'pending' && r.avg_days_to_complete > 30);
    
    if (overdueRequests.length > 0) {
      issues.push({
        type: 'overdue_dsr',
        severity: 'high',
        message: `${overdueRequests.length} data subject requests exceed 30-day deadline`
      });
    }
    
    // Check for unresolved violations
    const openViolations = report.violations
      .filter(v => v.status === 'open' && v.severity !== 'low');
    
    if (openViolations.length > 0) {
      issues.push({
        type: 'open_violations',
        severity: 'high',
        message: `${openViolations.length} compliance violations remain open`
      });
    }
    
    return issues;
  }
}

module.exports = new ComplianceLogger();