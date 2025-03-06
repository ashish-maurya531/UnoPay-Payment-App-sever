// Helper function to check for SQL injection




// const containsSQLInjectionWords = (input) => {
//     const sqlKeywords = [
//       "SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "WHERE", "OR", "AND", "--", "#", "/\\*", "\\*/", ";", "=", "'", "\""
//     ];
//     const regex = new RegExp(sqlKeywords.join('|'), 'i');
//     return regex.test(input);
//   };


// module.exports = containsSQLInjectionWords;



/**
 * Checks if a string potentially contains SQL injection attempts
 * @param {string} input - The input string to check
 * @returns {boolean} - True if SQL injection is detected, false otherwise
 */
const containsSQLInjectionWords = (input) => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Convert to lowercase for case-insensitive matching
  const str = input.toLowerCase();
  
  // Pattern 1: SQL comments
  if (str.includes('--') || str.includes('#') || str.includes('/*') || str.includes('*/')) {
    return true;
  }
  
  // Pattern 2: SQL statement boundaries
  if (str.includes(';')) {
    return true;
  }
  
  // Pattern 3: Common SQL injection patterns
  const suspiciousPatterns = [
    // UNION-based injections
    /\sunion\s+select\s/i,
    // Basic SQL injection attempts with quotes
    /'.*?(\s+or\s+|\s+and\s+).*?[=<>]/i,
    /".*?(\s+or\s+|\s+and\s+).*?[=<>]/i,
    // Numeric or boolean-based injections
    /\s(or|and)\s+\d+\s*[=<>]/i,
    /\s(or|and)\s+['"].*?['"].*?[=<>]/i,
    // Blind SQL injection TIME/SLEEP
    /sleep\s*\(\s*\d+\s*\)/i,
    /benchmark\s*\(/i,
    // Stacked queries
    /;\s*drop\s+/i,
    /;\s*insert\s+/i,
    /;\s*update\s+/i,
    /;\s*delete\s+/i,
    // More sophisticated patterns
    /exec\s*\(\s*xp_/i,
    /INTO\s+(OUT|DUMP)FILE/i,
    /LOAD_FILE\s*\(/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(str)) {
      return true;
    }
  }
  
  return false;
};

module.exports = containsSQLInjectionWords;