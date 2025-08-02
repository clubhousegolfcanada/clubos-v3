/**
 * Booking Service
 * Migrated from V1 - Handles booking validation and checks
 */

const { pool } = require('../db/pool');

/**
 * Get booking for a customer by phone number
 * @param {string} phone - Customer phone number
 * @returns {Object|null} Active or upcoming booking, or null
 */
async function getBookingForCustomer(phone) {
  try {
    // Query for active or upcoming bookings
    const result = await pool.query(
      `SELECT * FROM bookings 
       WHERE user_phone = $1 
       AND status = 'confirmed'
       AND start_time >= NOW() - INTERVAL '30 minutes'
       AND start_time <= NOW() + INTERVAL '24 hours'
       ORDER BY start_time ASC
       LIMIT 1`,
      [phone]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching booking for customer:', error);
    return null;
  }
}

/**
 * Check if a booking is currently active
 * @param {Object} booking - Booking object
 * @returns {boolean} True if booking is active
 */
function isBookingActive(booking) {
  if (!booking) return false;
  
  const now = new Date();
  const startTime = new Date(booking.start_time);
  const endTime = new Date(startTime.getTime() + booking.duration * 60000);
  
  // Booking is active if current time is between start and end
  // Allow 15 minutes early and 30 minutes late
  const earlyBuffer = 15 * 60 * 1000; // 15 minutes
  const lateBuffer = 30 * 60 * 1000; // 30 minutes
  
  return now >= new Date(startTime.getTime() - earlyBuffer) && 
         now <= new Date(endTime.getTime() + lateBuffer);
}

/**
 * Get all bookings for a specific date and location
 * @param {Object} filters - Filter options
 * @returns {Array} List of bookings
 */
async function getBookings(filters = {}) {
  try {
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (filters.date) {
      paramCount++;
      query += ` AND DATE(start_time) = DATE($${paramCount})`;
      params.push(filters.date);
    }
    
    if (filters.location) {
      paramCount++;
      query += ` AND location = $${paramCount}`;
      params.push(filters.location);
    }
    
    if (filters.bay_id) {
      paramCount++;
      query += ` AND bay_id = $${paramCount}`;
      params.push(filters.bay_id);
    }
    
    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }
    
    query += ' ORDER BY start_time ASC';
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

/**
 * Validate if a customer has permission for a specific action
 * @param {string} phone - Customer phone number
 * @param {string} action - Action to validate (e.g., 'unlock_door')
 * @returns {Object} Validation result
 */
async function validateCustomerAction(phone, action) {
  const booking = await getBookingForCustomer(phone);
  
  if (!booking) {
    return {
      allowed: false,
      reason: 'No active booking found'
    };
  }
  
  if (!isBookingActive(booking)) {
    return {
      allowed: false,
      reason: 'Booking is not currently active',
      booking
    };
  }
  
  // Action-specific validations
  if (action === 'unlock_door') {
    // Check if it's within reasonable time of booking
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const minutesUntilStart = (startTime - now) / 60000;
    
    if (minutesUntilStart > 15) {
      return {
        allowed: false,
        reason: `Too early to unlock. Please try ${Math.round(minutesUntilStart - 15)} minutes before your booking.`,
        booking
      };
    }
  }
  
  return {
    allowed: true,
    booking
  };
}

module.exports = {
  getBookingForCustomer,
  isBookingActive,
  getBookings,
  validateCustomerAction
};