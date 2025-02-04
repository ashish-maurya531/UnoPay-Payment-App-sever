const express = require('express');
const router = express.Router();
const { distributeDailyRankIncome, distributeWeeklyRankIncome, distributeMonthlyRankIncome } = require('../utills/companyTurnoverDistrubution.js');
const { pool } = require('../config/database');

// Route for distributing daily rank income
router.post('/distribute/daily', async (req, res) => {
    try {
        const result = await distributeDailyRankIncome(req, res);
        if (result.success === 'true') {
            return res.status(200).json({
                success: true,
                message: result.message
            });
        } else {
            return res.status(200).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error("Error in daily distribution:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while distributing daily income"
        });
    }
});

// Route for distributing weekly rank income
router.post('/distribute/weekly', async (req, res) => {
    try {
        const result = await distributeWeeklyRankIncome(req, res);
        if (result.success === 'true') {
            return res.status(200).json({
                success: true,
                message: result.message
            });
        } else {
            return res.status(200).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error("Error in weekly distribution:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while distributing weekly income"
        });
    }
});

// Route for distributing monthly rank income
router.post('/distribute/monthly', async (req, res) => {
    try {
        const result = await distributeMonthlyRankIncome(req, res);
        if (result.success === 'true') {
            return res.status(200).json({
                success: true,
                message: result.message
            });
        } else {
            return res.status(200).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error("Error in monthly distribution:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while distributing monthly income"
        });
    }
});






// Route to get the details of company closing from the `company_closing` table
router.get('/closing-details', async (req, res) => {
    try {
        // Query to fetch all records from company_closing table
        const [closingDetails] = await pool.query('SELECT * FROM company_closing ORDER BY date_and_time_of_closing DESC');

        // If no records are found
        if (closingDetails.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No company closing records found.'
            });
        }

        // Return the company closing records
        return res.status(200).json({
            success: true,
            data: closingDetails
        });
    } catch (error) {
        console.error('Error fetching company closing details:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching company closing details'
        });
    }
});

module.exports = router;


