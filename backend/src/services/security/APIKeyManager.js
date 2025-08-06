const db = require('../../db/pool');
const crypto = require('crypto');
const logger = require('../../utils/logger');

class APIKeyManager {
  constructor() {
    this.rotationDays = parseInt(process.env.API_KEY_ROTATION_DAYS || '90');
    this.warningDays = 7; // Warn 7 days before expiration
    this.services = {
      OPENAI: 'openai',
      ANTHROPIC: 'anthropic',
      SLACK: 'slack',
      OPENPHONE: 'openphone',
      NINJAONE: 'ninjaone'
    };
  }

  /**
   * Generate a new API key
   */
  generateApiKey(service) {
    const prefix = service.substring(0, 4).toUpperCase();
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const key = `${prefix}_${randomBytes}`;
    return {
      key,
      hash: this.hashKey(key),
      prefix: key.substring(0, 8)
    };
  }

  /**
   * Hash API key for storage
   */
  hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Create new API key
   */
  async createApiKey(service, environment = 'production', createdBy = null) {
    try {
      const { key, hash, prefix } = this.generateApiKey(service);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.rotationDays);
      
      const query = `
        INSERT INTO api_keys (
          key_hash, key_prefix, service_name, environment,
          status, expires_at, created_by
        ) VALUES ($1, $2, $3, $4, 'active', $5, $6)
        RETURNING id, key_prefix, expires_at
      `;
      
      const result = await db.query(query, [
        hash,
        prefix,
        service,
        environment,
        expiresAt,
        createdBy
      ]);
      
      logger.info('API key created', {
        service,
        environment,
        keyId: result.rows[0].id,
        expiresAt
      });
      
      // Return the actual key only once
      return {
        id: result.rows[0].id,
        key, // Only returned on creation
        prefix,
        service,
        environment,
        expiresAt: result.rows[0].expires_at
      };
      
    } catch (error) {
      logger.error('Error creating API key', error);
      throw error;
    }
  }

  /**
   * Rotate API keys that are expiring soon
   */
  async rotateExpiringKeys() {
    try {
      const keysToRotate = await this.getKeysNeedingRotation();
      const rotationResults = [];
      
      for (const key of keysToRotate) {
        try {
          const result = await this.rotateKey(
            key.id,
            'scheduled',
            'Automatic rotation due to expiration'
          );
          rotationResults.push(result);
        } catch (error) {
          logger.error('Error rotating key', {
            keyId: key.id,
            service: key.service_name,
            error
          });
        }
      }
      
      return rotationResults;
      
    } catch (error) {
      logger.error('Error in key rotation process', error);
      throw error;
    }
  }

  /**
   * Get keys that need rotation
   */
  async getKeysNeedingRotation() {
    const query = `
      SELECT * FROM check_api_key_rotation()
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Rotate a specific API key
   */
  async rotateKey(oldKeyId, reason, details, rotationType = 'gradual') {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get old key details
      const oldKeyResult = await client.query(
        'SELECT * FROM api_keys WHERE id = $1',
        [oldKeyId]
      );
      
      if (oldKeyResult.rows.length === 0) {
        throw new Error('API key not found');
      }
      
      const oldKey = oldKeyResult.rows[0];
      
      // Create new key
      const newKey = await this.createApiKey(
        oldKey.service_name,
        oldKey.environment,
        oldKey.created_by
      );
      
      // Create rotation log
      const rotationQuery = `
        INSERT INTO api_key_rotation_log (
          old_key_id, new_key_id, rotation_reason,
          rotation_type, status
        ) VALUES ($1, $2, $3, $4, 'in_progress')
        RETURNING id
      `;
      
      const rotationResult = await client.query(rotationQuery, [
        oldKeyId,
        newKey.id,
        reason,
        rotationType
      ]);
      
      const rotationId = rotationResult.rows[0].id;
      
      // Update old key status
      await client.query(
        `UPDATE api_keys 
         SET status = 'rotating', rotated_at = NOW() 
         WHERE id = $1`,
        [oldKeyId]
      );
      
      await client.query('COMMIT');
      
      // Notify administrators
      await this.notifyKeyRotation(oldKey, newKey, reason);
      
      // Schedule old key deactivation based on rotation type
      if (rotationType === 'immediate') {
        await this.deactivateKey(oldKeyId);
      } else {
        // Schedule deactivation after grace period
        await this.scheduleKeyDeactivation(oldKeyId, 24); // 24 hours
      }
      
      logger.info('API key rotated', {
        oldKeyId,
        newKeyId: newKey.id,
        service: oldKey.service_name,
        rotationType
      });
      
      return {
        rotationId,
        oldKeyId,
        newKey,
        rotationType,
        status: 'in_progress'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error rotating API key', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Audit key usage
   */
  async auditKeyUsage(days = 30) {
    try {
      const query = `
        SELECT 
          ak.service_name,
          ak.environment,
          ak.status,
          ak.usage_count,
          ak.error_count,
          ak.estimated_cost,
          ak.last_used_at,
          CASE 
            WHEN ak.usage_count > 0 
            THEN ROUND((ak.error_count::DECIMAL / ak.usage_count) * 100, 2)
            ELSE 0
          END as error_rate,
          EXTRACT(DAY FROM ak.expires_at - NOW())::INTEGER as days_until_expiry
        FROM api_keys ak
        WHERE ak.created_at > NOW() - INTERVAL '${days} days'
        ORDER BY ak.service_name, ak.environment
      `;
      
      const result = await db.query(query);
      
      // Group by service
      const audit = result.rows.reduce((acc, key) => {
        if (!acc[key.service_name]) {
          acc[key.service_name] = {
            totalCalls: 0,
            totalCost: 0,
            totalErrors: 0,
            environments: {}
          };
        }
        
        acc[key.service_name].totalCalls += key.usage_count;
        acc[key.service_name].totalCost += parseFloat(key.estimated_cost);
        acc[key.service_name].totalErrors += key.error_count;
        
        acc[key.service_name].environments[key.environment] = {
          status: key.status,
          calls: key.usage_count,
          cost: `$${key.estimated_cost}`,
          errorRate: `${key.error_rate}%`,
          lastUsed: key.last_used_at,
          daysUntilExpiry: key.days_until_expiry
        };
        
        return acc;
      }, {});
      
      // Add alerts for concerning patterns
      const alerts = await this.generateUsageAlerts(result.rows);
      
      return {
        period: `Last ${days} days`,
        services: audit,
        alerts,
        generatedAt: new Date()
      };
      
    } catch (error) {
      logger.error('Error auditing key usage', error);
      throw error;
    }
  }

  /**
   * Update key usage statistics
   */
  async updateKeyUsage(keyHash, success = true, cost = 0) {
    try {
      const query = success ? `
        UPDATE api_keys
        SET usage_count = usage_count + 1,
            last_used_at = NOW(),
            estimated_cost = estimated_cost + $2
        WHERE key_hash = $1
      ` : `
        UPDATE api_keys
        SET usage_count = usage_count + 1,
            error_count = error_count + 1,
            last_error_at = NOW(),
            last_used_at = NOW()
        WHERE key_hash = $1
      `;
      
      const params = success ? [keyHash, cost] : [keyHash];
      await db.query(query, params);
      
    } catch (error) {
      logger.error('Error updating key usage', error);
    }
  }

  /**
   * Validate API key
   */
  async validateKey(key) {
    try {
      const hash = this.hashKey(key);
      
      const query = `
        SELECT id, service_name, environment, status, expires_at,
               ip_whitelist
        FROM api_keys
        WHERE key_hash = $1
        AND status = 'active'
        AND expires_at > NOW()
      `;
      
      const result = await db.query(query, [hash]);
      
      if (result.rows.length === 0) {
        return {
          valid: false,
          reason: 'Invalid or expired key'
        };
      }
      
      const keyData = result.rows[0];
      
      // Check IP whitelist if configured
      if (keyData.ip_whitelist && keyData.ip_whitelist.length > 0) {
        const clientIp = this.getClientIp();
        if (!keyData.ip_whitelist.includes(clientIp)) {
          return {
            valid: false,
            reason: 'IP not whitelisted'
          };
        }
      }
      
      return {
        valid: true,
        keyId: keyData.id,
        service: keyData.service_name,
        environment: keyData.environment
      };
      
    } catch (error) {
      logger.error('Error validating key', error);
      return {
        valid: false,
        reason: 'Validation error'
      };
    }
  }

  /**
   * Deactivate a key
   */
  async deactivateKey(keyId) {
    try {
      await db.query(
        `UPDATE api_keys 
         SET status = 'expired', revoked_at = NOW() 
         WHERE id = $1`,
        [keyId]
      );
      
      logger.info('API key deactivated', { keyId });
      
    } catch (error) {
      logger.error('Error deactivating key', error);
      throw error;
    }
  }

  /**
   * Schedule key deactivation
   */
  async scheduleKeyDeactivation(keyId, hoursDelay) {
    // In production, this would use a job queue
    setTimeout(async () => {
      await this.deactivateKey(keyId);
    }, hoursDelay * 60 * 60 * 1000);
  }

  /**
   * Notify administrators about key rotation
   */
  async notifyKeyRotation(oldKey, newKey, reason) {
    const notification = {
      type: 'api_key_rotation',
      service: oldKey.service_name,
      environment: oldKey.environment,
      reason,
      action_required: true,
      instructions: `Please update ${oldKey.service_name} API key to: ${newKey.prefix}...`,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    // In production, this would send actual notifications
    logger.info('Key rotation notification', notification);
    
    // Also log to database for audit
    const query = `
      INSERT INTO notifications (
        type, severity, title, message, data
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    
    try {
      await db.query(query, [
        'api_key_rotation',
        'high',
        `API Key Rotation Required: ${oldKey.service_name}`,
        notification.instructions,
        JSON.stringify(notification)
      ]);
    } catch (error) {
      logger.error('Error logging notification', error);
    }
  }

  /**
   * Generate usage alerts
   */
  async generateUsageAlerts(keys) {
    const alerts = [];
    
    for (const key of keys) {
      // High error rate
      if (key.error_rate > 10) {
        alerts.push({
          type: 'high_error_rate',
          severity: 'high',
          service: key.service_name,
          message: `${key.service_name} has ${key.error_rate}% error rate`,
          value: key.error_rate
        });
      }
      
      // Expiring soon
      if (key.days_until_expiry <= this.warningDays && key.status === 'active') {
        alerts.push({
          type: 'expiring_soon',
          severity: 'medium',
          service: key.service_name,
          message: `${key.service_name} key expires in ${key.days_until_expiry} days`,
          value: key.days_until_expiry
        });
      }
      
      // High cost
      if (key.estimated_cost > 1000) {
        alerts.push({
          type: 'high_cost',
          severity: 'medium',
          service: key.service_name,
          message: `${key.service_name} cost: $${key.estimated_cost}`,
          value: key.estimated_cost
        });
      }
      
      // Unused key
      if (!key.last_used_at && key.days_until_expiry < 30) {
        alerts.push({
          type: 'unused_key',
          severity: 'low',
          service: key.service_name,
          message: `${key.service_name} key has never been used`,
          value: 0
        });
      }
    }
    
    return alerts;
  }

  /**
   * Mark key as compromised
   */
  async markKeyCompromised(keyId, details) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update key status
      await client.query(
        `UPDATE api_keys 
         SET status = 'compromised', 
             revoked_at = NOW(),
             compromise_details = $2
         WHERE id = $1`,
        [keyId, details]
      );
      
      // Get key details for immediate rotation
      const keyResult = await client.query(
        'SELECT * FROM api_keys WHERE id = $1',
        [keyId]
      );
      
      const key = keyResult.rows[0];
      
      // Create security event
      await client.query(`
        INSERT INTO security_events (
          event_type, severity, detection_method,
          detection_rule, action_taken, api_key_id
        ) VALUES (
          'api_key_compromise', 'critical', 'manual_report',
          $1, 'key_revoked', $2
        )
      `, [details, keyId]);
      
      await client.query('COMMIT');
      
      // Immediately rotate the key
      const newKey = await this.rotateKey(
        keyId,
        'compromised',
        details,
        'immediate'
      );
      
      // Send urgent notification
      await this.sendUrgentNotification(key, details);
      
      return newKey;
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error marking key as compromised', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Send urgent notification
   */
  async sendUrgentNotification(key, details) {
    // In production, this would trigger immediate alerts
    logger.critical('API KEY COMPROMISED', {
      service: key.service_name,
      environment: key.environment,
      details
    });
  }

  /**
   * Get client IP (helper method)
   */
  getClientIp() {
    // In production, this would get the actual client IP
    return '127.0.0.1';
  }

  /**
   * Cleanup expired keys
   */
  async cleanupExpiredKeys() {
    try {
      const query = `
        UPDATE api_keys
        SET status = 'expired'
        WHERE status = 'active'
        AND expires_at < NOW()
        RETURNING id, service_name
      `;
      
      const result = await db.query(query);
      
      if (result.rows.length > 0) {
        logger.info(`Cleaned up ${result.rows.length} expired keys`);
      }
      
      return result.rows;
      
    } catch (error) {
      logger.error('Error cleaning up expired keys', error);
      throw error;
    }
  }
}

module.exports = new APIKeyManager();