const BasePatternModule = require('./BasePatternModule');
const logger = require('../../../utils/logger');

/**
 * Booking Pattern Module
 * Handles reservation, scheduling, and booking-related patterns
 */
class BookingPatternModule extends BasePatternModule {
  constructor() {
    super('booking', {
      minConfidenceForSuggestion: 0.6,
      learningEnabled: true,
      crossDomainLearning: true,
      // Booking-specific config
      bookingTypes: {
        standard: ['regular', 'single', 'normal'],
        recurring: ['weekly', 'monthly', 'series'],
        group: ['team', 'party', 'event'],
        priority: ['vip', 'premium', 'urgent']
      },
      conflictResolutionStrategies: {
        firstComeFirstServed: 0.3,
        priorityBased: 0.4,
        fairShare: 0.3
      }
    });
  }

  /**
   * Check if this module can handle the event
   */
  canHandle(eventType) {
    const bookingTypes = ['booking', 'reservation', 'schedule', 'appointment'];
    return bookingTypes.includes(eventType) || 
           (eventType === 'general' && this.isBookingRelated(eventType));
  }

  /**
   * Check if event is booking-related
   */
  isBookingRelated(event) {
    const bookingKeywords = ['book', 'reserve', 'schedule', 'slot', 'bay', 'time'];
    const eventStr = JSON.stringify(event).toLowerCase();
    return bookingKeywords.some(keyword => eventStr.includes(keyword));
  }

  /**
   * Generate booking-specific signature
   */
  async generateSignature(event) {
    const components = [
      'booking',
      event.bookingType || this.categorizeBooking(event),
      event.resource || event.bay || '',
      event.timeSlot ? this.normalizeTimeSlot(event.timeSlot) : '',
      event.action || ''
    ];
    
    return components.filter(Boolean).join(':').toLowerCase();
  }

  /**
   * Categorize booking type
   */
  categorizeBooking(event) {
    const eventStr = JSON.stringify(event).toLowerCase();
    
    for (const [type, keywords] of Object.entries(this.config.bookingTypes)) {
      if (keywords.some(keyword => eventStr.includes(keyword))) {
        return type;
      }
    }
    
    return 'standard';
  }

