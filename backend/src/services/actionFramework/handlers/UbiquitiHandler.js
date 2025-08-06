/**
 * Ubiquiti Door Access Control Handler
 * Controls door locks via Ubiquiti access control system
 */

const axios = require('axios');
const BaseHandler = require('./BaseHandler');

class UbiquitiHandler extends BaseHandler {
  constructor() {
    super('ubiquiti', {
      timeout: 15000, // Door operations can take time
      retryable: true
    });
    
    // Door mappings for different locations
    this.doors = {
      // Bedford location doors
      'bedford_main': { 
        id: 'door_001', 
        name: 'Bedford Main Entrance',
        building: 'bedford',
        type: 'main_entrance'
      },
      'bedford_bay1': { 
        id: 'door_002', 
        name: 'Bedford Bay 1 Access',
        building: 'bedford',
        type: 'bay_access'
      },
      'bedford_bay2': { 
        id: 'door_003', 
        name: 'Bedford Bay 2 Access',
        building: 'bedford',
        type: 'bay_access'
      },
      'bedford_office': { 
        id: 'door_004', 
        name: 'Bedford Office',
        building: 'bedford',
        type: 'office'
      },
      
      // Dartmouth location doors
      'dartmouth_main': { 
        id: 'door_101', 
        name: 'Dartmouth Main Entrance',
        building: 'dartmouth',
        type: 'main_entrance'
      },
      'dartmouth_bay1': { 
        id: 'door_102', 
        name: 'Dartmouth Bay 1 Access',
        building: 'dartmouth',
        type: 'bay_access'
      },
      'dartmouth_bay2': { 
        id: 'door_103', 
        name: 'Dartmouth Bay 2 Access',
        building: 'dartmouth',
        type: 'bay_access'
      },
      'dartmouth_bay3': { 
        id: 'door_104', 
        name: 'Dartmouth Bay 3 Access',
        building: 'dartmouth',
        type: 'bay_access'
      },
      'dartmouth_bay4': { 
        id: 'door_105', 
        name: 'Dartmouth Bay 4 Access',
        building: 'dartmouth',
        type: 'bay_access'
      },
      'dartmouth_office': { 
        id: 'door_106', 
        name: 'Dartmouth Office',
        building: 'dartmouth',
        type: 'office'
      }
    };
    
    // Default unlock duration (seconds)
    this.defaultUnlockDuration = 10;
  }

  /**
   * Load Ubiquiti credentials
   */
  loadCredentials() {
    return {
      apiUrl: process.env.UBIQUITI_API_URL || 'https://unifi-controller.clubhouse.local:8443',
      username: process.env.UBIQUITI_USERNAME,
      password: process.env.UBIQUITI_PASSWORD,
      siteId: process.env.UBIQUITI_SITE_ID || 'default'
    };
  }

  /**
   * Unlock a door
   */
  async unlockDoor(context) {
    try {
      this.validateContext(context, ['location', 'door_type']);
      
      const doorKey = `${context.location}_${context.door_type}`;
      const door = this.doors[doorKey];
      
      if (!door) {
        throw new Error(`Door not found: ${context.location} ${context.door_type}`);
      }
      
      const duration = context.duration || this.defaultUnlockDuration;
      
      console.log(`Unlocking door: ${door.name} for ${duration} seconds`);
      
      // TODO: Replace with actual Ubiquiti API call
      const unlockResult = await this.performUnlockOperation(door, duration, context);
      
      if (unlockResult.success) {
        return this.handleSuccess('unlockDoor',
          this.createResult('success', `Door unlocked for ${duration} seconds`, {
            door: door.name,
            doorId: door.id,
            action: 'unlock',
            duration: duration,
            unlockTime: new Date().toISOString(),
            autoLockTime: new Date(Date.now() + (duration * 1000)).toISOString(),
            requestedBy: context.requested_by || 'system'
          })
        );
      } else {
        throw new Error(unlockResult.error || 'Unlock operation failed');
      }
      
    } catch (error) {
      return this.handleFailure('unlockDoor', error, context);
    }
  }

