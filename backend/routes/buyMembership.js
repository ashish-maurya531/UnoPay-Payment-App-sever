const express = require('express');
const { pool } = require('../config/database');
const axios = require('axios');
const router = express.Router();
const generateTransactionId = require('../utills/generateTxnId');
const {getFlexiWalletBalance} = require('../utills/checkUserBalance');
const {commisionPayout} = require('../utills/commisionPayout');

//api for mobile recharge

// console.log(commisionPayout("","UP109796",""));

// //call the function
// const balance = getFlexiWalletBalance("UP100070");
// console.log(balance);

// Helper function to check for SQL injection
const containsSQLInjectionWords = (input) => {
    const sqlKeywords = [
        "SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "WHERE", "OR", "AND", "--", "#", "/\\*", "\\*/", ";", "=", "'", "\""
    ];
    const regex = new RegExp(sqlKeywords.join('|'), 'i');
    return regex.test(input);
};


// route to by membership plan 
router.post('/buymembership', async (req, res) => {
    const { package_name, member_id } = req.body;

    // Validate input
    if (!package_name || !member_id) {
        return res.status(400).json({ status: 'false', error: 'All required fields must be provided.' });
    }

    // Check for SQL injection
    const checkFields = [package_name, member_id].join(' ');
    if (containsSQLInjectionWords(checkFields)) {
        return res.status(400).json({ status: "false", error: "Don't try to hack !" });
    }
   
    const [packageRows] = await pool.query(
        `SELECT * FROM list_of_packages WHERE package_name = ?`,
        [package_name]
    );
    if (!packageRows.length) {
        return res.status(404).json({ status: 'false', error: 'Invalid package name' });
    }
    connection = await pool.getConnection();
    try {
        // Check if member_id exists
        const [userRows] = await pool.query(
            `SELECT memberid, membership,status FROM usersdetails WHERE memberid = ?`,
            [member_id]
        );
        if (!userRows.length) {
            return res.status(404).json({ status: 'false', error: 'Invalid member ID.' });
        }
        if (userRows[0].status==="inactive"){
            return res.status(400).json({ status: 'false', error: 'Your account is inactive.' });
        }
        if (userRows[0].membership==="BASIC" & package_name==="BASIC"){
            return res.status(400).json({ status: 'false', error: 'You are already a basic member.' });
        }
        
        if (userRows[0].membership==="PREMIUM"){
            return res.status(400).json({ status: 'false', error: 'You are already a premium member.' });

        }
        
      
        const price = packageRows[0].price;
        //total price with gst
        const total_price = packageRows[0].total_price;

        // Check if balance is sufficient
        const userflexiBalance = await getFlexiWalletBalance(member_id);
        if (userflexiBalance < total_price) {
            return res.status(400).json({ status: 'false', error: 'Insufficient balance.' });
        }
        // update user balance and insert into transaction table
        const txn_id = generateTransactionId();
        try {
            //place the entry in universal table sno, transaction_id, member_id, type, subType, recharge_to, amount, status, created_at, message
            //start transaction
            // Get a connection from the pool
            
            await connection.beginTransaction();
           
            const [rows] = await connection.query(
                `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,amount, status,message)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [txn_id, member_id, 'Membership', package_name, total_price, 'success', 'Membership Buyed Successfully']
            );
            if (rows.affectedRows>0) {
                console.log('Addition in universal transaction done successfully');
                }
            // place entry in flexi wallet table sno, member_id, credit, debit, message, created_at
            const [rows1] = await connection.query(
                `INSERT INTO flexi_wallet (member_id,transaction_id, credit, debit) VALUES (?, ?, ?, ?)`,
                [member_id,txn_id, 0.00, total_price]
            );
            if (rows1.affectedRows>0) {
                console.log('Addition in flexi wallet done successfully');
                }
            //UPDATE user_total_balance
            const [rows3] = await connection.query(
                `UPDATE users_total_balance SET user_total_balance = user_total_balance - ? WHERE member_id = ?`,
                [total_price, member_id]
                );
            if (rows3.affectedRows>0) {
                console.log('User total balance updated successfully');
                }
            // update entry in userdetails table membership
            const [rows2] = await connection.query(
                `UPDATE usersdetails SET membership = ? WHERE memberid = ?`,
                [package_name, member_id]
                );
            if (rows2.affectedRows>0) {
                console.log('Membership updated successfully');

                const commission_done=await commisionPayout(txn_id,package_name, member_id, price);
                if (commission_done) {
                    console.log('Commision distributed successfully');
                    }

                }
            // call the function to update the commission table

            


            
            //commit the transaction
            await connection.commit();
            
            return res.status(200).json({ status:'success', message: 'Membership purchased successfully.' });
        }
        catch (error) {
            console.error(error);
            // Rollback the transaction
            await connection.rollback();
            return res.status(500).json({ status: 'failed', error: 'Error while purchasing membership.' });
            }






    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'failed', error: 'Internal Server Error' });
    }
    finally {
        // Release the connection
        if (connection) connection.release();
    
    }
});

module.exports = router;
        
