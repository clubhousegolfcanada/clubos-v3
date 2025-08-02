/**
 * Remote Actions Service
 * Migrated from V1 - Handles device control actions
 */

const axios = require('axios');
const { pool } = require('../db/pool');

// Device mapping - Update with real device IDs when available
const DEVICE_MAP = {
  'bedford': {
    'bay-1': { deviceId: 'BEDFORD-BAY1-PC', name: 'Bedford Bay 1' },
    'bay-2': { deviceId: 'BEDFORD-BAY2-PC', name: 'Bedford Bay 2' }
  },
  'dartmouth': {
    'bay-1': { deviceId: 'DART-BAY1-PC', name: 'Dartmouth Bay 1' },
    'bay-2': { deviceId: 'DART-BAY2-PC', name: 'Dartmouth Bay 2' },
    'bay-3': { deviceId: 'DART-BAY3-PC', name: 'Dartmouth Bay 3' },
    'bay-4': { deviceId: 'DART-BAY4-PC', name: 'Dartmouth Bay 4' }
  }
};

/**
 * Execute TrackMan reset
 * @param {string} bay_id - Bay identifier (e.g., 'bay-1')
 * @param {string} location - Location name
 * @returns {Object} Action result
 */
async function executeResetTrackman(bay_id, location = 'bedford') {
  try {
    const locationDevices = DEVICE_MAP[location.toLowerCase()];
    if (!locationDevices || !locationDevices[bay_id]) {
      return {
        success: false,
        outcome: 'failed',
        notes: `Device not found for ${location} ${bay_id}`
      };
    }
    
    const device = locationDevices[bay_id];
    
    // Check if NinjaOne is configured
    if (!process.env.NINJAONE_CLIENT_ID || process.env.NINJAONE_CLIENT_ID === 'demo_client_id') {
      // Demo mode
      console.log(`[DEMO] Would reset TrackMan on ${device.name}`);
      
      // Simulate success with some randomness
      const success = Math.random() > 0.1;
      
      return {
        success,
        outcome: success ? 'success' : 'failed',
        notes: success ? 
          `TrackMan reset initiated on ${device.name}` : 
          `Failed to reset TrackMan on ${device.name} - Device not responding`,
        deviceName: device.name,
        simulated: true
      };
    }
    
    // Production mode - Call NinjaOne API
    try {
      // TODO: Implement actual NinjaOne API call
      const response = await callNinjaOneAPI('run-script', {
        deviceId: device.deviceId,
        scriptId: 'RESTART-TRACKMAN',
        parameters: {}
      });
      
      return {
        success: true,
        outcome: 'success',
        notes: `TrackMan reset initiated on ${device.name}`,
        deviceName: device.name,
        jobId: response.jobId
      };
    } catch (error) {
      return {
        success: false,
        outcome: 'failed',
        notes: `Failed to reset TrackMan: ${error.message}`,
        deviceName: device.name
      };
    }
  } catch (error) {
    console.error('TrackMan reset error:', error);
    return {
      success: false,
      outcome: 'failed',
      notes: `System error: ${error.message}`
    };
  }
}

/**
 * Execute door unlock
 * @param {string} bay_id - Bay identifier
 * @param {string} location - Location name
 * @returns {Object} Action result
 */
async function executeUnlockDoor(bay_id, location = 'bedford') {
  try {
    // Check if Ubiquiti is configured
    if (!process.env.UBIQUITI_API_KEY) {
      // Demo mode
      console.log(`[DEMO] Would unlock door for ${location} ${bay_id}`);
      
      return {
        success: true,
        outcome: 'success',
        notes: `Door unlocked for ${location} ${bay_id}`,
        duration: '10 minutes',
        simulated: true
      };
    }
    
    // Production mode - Call Ubiquiti API
    try {
      // TODO: Implement actual Ubiquiti UniFi Access API call
      const response = await callUbiquitiAPI('unlock', {
        location: location,
        door: 'main-entrance',
        duration: 600 // 10 minutes
      });
      
      return {
        success: true,
        outcome: 'success',
        notes: `Door unlocked for ${location}`,
        duration: '10 minutes'
      };
    } catch (error) {
      return {
        success: false,
        outcome: 'failed',
        notes: `Failed to unlock door: ${error.message}`
      };
    }
  } catch (error) {
    console.error('Door unlock error:', error);
    return {
      success: false,
      outcome: 'failed',
      notes: `System error: ${error.message}`
    };
  }
}

/**
 * Execute PC reboot
 * @param {string} bay_id - Bay identifier
 * @param {string} location - Location name
 * @returns {Object} Action result
 */
async function executeRebootPC(bay_id, location = 'bedford') {
  try {
    const locationDevices = DEVICE_MAP[location.toLowerCase()];
    if (!locationDevices || !locationDevices[bay_id]) {
      return {
        success: false,
        outcome: 'failed',
        notes: `Device not found for ${location} ${bay_id}`
      };
    }
    
    const device = locationDevices[bay_id];
    
    if (!process.env.NINJAONE_CLIENT_ID || process.env.NINJAONE_CLIENT_ID === 'demo_client_id') {
      console.log(`[DEMO] Would reboot PC ${device.name}`);
      
      return {
        success: true,
        outcome: 'success',
        notes: `PC reboot initiated on ${device.name}. Estimated time: 3-5 minutes`,
        deviceName: device.name,
        estimatedTime: '3-5 minutes',
        simulated: true
      };
    }
    
    // Production mode
    try {
      const response = await callNinjaOneAPI('run-script', {
        deviceId: device.deviceId,
        scriptId: 'REBOOT-PC',
        parameters: { graceful: true }
      });
      
      return {
        success: true,
        outcome: 'success',
        notes: `PC reboot initiated on ${device.name}`,
        deviceName: device.name,
        jobId: response.jobId,
        estimatedTime: '3-5 minutes'
      };
    } catch (error) {
      return {
        success: false,
        outcome: 'failed',
        notes: `Failed to reboot PC: ${error.message}`,
        deviceName: device.name
      };
    }
  } catch (error) {
    console.error('PC reboot error:', error);
    return {
      success: false,
      outcome: 'failed',
      notes: `System error: ${error.message}`
    };
  }
}

/**
 * Helper function to call NinjaOne API (placeholder)
 */
async function callNinjaOneAPI(action, params) {
  // TODO: Implement actual NinjaOne API integration
  throw new Error('NinjaOne API not yet implemented');
}

/**
 * Helper function to call Ubiquiti API (placeholder)
 */
async function callUbiquitiAPI(action, params) {
  // TODO: Implement actual Ubiquiti API integration
  throw new Error('Ubiquiti API not yet implemented');
}

module.exports = {
  executeResetTrackman,
  executeUnlockDoor,
  executeRebootPC,
  DEVICE_MAP
};