  /**
   * Lock a door (immediate)
   */
  async lockDoor(context) {
    try {
      this.validateContext(context, ['location', 'door_type']);
      
      const doorKey = `${context.location}_${context.door_type}`;
      const door = this.doors[doorKey];
      
      if (!door) {
        throw new Error(`Door not found: ${context.location} ${context.door_type}`);
      }
      
      console.log(`Locking door: ${door.name}`);
      
      // Check current status first
      const currentStatus = await this.getDoorStatus(door);
      if (currentStatus === 'locked') {
        return this.handleSuccess('lockDoor',
          this.createResult('success', 'Door already locked', {
            door: door.name,
            doorId: door.id,
            action: 'lock',
            skipped: true,
            status: 'locked'
          })
        );
      }
      
      // TODO: Replace with actual Ubiquiti API call
      const lockResult = await this.performLockOperation(door, context);
      
      if (lockResult.success) {
        return this.handleSuccess('lockDoor',
          this.createResult('success', 'Door locked successfully', {
            door: door.name,
            doorId: door.id,
            action: 'lock',
            lockTime: new Date().toISOString(),
            requestedBy: context.requested_by || 'system'
          })
        );
      } else {
        throw new Error(lockResult.error || 'Lock operation failed');
      }
      
    } catch (error) {
      return this.handleFailure('lockDoor', error, context);
    }
  }

  /**
   * Check door status
   */
  async checkDoorStatus(context) {
    try {
      this.validateContext(context, ['location', 'door_type']);
      
      const doorKey = `${context.location}_${context.door_type}`;
      const door = this.doors[doorKey];
      
      if (!door) {
        throw new Error(`Door not found: ${context.location} ${context.door_type}`);
      }
      
      console.log(`Checking status for door: ${door.name}`);
      
      const status = await this.getDoorStatus(door);
      const lastActivity = await this.getLastDoorActivity(door);
      
      return this.handleSuccess('checkDoorStatus',
        this.createResult('success', `Door status: ${status}`, {
          door: door.name,
          doorId: door.id,
          status: status,
          lastActivity: lastActivity,
          checkedAt: new Date().toISOString()
        })
      );
      
    } catch (error) {
      return this.handleFailure('checkDoorStatus', error, context);
    }
  }

  /**
   * Get all doors status for a location
   */
  async getLocationStatus(context) {
    try {
      this.validateContext(context, ['location']);
      
      const locationDoors = Object.entries(this.doors)
        .filter(([key, door]) => door.building === context.location)
        .map(([key, door]) => ({ key, ...door }));
      
      if (locationDoors.length === 0) {
        throw new Error(`No doors found for location: ${context.location}`);
      }
      
      console.log(`Getting status for all doors at ${context.location}`);
      
      const doorStatuses = await Promise.all(
        locationDoors.map(async (door) => {
          try {
            const status = await this.getDoorStatus(door);
            const lastActivity = await this.getLastDoorActivity(door);
            
            return {
              doorKey: door.key,
              name: door.name,
              doorId: door.id,
              type: door.type,
              status: status,
              lastActivity: lastActivity
            };
          } catch (error) {
            return {
              doorKey: door.key,
              name: door.name,
              doorId: door.id,
              type: door.type,
              status: 'error',
              error: error.message
            };
          }
        })
      );
      
      return this.handleSuccess('getLocationStatus',
        this.createResult('success', `Status retrieved for ${doorStatuses.length} doors`, {
          location: context.location,
          doors: doorStatuses,
          checkedAt: new Date().toISOString()
        })
      );
      
    } catch (error) {
      return this.handleFailure('getLocationStatus', error, context);
    }
  }

