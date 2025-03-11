// const { v5 } = require('uuid');

// function generateTransactionId() {
//   const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
//   const input = new Date().toISOString();  
//   const uuid = v5(input, namespace);
//   const numericPart = uuid.replace(/[^0-9]/g, '').slice(0, 10);
//   const paddedNumericPart = numericPart.padStart(10, '0'); 
//   return `TXN${paddedNumericPart}`;
// }

// module.exports = generateTransactionId;
const { v5 } = require('uuid');
const crypto = require('crypto');

function generateTransactionId() {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  
  // Create unique input using timestamp + random bytes
  const timestamp = new Date().toISOString();
  const randomComponent = crypto.randomBytes(4).toString('hex'); // 8-character hex string
  const uniqueInput = timestamp + randomComponent;

  // Generate UUID v5 with enhanced uniqueness
  const uuid = v5(uniqueInput, namespace);
  
  // Extract and format numeric part
  const numericPart = uuid.replace(/[^0-9]/g, '').slice(0, 10);
  const paddedNumericPart = numericPart.padStart(10, '0');
  
  return `TXN${paddedNumericPart}`;
}

module.exports = generateTransactionId;

