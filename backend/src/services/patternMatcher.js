const logger = require('../utils/logger');

class PatternMatcherService {
  constructor() {
    // Similarity algorithms
    this.algorithms = {
      exact: this.exactMatch,
      levenshtein: this.levenshteinSimilarity,
      jaccard: this.jaccardSimilarity,
      cosine: this.cosineSimilarity,
      weighted: this.weightedSimilarity
    };
    
    // Feature weights for weighted similarity
    this.featureWeights = {
      errorType: 0.3,
      errorCode: 0.2,
      module: 0.2,
      endpoint: 0.15,
      contextKeys: 0.15
    };
  }

  /**
   * Calculate overall similarity between patterns
   */
  calculateSimilarity(current, stored, algorithm = 'weighted') {
    const similarityFn = this.algorithms[algorithm] || this.algorithms.weighted;
    return similarityFn.call(this, current, stored);
  }

  /**
   * Exact match comparison
   */
  exactMatch(current, stored) {
    return current.signature === stored.signature ? 1.0 : 0.0;
  }

  /**
   * Levenshtein distance-based similarity
   */
  levenshteinSimilarity(current, stored) {
    const distance = this.levenshteinDistance(
      current.signature || '',
      stored.signature || ''
    );
    
    const maxLength = Math.max(
      current.signature?.length || 0,
      stored.signature?.length || 0
    );
    
    return maxLength === 0 ? 0 : 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Jaccard similarity for sets
   */
  jaccardSimilarity(current, stored) {
    const set1 = this.extractFeatures(current);
    const set2 = this.extractFeatures(stored);
    
    const intersection = set1.filter(x => set2.includes(x));
    const union = [...new Set([...set1, ...set2])];
    
    return union.length === 0 ? 0 : intersection.length / union.length;
  }

  /**
   * Cosine similarity for vectors
   */
  cosineSimilarity(current, stored) {
    const vec1 = this.vectorize(current);
    const vec2 = this.vectorize(stored);
    
    const dotProduct = this.dot(vec1, vec2);
    const magnitude1 = Math.sqrt(this.dot(vec1, vec1));
    const magnitude2 = Math.sqrt(this.dot(vec2, vec2));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Weighted similarity across multiple features
   */
  weightedSimilarity(current, stored) {
    const scores = {};
    
    // Error type similarity
    scores.errorType = this.compareStrings(
      current.error?.type,
      stored.error_type
    );
    
    // Error code similarity
    scores.errorCode = this.compareStrings(
      current.error?.code,
      stored.error_code
    );
    
    // Module similarity
    scores.module = this.compareStrings(
      current.context?.module,
      stored.module_context
    );
    
    // Endpoint similarity
    scores.endpoint = this.compareStrings(
      current.context?.endpoint,
      stored.trigger_conditions?.endpoint
    );
    
    // Context keys similarity
    scores.contextKeys = this.compareContextKeys(
      current.context,
      stored.trigger_conditions
    );
    
    // Calculate weighted sum
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const [feature, weight] of Object.entries(this.featureWeights)) {
      if (scores[feature] !== undefined) {
        weightedSum += scores[feature] * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight === 0 ? 0 : weightedSum / totalWeight;
  }

  /**
   * Compare two strings with fuzzy matching
   */
  compareStrings(str1, str2) {
    if (!str1 || !str2) return 0;
    
    // Exact match
    if (str1 === str2) return 1.0;
    
    // Case-insensitive match
    if (str1.toLowerCase() === str2.toLowerCase()) return 0.95;
    
    // Substring match
    const lower1 = str1.toLowerCase();
    const lower2 = str2.toLowerCase();
    
    if (lower1.includes(lower2) || lower2.includes(lower1)) {
      return 0.7;
    }
    
    // Token-based match
    const tokens1 = this.tokenize(lower1);
    const tokens2 = this.tokenize(lower2);
    
    const commonTokens = tokens1.filter(t => tokens2.includes(t));
    const tokenScore = commonTokens.length / Math.max(tokens1.length, tokens2.length);
    
    return tokenScore * 0.8;
  }

  /**
   * Compare context objects
   */
  compareContextKeys(context1, context2) {
    if (!context1 || !context2) return 0;
    
    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    
    // Key overlap
    const commonKeys = keys1.filter(k => keys2.includes(k));
    const keyOverlap = commonKeys.length / Math.max(keys1.length, keys2.length);
    
    // Value similarity for common keys
    let valueSimilarity = 0;
    
    if (commonKeys.length > 0) {
      const matches = commonKeys.filter(k => {
        const val1 = context1[k];
        const val2 = context2[k];
        
        // Handle different types
        if (typeof val1 !== typeof val2) return false;
        
        if (typeof val1 === 'string') {
          return this.compareStrings(val1, val2) > 0.8;
        }
        
        return val1 === val2;
      });
      
      valueSimilarity = matches.length / commonKeys.length;
    }
    
    // Weighted combination
    return (keyOverlap * 0.4) + (valueSimilarity * 0.6);
  }

  /**
   * Extract features for comparison
   */
  extractFeatures(pattern) {
    const features = [];
    
    // Extract from signature
    if (pattern.signature) {
      features.push(...pattern.signature.split(':').filter(Boolean));
    }
    
    // Extract from error
    if (pattern.error) {
      features.push(pattern.error.type, pattern.error.code);
    }
    
    // Extract from context
    if (pattern.context) {
      features.push(
        pattern.context.module,
        pattern.context.endpoint,
        ...Object.keys(pattern.context)
      );
    }
    
    return [...new Set(features.filter(Boolean))];
  }

  /**
   * Vectorize pattern for mathematical operations
   */
  vectorize(pattern) {
    const vector = [];
    const features = this.extractFeatures(pattern);
    
    // Create binary vector for presence of features
    const allFeatures = this.getFeatureUniverse();
    
    for (const feature of allFeatures) {
      vector.push(features.includes(feature) ? 1 : 0);
    }
    
    return vector;
  }

  /**
   * Get all possible features (for vectorization)
   */
  getFeatureUniverse() {
    // In real implementation, this would be dynamically built
    return [
      'error', 'timeout', 'validation', 'authentication',
      'messages', 'threads', 'sops', 'actions',
      'get', 'post', 'patch', 'delete',
      'user', 'system', 'api'
    ];
  }

  /**
   * Tokenize string for comparison
   */
  tokenize(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Dot product of vectors
   */
  dot(vec1, vec2) {
    return vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  }

  /**
   * Find best matching patterns
   */
  async findBestMatches(currentPattern, candidatePatterns, threshold = 0.5) {
    const matches = [];
    
    for (const candidate of candidatePatterns) {
      const similarity = this.calculateSimilarity(currentPattern, candidate);
      
      if (similarity >= threshold) {
        matches.push({
          pattern: candidate,
          similarity,
          confidence: this.calculateConfidence(similarity, candidate)
        });
      }
    }
    
    // Sort by similarity and confidence
    matches.sort((a, b) => {
      const scoreDiff = b.similarity - a.similarity;
      if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
      
      return b.confidence - a.confidence;
    });
    
    return matches;
  }

  /**
   * Calculate confidence based on similarity and pattern history
   */
  calculateConfidence(similarity, pattern) {
    // Base confidence from similarity
    let confidence = similarity;
    
    // Boost for successful patterns
    if (pattern.success_count && pattern.match_count) {
      const successRate = pattern.success_count / pattern.match_count;
      confidence *= (0.5 + successRate * 0.5);
    }
    
    // Boost for recent patterns
    const daysSinceLastUse = (Date.now() - new Date(pattern.last_seen).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUse < 7) {
      confidence *= 1.1;
    } else if (daysSinceLastUse > 30) {
      confidence *= 0.9;
    }
    
    // Apply relevance score
    confidence *= pattern.relevance_score || 1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Explain why patterns match
   */
  explainMatch(current, stored, similarity) {
    const explanation = {
      similarity,
      matchedFeatures: [],
      mismatchedFeatures: [],
      confidence: this.calculateConfidence(similarity, stored)
    };
    
    // Compare individual features
    const features = {
      errorType: [current.error?.type, stored.error_type],
      errorCode: [current.error?.code, stored.error_code],
      module: [current.context?.module, stored.module_context],
      endpoint: [current.context?.endpoint, stored.trigger_conditions?.endpoint]
    };
    
    for (const [feature, [val1, val2]] of Object.entries(features)) {
      if (val1 && val2) {
        const score = this.compareStrings(val1, val2);
        
        if (score > 0.8) {
          explanation.matchedFeatures.push({
            feature,
            current: val1,
            stored: val2,
            score
          });
        } else {
          explanation.mismatchedFeatures.push({
            feature,
            current: val1,
            stored: val2,
            score
          });
        }
      }
    }
    
    return explanation;
  }
}

module.exports = new PatternMatcherService();