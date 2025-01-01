const { v5 } = require('uuid');

function generateTransactionId() {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const input = new Date().toISOString();  
  const uuid = v5(input, namespace);
  const numericPart = uuid.replace(/[^0-9]/g, '').slice(0, 10);
  const paddedNumericPart = numericPart.padStart(10, '0'); 
  return `TXN${paddedNumericPart}`;
}

module.exports = generateTransactionId;
