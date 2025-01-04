// Helper function to check for SQL injection




const containsSQLInjectionWords = (input) => {
    const sqlKeywords = [
      "SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "WHERE", "OR", "AND", "--", "#", "/\\*", "\\*/", ";", "=", "'", "\""
    ];
    const regex = new RegExp(sqlKeywords.join('|'), 'i');
    return regex.test(input);
  };


module.exports = containsSQLInjectionWords;