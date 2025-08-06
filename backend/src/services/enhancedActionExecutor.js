const axios = require('axios');
const { executeResetTrackman, executeUnlockDoor } = require('./remoteActions');
const { validateCustomerAction } = require('./booking');
const notificationService = require('./notifications');
const recursiveLearning = require('./recursiveLearning');
const fixRegistry = require('./fixRegistry');
const logger = require('../utils/logger');

// Action execution handlers
const actionHandlers = {
  reset_trackman: resetTrackMan,
  unlock_door: unlockDoor,
  escalate: escalateToSlack,
  send_message: sendMessage
};

/**
 * Enhanced action executor with recursive learning
 */
async function executeAction(actionType, context) {
  const startTime = Date.now();
  
  try {
    // Check if we have a handler for this action
    const handler = actionHandlers[actionType];
    if (!handler) {
      const error = new Error(`Unknown action type: ${actionType}`);
      error.code = 'UNKNOWN_ACTION';
      throw error;
    }
    
    const { timeout_seconds = 30, max_retries = 2 } = context.sop || {};
    let lastError = null;
    let attempt = 0;
    
    // Check for known fixes before execution
    const preemptiveFix = await recursiveLearning.findSimilarFix(
      { type: 'ActionExecution', code: actionType },
      {
        action: actionType,
        module: 'actions',
        endpoint: context.endpoint,
        customerId: context.customerId
      }
    );
    
    if (preemptiveFix) {
      logger.info('Applying preemptive fix for action', {
        actionType,
        fixClass: preemptiveFix.fix_class
      });
      
      // Apply fix configuration
      const fixConfig = await fixRegistry.applyFix(preemptiveFix, context);
      
      // Merge fix configuration with context
      if (fixConfig.timeout) {
        context.timeout_override = fixConfig.timeout;
      }
      if (fixConfig.retryCount) {
        context.max_retries_override = fixConfig.retryCount;
      }
    }
    
    // Use overrides if available
    const effectiveTimeout = context.timeout_override || timeout_seconds;
    const effectiveRetries = context.max_retries_override || max_retries;
    
    // Retry logic with learning
    while (attempt <= effectiveRetries) {
      try {
        // Execute with timeout
        const result = await executeWithTimeout(
          handler(context), 
          effectiveTimeout * 1000
        );
        
        // Validate outcome
        if (!['success', 'partial', 'failed', 'unconfirmed'].includes(result.outcome)) {
          result.outcome = 'unconfirmed';
        }
        
        // Record successful execution
        if (result.outcome === 'success' && preemptiveFix) {
          await recursiveLearning.updatePatternOutcome(
            preemptiveFix.originalPattern,
            null,
            true
          );
        }
        
        // Add execution metadata
        result.executionTime = Date.now() - startTime;
        result.attempts = attempt + 1;
        
        return result;
        
      } catch (error) {
        lastError = error;
        attempt++;
        
        // Capture error for learning
        const captureResult = await recursiveLearning.captureError(
          {
            type: error.name || 'ActionExecutionError',
            code: error.code || actionType,
            message: error.message,
            stack: error.stack
          },
          {
            action: actionType,
            attempt,
            module: 'actions',
            customerId: context.customerId,
            threadId: context.threadId,
            timeout: effectiveTimeout,
            retries: effectiveRetries
          }
        );
        
        // Check if we got a fix suggestion
        if (captureResult.hasFix && !captureResult.suppressed) {
          try {
            const fixResult = await fixRegistry.applyFix(
              captureResult.fix,
              { ...context, error, attempt }
            );
            
            if (fixResult.retry) {
              // Fix suggests retry with modifications
              logger.info('Applying fix and retrying', {
                actionType,
                fixClass: captureResult.fix.fix_class
              });
              
              // Apply fix modifications
              if (fixResult.backoffMs) {
                await new Promise(resolve => setTimeout(resolve, fixResult.backoffMs));
              }
              
              continue; // Retry with fix applied
            }
          } catch (fixError) {
            logger.error('Failed to apply fix during action execution', fixError);
          }
        }
        
        // Handle specific error types
        if (error.message === 'Operation timeout') {
          logger.warn(`Attempt ${attempt} timed out for ${actionType}`, {
            timeout: effectiveTimeout,
            attempt
          });
          
          if (attempt > effectiveRetries) {
            return {
              outcome: 'failed',
              notes: `Action timed out after ${effectiveTimeout}s (${attempt} attempts)`,
              error: 'TIMEOUT',
              executionTime: Date.now() - startTime
            };
          }
          
          // Exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          
        } else if (error.response?.status === 429) {
          // Rate limit error
          const retryAfter = error.response.headers['retry-after'] || 60;
          
          if (attempt > effectiveRetries) {
            return {
              outcome: 'failed',
              notes: `Rate limited after ${attempt} attempts`,
              error: 'RATE_LIMIT',
              retryAfter,
              executionTime: Date.now() - startTime
            };
          }
          
          await new Promise(resolve => 
            setTimeout(resolve, retryAfter * 1000)
          );
          
        } else {
          // Other errors - shorter backoff
          if (attempt <= effectiveRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
    }
    
    // All retries exhausted
    const finalError = lastError || new Error('Unknown failure');
    
    // Capture the final failure pattern
    await recursiveLearning.captureFix(
      lastError.errorId || null,
      {
        implementation: 'increase_retries_or_timeout',
        parameters: {
          suggestedRetries: effectiveRetries + 1,
          suggestedTimeout: effectiveTimeout * 1.5
        }
      },
      {
        type: 'retry',
        reusability: 'conditional',
        module: 'actions',
        symptom: `Action ${actionType} failed after ${attempt} attempts`,
        requiresAnalysis: attempt > 3
      }
    );
    
    return {
      outcome: 'failed',
      notes: finalError.message,
      error: finalError.code || 'UNKNOWN',
      attempts: attempt,
      executionTime: Date.now() - startTime
    };
    
  } catch (error) {
    // Unexpected error in the executor itself
    logger.error('Unexpected error in action executor', error);
    
    return {
      outcome: 'failed',
      notes: `Executor error: ${error.message}`,
      error: 'EXECUTOR_ERROR',
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Execute with timeout
 */
function executeWithTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ]);
}

/**
 * Action handler implementations with learning hooks
 */
async function resetTrackMan(context) {
  const { customerId, bayNumber, reason } = context;
  
  try {
    // Validate customer can perform action
    const validation = await validateCustomerAction(customerId, 'reset_trackman');
    if (!validation.allowed) {
      return {
        outcome: 'failed',
        notes: validation.reason || 'Customer not authorized'
      };
    }
    
    // Execute reset
    const result = await executeResetTrackman(bayNumber, reason);
    
    if (result.success) {
      // Notify success
      await notificationService.sendOperatorNotification({
        type: 'action_success',
        action: 'reset_trackman',
        bay: bayNumber,
        customerId
      });
      
      return {
        outcome: 'success',
        notes: 'TrackMan reset successfully',
        details: result
      };
    } else {
      throw new Error(result.error || 'Reset failed');
    }
    
  } catch (error) {
    // Check if this is a known issue
    if (error.message.includes('Device offline')) {
      // Capture this pattern
      await recursiveLearning.captureFix(
        null,
        {
          implementation: 'check_device_status_first',
          parameters: {
            preCheckEndpoint: '/api/devices/status',
            fallbackAction: 'notify_technician'
          }
        },
        {
          type: 'validation',
          reusability: 'universal',
          module: 'actions',
          symptom: 'Device offline during reset attempt'
        }
      );
    }
    
    throw error;
  }
}

async function unlockDoor(context) {
  const { customerId, facilityId, doorId } = context;
  
  try {
    // Validate customer
    const validation = await validateCustomerAction(customerId, 'unlock_door');
    if (!validation.allowed) {
      return {
        outcome: 'failed',
        notes: validation.reason || 'Customer not authorized'
      };
    }
    
    // Execute unlock
    const result = await executeUnlockDoor(facilityId, doorId);
    
    if (result.success) {
      return {
        outcome: 'success',
        notes: 'Door unlocked successfully',
        details: result
      };
    } else {
      throw new Error(result.error || 'Unlock failed');
    }
    
  } catch (error) {
    throw error;
  }
}

async function escalateToSlack(context) {
  const { threadId, reason, urgency = 'normal' } = context;
  
  try {
    const result = await notificationService.escalateToSlack({
      threadId,
      reason,
      urgency,
      context
    });
    
    return {
      outcome: result.success ? 'success' : 'failed',
      notes: result.message || 'Escalation sent',
      details: result
    };
    
  } catch (error) {
    // Capture Slack-specific errors
    if (error.code === 'SLACK_WEBHOOK_ERROR') {
      await recursiveLearning.captureFix(
        null,
        {
          implementation: 'fallback_notification',
          parameters: {
            fallbackMethod: 'email',
            fallbackRecipients: ['ops@clubhouse.com']
          }
        },
        {
          type: 'fallback',
          reusability: 'universal',
          module: 'notifications',
          symptom: 'Slack webhook failure'
        }
      );
    }
    
    throw error;
  }
}

async function sendMessage(context) {
  const { recipientId, message, channel = 'sms' } = context;
  
  try {
    const result = await notificationService.sendMessage({
      recipientId,
      message,
      channel
    });
    
    return {
      outcome: result.success ? 'success' : 'failed',
      notes: result.message || 'Message sent',
      details: result
    };
    
  } catch (error) {
    throw error;
  }
}

module.exports = {
  executeAction,
  actionHandlers
};