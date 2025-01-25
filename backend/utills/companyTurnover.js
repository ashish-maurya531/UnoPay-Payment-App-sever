const express = require('express');
const { pool } = require('../config/database');
const moment = require('moment'); // For handling date and time

// Function to get Membership transactions with success status for the current day
const getMembershipTransactionsForToday = async (req, res) => {
    try {
        // Get today's date in UTC format (YYYY-MM-DD) without the time part
        const today = moment.utc().format('YYYY-MM-DD'); // Ensure it is in string format

        // Debugging: Log today's date
        console.log('Today\'s date (UTC):', today); 

        if (!today) {
            throw new Error('Invalid date');
        }

        // SQL query to get all transactions where type is 'Membership', status is 'success', and the date is today
        const query = `
            SELECT * 
            FROM universal_transaction_table 
            WHERE type = 'Membership' 
              AND status = 'success'
              AND DATE(created_at) = ?; 
        `;

        // Execute the query with the current UTC date
        const [rows] = await pool.query(query, [today]);

        // Send the response with the result
        console.log({
            message: "Transactions fetched successfully",
            data: rows,
        });
    } catch (err) {
        // Handle error
        console.error('Error fetching transactions:', err);
        console.log({
            message: "Error fetching transactions",
            error: err.message,
        });
    }
};

module.exports = { getMembershipTransactionsForToday };
