/**
 * NinjaOne Handler
 * Controls PCs and TrackMan systems via NinjaOne RMM API
 */

const axios = require('axios');
const BaseHandler = require('./BaseHandler');

class NinjaOneHandler extends BaseHandler {
  constructor() {
    super('ninjaone', {
      timeout: 30000, // PC operations can take time
      retryable: true
    });
    
    // Device mappings
    this.devices = {
      'bedford_bay1': { id: process.env.NINJAONE_BEDFORD_BAY1_ID || 'BEDFORD-BAY1-PC', name: 'Bedford Bay 1 PC' },
      'bedford_bay2': { id: process.env.NINJAONE_BEDFORD_BAY2_ID || 'BEDFORD-BAY2-PC', name: 'Bedford Bay 2 PC' },
      'dartmouth_bay1': { id: process.env.NINJAONE_DARTMOUTH_BAY1_ID || 'DART-BAY1-PC', name: 'Dartmouth Bay 1 PC' },
      'dartmouth_bay2': { id: process.env.NINJAONE_DARTMOUTH_BAY2_ID || 'DART-BAY2-PC', name: 'Dartmouth Bay 2 PC' },
      'dartmouth_bay3': { id: process.env.NINJAONE_DARTMOUTH_BAY3_ID || 'DART-BAY3-PC', name: 'Dartmouth Bay 3 PC' },
      'dartmouth_bay4': { id: process.env.NINJAONE_DARTMOUTH_BAY4_ID || 'DART-BAY4-PC', name: 'Dartmouth Bay 4 PC' }
    };
    
    // Script IDs for common operations
    this.scripts = {
      RESTART_TRACKMAN: process.env.NINJAONE_SCRIPT_RESTART_TRACKMAN || 'restart-trackman-v2',
      REBOOT_PC: process.env.NINJAONE_SCRIPT_REBOOT || 'reboot-graceful',
      WAKE_PC: process.env.NINJAONE_SCRIPT_WAKE || 'wake-on-lan',
      LOCK_PC: process.env.NINJAONE_SCRIPT_LOCK || 'lock-workstation',
      KILL_TRACKMAN: process.env.NINJAONE_SCRIPT_KILL_TRACKMAN || 'kill-trackman-process',
      CHECK_TRACKMAN: process.env.NINJAONE_SCRIPT_CHECK_TRACKMAN || 'check-trackman-status'
    };
    
    // Initialize API client
    this.initializeClient();
  }

  /**
   * Load NinjaOne credentials
   */
  loadCredentials() {
    return {
      clientId: process.env.NINJAONE_CLIENT_ID,
      clientSecret: process.env.NINJAONE_CLIENT_SECRET,
      baseUrl: process.env.NINJAONE_API_URL || 'https://api.ninjarmm.com/v2',
      organizationId: process.env.NINJAONE_ORG_ID
    };
  }

