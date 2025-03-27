const express = require('express');
const router = express.Router();

const { pool } = require('../config/database');
const { getFlexiWalletTransactionList, 
  getCommissionWalletTransactionList,
  selfTransactionsList,
  incomeTransactionsList ,
  getFlexiWalletBalance,
  getTodayCommissionWalletBalance,
  getCommisionWalletBalance,
  TransactionsListForPassBook,
  getHoldTotalCommission,
  getOverallTotalIncome
} = require('../utills/checkUserBalance');
const containsSQLInjectionWords=require('../utills/sqlInjectionCheck');
const authenticateToken = require('../middleware/auth');



// Route to get flexi wallet transactions
router.post('/flexiWalletTransactions', authenticateToken,async (req, res) => {
    const {member_id} = req.body;
    if(containsSQLInjectionWords(member_id)){
        return res.status(400).json({ success: false, message: 'Invalid SQL Injection detected in member_id' });
    }
    try {
        const transactions = await getFlexiWalletTransactionList(member_id);
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting flexi wallet transactions', error });
    }
});

// Route to get commission wallet transactions
router.post('/commissionWalletTransactions',authenticateToken, async (req, res) => {
    const {member_id} = req.body;
    if(containsSQLInjectionWords(member_id)){
        return res.status(400).json({ success: false, message: 'Invalid SQL Injection detected in member_id' });
    }
    try {
        const transactions = await getCommissionWalletTransactionList(member_id);
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting commission wallet transactions', error });
    }
});

// Route to get self transactions
router.post('/selfTransactions', authenticateToken,async (req, res) => {
    const {member_id} = req.body;
    if(containsSQLInjectionWords(member_id)){
        return res.status(400).json({ success: false, message: 'Invalid SQL Injection detected in member_id' });
    }

    try {
        const transactions = await selfTransactionsList(member_id);
        if (transactions?.message) {
            return res.status(404).json({ success: false, message: transactions.message });
        }
        // console.log(transactions?.data.length===0);
        if (transactions?.data.length === 0) {
            return res.status(404).json({ success: false, message: 'No transactions' });
        }
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting self transactions222', error });
    }
});

//get all income transactions
router.post('/incomeTransactions',authenticateToken, async (req, res) => {
    const {member_id} = req.body;
    if(containsSQLInjectionWords(member_id)){
        return res.status(400).json({ success: false, message: 'Invalid SQL Injection detected in member_id' });
    }
    try {
        const transactions = await incomeTransactionsList(member_id);
        if (transactions?.message) {
            return res.status(404).json({ success: false, message: transactions.message });
        }
        if (transactions?.data.length === 0) {
            return res.status(404).json({ success: false, message: 'No transactions' });
        }
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting income transactions', error });
    }
}
);
// Route to get passbook transactions
router.post('/passbookTransactions', authenticateToken, async (req, res) => {
  const { member_id } = req.body;

  // SQL injection check
  if (containsSQLInjectionWords(member_id)) {
      return res.status(400).json({ 
          success: false, 
          message: 'Invalid SQL Injection detected in member_id' 
      });
  }

  try {
      const transactions = await TransactionsListForPassBook(member_id);
      
      // Check for user not found error
      if (transactions?.message) {
          return res.status(404).json({ 
              success: false, 
              message: transactions.message 
          });
      }

      // Check for empty transactions
      if (transactions?.data?.length === 0) {
          return res.status(404).json({ 
              success: false, 
              message: 'No transactions found' 
          });
      }

      // Return successful response
      res.status(200).json({ 
          success: true, 
          transactions 
      });

  } catch (error) {
      console.error('Error in passbook transactions route:', error);
      res.status(500).json({ 
          success: false, 
          message: 'Error getting passbook transactions', 
          error 
      });
  }
});