  /**
   * Perform unlock operation (placeholder for actual API)
   */
  async performUnlockOperation(door, duration, context) {
    // TODO: Implement actual Ubiquiti UniFi Protect API call
    // This would typically involve:
    // 1. Authenticate with UniFi controller
    // 2. Send unlock command to specific door device
    // 3. Set auto-lock timer
    // 4. Return success/failure status
    
    try {
      const { apiUrl, username, password, siteId } = this.credentials;
      
      if (!username || !password) {
        throw new Error('Ubiquiti credentials not configured');
      }
      
      // Placeholder API call structure
      const apiEndpoint = `${apiUrl}/api/s/${siteId}/cmd/access`;
      const payload = {
        cmd: 'unlock-door',
        door_id: door.id,
        duration: duration,
        requested_by: context.requested_by || 'clubos-v3'
      };
      
      console.log(`[TODO] Would call Ubiquiti API:`, {
        endpoint: apiEndpoint,
        payload: payload
      });
      
      // TODO: Uncomment when ready for real API integration
      /*
      const response = await axios.post(apiEndpoint, payload, {
        auth: {
          username: username,
          password: password
        },
        timeout: this.config.timeout,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false // Self-signed certs common in UniFi
        })
      });
      
      return {
        success: response.data.meta.rc === 'ok',
        error: response.data.meta.rc !== 'ok' ? response.data.meta.msg : null
      };
      */
      
      // Placeholder success response
      return {
        success: true,
        mockResponse: true
      };
      
    } catch (error) {
      console.error('Unlock operation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Perform lock operation (placeholder for actual API)
   */
  async performLockOperation(door, context) {
    // TODO: Implement actual Ubiquiti UniFi Protect API call
    
    try {
      const { apiUrl, username, password, siteId } = this.credentials;
      
      if (!username || !password) {
        throw new Error('Ubiquiti credentials not configured');
      }
      
      // Placeholder API call structure
      const apiEndpoint = `${apiUrl}/api/s/${siteId}/cmd/access`;
      const payload = {
        cmd: 'lock-door',
        door_id: door.id,
        requested_by: context.requested_by || 'clubos-v3'
      };
      
      console.log(`[TODO] Would call Ubiquiti API:`, {
        endpoint: apiEndpoint,
        payload: payload
      });
      
      // Placeholder success response
      return {
        success: true,
        mockResponse: true
      };
      
    } catch (error) {
      console.error('Lock operation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get door status (placeholder for actual API)
   */
  async getDoorStatus(door) {
    // TODO: Implement actual Ubiquiti API call to get door status
    
    try {
      const { apiUrl, username, password, siteId } = this.credentials;
      
      console.log(`[TODO] Would check door status for ${door.name} (${door.id})`);
      
      // TODO: Uncomment when ready for real API integration
      /*
      const response = await axios.get(
        `${apiUrl}/api/s/${siteId}/stat/door/${door.id}`,
        {
          auth: {
            username: username,
            password: password
          },
          timeout: this.config.timeout
        }
      );
      
      return response.data.data[0]?.state || 'unknown';
      */
      
      // Placeholder response - assume doors are locked by default
      return 'locked';
      
    } catch (error) {
      console.error('Failed to get door status:', error.message);
      return 'unknown';
    }
  }

  /**
   * Get last door activity (placeholder for actual API)
   */
  async getLastDoorActivity(door) {
    // TODO: Implement actual Ubiquiti API call to get last activity
    
    try {
      console.log(`[TODO] Would get last activity for ${door.name} (${door.id})`);
      
      // Placeholder response
      return {
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        action: 'locked',
        triggered_by: 'auto_timer'
      };
      
    } catch (error) {
      console.error('Failed to get door activity:', error.message);
      return null;
    }
  }

  /**
   * Health check - verify connection to Ubiquiti controller
   */
  async checkHealth() {
    try {
      const { apiUrl, username, password } = this.credentials;
      
      if (!username || !password) {
        return {
          healthy: false,
          message: 'Ubiquiti credentials not configured'
        };
      }
      
      // TODO: Implement actual health check API call
      console.log(`[TODO] Would check health of Ubiquiti controller at ${apiUrl}`);
      
      // TODO: Uncomment when ready for real API integration
      /*
      const response = await axios.get(`${apiUrl}/api/self`, {
        auth: {
          username: username,
          password: password
        },
        timeout: 5000
      });
      
      return {
        healthy: response.status === 200,
        message: response.status === 200 ? 'Ubiquiti controller accessible' : 'Controller not responding'
      };
      */
      
      // Placeholder health response
      return {
        healthy: true,
        message: 'Ubiquiti handler operational (mock mode)',
        mockMode: true
      };
      
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`
      };
    }
  }

  /**
   * Get door information
   */
  getDoorInfo(location, doorType) {
    const doorKey = `${location}_${doorType}`;
    return this.doors[doorKey] || null;
  }

  /**
   * List all available doors
   */
  listDoors(location = null) {
    if (location) {
      return Object.entries(this.doors)
        .filter(([key, door]) => door.building === location)
        .map(([key, door]) => ({ key, ...door }));
    }
    
    return Object.entries(this.doors)
      .map(([key, door]) => ({ key, ...door }));
  }
}

module.exports = UbiquitiHandler;