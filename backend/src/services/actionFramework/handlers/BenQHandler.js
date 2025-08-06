/**
 * BenQ Projector Handler
 * Controls BenQ projectors via network API
 */

const axios = require('axios');
const BaseHandler = require('./BaseHandler');

class BenQHandler extends BaseHandler {
  constructor() {
    super('benq', {
      timeout: 10000, // Projectors can be slow to respond
      retryable: true
    });
    
    // BenQ projector mappings
    this.projectors = {
      'bedford_bay1': { ip: process.env.BENQ_BEDFORD_BAY1_IP || '192.168.1.101', name: 'Bedford Bay 1' },
      'bedford_bay2': { ip: process.env.BENQ_BEDFORD_BAY2_IP || '192.168.1.102', name: 'Bedford Bay 2' },
      'dartmouth_bay1': { ip: process.env.BENQ_DARTMOUTH_BAY1_IP || '192.168.2.101', name: 'Dartmouth Bay 1' },
      'dartmouth_bay2': { ip: process.env.BENQ_DARTMOUTH_BAY2_IP || '192.168.2.102', name: 'Dartmouth Bay 2' },
      'dartmouth_bay3': { ip: process.env.BENQ_DARTMOUTH_BAY3_IP || '192.168.2.103', name: 'Dartmouth Bay 3' },
      'dartmouth_bay4': { ip: process.env.BENQ_DARTMOUTH_BAY4_IP || '192.168.2.104', name: 'Dartmouth Bay 4' }
    };
    
    // BenQ API commands
    this.commands = {
      POWER_ON: '*pow=on#',
      POWER_OFF: '*pow=off#',
      POWER_STATUS: '*pow=?#',
      INPUT_HDMI1: '*sour=hdmi#',
      INPUT_HDMI2: '*sour=hdmi2#',
      INPUT_VGA: '*sour=rgb#',
      INPUT_STATUS: '*sour=?#',
      LAMP_HOURS: '*ltim=?#',
      MODEL_INFO: '*modelname=?#'
    };
  }

  /**
   * Load BenQ credentials
   */
  loadCredentials() {
    return {
      port: process.env.BENQ_API_PORT || 4661, // PJLink port
      password: process.env.BENQ_PASSWORD || ''
    };
  }

  /**
   * Power on projector
   */
  async powerOn(context) {
    try {
      this.validateContext(context, ['bay_id', 'location']);
      
      const projectorKey = `${context.location}_${context.bay_id}`;
      const projector = this.projectors[projectorKey];
      
      if (!projector) {
        throw new Error(`Projector not found for ${context.location} ${context.bay_id}`);
      }
      
      console.log(`Powering on projector: ${projector.name}`);
      
      // Check if already on
      const status = await this.getPowerStatus(projector);
      if (status === 'on') {
        return this.handleSuccess('powerOn', 
          this.createResult('success', 'Projector already on', {
            projector: projector.name,
            action: 'power_on',
            skipped: true
          })
        );
      }
      
      // Send power on command
      const response = await this.sendCommand(projector, this.commands.POWER_ON);
      
      // Wait for projector to warm up
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify power state
      const newStatus = await this.getPowerStatus(projector);
      
      if (newStatus === 'on') {
        return this.handleSuccess('powerOn',
          this.createResult('success', 'Projector powered on successfully', {
            projector: projector.name,
            action: 'power_on',
            warmupTime: '3 seconds'
          })
        );
      } else {
        throw new Error('Projector failed to power on');
      }
      
    } catch (error) {
      return this.handleFailure('powerOn', error, context);
    }
  }

  /**
   * Power off projector
   */
  async powerOff(context) {
    try {
      this.validateContext(context, ['bay_id', 'location']);
      
      const projectorKey = `${context.location}_${context.bay_id}`;
      const projector = this.projectors[projectorKey];
      
      if (!projector) {
        throw new Error(`Projector not found for ${context.location} ${context.bay_id}`);
      }
      
      console.log(`Powering off projector: ${projector.name}`);
      
      // Check if already off
      const status = await this.getPowerStatus(projector);
      if (status === 'off') {
        return this.handleSuccess('powerOff',
          this.createResult('success', 'Projector already off', {
            projector: projector.name,
            action: 'power_off',
            skipped: true
          })
        );
      }
      
      // Send power off command (usually needs to be sent twice)
      await this.sendCommand(projector, this.commands.POWER_OFF);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.sendCommand(projector, this.commands.POWER_OFF);
      
      return this.handleSuccess('powerOff',
        this.createResult('success', 'Projector powering off', {
          projector: projector.name,
          action: 'power_off',
          cooldownTime: '90 seconds'
        })
      );
      
    } catch (error) {
      return this.handleFailure('powerOff', error, context);
    }
  }

