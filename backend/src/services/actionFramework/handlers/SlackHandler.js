/**
 * Slack Notification Handler
 * Handles Slack messaging and notifications via webhook and API
 * Migrated from notifications.js to fit handler pattern
 */

const axios = require('axios');
const BaseHandler = require('./BaseHandler');

class SlackHandler extends BaseHandler {
  constructor() {
    super('slack', {
      timeout: 10000, // Slack is usually fast
      retryable: true
    });
    
    // Slack channels for different types of notifications
    this.channels = {
      alerts: process.env.SLACK_CHANNEL_ALERTS || '#clubos-alerts',
      system: process.env.SLACK_CHANNEL_SYSTEM || '#clubos-system',
      bookings: process.env.SLACK_CHANNEL_BOOKINGS || '#clubos-bookings',
      general: process.env.SLACK_CHANNEL_GENERAL || '#general'
    };
    
    // Message color schemes
    this.colors = {
      success: '#36a64f',    // green
      warning: '#ff9f00',    // orange
      error: '#ff6b6b',      // red
      urgent: '#8b0000',     // dark red
      info: '#2196F3',       // blue
      neutral: '#808080'     // gray
    };
    
    // Priority mappings
    this.priorityConfig = {
      low: { color: this.colors.success, emoji: '🔵' },
      medium: { color: this.colors.warning, emoji: '🟡' },
      high: { color: this.colors.error, emoji: '🔴' },
      urgent: { color: this.colors.urgent, emoji: '🚨' }
    };
  }

  /**
   * Load Slack credentials
   */
  loadCredentials() {
    return {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      botToken: process.env.SLACK_BOT_TOKEN,
      enabled: Boolean(process.env.SLACK_WEBHOOK_URL)
    };
  }

  /**
   * Send Slack alert (primary method)
   */
  async sendAlert(context) {
    try {
      this.validateContext(context, ['message']);
      
      if (!this.credentials.enabled) {
        console.log('[Slack Disabled] Would send alert:', context);
        return this.handleSuccess('sendAlert',
          this.createResult('partial', 'Slack notifications not configured', {
            message: context.message,
            reason: 'not_configured',
            skipped: true
          })
        );
      }
      
      const priority = context.priority || 'medium';
      const channel = context.channel || this.channels.alerts;
      const threadId = context.thread_id || context.threadId;
      
      console.log(`Sending Slack alert (${priority}) to ${channel}`);
      
      const slackMessage = this.buildAlertMessage(context, priority, channel, threadId);
      const result = await this.sendSlackMessage(slackMessage);
      
      if (result.success) {
        return this.handleSuccess('sendAlert',
          this.createResult('success', 'Alert sent to Slack', {
            priority: priority,
            channel: channel,
            threadId: threadId,
            message: context.message,
            sentAt: new Date().toISOString()
          })
        );
      } else {
        throw new Error(result.error || 'Failed to send Slack alert');
      }
      
    } catch (error) {
      return this.handleFailure('sendAlert', error, context);
    }
  }

  /**
   * Send booking notification
   */
  async sendBookingNotification(context) {
    try {
      this.validateContext(context, ['bookingType', 'customerName']);
      
      const bookingContext = {
        ...context,
        channel: this.channels.bookings,
        message: this.formatBookingMessage(context),
        priority: 'low'
      };
      
      return await this.sendAlert(bookingContext);
      
    } catch (error) {
      return this.handleFailure('sendBookingNotification', error, context);
    }
  }

  /**
   * Send system notification
   */
  async sendSystemNotification(context) {
    try {
      this.validateContext(context, ['alertType', 'message']);
      
      const systemContext = {
        ...context,
        channel: this.channels.system,
        priority: context.priority || 'medium'
      };
      
      return await this.sendAlert(systemContext);
      
    } catch (error) {
      return this.handleFailure('sendSystemNotification', error, context);
    }
  }

  /**
   * Send escalation notification
   */
  async sendEscalation(context) {
    try {
      this.validateContext(context, ['thread', 'reason']);
      
      const thread = context.thread;
      const sop = context.sop;
      const reason = context.reason;
      
      const escalationMessage = [
        `**Thread Escalation Required**`,
        `Thread: #${thread.id}`,
        `Customer: ${thread.customer_id}`,
        `Intent: ${thread.intent}`,
        `Failed SOP: ${sop ? sop.title : 'None'}`,
        `Reason: ${reason}`,
        '',
        `Please review and take action.`
      ].join('\n');
      
      const escalationContext = {
        message: escalationMessage,
        priority: 'high',
        channel: this.channels.alerts,
        thread_id: thread.id,
        customer_id: thread.customer_id,
        correlation_id: thread.correlation_id,
        action_type: sop?.primary_action
      };
      
      return await this.sendAlert(escalationContext);
      
    } catch (error) {
      return this.handleFailure('sendEscalation', error, context);
    }
  }

