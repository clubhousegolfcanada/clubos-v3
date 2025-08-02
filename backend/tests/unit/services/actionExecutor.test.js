const { executeAction } = require('../../../src/services/actionExecutor');

// Mock dependencies
jest.mock('../../../src/services/notifications');
jest.mock('../../../src/services/remoteActions');
jest.mock('../../../src/services/booking');
jest.mock('axios');

const notifications = require('../../../src/services/notifications');
const { executeResetTrackman, executeUnlockDoor } = require('../../../src/services/remoteActions');
const { validateCustomerAction } = require('../../../src/services/booking');
const axios = require('axios');

describe('ActionExecutor Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeAction', () => {
    it('should execute reset_trackman action successfully', async () => {
      const actionType = 'reset_trackman';
      const context = {
        thread: { bay_id: 'bay-1' },
        sop: { timeout_seconds: 30, max_retries: 2 }
      };

      executeResetTrackman.mockResolvedValue({
        success: true,
        data: { message: 'Trackman reset successfully' }
      });

      const result = await executeAction(actionType, context);

      expect(result.outcome).toBe('completed');
      expect(result.notes).toContain('Trackman reset successfully');
      expect(executeResetTrackman).toHaveBeenCalledWith('bay-1');
    });

    it('should execute unlock_door action successfully', async () => {
      const actionType = 'unlock_door';
      const context = {
        thread: { phone_number: '+1234567890' },
        sop: { timeout_seconds: 30, max_retries: 2 }
      };

      validateCustomerAction.mockResolvedValue({
        valid: true,
        customerId: 'cust-123',
        accessCode: '1234'
      });

      executeUnlockDoor.mockResolvedValue({
        success: true,
        data: { unlocked: true }
      });

      const result = await executeAction(actionType, context);

      expect(result.outcome).toBe('completed');
      expect(result.notes).toContain('Door unlocked');
      expect(validateCustomerAction).toHaveBeenCalledWith('+1234567890', 'unlock_door');
      expect(executeUnlockDoor).toHaveBeenCalledWith('1234');
    });

    it('should handle escalate action', async () => {
      const actionType = 'escalate';
      const context = {
        thread: { thread_id: 'thread-123', customer_name: 'John Doe' },
        message: { content: 'Help needed' },
        sop: { timeout_seconds: 30, max_retries: 2 }
      };

      axios.post.mockResolvedValue({ data: { ok: true } });

      const result = await executeAction(actionType, context);

      expect(result.outcome).toBe('completed');
      expect(result.notes).toContain('Escalated to Slack');
      expect(axios.post).toHaveBeenCalled();
    });

    it('should handle send_message action', async () => {
      const actionType = 'send_message';
      const context = {
        thread: { thread_id: 'thread-123' },
        sop: { message_template: 'Hello {{customer_name}}', timeout_seconds: 30 }
      };

      notifications.sendNotification.mockResolvedValue({
        success: true,
        messageId: 'msg-123'
      });

      const result = await executeAction(actionType, context);

      expect(result.outcome).toBe('completed');
      expect(result.notes).toContain('Message sent');
    });

    it('should handle unknown action type', async () => {
      const actionType = 'unknown_action';
      const context = {};

      const result = await executeAction(actionType, context);

      expect(result.outcome).toBe('failed');
      expect(result.notes).toContain('Unknown action type: unknown_action');
    });

    it('should retry on failure', async () => {
      const actionType = 'reset_trackman';
      const context = {
        thread: { bay_id: 'bay-1' },
        sop: { timeout_seconds: 30, max_retries: 2 }
      };

      executeResetTrackman
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: { message: 'Trackman reset successfully' }
        });

      const result = await executeAction(actionType, context);

      expect(result.outcome).toBe('completed');
      expect(executeResetTrackman).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const actionType = 'reset_trackman';
      const context = {
        thread: { bay_id: 'bay-1' },
        sop: { timeout_seconds: 30, max_retries: 2 }
      };

      executeResetTrackman.mockRejectedValue(new Error('Network error'));

      const result = await executeAction(actionType, context);

      expect(result.outcome).toBe('failed');
      expect(result.notes).toContain('Network error');
      expect(executeResetTrackman).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });
});