  /**
   * Change projector input
   */
  async changeInput(context) {
    try {
      this.validateContext(context, ['bay_id', 'location', 'input']);
      
      const projectorKey = `${context.location}_${context.bay_id}`;
      const projector = this.projectors[projectorKey];
      
      if (!projector) {
        throw new Error(`Projector not found for ${context.location} ${context.bay_id}`);
      }
      
      // Map input names to commands
      const inputCommands = {
        'hdmi': this.commands.INPUT_HDMI1,
        'hdmi1': this.commands.INPUT_HDMI1,
        'hdmi2': this.commands.INPUT_HDMI2,
        'vga': this.commands.INPUT_VGA
      };
      
      const command = inputCommands[context.input.toLowerCase()];
      if (!command) {
        throw new Error(`Invalid input: ${context.input}. Valid inputs: hdmi, hdmi2, vga`);
      }
      
      console.log(`Changing projector input to ${context.input}: ${projector.name}`);
      
      // Send input change command
      await this.sendCommand(projector, command);
      
      // Wait for input to switch
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return this.handleSuccess('changeInput',
        this.createResult('success', `Input changed to ${context.input}`, {
          projector: projector.name,
          action: 'change_input',
          input: context.input
        })
      );
      
    } catch (error) {
      return this.handleFailure('changeInput', error, context);
    }
  }

  /**
   * Get projector power status
   */
  async getPowerStatus(projector) {
    try {
      const response = await this.sendCommand(projector, this.commands.POWER_STATUS);
      
      // Parse response (format: *POW=ON# or *POW=OFF#)
      if (response.includes('ON')) return 'on';
      if (response.includes('OFF')) return 'off';
      
      return 'unknown';
    } catch (error) {
      console.error(`Failed to get power status for ${projector.name}:`, error.message);
      return 'unknown';
    }
  }

  /**
   * Send command to projector
   */
  async sendCommand(projector, command) {
    const url = `http://${projector.ip}:${this.credentials.port}/cgi-bin/pjcontrol.cgi`;
    
    try {
      // BenQ projectors use PJLink protocol over HTTP
      const response = await axios.post(url, command, {
        headers: {
          'Content-Type': 'text/plain'
        },
        auth: this.credentials.password ? {
          username: 'admin',
          password: this.credentials.password
        } : undefined,
        timeout: this.config.timeout
      });
      
      return response.data;
      
    } catch (error) {
      // If HTTP fails, try raw TCP socket (some models)
      if (error.code === 'ECONNREFUSED') {
        return this.sendCommandTCP(projector, command);
      }
      throw error;
    }
  }

  /**
   * Send command via TCP socket (fallback)
   */
  async sendCommandTCP(projector, command) {
    const net = require('net');
    
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let response = '';
      
      client.setTimeout(this.config.timeout);
      
      client.connect(this.credentials.port, projector.ip, () => {
        client.write(command);
      });
      
      client.on('data', (data) => {
        response += data.toString();
      });
      
      client.on('close', () => {
        resolve(response);
      });
      
      client.on('error', (error) => {
        reject(error);
      });
      
      client.on('timeout', () => {
        client.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  /**
   * Check projector health
   */
  async checkHealth() {
    try {
      // Try to get status from first available projector
      const firstProjector = Object.values(this.projectors)[0];
      const status = await this.getPowerStatus(firstProjector);
      
      return {
        healthy: status !== 'unknown',
        message: status !== 'unknown' ? 'BenQ handler operational' : 'Cannot reach projectors'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`
      };
    }
  }

  /**
   * Get projector info (lamp hours, model, etc.)
   */
  async getProjectorInfo(context) {
    try {
      this.validateContext(context, ['bay_id', 'location']);
      
      const projectorKey = `${context.location}_${context.bay_id}`;
      const projector = this.projectors[projectorKey];
      
      if (!projector) {
        throw new Error(`Projector not found for ${context.location} ${context.bay_id}`);
      }
      
      const [powerStatus, lampHours, modelInfo] = await Promise.all([
        this.getPowerStatus(projector),
        this.sendCommand(projector, this.commands.LAMP_HOURS).catch(() => 'unknown'),
        this.sendCommand(projector, this.commands.MODEL_INFO).catch(() => 'unknown')
      ]);
      
      return this.handleSuccess('getProjectorInfo',
        this.createResult('success', 'Projector info retrieved', {
          projector: projector.name,
          powerStatus,
          lampHours: this.parseLampHours(lampHours),
          model: this.parseModelInfo(modelInfo)
        })
      );
      
    } catch (error) {
      return this.handleFailure('getProjectorInfo', error, context);
    }
  }

  /**
   * Parse lamp hours from response
   */
  parseLampHours(response) {
    // Format: *LTIM=1234# (hours)
    const match = response.match(/\*LTIM=(\d+)#/);
    return match ? parseInt(match[1]) : 'unknown';
  }

  /**
   * Parse model info from response
   */
  parseModelInfo(response) {
    // Format: *MODELNAME=TH685# 
    const match = response.match(/\*MODELNAME=(.+)#/);
    return match ? match[1] : 'unknown';
  }
}

module.exports = BenQHandler;