router.get("/user-all-transactions", authenticateToken, async (req, res) => {
    try {
      const query = `
        SELECT 
          ut.*, 
          ud.username 
        FROM 
          universal_transaction_table ut
        JOIN 
          usersdetails ud 
        ON 
          ut.member_id = ud.memberid
      `;
      const [transactions] = await pool.query(query);
      res.status(200).json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error getting all transactions", error });
    }
  });

  router.get("/user-activation-report-transactions", authenticateToken, async (req, res) => {
    try {
      const query = `
          SELECT 
              ut.transaction_id,
              ut.member_id,
              ut.type,
              ut.subType,
              ut.created_at AS activation_date,
              ud.username,
              ud.created_at AS date_of_joining
          FROM 
              universal_transaction_table ut
          JOIN 
              usersdetails ud ON ut.member_id = ud.memberid
          WHERE 
              ut.type = 'Membership' 
              AND (ut.subType = 'BASIC' OR ut.subType = 'PREMIUM')
          ORDER BY 
              ut.created_at DESC
      `;

      const [transactions] = await pool.query(query);
      
      res.status(200).json({ success: true, transactions });

  } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ success: false, message: "Error getting membership activation transactions", error });
  }
});
  


  router.get("/user-flexi-wallet-all-transactions", authenticateToken, async (req, res) => {
    try {
      const query = `
        SELECT 
          f.*, 
          ud.username 
        FROM 
          flexi_wallet f
        JOIN 
          usersdetails ud 
        ON 
          f.member_id = ud.memberid
      `;
      const [transactions] = await pool.query(query);
      res.status(200).json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error getting all transactions", error });
    }
  });
  
  router.get("/user-commission-wallet-all-transactions", authenticateToken, async (req, res) => {
    try {
      const query = `
        SELECT 
          c.*, 
          ud.username 
        FROM 
          commission_wallet c
        JOIN 
          usersdetails ud ON c.member_id = ud.memberid
      `;
      const [transactions] = await pool.query(query);
      res.status(200).json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error getting all transactions", error });
    }
  });
  
//get user flexi wallet total and cummission wallet total 
router.post("/user-wallet-wise-balance",authenticateToken, async (req, res) => {
    const { member_id } = req.body;
  
    // Check for missing member_id
    if (!member_id) {
      return res.status(400).json({ status: "false", message: "Member ID is required" });
    }
  
    // Check for SQL injection
    if (containsSQLInjectionWords(member_id)) {
      return res.status(400).json({ success: false, message: 'Invalid SQL Injection detected in member_id' });
    }
  
    // Check if member_id is valid
    const [memberExist] = await pool.query('SELECT memberid,username ,status,membership FROM usersdetails WHERE memberid = ?', [member_id]);
    
    if (memberExist.length === 0) {
      return res.status(404).json({ status: "false", message: "Member not found" });
    }
  
    try {
      const flexi_wallet = await getFlexiWalletBalance(member_id);
      const commission_wallet = await getCommisionWalletBalance(member_id);
      const overall_Total_Income = await getOverallTotalIncome(member_id);
      const todayIncome=await getTodayCommissionWalletBalance(member_id);
      const holdTotalCommission = await getHoldTotalCommission(member_id);
    //   console.log(holdTotalCommission);
      const membership= memberExist[0].membership;
      const [result] = await pool.query(`SELECT active_team,rank_no FROM ranktable WHERE member_id = ?`, [member_id]);
      // Check if user exists
     console.log({
        member_id: member_id,
        username: memberExist[0].username,
        datetime: new Date(),
        status: "true", 
        flexi_wallet, 
        commission_wallet:commission_wallet,
        holdTotalCommission,
        commission_minus_hold:commission_wallet-holdTotalCommission,  
        "signup_bonus":649 ,
        "membership":membership,
        "today_income":todayIncome,
        "total_income":overall_Total_Income,
        ...result[0]
      
      })
      return res.status(200).json({
        status: "true", 
        flexi_wallet, 
        commission_wallet:commission_wallet,
        holdTotalCommission,
        commission_minus_hold:commission_wallet-holdTotalCommission,  
        "signup_bonus":649 ,
        "membership":membership,
        "today_income":todayIncome,
        "total_income":overall_Total_Income,
        ...result[0]
      
      });
    } catch (error) {
      return res.status(500).json({ success: "false", message: "Error getting user wallet" });
    }
  });



  router.post("/all-user-wallet-wise-balance", authenticateToken, async (req, res) => {
    try {
      // Fetch all member IDs and usernames from the usersdetails table
      const [members] = await pool.query('SELECT memberid, username FROM usersdetails');
      if (members.length === 0) {
        return res.status(404).json({ status: "false", message: "No members found" });
      }
  
      // Initialize an array to store wallet balances along with usernames
      const results = [];
  
      // Fetch wallet balances for each member
      for (const member of members) {
        const member_id = member.memberid;
        try {
          const flexi_wallet = await getFlexiWalletBalance(member_id);
          const commission_wallet = await getCommisionWalletBalance(member_id);
  
          // Add the results along with username to the array
          results.push({
            member_id,
            username: member.username,
            flexi_wallet,
            commission_wallet,
          });
        } catch (error) {
          // Handle individual member errors and log them
          console.error(`Error fetching wallet for member_id: ${member_id}`, error);
          results.push({
            member_id,
            username: member.username,
            flexi_wallet: null,
            commission_wallet: null,
            error: "Error fetching wallet data",
          });
        }
      }
  
      // Return all wallet balances along with usernames
      return res.status(200).json({ success: "true", data: results });
    } catch (error) {
      console.error("Error fetching user wallets:", error);
      return res.status(500).json({ success: "false", message: "Error fetching user wallets" });
    }
  });
  
  
    
       


module.exports = router;