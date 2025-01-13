const express = require('express');
const router = express.Router();

const { pool } = require('../config/database');
const { getFlexiWalletTransactionList, getCommissionWalletTransactionList,selfTransactionsList,incomeTransactionsList ,getFlexiWalletBalance,getCommisionWalletBalance} = require('../utills/checkUserBalance');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');



// Route to get flexi wallet transactions
router.post('/flexiWalletTransactions', async (req, res) => {
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
router.post('/commissionWalletTransactions', async (req, res) => {
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
router.post('/selfTransactions', async (req, res) => {
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
router.post('/incomeTransactions', async (req, res) => {
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


router.get("/user-all-transactions",async(req,res)=>{
    try{
        // Get all users transactions from the univarsal_transactions_table
        const [transactions]=await pool.query(`SELECT * FROM universal_transaction_table`);
        res.status(200).json({success:true,transactions});
    }catch(error){
        res.status(500).json({success:false,message:"Error getting all transactions",error});
    }
});


router.get("/user-flexi-wallet-all-transactions",async(req,res)=>{
    try{
        // Get all users transactions from the univarsal_transactions_table
        const [transactions]=await pool.query(`SELECT * FROM flexi_wallet`);
        res.status(200).json({success:true,transactions});
    }catch(error){
        res.status(500).json({success:false,message:"Error getting all transactions",error});
    }
});

router.get("/user-commission-wallet-all-transactions",async(req,res)=>{
    try{
        // Get all users transactions from the univarsal_transactions_table
        const [transactions]=await pool.query(`SELECT * FROM commission_wallet`);
        res.status(200).json({success:true,transactions});
    }catch(error){
        res.status(500).json({success:false,message:"Error getting all transactions",error});
    }
});

//get user flexi wallet total and cummission wallet total 
router.post("/user-wallet-wise-balance", async (req, res) => {
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
    const [memberExist] = await pool.query('SELECT memberid, status FROM usersdetails WHERE memberid = ?', [member_id]);
    if (memberExist.length === 0) {
      return res.status(404).json({ status: "false", message: "Member not found" });
    }
  
    try {
      const flexi_wallet = await getFlexiWalletBalance(member_id);
      const commission_wallet = await getCommisionWalletBalance(member_id);
      return res.status(200).json({status: "true", flexi_wallet, commission_wallet,"signup_bonus":649 });
    } catch (error) {
      return res.status(500).json({ success: "false", message: "Error getting user wallet" });
    }
  });



  router.post("/all-user-wallet-wise-balance", async (req, res) => {
    try {
      // Fetch all member IDs from the usersdetails table
      const [members] = await pool.query('SELECT memberid FROM usersdetails');
      if (members.length === 0) {
        return res.status(404).json({ status: "false", message: "No members found" });
      }
  
      // Initialize an array to store wallet balances
      const results = [];
  
      // Fetch wallet balances for each member
      for (const member of members) {
        const member_id = member.memberid;
        try {
          const flexi_wallet = await getFlexiWalletBalance(member_id);
          const commission_wallet = await getCommisionWalletBalance(member_id);
  
          // Add the results to the array
          results.push({
            member_id,
            flexi_wallet,
            commission_wallet,
          });
        } catch (error) {
          // Handle individual member errors and log them
          console.error(`Error fetching wallet for member_id: ${member_id}`, error);
          results.push({
            member_id,
            flexi_wallet: null,
            commission_wallet: null,
            error: "Error fetching wallet data",
          });
        }
      }
  
      // Return all wallet balances
      return res.status(200).json({ success: "true", data: results });
    } catch (error) {
      console.error("Error fetching user wallets:", error);
      return res.status(500).json({ success: "false", message: "Error fetching user wallets" });
    }
  });
  
  
    
       


module.exports = router;