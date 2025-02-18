const { pool } = require('../config/database');
// const moment = require('moment'); 
const moment = require('moment-timezone');


const getMembershipTransactionsForToday = async (req, res) => {
    try {
        const today = moment().tz("Asia/Kolkata").subtract(1, 'days').format('YYYY-MM-DD');

        // const today = moment.itc().subtract(1, 'days').format('YYYY-MM-DD');
        console.log(today);

        // const today = moment.utc().format('YYYY-MM-DD'); 

        console.log('Today\'s date (UTC):', today); 

        if (!today) {
            throw new Error('Invalid date');
        }

        // SQL query to get all transactions where type is 'Membership', status is 'success', and the date is today
        const query = `
            SELECT 
                550 * COUNT(CASE WHEN subType = 'BASIC' THEN 1 END) 
                + 55 * COUNT(CASE WHEN subType = 'PREMIUM' THEN 1 END) 
                AS todayIncome
            FROM universal_transaction_table 
            WHERE type = 'Membership' 
            AND subType IN ('BASIC', 'PREMIUM')  -- Include both subtypes
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
        const startOfWeek = moment().tz("Asia/Kolkata").subtract(1, 'weeks').startOf('week').format('YYYY-MM-DD');
        const endOfWeek = moment().tz("Asia/Kolkata").subtract(1, 'weeks').endOf('week').format('YYYY-MM-DD');

        console.log("Previous Week Start:", startOfWeek);
        console.log("Previous Week End:", endOfWeek);
        // const startOfWeek = moment.utc().startOf('week').format('YYYY-MM-DD'); // Start of this week in UTC format
        // const endOfWeek = moment.utc().endOf('week').format('YYYY-MM-DD'); // End of this week in UTC format

        // console.log('Start of the week (UTC):', startOfWeek);
        // console.log('End of the week (UTC):', endOfWeek);

        // Query to get weekly income
        const query = `
            SELECT 
    550 * COUNT(CASE WHEN subType = 'BASIC' THEN 1 END) 
    + 55 * COUNT(CASE WHEN subType = 'PREMIUM' THEN 1 END) 
    AS todayIncome
FROM universal_transaction_table 
WHERE type = 'Membership' 
  AND subType IN ('BASIC', 'PREMIUM')  -- Include both subtypes
  AND status = 'success'
  AND DATE(created_at)  BETWEEN ? AND ?;
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
        const startOfMonth = moment().tz("Asia/Kolkata").subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
        const endOfMonth = moment().tz("Asia/Kolkata").subtract(1, 'months').endOf('month').format('YYYY-MM-DD');

        console.log("Previous Month Start:", startOfMonth);
        console.log("Previous Month End:", endOfMonth);

        
        // const startOfMonth = moment.utc().startOf('month').format('YYYY-MM-DD'); // Start of this month in UTC format
        // const endOfMonth = moment.utc().endOf('month').format('YYYY-MM-DD'); // End of this month in UTC format

        // console.log('Start of the month (UTC):', startOfMonth);
        // console.log('End of the month (UTC):', endOfMonth);

        // Query to get monthly income
        const query = `
           SELECT
    550 * COUNT(CASE WHEN subType = 'BASIC' THEN 1 END)
    + 55 * COUNT(CASE WHEN subType = 'PREMIUM' THEN 1 END)
    AS todayIncome
FROM universal_transaction_table
WHERE type = 'Membership'
  AND subType IN ('BASIC', 'PREMIUM')  -- Include both subtypes
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

module.exports = {
    getMembershipTransactionsForToday,
    getMembershipTransactionsForWeek,
    getMembershipTransactionsForMonth,
};
