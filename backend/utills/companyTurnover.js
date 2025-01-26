const { pool } = require('../config/database');
const moment = require('moment'); 


const getMembershipTransactionsForToday = async (req, res) => {
    try {
       
        const today = moment.utc().format('YYYY-MM-DD'); 

       
        console.log('Today\'s date (UTC):', today); 

        if (!today) {
            throw new Error('Invalid date');
        }

        const query = `
            SELECT * 
            FROM universal_transaction_table 
            WHERE type = 'Membership' 
              AND status = 'success'
              AND DATE(created_at) = ?; 
        `;

        const [rows] = await pool.query(query, [today]);

     
        console.log({
            message: "Transactions fetched successfully",
            data: rows,
        });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        console.log({
            message: "Error fetching transactions",
            error: err.message,
        });
    }
};

module.exports = { getMembershipTransactionsForToday };
