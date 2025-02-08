const express = require('express');
const router = express.Router();
const { 
    checkDaily,
    checkWeekly,
    checkMonthly 
} = require('../utills/companyTurnoverDistrubution.js');
const { pool } = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Route for daily check and distribution
router.post('/check-distribute/daily',authenticateToken, async (req, res) => {
    try {
        const result = await checkDaily();
        return res.status(result.success ? 200 : 400).json({
            success: result.success,
            message: result.message,
            data: result.data || null
        });
    } catch (error) {
        console.error("Daily check-distribute error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during daily processing"
        });
    }
});

// Route for weekly check and distribution
router.post('/check-distribute/weekly',authenticateToken,async (req, res) => {
    try {
        const result = await checkWeekly();
        return res.status(result.success ? 200 : 400).json({
            success: result.success,
            message: result.message,
            data: result.data || null
        });
    } catch (error) {
        console.error("Weekly check-distribute error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during weekly processing"
        });
    }
});

// Route for monthly check and distribution
router.post('/check-distribute/monthly', authenticateToken,async (req, res) => {
    try {
        const result = await checkMonthly();
        return res.status(result.success ? 200 : 400).json({
            success: result.success,
            message: result.message,
            data: result.data || null
        });
    } catch (error) {
        console.error("Monthly check-distribute error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during monthly processing"
        });
    }
});

// Route to get company closing details
router.get('/closing-details', authenticateToken,async (req, res) => {
    try {
        const [closingDetails] = await pool.query(`
            SELECT * FROM company_closing 
            ORDER BY date_and_time_of_closing DESC
            LIMIT 100
        `);

        return res.status(200).json({
            success: true,
            count: closingDetails.length,
            data: closingDetails
        });
    } catch (error) {
        console.error('Closing details error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch closing details'
        });
    }
});

module.exports = router;