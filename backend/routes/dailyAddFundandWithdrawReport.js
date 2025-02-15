const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
// const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');

const authenticateToken = require('../middleware/auth'); 
const moment = require('moment-timezone'); 



// Route 1: Get Data for Today
router.get('/getDataForToday', async (req, res) => {
    // Get today's date in 'YYYY-MM-DD' format in Asia/Kolkata timezone
    const today = moment.tz("Asia/Kolkata").format('YYYY-MM-DD');  
  
    try {
      const [rows] = await pool.query(
        `SELECT Total_Add_Fund, Total_Bank_Withdraw, Company_Money, 
         DATE(CONVERT_TZ(date_time, '+00:00', '+05:30')) AS date
         FROM daily_AddFund_Withdraw_Report
         WHERE DATE(CONVERT_TZ(date_time, '+00:00', '+05:30')) = ?`,  // Convert UTC to Asia/Kolkata timezone
        [today]
      );
  
      if (rows.length > 0) {
        // Convert the date to the desired time zone
        rows.forEach(row => {
          row.date = moment(row.date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        });
  
        res.status(200).json(rows);  // Return today's data with correct timezone
      } else {
        res.status(404).json({ message: "No data found for today." });
      }
    } catch (error) {
      console.error('Error fetching data for today:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });
  

// Route 2: Get All Data Except Today
router.get('/getDataExceptToday', async (req, res) => {
    // Get today's date in 'YYYY-MM-DD' format in Asia/Kolkata timezone
    const today = moment.tz("Asia/Kolkata").format('YYYY-MM-DD');  
  
    try {
      const [rows] = await pool.query(
        `SELECT Total_Add_Fund, Total_Bank_Withdraw, Company_Money, 
         DATE(CONVERT_TZ(date_time, '+00:00', '+05:30')) AS date
         FROM daily_AddFund_Withdraw_Report
         WHERE DATE(CONVERT_TZ(date_time, '+00:00', '+05:30')) != ?`,  // Convert UTC to Asia/Kolkata timezone
        [today]
      );
  
      if (rows.length > 0) {
        // Convert the date to the desired time zone
        rows.forEach(row => {
          row.date = moment(row.date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        });
  
        res.status(200).json(rows);  // Return data except today's, with correct timezone
      } else {
        res.status(404).json({ message: "No data found except today." });
      }
    } catch (error) {
      console.error('Error fetching data except today:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });
  

module.exports = router;