  /**
   * Normalize time slot for pattern matching
   */
  normalizeTimeSlot(timeSlot) {
    if (!timeSlot) return '';
    
    const date = new Date(timeSlot);
    const hour = date.getHours();
    
    // Categorize into time blocks
    if (hour < 6) return 'early_morning';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Calculate semantic match for bookings
   */
  async calculateSemanticMatch(pattern, event) {
    let score = 0;
    
    // Resource matching
    if (event.resource && pattern.logic?.resource) {
      if (event.resource === pattern.logic.resource) {
        score += 0.3;
      } else if (this.areResourcesSimilar(event.resource, pattern.logic.resource)) {
        score += 0.15;
      }
    }
    
    // Duration matching
    if (event.duration && pattern.logic?.typicalDuration) {
      const durationMatch = 1 - Math.abs(event.duration - pattern.logic.typicalDuration) / 
                           Math.max(event.duration, pattern.logic.typicalDuration);
      score += durationMatch * 0.2;
    }
    
    // Participant count matching
    if (event.participants && pattern.logic?.typicalParticipants) {
      const participantMatch = 1 - Math.abs(event.participants - pattern.logic.typicalParticipants) / 
                              Math.max(event.participants, pattern.logic.typicalParticipants);
      score += participantMatch * 0.2;
    }
    
    // Booking type matching
    const bookingType = this.categorizeBooking(event);
    if (pattern.logic?.bookingType === bookingType) {
      score += 0.3;
    }
    
    return score;
  }

  /**
   * Check if resources are similar
   */
  areResourcesSimilar(resource1, resource2) {
    // Simple similarity check - could be enhanced
    const r1 = resource1.toLowerCase();
    const r2 = resource2.toLowerCase();
    
    // Check if they're the same type (e.g., both bays)
    const resourceTypes = ['bay', 'room', 'court', 'table'];
    for (const type of resourceTypes) {
      if (r1.includes(type) && r2.includes(type)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract key attributes for booking patterns
   */
  extractKeyAttributes(event) {
    return {
      bookingType: this.categorizeBooking(event),
      resource: event.resource || event.bay,
      timeSlot: event.timeSlot,
      duration: event.duration,
      participants: event.participants || 1,
      recurring: event.recurring || false,
      priority: event.priority || 'normal',
      requestedBy: event.customerId || event.userId
    };
  }

  /**
   * Extract conditions for booking patterns
   */
  extractConditions(event, outcome) {
    return {
      availability: outcome.availabilityChecked || true,
      conflicts: outcome.conflictsResolved || [],
      prerequisites: event.prerequisites || [],
      specialRequirements: event.requirements || [],
      paymentStatus: outcome.paymentStatus || 'pending',
      confirmationSent: outcome.confirmationSent || false
    };
  }

  /**
   * Handle booking conflicts
   */
  async handleBookingConflict(event, existingBookings) {
    const strategies = [];
    
    // First come first served
    strategies.push({
      name: 'firstComeFirstServed',
      weight: this.config.conflictResolutionStrategies.firstComeFirstServed,
      resolution: this.resolveByFirstCome(event, existingBookings)
    });
    
    // Priority based
    strategies.push({
      name: 'priorityBased',
      weight: this.config.conflictResolutionStrategies.priorityBased,
      resolution: this.resolveByPriority(event, existingBookings)
    });
    
    // Fair share
    strategies.push({
      name: 'fairShare',
      weight: this.config.conflictResolutionStrategies.fairShare,
      resolution: this.resolveByFairShare(event, existingBookings)
    });
    
    // Select strategy based on weights
    const selectedStrategy = this.selectStrategy(strategies);
    
    return {
      pattern: {
        id: 'booking-conflict-resolver',
        logic: {
          type: 'conflict_resolution',
          strategy: selectedStrategy.name,
          resolution: selectedStrategy.resolution,
          alternatives: this.generateAlternatives(event, existingBookings)
        },
        confidence_score: 0.8,
        auto_executable: selectedStrategy.resolution.autoResolvable
      },
      confidence: 0.8,
      matchDetails: {
        type: 'booking_conflict',
        conflictCount: existingBookings.length,
        strategy: selectedStrategy.name
      }
    };
  }

  /**
   * Resolve by first come first served
   */
  resolveByFirstCome(event, existingBookings) {
    const sorted = existingBookings.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    return {
      action: 'deny_new_booking',
      reason: 'Existing booking has priority',
      existingBooking: sorted[0],
      autoResolvable: true,
      customerMessage: 'This time slot is already booked. Please select another time.'
    };
  }

  /**
   * Resolve by priority
   */
  resolveByPriority(event, existingBookings) {
    const priorities = { vip: 3, premium: 2, normal: 1 };
    const eventPriority = priorities[event.priority || 'normal'];
    
    const higherPriorityBookings = existingBookings.filter(booking => 
      priorities[booking.priority || 'normal'] >= eventPriority
    );
    
    if (higherPriorityBookings.length > 0) {
      return {
        action: 'deny_new_booking',
        reason: 'Higher priority booking exists',
        autoResolvable: true,
        customerMessage: 'This time slot is reserved for priority bookings.'
      };
    }
    
    return {
      action: 'bump_existing_bookings',
      reason: 'New booking has higher priority',
      affectedBookings: existingBookings,
      autoResolvable: false, // Requires human approval to bump
      requiresNotification: true
    };
  }

  /**
   * Resolve by fair share
   */
  resolveByFairShare(event, existingBookings) {
    // Check customer's recent booking count
    const customerBookings = existingBookings.filter(b => 
      b.customerId === event.customerId
    );
    
    if (customerBookings.length >= 2) {
      return {
        action: 'deny_new_booking',
        reason: 'Customer has reached booking limit',
        autoResolvable: true,
        customerMessage: 'You have reached your booking limit for this period.'
      };
    }
    
    return {
      action: 'allow_with_conditions',
      conditions: ['shorter_duration', 'off_peak_only'],
      autoResolvable: true,
      customerMessage: 'Booking approved with modified conditions.'
    };
  }

  /**
   * Select strategy based on weights
   */
  selectStrategy(strategies) {
    const random = Math.random();
    let cumulative = 0;
    
    for (const strategy of strategies) {
      cumulative += strategy.weight;
      if (random <= cumulative) {
        return strategy;
      }
    }
    
    return strategies[0]; // Fallback
  }

  /**
   * Generate alternative booking options
   */
  generateAlternatives(event, existingBookings) {
    const alternatives = [];
    const requestedTime = new Date(event.timeSlot);
    
    // Earlier slots
    for (let i = 1; i <= 3; i++) {
      const earlierTime = new Date(requestedTime);
      earlierTime.setHours(earlierTime.getHours() - i);
      
      if (this.isSlotAvailable(earlierTime, existingBookings)) {
        alternatives.push({
          timeSlot: earlierTime,
          type: 'earlier',
          availability: 'available'
        });
      }
    }
    
    // Later slots
    for (let i = 1; i <= 3; i++) {
      const laterTime = new Date(requestedTime);
      laterTime.setHours(laterTime.getHours() + i);
      
      if (this.isSlotAvailable(laterTime, existingBookings)) {
        alternatives.push({
          timeSlot: laterTime,
          type: 'later',
          availability: 'available'
        });
      }
    }
    
    // Different resources
    if (event.resource) {
      const similarResources = this.findSimilarResources(event.resource);
      for (const resource of similarResources) {
        alternatives.push({
          resource: resource,
          timeSlot: requestedTime,
          type: 'different_resource',
          availability: 'check_required'
        });
      }
    }
    
    return alternatives;
  }

  /**
   * Check if time slot is available
   */
  isSlotAvailable(timeSlot, existingBookings) {
    return !existingBookings.some(booking => {
      const bookingTime = new Date(booking.timeSlot);
      return Math.abs(bookingTime - timeSlot) < 3600000; // Within 1 hour
    });
  }

  /**
   * Find similar resources
   */
  findSimilarResources(resource) {
    // In real implementation, this would query available resources
    const resourceType = resource.match(/bay|room|court|table/i)?.[0] || 'space';
    return [`${resourceType}_2`, `${resourceType}_3`, `${resourceType}_4`];
  }

  /**
   * Special handling for recurring bookings
   */
  async handleRecurringBooking(event) {
    if (!event.recurring) return null;
    
    const recurrencePattern = {
      frequency: event.recurringFrequency || 'weekly',
      interval: event.recurringInterval || 1,
      endDate: event.recurringEndDate || this.calculateDefaultEndDate(event),
      daysOfWeek: event.recurringDays || [new Date(event.timeSlot).getDay()]
    };
    
    // Generate all occurrences
    const occurrences = this.generateOccurrences(event.timeSlot, recurrencePattern);
    
    // Check availability for all occurrences
    const availabilityCheck = await this.checkBulkAvailability(
      event.resource,
      occurrences
    );
    
    return {
      pattern: {
        id: 'recurring-booking-handler',
        logic: {
          type: 'recurring_booking',
          recurrencePattern,
          occurrences,
          availabilityCheck,
          conflictResolution: availabilityCheck.hasConflicts ? 
            'partial_booking' : 'full_booking'
        },
        confidence_score: 0.85,
        auto_executable: !availabilityCheck.hasConflicts
      },
      confidence: 0.85,
      matchDetails: {
        type: 'recurring_booking',
        occurrenceCount: occurrences.length,
        conflictCount: availabilityCheck.conflicts?.length || 0
      }
    };
  }

  /**
   * Calculate default end date for recurring bookings
   */
  calculateDefaultEndDate(event) {
    const startDate = new Date(event.timeSlot);
    const endDate = new Date(startDate);
    
    // Default to 3 months for most bookings
    endDate.setMonth(endDate.getMonth() + 3);
    
    return endDate;
  }

  /**
   * Generate occurrences for recurring booking
   */
  generateOccurrences(startTime, pattern) {
    const occurrences = [];
    const current = new Date(startTime);
    const endDate = new Date(pattern.endDate);
    
    while (current <= endDate) {
      if (pattern.daysOfWeek.includes(current.getDay())) {
        occurrences.push(new Date(current));
      }
      
      // Move to next interval
      if (pattern.frequency === 'daily') {
        current.setDate(current.getDate() + pattern.interval);
      } else if (pattern.frequency === 'weekly') {
        current.setDate(current.getDate() + (7 * pattern.interval));
      } else if (pattern.frequency === 'monthly') {
        current.setMonth(current.getMonth() + pattern.interval);
      }
    }
    
    return occurrences;
  }

  /**
   * Check availability for multiple time slots
   */
  async checkBulkAvailability(resource, timeSlots) {
    // In real implementation, this would query the database
    // For now, simulate with random availability
    const conflicts = timeSlots.filter(() => Math.random() < 0.1); // 10% conflicts
    
    return {
      totalSlots: timeSlots.length,
      availableSlots: timeSlots.length - conflicts.length,
      conflicts: conflicts,
      hasConflicts: conflicts.length > 0
    };
  }
}

module.exports = BookingPatternModule;