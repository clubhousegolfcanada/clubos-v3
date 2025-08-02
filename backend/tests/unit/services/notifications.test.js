const NotificationService = require('../../../src/services/notifications');
const axios = require('axios');

// Mock dependencies
jest.mock('axios');
jest.mock('../../../src/utils/correlationId', () => ({
  getCorrelationId: jest.fn(() => 'test-correlation-id')
}));

// Mock environment variables
const originalEnv = process.env;

describe('NotificationService', () => {
  let notificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      SLACK_WEBHOOK_URL: 'https://hooks.slack.com/test',
      SLACK_CHANNEL: '#test-channel'
    };
    notificationService = new NotificationService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with webhook URL and channel', () => {
      expect(notificationService.enabled).toBe(true);
      expect(notificationService.webhookUrl).toBe('https://hooks.slack.com/test');
      expect(notificationService.channel).toBe('#test-channel');
    });

    it('should disable notifications when webhook URL is not set', () => {
      process.env.SLACK_WEBHOOK_URL = '';
      const service = new NotificationService();
      expect(service.enabled).toBe(false);
    });
  });

  describe('sendSlackAlert', () => {
    it('should send high priority alert successfully', async () => {
      axios.post.mockResolvedValue({ data: { ok: true } });

      const result = await notificationService.sendSlackAlert(
        'thread-123',
        'high',
        'Critical issue detected',
        { customer: 'John Doe', bay: 'Bay 5' }
      );

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          channel: '#test-channel',
          text: expect.stringContaining('High Priority Alert'),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              color: '#ff6b6b', // red for high priority
              fields: expect.arrayContaining([
                expect.objectContaining({
                  title: 'Thread ID',
                  value: 'thread-123'
                }),
                expect.objectContaining({
                  title: 'Message',
                  value: 'Critical issue detected'
                })
              ])
            })
          ])
        })
      );
    });

    it('should send urgent priority alert with dark red color', async () => {
      axios.post.mockResolvedValue({ data: { ok: true } });

      const result = await notificationService.sendSlackAlert(
        'thread-456',
        'urgent',
        'Emergency situation'
      );

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              color: '#8b0000' // dark red for urgent
            })
          ])
        })
      );
    });

    it('should handle Slack API errors', async () => {
      axios.post.mockRejectedValue(new Error('Slack API error'));

      const result = await notificationService.sendSlackAlert(
        'thread-789',
        'medium',
        'Test message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Slack API error');
    });

    it('should return false when notifications are disabled', async () => {
      process.env.SLACK_WEBHOOK_URL = '';
      const service = new NotificationService();

      const result = await service.sendSlackAlert(
        'thread-999',
        'low',
        'Test message'
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Slack notifications not configured');
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('sendNotification', () => {
    it('should send notification with custom channel', async () => {
      axios.post.mockResolvedValue({ data: { ok: true } });

      const result = await notificationService.sendNotification(
        'Custom notification',
        { channel: '#custom-channel' }
      );

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          channel: '#custom-channel',
          text: 'Custom notification'
        })
      );
    });

    it('should format message with markdown', async () => {
      axios.post.mockResolvedValue({ data: { ok: true } });

      const result = await notificationService.sendNotification(
        '*Bold text* and _italic text_'
      );

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          text: '*Bold text* and _italic text_',
          mrkdwn: true
        })
      );
    });
  });

  describe('notifyActionExecution', () => {
    it('should notify successful action execution', async () => {
      axios.post.mockResolvedValue({ data: { ok: true } });

      const result = await notificationService.notifyActionExecution(
        'reset_trackman',
        'completed',
        { thread_id: 'thread-123', bay_id: 'bay-5' }
      );

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          text: expect.stringContaining('Action Executed: reset_trackman'),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              color: '#36a64f', // green for success
              fields: expect.arrayContaining([
                expect.objectContaining({
                  title: 'Action',
                  value: 'reset_trackman'
                }),
                expect.objectContaining({
                  title: 'Status',
                  value: 'completed'
                })
              ])
            })
          ])
        })
      );
    });

    it('should notify failed action execution', async () => {
      axios.post.mockResolvedValue({ data: { ok: true } });

      const result = await notificationService.notifyActionExecution(
        'unlock_door',
        'failed',
        { thread_id: 'thread-456', error: 'Access denied' }
      );

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              color: '#ff6b6b' // red for failure
            })
          ])
        })
      );
    });
  });
});