const { pool } = require('../db/pool');

async function findMatchingSOP(intent, message) {
  try {
    // First, get all LIVE SOPs for the intent category
    const sopResult = await pool.query(
      `SELECT * FROM sop 
       WHERE category = $1 
       AND active = true 
       AND status = 'live'
       AND (valid_until IS NULL OR valid_until > NOW())
       ORDER BY usage_count DESC, version DESC`,
      [intent]
    );
    
    if (sopResult.rows.length === 0) {
      return null;
    }
    
    const messageLower = message.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;
    
    // Check each SOP for trigger phrase matches
    for (const sop of sopResult.rows) {
      let matchScore = 0;
      let matchedPhrases = 0;
      
      // Check trigger phrases
      if (sop.trigger_phrases && Array.isArray(sop.trigger_phrases)) {
        for (const trigger of sop.trigger_phrases) {
          if (messageLower.includes(trigger.toLowerCase())) {
            matchedPhrases++;
            // Give higher score for longer phrases (more specific)
            matchScore += trigger.split(' ').length;
          }
        }
      }
      
      // Calculate confidence based on matches
      if (matchedPhrases > 0) {
        const confidence = Math.min(0.95, (matchScore / 10) + (matchedPhrases * 0.2));
        
        if (confidence > highestScore) {
          highestScore = confidence;
          bestMatch = {
            ...sop,
            match_confidence: confidence,
            matched_phrases: matchedPhrases
          };
        }
      }
    }
    
    // Only return if confidence is above threshold
    const CONFIDENCE_THRESHOLD = 0.5;
    if (bestMatch && bestMatch.match_confidence >= CONFIDENCE_THRESHOLD) {
      // Update usage tracking
      await pool.query(
        'UPDATE sop SET usage_count = usage_count + 1, last_used_at = NOW() WHERE id = $1',
        [bestMatch.id]
      );
      
      return bestMatch;
    }
    
    return null;
  } catch (error) {
    console.error('SOP matching error:', error);
    return null;
  }
}

// Helper function to check if prerequisites are met
async function checkPrerequisites(sop, context) {
  if (!sop.prerequisites || sop.prerequisites.length === 0) {
    return true;
  }
  
  // Parse prerequisites from JSONB
  const prerequisites = typeof sop.prerequisites === 'string' 
    ? JSON.parse(sop.prerequisites) 
    : sop.prerequisites;
    
  for (const prereq of prerequisites) {
    switch (prereq) {
      case 'booking_active':
        if (!context.booking_id) return false;
        break;
      case 'within_time_window':
        // TODO: Check if current time is within booking window
        break;
      case 'bay_occupied':
        // TODO: Check bay occupancy status
        break;
    }
  }
  
  return true;
}

module.exports = { findMatchingSOP, checkPrerequisites };