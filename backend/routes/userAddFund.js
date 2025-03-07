const express = require('express');
const { pool } = require('../config/database');
const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
const fs = require('fs')
const path = require('path');

const router = express.Router();
const generateTransactionId = require('../utills/generateTxnId');
const containsSQLInjectionWords=require('../utills/sqlInjectionCheck');
const authenticateToken = require('../middleware/auth');
const moment = require('moment-timezone');


// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Only .png, .jpg and .jpeg formats are allowed!');
      error.code = 'INVALID_FILE_TYPE'; // Custom error code
      cb(error, false);
    }
  },
});


// Error handling middleware
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors
    return res.status(400).json({ status: 'false', error: err.message });
  } else if (err.code === 'INVALID_FILE_TYPE') {
    // Handle custom file type error
    return res.status(400).json({ status: 'false', error: err.message });
  }
  // Pass other errors to the default error handler
  next(err);
};
//upload.single('screenshot'),
router.post('/userAddFundRequest',authenticateToken,upload.single('screenshot'), async (req, res) => {
  const {  utr_number, to_upi_id, amount, member_id } = req.body;
  console.log( utr_number, amount, member_id);

  if (!to_upi_id || !amount || !member_id) {
    return res.status(404).json({ status: 'false', error: 'All required fields. Some fields are empty' });
  }

  const checktheData = [ utr_number, to_upi_id, amount, member_id].join(' ');
  // console.log(checktheData)
  if (containsSQLInjectionWords(checktheData)) {
    return res.status(400).json({ status: "false", error: "Don't try to hack." });
  }
  //check amount to be min 100
  if (amount < 50) {
    return res.status(400).json({ status: 'false', error: 'Minimum amount is 100.' });
  }

  try {
    // Check if member_id exists in usersdetails table
    const [userRows] = await pool.query(
      `SELECT memberid FROM usersdetails WHERE memberid = ?`,
      [member_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ status: 'false', error: 'Invalid member ID.' });
    }
//check for to_upi_id present in admin_qrs table 
const [qrRows] = await pool.query(
  `SELECT * FROM admin_qrs WHERE upi_id = ?`,
  [to_upi_id]
);
console.log(qrRows );
if (qrRows.length === 0) {
  return res.status(404).json({ status: 'false', error: 'Invalid UPI ID.' });
}

    // Check for duplicate transaction ID or UTR number
    const [rows] = await pool.query(
      `SELECT * FROM user_add_fund_request WHERE utr_number = ?`,
      [ utr_number]
    );

    if (rows.length > 0) {
      return res.status(400).json({ status: 'false', error: 'UTR Number already exists.' });
    }


    // Proceed to upload the file and insert the data
    if (!req.file) {
      return res.status(402).json({ status: 'false', error: 'Screenshot is required.' });
    }

    const uploadPath = path.join(__dirname, 'adminScreenshots');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    const uniqueName = `screenshot-${Date.now()}-${Math.floor(Math.random() * 100000)}${path.extname(req.file.originalname)}`;
    const filePath = path.join(uploadPath, uniqueName);

    // Save the file to disk
    fs.writeFileSync(filePath, req.file.buffer);

    // Insert the fund request into the database
    const [result] = await pool.query(
      `INSERT INTO user_add_fund_request ( utr_number, to_upi_id, amount, screenshot, member_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [ utr_number, to_upi_id, amount, uniqueName, member_id]
    );

    res.status(201).json({
      status: 'true',
      data: {
        sno: result.insertId,
        
        utr_number,
        to_upi_id,
        amount,
        screenshot: uniqueName,
        status: 'pending',
        member_id,
      },
    });
  } catch (error) {
    console.error('Error adding fund request:', error);
    res.status(500).json({ status: 'false', error: 'Internal server error.' });
  }
});
router.use(handleMulterErrors)

// Get all fund requests with pagination and membership priority sorting
router.get('/getAllUserAddFundRequest', authenticateToken, async (req, res) => {
  try {
    // Get page number from query params, default to page 1
    const page = parseInt(req.query.page) || 1;
    const limit = 100; // Number of records per page
    const offset = (page - 1) * limit;

    // Get total count of records for pagination metadata
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM user_add_fund_request');
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    // Get paginated records with membership priority sorting
    const [rows] = await pool.query(
      `SELECT uafr.*, ud.membership,ud.username 
       FROM user_add_fund_request uafr
       JOIN usersdetails ud ON uafr.member_id = ud.memberid
       ORDER BY 
         CASE 
           WHEN ud.membership = 'PREMIUM' THEN 1
           WHEN ud.membership = 'BASIC' THEN 2
           WHEN ud.membership = 'FREE' THEN 3
           ELSE 4
         END,
         uafr.time_date DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.status(200).json({
      status: "success",
      data: rows,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        recordsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching fund requests:', error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

//get single user addfund request
router.post('/getUserAddFundRequest',authenticateToken, async (req, res) => {
  const { member_id } = req.body;
  if (!member_id) {
    return res.status(400).json({ status: "error", message: "Member ID is required" });
  }

  // Validate inputs
  if (containsSQLInjectionWords(member_id)){
    return res.status(400).json({ status:"false",error: "Don't try to hack." });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM user_add_fund_request WHERE member_id =?', [member_id]);
    if (rows.length === 0) {
      return res.status(200).json({ status: "true", message: "No Fund request found" });
    }
    res.status(200).json({ status: "true", data: rows });
    } catch (error) {
      console.error('Error fetching fund request:', error);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
    });







router.post('/getUserAddFundRequestSS', authenticateToken, async (req, res) => {
  const { utr_number } = req.body;

  if (!utr_number) {
    return res.status(400).json({ status: "error", message: "Utr Number is required" });
  }

  // Validate inputs
  if (containsSQLInjectionWords(utr_number)) {
    return res.status(400).json({ status: "false", error: "Don't try to hack." });
  }

  try {
    const [rows] = await pool.query(
      'SELECT screenshot FROM user_add_fund_request WHERE utr_number = ?',
      [utr_number]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Transaction ID not found" });
    }

    const screenshot = rows[0].screenshot;

    // Check if the image was marked as deleted
    if (screenshot === 'deleted') {
      return res.status(200).json({ error: "Image deleted." });
    }

    // Check if the file exists
    const filePath = path.join(__dirname, 'adminScreenshots', screenshot);
    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ error: "Screenshot file not found." });
    }

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error fetching screenshot:', error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});






router.post('/updateFundRequestStatus', authenticateToken, async (req, res) => {
  const { utr_number, status } = req.body;

  if (!utr_number || !status) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Validate inputs
  if (containsSQLInjectionWords(utr_number) || containsSQLInjectionWords(status)) {
    return res.status(400).json({ status: "false", error: "Don't try to hack." });
  }

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  try {
    // Fetch transaction details including the screenshot path
    const [fundRequestRows] = await pool.query(
      `SELECT amount, member_id, status, screenshot FROM user_add_fund_request WHERE utr_number = ?`,
      [utr_number]
    );

    if (fundRequestRows.length === 0) {
      return res.status(404).json({ error: 'Transaction ID not found.' });
    }

    const { amount, member_id, status: currentStatus, screenshot } = fundRequestRows[0];

    // Prevent duplicate approval/rejection
    if ((currentStatus === 'approved' || currentStatus === 'rejected') && status !== currentStatus) {
      return res.status(400).json({ error: `Transaction is already ${currentStatus}.` });
    }

    // Delete the screenshot if it exists
    if (screenshot && screenshot !== 'deleted') {
      try {
        const imagePath = path.join(__dirname, 'adminScreenshots', screenshot);
        await fs.promises.unlink(imagePath); // Delete the file
        await pool.query(
          `UPDATE user_add_fund_request SET screenshot = 'deleted' WHERE utr_number = ?`,
          [utr_number]
        );
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    // Update the status
    await pool.query(
      `UPDATE user_add_fund_request SET status = ? WHERE utr_number = ?`,
      [status, utr_number]
    );

    // Handle approval/rejection logic (unchanged)
    const transaction_id = generateTransactionId();
    if (status === 'approved') {
      // ... (existing approval logic)
      try {
        // Generate a unique transaction ID
        //add the transaction to the universal transaction table 
        await pool.query(
          `INSERT INTO universal_transaction_table (transaction_id, member_id, type,amount, status, message) VALUES (?, ?, ?, ?, ?, ?)`,
          [transaction_id, member_id,'Add Fund Request',amount, 'success', 'Fund added successfully.']
        );

        // add transaction in flexi wallet
        await pool.query(
          `INSERT INTO flexi_wallet (transaction_id, member_id, credit) VALUES (?, ?, ?)`,
            [transaction_id, member_id, amount]
        );

        const [balanceRows] = await pool.query(
          `SELECT user_total_balance FROM users_total_balance WHERE member_id = ?`,
          [member_id]
        );

        if (balanceRows.length > 0) {
          // Update the user's total balance
          await pool.query(
            `UPDATE users_total_balance SET user_total_balance = user_total_balance + ? WHERE member_id = ?`,
            [amount, member_id]
          );
        } else {
          // Insert a new record for the user
          await pool.query(
            `INSERT INTO users_total_balance (member_id, user_total_balance) VALUES (?, ?)`,
            [member_id, amount]
          );
        }
        //add in daily add fund report
        const currentDateInKolkata = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');  // current date in Asia/Kolkata
        

        await pool.query(
          `INSERT INTO daily_AddFund_Withdraw_Report (Total_Add_Fund, date_time)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
          Total_Add_Fund = Total_Add_Fund + VALUES(Total_Add_Fund),
          updated_at = CURRENT_TIMESTAMP`,
          [amount, currentDateInKolkata]
        );


      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
      }

    } else {
      // ... (existing rejection logic)
      // If status is rejected, add  transaction in universal transaction table
      try{
        await pool.query(
          `INSERT INTO universal_transaction_table (transaction_id, member_id, type, amount, status, message) VALUES (?, ?, ?, ?, ?, ?)`,
          [transaction_id, member_id, 'Add Fund Request', amount,'failed', 'Fund request was rejected.']
        );
      }
      catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
        }
    }

    res.json({ status: 'success', message: 'Transaction status updated successfully.' });
  } catch (error) {
    console.error('Error updating fund request status:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});



router.post('/userBalance',authenticateToken, async (req, res) => {
  const { member_id } = req.body;
  //member_id is not empty
  if (!member_id || member_id==="") return res.status(400).json({ status: 'error', message: 'Member ID is required.' });





  // Validate inputs
  if (containsSQLInjectionWords(member_id)){
    return res.status(400).json({ status:"false",error: "Don't try to hack." });
  }


  try{
  const [balanceRows] = await pool.query(`SELECT user_total_balance FROM users_total_balance WHERE member_id = ?`, [member_id]);
  if (!balanceRows) return res.status(404).json({ status: 'error', message: 'User not found.' });
  res.json({ status: 'true', userBalance: balanceRows[0].user_total_balance });
  } catch (error) {
    console.error('Error fetching user balance:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
  });
 









module.exports = router;

