const axios = require('axios');
const { executeResetTrackman, executeUnlockDoor } = require('./remoteActions');
const { validateCustomerAction } = require('./booking');
const notificationService = require('./notifications');
const actionFramework = require('./actionFramework');

// Legacy action execution handlers (being phased out)
const legacyHandlers = {
  reset_trackman: resetTrackMan,
  unlock_door: unlockDoor,
  escalate: escalateToSlack,
  send_message: sendMessage
};

// New action types supported by the framework
const frameworkActions = [
  'projector_on', 'projector_off', 'projector_input',
  'reset_trackman', 'reboot_pc', 'wake_pc', 'lock_pc',
  'unlock_door', 'lock_door', 'check_door_status',
  'send_sms', 'send_message',
  'update_contact', 'create_ticket', 'log_activity',
  'escalate', 'notify_team'
];

async function executeAction(actionType, context) {
  // Use new framework for supported actions
  if (frameworkActions.includes(actionType)) {
    return actionFramework.execute(actionType, context);
  }
  
  // Fall back to legacy handlers
  try {
    // Check if we have a handler for this action
    const handler = legacyHandlers[actionType];
    if (!handler) {
      return {
        outcome: 'failed',
        notes: `Unknown action type: ${actionType}`
      };
    }
    
    const { timeout_seconds = 30, max_retries = 2 } = context.sop || {};
    let lastError = null;
    let attempt = 0;
    
    // Retry logic
    while (attempt <= max_retries) {
      try {
        // Execute with timeout
        const result = await executeWithTimeout(handler(context), timeout_seconds * 1000);
        
        // Validate outcome
        if (!['success', 'partial', 'failed', 'unconfirmed'].includes(result.outcome)) {
          result.outcome = 'unconfirmed';
        }
        
        return result;
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (error.message === 'Operation timeout') {
          console.log(`Attempt ${attempt} timed out for ${actionType}`);
          if (attempt > max_retries) {
            return {
              outcome: 'failed',
              notes: `Action timed out after ${timeout_seconds}s (${attempt} attempts)`
            };
          }
        } else if (attempt > max_retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw lastError;
  } catch (error) {
    console.error(`Action execution error for ${actionType}:`, error);
    return {
      outcome: 'failed',
      notes: error.message
    };
  }
}

// Helper function for timeout
async function executeWithTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ]);
}

// Action implementations using migrated services
async function resetTrackMan(context) {
  try {
    console.log(`Resetting TrackMan for thread ${context.thread.id}`);
    
    // Extract bay and location from context
    const bay_id = context.thread.bay_id || 'bay-1';
    const location = context.thread.location || 'bedford';
    
    // Use migrated remote actions service
    const result = await executeResetTrackman(bay_id, location);
    
    return {
      outcome: result.outcome,
      notes: result.notes,
      details: {
        bay: bay_id,
        location: location,
        device: result.deviceName,
        reset_time: new Date().toISOString(),
        simulated: result.simulated
      }
    };
  } catch (error) {
    return {
      outcome: 'failed',
      notes: `Reset error: ${error.message}`
    };
  }
}

async function unlockDoor(context) {
  try {
    console.log(`Unlocking door for thread ${context.thread.id}`);
    
    // Validate customer has active booking using migrated service
    const validation = await validateCustomerAction(
      context.thread.customer_id, 
      'unlock_door'
    );
    
    if (!validation.allowed) {
      return {
        outcome: 'failed',
        notes: validation.reason
      };
    }
    
    // Extract location from context or booking
    const location = context.thread.location || validation.booking?.location || 'bedford';
    const bay_id = validation.booking?.bay_id || context.thread.bay_id;
    
    // Use migrated remote actions service
    const result = await executeUnlockDoor(bay_id, location);
    
    return {
      outcome: result.outcome,
      notes: result.notes,
      details: {
        location: location,
        unlock_duration: result.duration || '10 minutes',
        booking_id: validation.booking?.id,
        simulated: result.simulated
      }
    };
  } catch (error) {
    return {
      outcome: 'failed',
      notes: `Unlock error: ${error.message}`
    };
  }
}

async function escalateToSlack(context) {
  try {
    // Use migrated notification service
    const result = await notificationService.sendEscalation(
      context.thread,
      context.sop,
      context.reason || 'Automated escalation - action failed or manual review required'
    );
    
    if (result.success) {
      return {
        outcome: 'success',
        notes: 'Escalated to Slack successfully'
      };
    } else {
      return {
        outcome: 'unconfirmed',
        notes: result.reason || 'Escalation attempted but status unknown'
      };
    }
  } catch (error) {
    return {
      outcome: 'failed',
      notes: `Slack escalation error: ${error.message}`
    };
  }
}

async function sendMessage(context) {
  try {
    // TODO: Integrate with OpenPhone API
    console.log(`Sending message for thread ${context.thread.id}`);
    
    return {
      outcome: 'success',
      notes: 'Message queued for sending'
    };
  } catch (error) {
    return {
      outcome: 'failed',
      notes: `Message send error: ${error.message}`
    };
  }
}

module.exports = { executeAction };