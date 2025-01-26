const express = require('express');
const { pool } = require('../config/database');
const moment = require('moment'); // For handling date and time

// Function to get Membership transactions with success status for the current day
const getMembershipTransactionsForToday = async (req, res) => {
    try {
        const today = moment.utc().format('YYYY-MM-DD'); // Today's date in UTC format

        console.log('Today\'s date (UTC):', today); 

        if (!today) {
            throw new Error('Invalid date');
        }

        // Query to get today's income
        const query = `
            SELECT sum(amount) as "todayIncome"
            FROM universal_transaction_table 
            WHERE type = 'Membership' 
              AND status = 'success'
              AND DATE(created_at) = ?;
        `;

        const [rows] = await pool.query(query, [today]);

        console.log({
            message: "Today's transactions fetched successfully",
            todayIncome: rows[0].todayIncome,
        });

        return {
            message: "Today's transactions fetched successfully",
            todayIncome: rows[0].todayIncome || 0, // Default to 0 if null
        };
    } catch (err) {
        // Handle error
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
        const startOfWeek = moment.utc().startOf('week').format('YYYY-MM-DD'); // Start of this week in UTC format
        const endOfWeek = moment.utc().endOf('week').format('YYYY-MM-DD'); // End of this week in UTC format

        console.log('Start of the week (UTC):', startOfWeek);
        console.log('End of the week (UTC):', endOfWeek);

        // Query to get weekly income
        const query = `
            SELECT sum(amount) as "weeklyIncome"
            FROM universal_transaction_table 
            WHERE type = 'Membership' 
              AND status = 'success'
              AND DATE(created_at) BETWEEN ? AND ?;
        `;

        const [rows] = await pool.query(query, [startOfWeek, endOfWeek]);

        console.log({
            message: "Weekly transactions fetched successfully",
            weeklyIncome: rows[0].weeklyIncome,
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
        const startOfMonth = moment.utc().startOf('month').format('YYYY-MM-DD'); // Start of this month in UTC format
        const endOfMonth = moment.utc().endOf('month').format('YYYY-MM-DD'); // End of this month in UTC format

        console.log('Start of the month (UTC):', startOfMonth);
        console.log('End of the month (UTC):', endOfMonth);

        // Query to get monthly income
        const query = `
            SELECT sum(amount) as "monthlyIncome"
            FROM universal_transaction_table 
            WHERE type = 'Membership' 
              AND status = 'success'
              AND DATE(created_at) BETWEEN ? AND ?;
        `;

        const [rows] = await pool.query(query, [startOfMonth, endOfMonth]);

        console.log({
            message: "Monthly transactions fetched successfully",
            monthlyIncome: rows[0].monthlyIncome,
        });

        return {
            message: "Monthly transactions fetched successfully",
            monthlyIncome: rows[0].monthlyIncome || 0, // Default to 0 if null
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