  /**
   * Send simple message
   */
  async sendMessage(context) {
    try {
      this.validateContext(context, ['text']);
      
      if (!this.credentials.enabled) {
        console.log('[Slack Disabled] Would send message:', context.text);
        return this.handleSuccess('sendMessage',
          this.createResult('partial', 'Slack not configured', {
            text: context.text,
            skipped: true
          })
        );
      }
      
      const channel = context.channel || this.channels.general;
      
      const message = {
        channel: channel,
        text: context.text,
        username: 'ClubOS V3',
        icon_emoji: ':robot_face:'
      };
      
      const result = await this.sendSlackMessage(message);
      
      if (result.success) {
        return this.handleSuccess('sendMessage',
          this.createResult('success', 'Message sent to Slack', {
            channel: channel,
            text: context.text,
            sentAt: new Date().toISOString()
          })
        );
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
      
    } catch (error) {
      return this.handleFailure('sendMessage', error, context);
    }
  }

  /**
   * Build alert message with attachments
   */
  buildAlertMessage(context, priority, channel, threadId) {
    const priorityConfig = this.priorityConfig[priority] || this.priorityConfig.medium;
    
    const message = {
      channel: channel,
      username: 'ClubOS V3',
      icon_emoji: ':robot_face:',
      text: `${priorityConfig.emoji} ${priority.toUpperCase()} Priority Alert`,
      attachments: [
        {
          color: priorityConfig.color,
          title: 'Alert Details',
          text: context.message,
          fields: [],
          footer: 'ClubOS V3',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
    
    // Add context fields
    if (threadId) {
      message.attachments[0].fields.push({
        title: 'Thread ID',
        value: threadId,
        short: true
      });
    }
    
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
    
    return message;
  }

  /**
   * Format booking-specific message
   */
  formatBookingMessage(context) {
    const { bookingType, customerName, location, bayNumber, date, time } = context;
    
    switch (bookingType) {
      case 'confirmation':
        return `New booking confirmed: ${customerName} at ${location} Bay ${bayNumber} on ${date} at ${time}`;
      case 'cancellation':
        return `Booking cancelled: ${customerName} at ${location} Bay ${bayNumber} on ${date} at ${time}`;
      case 'reminder':
        return `Booking reminder sent: ${customerName} at ${location} Bay ${bayNumber} starts soon`;
      case 'no_show':
        return `No-show recorded: ${customerName} did not arrive for ${location} Bay ${bayNumber} at ${time}`;
      default:
        return `Booking ${bookingType}: ${customerName} at ${location}`;
    }
  }

  /**
   * Send message to Slack webhook
   */
  async sendSlackMessage(message) {
    try {
      const { webhookUrl } = this.credentials;
      
      const response = await axios.post(webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      });
      
      return {
        success: response.status === 200,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to send Slack message:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check - verify Slack webhook
   */
  async checkHealth() {
    try {
      const { webhookUrl, enabled } = this.credentials;
      
      if (!enabled) {
        return {
          healthy: false,
          message: 'Slack webhook URL not configured'
        };
      }
      
      // Send a minimal test message
      const testMessage = {
        text: 'ClubOS V3 health check',
        username: 'ClubOS Health Check'
      };
      
      const response = await axios.post(webhookUrl, testMessage, {
        timeout: 5000
      });
      
      return {
        healthy: response.status === 200,
        message: response.status === 200 ? 'Slack webhook accessible' : 'Webhook not responding'
      };
      
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`
      };
    }
  }

  /**
   * Get available channels
   */
  getChannels() {
    return this.channels;
  }

  /**
   * Get priority configurations
   */
  getPriorityConfig() {
    return this.priorityConfig;
  }

  /**
   * Format message for display
   */
  formatMessage(text, options = {}) {
    let formatted = text;
    
    // Add bold formatting
    if (options.bold) {
      formatted = `*${formatted}*`;
    }
    
    // Add italic formatting
    if (options.italic) {
      formatted = `_${formatted}_`;
    }
    
    // Add code formatting
    if (options.code) {
      formatted = `\`${formatted}\``;
    }
    
    // Add code block formatting
    if (options.codeBlock) {
      formatted = `\`\`\`${formatted}\`\`\``;
    }
    
    return formatted;
  }

  /**
   * Create threaded reply
   */
  async replyToThread(context) {
    try {
      this.validateContext(context, ['threadTs', 'text']);
      
      // Note: This requires Slack Bot Token for threading
      // For webhook-only integration, this is a placeholder
      
      console.log(`[TODO] Would reply to thread ${context.threadTs}: ${context.text}`);
      
      return this.handleSuccess('replyToThread',
        this.createResult('partial', 'Thread replies require Bot Token', {
          threadTs: context.threadTs,
          text: context.text,
          note: 'Webhook-only mode, threading not available'
        })
      );
      
    } catch (error) {
      return this.handleFailure('replyToThread', error, context);
    }
  }
}

module.exports = SlackHandler;