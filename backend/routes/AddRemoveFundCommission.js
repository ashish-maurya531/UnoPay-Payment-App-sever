



const express = require('express');
const { pool } = require('../config/database');
const containsSQLInjectionWords=require('../utills/sqlInjectionCheck');
const generateTransactionId = require('../utills/generateTxnId');

const router = express.Router();
const authenticateToken = require('../middleware/auth');


// Add/Remove funds from Flexi Wallet
router.post('/manage-flexi-wallet', authenticateToken, async (req, res) => {
  const { member_id, amount, operation } = req.body;
  
  // Validate input
  if (!member_id || !amount || !operation || !['credit', 'debit'].includes(operation)) {
    return res.status(400).json({ status: "false", message: "Invalid input parameters" });
  }
  
  if (amount <= 0) {
    return res.status(400).json({ status: "false", message: "Amount must be greater than zero" });
  }

  try {
    // Check if member exists
    const [memberCheck] = await pool.query('SELECT 1 FROM usersdetails WHERE memberid = ?', [member_id]);
    if (memberCheck.length === 0) {
      return res.status(404).json({ status: "false", message: "Member not found" });
    }
    
    // Begin transaction
    await pool.query('START TRANSACTION');
    
    // Generate transaction ID
    const transaction_id = await generateTransactionId();
    
    // Check current balance if operation is debit
    if (operation === 'debit') {
      const [currentBalance] = await pool.query(
        'SELECT SUM(credit) - SUM(debit) as balance FROM flexi_wallet WHERE member_id = ?', 
        [member_id]
      );
      
      const balance = currentBalance[0].balance || 0;
      
      if (balance < amount) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ 
          status: "false", 
          message: "Insufficient balance. Current balance: " + balance 
        });
      }
    }
    
    // Add record to universal_transaction_table
    const type = operation === 'credit' ? 'Add Fund By' : 'Remove Fund By';
    const message = operation === 'credit' ? 'Fund added successfully' : 'Fund removed successfully';
    
    await pool.query(
      'INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType, amount, status, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [transaction_id, member_id, type, 'admin', amount, 'success', message]
    );
    
    // Add record to flexi_wallet
    const credit = operation === 'credit' ? amount : 0;
    const debit = operation === 'debit' ? amount : 0;
    
    await pool.query(
      'INSERT INTO flexi_wallet (member_id, transaction_id, credit, debit, fund_by) VALUES (?, ?, ?, ?, ?)',
      [member_id, transaction_id, credit, debit, 'admin']
    );
    
    // Get updated balance
    const [updatedBalance] = await pool.query(
      'SELECT SUM(credit) - SUM(debit) as balance FROM flexi_wallet WHERE member_id = ?', 
      [member_id]
    );
    
    // Commit transaction
    await pool.query('COMMIT');
    
    res.status(200).json({
      status: "true",
      message: message,
      transaction_id: transaction_id,
      updated_balance: updatedBalance[0].balance || 0
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error managing flexi wallet:', error);
    res.status(500).json({ status: "false", message: "Internal server error" });
  }
});

// Add/Remove commission
router.post('/manage-commission-wallet', authenticateToken, async (req, res) => {
  const { member_id, amount, operation } = req.body;
  
  // Validate input
  if (!member_id || !amount || !operation || !['credit', 'debit'].includes(operation)) {
    return res.status(400).json({ status: "false", message: "Invalid input parameters" });
  }
  
  if (amount <= 0) {
    return res.status(400).json({ status: "false", message: "Amount must be greater than zero" });
  }

  try {
    // Check if member exists
    const [memberCheck] = await pool.query('SELECT 1 FROM usersdetails WHERE memberid = ?', [member_id]);
    if (memberCheck.length === 0) {
      return res.status(404).json({ status: "false", message: "Member not found" });
    }
    
    // Begin transaction
    await pool.query('START TRANSACTION');
    
    // Generate transaction ID
    const transaction_id = await generateTransactionId();
    
    // Check current balance if operation is debit
    if (operation === 'debit') {
      const [currentBalance] = await pool.query(
        'SELECT SUM(credit) - SUM(debit) as balance FROM commission_wallet WHERE member_id = ?', 
        [member_id]
      );
      
      const balance = currentBalance[0].balance || 0;
      
      if (balance < amount) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ 
          status: "false", 
          message: "Insufficient commission balance. Current balance: " + balance 
        });
      }
    }
    
    // Add record to universal_transaction_table
    const type = operation === 'credit' ? 'Added Commission By' : 'Remove Commission By';
    const message = operation === 'credit' ? 'Commission added successfully' : 'Commission removed successfully';
    
    await pool.query(
      'INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType, amount, status, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [transaction_id, member_id, type, 'admin', amount, 'success', message]
    );
    
    // Add record to commission_wallet
    const credit = operation === 'credit' ? amount : 0;
    const debit = operation === 'debit' ? amount : 0;
    
    await pool.query(
      'INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [member_id, 'admin', transaction_id, transaction_id, credit, debit, 0]
    );
    
    // Get updated balance
    const [updatedBalance] = await pool.query(
      'SELECT SUM(credit) - SUM(debit) as balance FROM commission_wallet WHERE member_id = ?', 
      [member_id]
    );
    
    // Commit transaction
    await pool.query('COMMIT');
    
    res.status(200).json({
      status: "true",
      message: message,
      transaction_id: transaction_id,
      updated_balance: updatedBalance[0].balance || 0
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error managing commission wallet:', error);
    res.status(500).json({ status: "false", message: "Internal server error" });
  }
});

module.exports = router;