/**
 * Notifications Service
 * Migrated from V1 - Handles Slack notifications
 */

const axios = require('axios');
const { getCorrelationId } = require('../utils/correlationId');

class NotificationService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.enabled = Boolean(this.webhookUrl);
    this.channel = process.env.SLACK_CHANNEL || '#clubos-alerts';
    
    if (!this.enabled) {
      console.warn('Slack webhook URL not configured, notifications disabled');
    }
  }

  /**
   * Send a Slack alert
   * @param {string} thread_id - Thread ID for context
   * @param {string} priority - Priority level (low, medium, high, urgent)
   * @param {string} messageText - Alert message
   * @param {Object} context - Additional context
   * @returns {Object} Result of notification attempt
   */
  async sendSlackAlert(thread_id, priority, messageText, context = {}) {
    if (!this.enabled) {
      console.log('[Slack Disabled] Would send:', { thread_id, priority, messageText });
      return {
        success: false,
        reason: 'Slack notifications not configured'
      };
    }

    try {
      // Determine color based on priority
      const colorMap = {
        low: '#36a64f',      // green
        medium: '#ff9f00',   // orange
        high: '#ff6b6b',     // red
        urgent: '#8b0000'    // dark red
      };

      const color = colorMap[priority] || '#808080';

      // Build Slack message
      const message = {
        channel: this.channel,
        username: 'ClubOS V3',
        icon_emoji: ':robot_face:',
        text: `🚨 ${priority.toUpperCase()} Priority Alert`,
        attachments: [
          {
            color: color,
            title: 'Alert Details',
            text: messageText,
            fields: [
              {
                title: 'Thread ID',
                value: thread_id,
                short: true
              },
              {
                title: 'Priority',
                value: priority,
                short: true
              }
            ],
            footer: 'ClubOS V3',
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };

      // Add context fields if provided
      if (context.customer_id) {
        message.attachments[0].fields.push({
          title: 'Customer',
          value: context.customer_id,
          short: true
        });
      }

      if (context.location) {
        message.attachments[0].fields.push({
          title: 'Location',
          value: context.location,
          short: true
        });
      }

      if (context.action_type) {
        message.attachments[0].fields.push({
          title: 'Action',
          value: context.action_type,
          short: true
        });
      }

      if (context.correlation_id) {
        message.attachments[0].fields.push({
          title: 'Correlation ID',
          value: context.correlation_id,
          short: false
        });
      }

      // Send to Slack
      const response = await axios.post(this.webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      return {
        success: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to send Slack notification:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send escalation notification
   * @param {Object} thread - Thread object
   * @param {Object} sop - SOP that failed
   * @param {string} reason - Escalation reason
   * @returns {Object} Result
   */
  async sendEscalation(thread, sop, reason) {
    const message = [
      `Thread: #${thread.id}`,
      `Customer: ${thread.customer_id}`,
      `Intent: ${thread.intent}`,
      `Failed SOP: ${sop ? sop.title : 'None'}`,
      `Reason: ${reason}`,
      '',
      `Please review and take action.`
    ].join('\n');

    return this.sendSlackAlert(
      thread.id,
      'high',
      message,
      {
        customer_id: thread.customer_id,
        correlation_id: thread.correlation_id,
        action_type: sop?.primary_action
      }
    );
  }

  /**
   * Send system alert
   * @param {string} alertType - Type of alert
   * @param {string} message - Alert message
   * @param {Object} details - Additional details
   * @returns {Object} Result
   */
  async sendSystemAlert(alertType, message, details = {}) {
    if (!this.enabled) {
      console.log('[Slack Disabled] System alert:', { alertType, message, details });
      return { success: false };
    }

    try {
      const slackMessage = {
        channel: '#clubos-system',
        username: 'ClubOS System',
        icon_emoji: ':warning:',
        text: `System Alert: ${alertType}`,
        attachments: [
          {
            color: 'warning',
            title: alertType,
            text: message,
            fields: Object.entries(details).map(([key, value]) => ({
              title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value: String(value),
              short: String(value).length < 40
            })),
            footer: 'ClubOS V3 System',
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };

      await axios.post(this.webhookUrl, slackMessage, {
        timeout: 5000
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send system alert:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send simple message
   * @param {string} text - Message text
   * @param {string} channel - Optional channel override
   * @returns {Object} Result
   */
  async sendMessage(text, channel = null) {
    if (!this.enabled) {
      console.log('[Slack Disabled] Message:', text);
      return { success: false };
    }

    try {
      await axios.post(this.webhookUrl, {
        channel: channel || this.channel,
        text: text,
        username: 'ClubOS V3'
      }, {
        timeout: 5000
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send Slack message:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();