const { pool } = require('../config/database');
// const moment = require('moment'); 
const moment = require('moment-timezone');


const getMembershipTransactionsForToday = async (req, res) => {
    try {
        const today = moment().subtract(1, 'days').format('YYYY-MM-DD');
        // console.log('Today\'s date (Asia/Kolkata):', today);

        const query = `
        SELECT 
            550 * COUNT(CASE WHEN subType = 'BASIC' THEN 1 END) 
            + 55 * COUNT(CASE WHEN subType = 'PREMIUM' THEN 1 END) 
            AS todayIncome
        FROM universal_transaction_table 
        WHERE type = 'Membership' 
        AND subType IN ('BASIC', 'PREMIUM')
        AND status = 'success'
        AND DATE(created_at) = ?;
    `;
    
   


        const [rows] = await pool.query(query, [today]);
        

        // Send the response with the result
        console.log({
            message: "Today's transactions fetched successfully",
            todayIncome: rows[0].todayIncome|| 0,
        });

        return {
            message: "Today's transactions fetched successfully",
            todayIncome: rows[0].todayIncome || 0, // Default to 0 if null
        };
    } catch (err) {
        console.error('Error fetching transactions:', err);
        console.log({
            message: "Error fetching transactions",
            error: err.message,
        });
    }
};

// Function to get Membership transactions with success status for the current week
const getMembershipTransactionsForWeek = async (req, res) => {
    try {
        // Get start and end of the CURRENT week in Asia/Kolkata
        const startOfWeek = moment().subtract(1, 'weeks').startOf('week').format('YYYY-MM-DD');
        const endOfWeek = moment().subtract(1, 'weeks').endOf('week').format('YYYY-MM-DD');

        const query = `
    SELECT 
        550 * COUNT(CASE WHEN subType = 'BASIC' THEN 1 END) 
        + 55 * COUNT(CASE WHEN subType = 'PREMIUM' THEN 1 END) 
        AS weeklyIncome
    FROM universal_transaction_table 
    WHERE type = 'Membership' 
    AND subType IN ('BASIC', 'PREMIUM')
    AND status = 'success'
    AND DATE(created_at) BETWEEN ? AND ?;
`;


        const [rows] = await pool.query(query, [startOfWeek, endOfWeek]);

        console.log({
            message: "Weekly transactions fetched successfully",
            weeklyIncome: rows[0].weeklyIncome|| 0,
        });

        return {
            message: "Weekly transactions fetched successfully",
            weeklyIncome: rows[0].weeklyIncome || 0, // Default to 0 if null
        };
    } catch (err) {
        // Handle error
        console.error('Error fetching weekly transactions:', err);
        console.log({
            message: "Error fetching weekly transactions",
            error: err.message,
        });
    }
};

// Function to get Membership transactions with success status for the current month
const getMembershipTransactionsForMonth = async (req, res) => {
    try {
       // Get start and end of the CURRENT month in Asia/Kolkata
       const startOfMonth = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
       const endOfMonth = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');

       const query = `
    SELECT 
        550 * COUNT(CASE WHEN subType = 'BASIC' THEN 1 END) 
        + 55 * COUNT(CASE WHEN subType = 'PREMIUM' THEN 1 END) 
        AS monthlyIncome
    FROM universal_transaction_table 
    WHERE type = 'Membership' 
    AND subType IN ('BASIC', 'PREMIUM')
    AND status = 'success'
    AND DATE(created_at) BETWEEN ? AND ?;
`;


       const [rows] = await pool.query(query, [startOfMonth, endOfMonth]);
        console.log({
            message: "Monthly transactions fetched successfully",
            monthlyIncome: rows[0].monthlyIncome|| 0,
        });

        return {
            message: "Monthly transactions fetched successfully",
            monthlyIncome: rows[0].monthlyIncome || 0, // Default to 0 if null
            startOfMonth,
            endOfMonth,
        };
    } catch (err) {
        // Handle error
        console.error('Error fetching monthly transactions:', err);
        console.log({
            message: "Error fetching monthly transactions",
            error: err.message,
        });
    }
};
// getMembershipTransactionsForMonth()
// getMembershipTransactionsForToday()
// getMembershipTransactionsForWeek()


module.exports = {
    getMembershipTransactionsForToday,
    getMembershipTransactionsForWeek,
    getMembershipTransactionsForMonth,
};