  /**
   * Initialize API client with OAuth
   */
  async initializeClient() {
    if (!this.credentials.clientId || !this.credentials.clientSecret) {
      console.warn('NinjaOne credentials not configured');
      return;
    }
    
    try {
      // Get OAuth token
      const tokenResponse = await axios.post(
        `${this.credentials.baseUrl}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
          scope: 'monitoring management'
        }
      );
      
      this.accessToken = tokenResponse.data.access_token;
      this.tokenExpiry = Date.now() + (tokenResponse.data.expires_in * 1000);
      
      // Create authenticated client
      this.client = axios.create({
        baseURL: this.credentials.baseUrl,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      });
      
    } catch (error) {
      console.error('Failed to initialize NinjaOne client:', error.message);
    }
  }

  /**
   * Ensure valid token
   */
  async ensureValidToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
      await this.initializeClient();
    }
  }

  /**
   * Reset TrackMan
   */
  async resetTrackMan(context) {
    try {
      this.validateContext(context, ['bay_id', 'location']);
      
      const deviceKey = `${context.location}_${context.bay_id}`;
      const device = this.devices[deviceKey];
      
      if (!device) {
        throw new Error(`Device not found for ${context.location} ${context.bay_id}`);
      }
      
      console.log(`Resetting TrackMan on ${device.name}`);
      
      // Ensure valid token
      await this.ensureValidToken();
      
      // First check if TrackMan is running
      const statusResult = await this.runScript(device.id, this.scripts.CHECK_TRACKMAN);
      
      // Kill TrackMan process
      await this.runScript(device.id, this.scripts.KILL_TRACKMAN);
      
      // Wait for process to terminate
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Restart TrackMan
      const result = await this.runScript(device.id, this.scripts.RESTART_TRACKMAN);
      
      // Wait for TrackMan to initialize
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify TrackMan is running
      const verifyResult = await this.runScript(device.id, this.scripts.CHECK_TRACKMAN);
      
      if (verifyResult.success) {
        return this.handleSuccess('resetTrackMan',
          this.createResult('success', 'TrackMan reset successfully', {
            device: device.name,
            action: 'reset_trackman',
            jobId: result.jobId,
            initializationTime: '5 seconds'
          })
        );
      } else {
        throw new Error('TrackMan failed to restart properly');
      }
      
    } catch (error) {
      return this.handleFailure('resetTrackMan', error, context);
    }
  }

  /**
   * Reboot PC
   */
  async rebootPC(context) {
    try {
      this.validateContext(context, ['bay_id', 'location']);
      
      const deviceKey = `${context.location}_${context.bay_id}`;
      const device = this.devices[deviceKey];
      
      if (!device) {
        throw new Error(`Device not found for ${context.location} ${context.bay_id}`);
      }
      
      console.log(`Rebooting PC: ${device.name}`);
      
      await this.ensureValidToken();
      
      // Initiate graceful reboot
      const result = await this.runScript(device.id, this.scripts.REBOOT_PC, {
        timeout: 60, // Give 60 seconds for graceful shutdown
        force: false
      });
      
      return this.handleSuccess('rebootPC',
        this.createResult('success', 'PC reboot initiated', {
          device: device.name,
          action: 'reboot_pc',
          jobId: result.jobId,
          estimatedTime: '3-5 minutes'
        })
      );
      
    } catch (error) {
      return this.handleFailure('rebootPC', error, context);
    }
  }

  /**
   * Wake PC
   */
  async wakePC(context) {
    try {
      this.validateContext(context, ['bay_id', 'location']);
      
      const deviceKey = `${context.location}_${context.bay_id}`;
      const device = this.devices[deviceKey];
      
      if (!device) {
        throw new Error(`Device not found for ${context.location} ${context.bay_id}`);
      }
      
      console.log(`Waking PC: ${device.name}`);
      
      await this.ensureValidToken();
      
      // Check if already online
      const status = await this.getDeviceStatus(device.id);
      if (status.online) {
        return this.handleSuccess('wakePC',
          this.createResult('success', 'PC already online', {
            device: device.name,
            action: 'wake_pc',
            skipped: true
          })
        );
      }
      
      // Send Wake-on-LAN
      const result = await this.runScript(device.id, this.scripts.WAKE_PC);
      
      // Wait for PC to boot
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Verify PC is online
      const newStatus = await this.getDeviceStatus(device.id);
      
      if (newStatus.online) {
        return this.handleSuccess('wakePC',
          this.createResult('success', 'PC woken successfully', {
            device: device.name,
            action: 'wake_pc',
            jobId: result.jobId,
            bootTime: '30 seconds'
          })
        );
      } else {
        return this.handleSuccess('wakePC',
          this.createResult('partial', 'Wake command sent but PC not yet online', {
            device: device.name,
            action: 'wake_pc',
            jobId: result.jobId
          })
        );
      }
      
    } catch (error) {
      return this.handleFailure('wakePC', error, context);
    }
  }

  /**
   * Lock PC
   */
  async lockPC(context) {
    try {
      this.validateContext(context, ['bay_id', 'location']);
      
      const deviceKey = `${context.location}_${context.bay_id}`;
      const device = this.devices[deviceKey];
      
      if (!device) {
        throw new Error(`Device not found for ${context.location} ${context.bay_id}`);
      }
      
      console.log(`Locking PC: ${device.name}`);
      
      await this.ensureValidToken();
      
      // Lock workstation
      const result = await this.runScript(device.id, this.scripts.LOCK_PC);
      
      return this.handleSuccess('lockPC',
        this.createResult('success', 'PC locked', {
          device: device.name,
          action: 'lock_pc',
          jobId: result.jobId
        })
      );
      
    } catch (error) {
      return this.handleFailure('lockPC', error, context);
    }
  }

  /**
   * Run script on device
   */
  async runScript(deviceId, scriptId, parameters = {}) {
    if (!this.client) {
      throw new Error('NinjaOne client not initialized');
    }
    
    try {
      const response = await this.client.post(
        `/devices/${deviceId}/scripts/${scriptId}/run`,
        {
          parameters
        }
      );
      
      return {
        success: true,
        jobId: response.data.jobId,
        status: response.data.status
      };
      
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Device or script not found: ${deviceId}/${scriptId}`);
      }
      throw error;
    }
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId) {
    if (!this.client) {
      return { online: false, lastSeen: null };
    }
    
    try {
      const response = await this.client.get(`/devices/${deviceId}`);
      
      return {
        online: response.data.online || false,
        lastSeen: response.data.lastSeenTime,
        osVersion: response.data.osVersion,
        agentVersion: response.data.agentVersion
      };
      
    } catch (error) {
      console.error(`Failed to get device status: ${error.message}`);
      return { online: false, lastSeen: null };
    }
  }

  /**
   * Check handler health
   */
  async checkHealth() {
    try {
      await this.ensureValidToken();
      
      if (!this.client) {
        return {
          healthy: false,
          message: 'NinjaOne client not initialized'
        };
      }
      
      // Try to get organization info
      const response = await this.client.get('/organizations');
      
      return {
        healthy: true,
        message: 'NinjaOne handler operational',
        organizations: response.data.length
      };
      
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`
      };
    }
  }

  /**
   * Get device info
   */
  async getDeviceInfo(context) {
    try {
      this.validateContext(context, ['bay_id', 'location']);
      
      const deviceKey = `${context.location}_${context.bay_id}`;
      const device = this.devices[deviceKey];
      
      if (!device) {
        throw new Error(`Device not found for ${context.location} ${context.bay_id}`);
      }
      
      await this.ensureValidToken();
      
      const [status, activities] = await Promise.all([
        this.getDeviceStatus(device.id),
        this.getRecentActivities(device.id).catch(() => [])
      ]);
      
      return this.handleSuccess('getDeviceInfo',
        this.createResult('success', 'Device info retrieved', {
          device: device.name,
          ...status,
          recentActivities: activities
        })
      );
      
    } catch (error) {
      return this.handleFailure('getDeviceInfo', error, context);
    }
  }

  /**
   * Get recent activities for device
   */
  async getRecentActivities(deviceId) {
    if (!this.client) return [];
    
    try {
      const response = await this.client.get(
        `/devices/${deviceId}/activities`,
        {
          params: {
            limit: 5,
            sort: 'timestamp:desc'
          }
        }
      );
      
      return response.data.map(activity => ({
        type: activity.type,
        timestamp: activity.timestamp,
        description: activity.description
      }));
      
    } catch (error) {
      console.error(`Failed to get activities: ${error.message}`);
      return [];
    }
  }
}

module.exports = NinjaOneHandler;