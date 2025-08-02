/**
 * SQL Security utilities to prevent injection attacks
 * Note: Using parameterized queries (which we already do) is the primary defense
 * These are additional safety measures
 */

/**
 * Validates that a string is a safe identifier (table/column name)
 * @param {string} identifier - The identifier to validate
 * @returns {boolean} - True if safe, false otherwise
 */
function isValidIdentifier(identifier) {
  // Only allow alphanumeric, underscore, and dot (for schema.table)
  const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
  return pattern.test(identifier);
}

/**
 * Escapes a string for use in a LIKE query
 * @param {string} str - The string to escape
 * @returns {string} - Escaped string
 */
function escapeLike(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Validates and sanitizes sort column names
 * @param {string} column - The column name to validate
 * @param {string[]} allowedColumns - Array of allowed column names
 * @returns {string|null} - The column name if valid, null otherwise
 */
function validateSortColumn(column, allowedColumns) {
  if (!column || !allowedColumns.includes(column)) {
    return null;
  }
  return column;
}

/**
 * Validates sort direction
 * @param {string} direction - The sort direction
 * @returns {string} - 'ASC' or 'DESC'
 */
function validateSortDirection(direction) {
  const upper = (direction || '').toUpperCase();
  return upper === 'ASC' ? 'ASC' : 'DESC';
}

/**
 * Creates a safe ORDER BY clause
 * @param {string} column - Column to sort by
 * @param {string} direction - Sort direction
 * @param {string[]} allowedColumns - Allowed column names
 * @returns {string} - Safe ORDER BY clause or empty string
 */
function createOrderByClause(column, direction, allowedColumns) {
  const safeColumn = validateSortColumn(column, allowedColumns);
  if (!safeColumn) {
    return '';
  }
  
  const safeDirection = validateSortDirection(direction);
  return `ORDER BY ${safeColumn} ${safeDirection}`;
}

/**
 * Sanitizes limit and offset values
 * @param {any} limit - The limit value
 * @param {any} offset - The offset value
 * @returns {Object} - Safe limit and offset values
 */
function sanitizePagination(limit, offset) {
  const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 100);
  const safeOffset = Math.max(0, parseInt(offset) || 0);
  
  return { limit: safeLimit, offset: safeOffset };
}

/**
 * Best practices reminder - always use parameterized queries!
 * 
 * Good:
 * pool.query('SELECT * FROM users WHERE id = $1', [userId])
 * 
 * Bad:
 * pool.query(`SELECT * FROM users WHERE id = ${userId}`)
 * 
 * For dynamic queries, use pg-format or similar libraries:
 * const format = require('pg-format');
 * const query = format('SELECT * FROM %I WHERE id = %L', tableName, userId);
 */

module.exports = {
  isValidIdentifier,
  escapeLike,
  validateSortColumn,
  validateSortDirection,
  createOrderByClause,
  sanitizePagination
};