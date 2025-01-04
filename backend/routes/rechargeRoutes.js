const express = require('express');
const { pool } = require('../config/database');
const axios = require('axios');
const router = express.Router();
const dotenv = require('dotenv');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');
const {commisionPayout_2} = require('../utills/commisionPayout_2'); //
const generateTransactionId = require('../utills/generateTxnId');
dotenv.config();
const username = process.env.unopay_username;
const pwd = process.env.unopay_pwd;
// await commisionPayout(orderid,membership_status,MOBILE_RECHARGE,member_id,amount);

//api for mobile recharge

 //chekc the membership_status of user 
//  async function abc(){
//  const [membership_status] = await pool.query(`SELECT membership FROM usersdetails WHERE memberid = ?`,["UP136786"]);
//  console.log(membership_status);
//  console.log(membership_status[0]?.membership);

//  }
//  abc()
// // Utility function to check for SQL injection
// function containsSQLInjectionWords(input) {
//     const sqlInjectionPatterns = [
//         /SELECT/i, /INSERT/i, /DELETE/i, /UPDATE/i, /DROP/i, /--/i, /\*/i, /;/i
//     ];
//     return sqlInjectionPatterns.some((pattern) => pattern.test(input));
// }

// Function to fetch recharge balance from third-party API
async function getRechargeBalance(format) {
    console.log(username , pwd)
    try {
        // Third-party API endpoint
        const apiUrl = `https://business.a1topup.com/recharge/balance?username=${(username)}&pwd=${encodeURIComponent(pwd)}&format=${encodeURIComponent(format)}`;

        // Make GET request to the API
        const response = await axios.get(apiUrl);

        // Return the response data
        return response.data;
    } catch (error) {
        console.error('Error fetching recharge balance:', error);
        throw error;
    }
}




router.post('/doMobileRecharge', async (req, res) => {
    const { circlecode, operatorcode, number, amount, member_id } = req.body;

    // Validate input
    if (!username || !pwd || !circlecode || !operatorcode || !number || !amount || !member_id) {
        return res.status(400).json({ status: 'false', error: 'All required fields must be provided.' });
    }

    // // Check for SQL injection
    // const checkFields = [username, pwd, circlecode, operatorcode, number, amount, member_id].join(' ');
    // if (containsSQLInjectionWords(checkFields)) {
    //     return res.status(400).json({ status: "false", error: "Don't try to hack !" });
    // }

    try {
        // Check if member_id exists
        const [userRows] = await pool.query(
            `SELECT user_total_balance FROM users_total_balance WHERE member_id = ?`,
            [member_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ status: 'false', error: 'Invalid member ID.' });
        }

      
        // Fetch balance data from the API
        const balanceData = await getRechargeBalance("json");

        // Check if the balance is below the threshold
        if (balanceData < parseFloat(amount)) {
            console.log(balanceData);
            console.log(amount);
            console.log('Insufficient balance in the unopay fund.');
            return res.status(400).json({ status: false, error:'Insufficient balance in the unopay fund.' });
        }

        //chekc the membership_status of user 
        const [membership_row] = await pool.query(`SELECT membership FROM usersdetails WHERE memberid = ?`,[member_id]);
        const membership_status = membership_row[0]?.membership;
        console.log(membership_status);


        const userBalance = userRows[0].user_total_balance;
        

        // Check if balance is sufficient
        if (parseFloat(userBalance) < parseFloat(amount)) {
            return res.status(400).json({ status: 'false', error: 'Insufficient balance.' });
        }

        //make a connection
        const connection = await pool.getConnection();
    
        try {
            // Begin transaction
            await connection.beginTransaction();




            // Generate unique order ID
            const orderid = generateTransactionId();

            // API URL with parameters
            const apiUrl = `https://business.a1topup.com/recharge/api?username=${encodeURIComponent(username)}&pwd=${encodeURIComponent(pwd)}&circlecode=${encodeURIComponent(circlecode)}&operatorcode=${encodeURIComponent(operatorcode)}&number=${encodeURIComponent(number)}&amount=${encodeURIComponent(amount)}&orderid=${encodeURIComponent(orderid)}&format=json`;

            // Call third-party API using Axios
            const apiResponse = await axios.get(apiUrl);

            // Parse response
            const apiData = apiResponse.data;
            console.log(apiData);
            if (!apiData || !apiData.status) {
                return res.status(500).json({
                    status: 'false',
                    error: 'Failed to get a valid response from the provider.'
                });
            }

            // Save transaction details into the database
            const transactionStatus = apiData.status === 'Success' ? 'success' : 'failed';
         

            // Update user's balance if the transaction was successful
            if (transactionStatus === 'success') {

                const [rows] = await connection.query(
                    `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,recharge_to,amount, status,message)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [orderid, member_id, 'Rechange', 'Mobile',number, amount, 'success', 'Recharge done Successfully']
                );
                if (rows.affectedRows>0) {
                    console.log('Addition in universal transaction done successfully');
                    }

                // place entry in flexi wallet table sno, member_id, credit, debit, message, created_at
                const [rows1] = await connection.query(
                    `INSERT INTO flexi_wallet (member_id,transaction_id, credit, debit) VALUES (?, ?, ?, ?)`,
                    [member_id, orderid, 0.00, amount]
                );
                if (rows1.affectedRows > 0) {
                    console.log('Addition in flexi wallet done successfully');
                    await commisionPayout_2(orderid,membership_status,"MOBILE_RECHARGE",member_id,amount);
                }

                


                await connection.query(
                    `UPDATE users_total_balance SET user_total_balance = user_total_balance - ? WHERE member_id = ?`,
                    [amount, member_id]
                );
            }
            if (transactionStatus === "failed") {
                const [rows] = await connection.query(
                    `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,recharge_to,amount, status,message)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [orderid, member_id, 'Rechange', 'Mobile', number, amount, 'failed', 'Recharge failed']
                );
                if (rows.affectedRows > 0) {
                    console.log('Addition in universal transaction done successfully');
                }
            }
             //commit the transaction
             await connection.commit();
            res.status(200).json({
                status: 'true',
                message: `Recharge ${transactionStatus}.`,
                data: apiData,
            });
        } catch (error) {
            console.error(error);
            // Rollback the transaction
            await connection.rollback();
            return res.status(500).json({
                status: 'false',
                error: 'Error while processing recharge.'
            });
        }
    finally {
        // Release the database connection
        connection.release();
    }


    } catch (error) {
        console.error('Error processing mobile recharge:', error);
        res.status(500).json({ status: 'false', error: 'Internal server error.' });
    }
});






router.post('/doDthRecharge', async (req, res) => {
    const { circlecode, operatorcode, number, amount, member_id } = req.body;

    // Validate input
    if (!username || !pwd || !circlecode || !operatorcode || !number || !amount || !member_id) {
        return res.status(400).json({ status: 'false', error: 'All required fields must be provided.' });
    }

    // // Check for SQL injection
    // const checkFields = [username, pwd, circlecode, operatorcode, number, amount, member_id].join(' ');
    // if (containsSQLInjectionWords(checkFields)) {
    //     return res.status(400).json({ status: "false", error: "Don't try to hack !" });
    // }

    try {
        // Check if member_id exists
        const [userRows] = await pool.query(
            `SELECT user_total_balance FROM users_total_balance WHERE member_id = ?`,
            [member_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ status: 'false', error: 'Invalid member ID.' });
        }

      
        // Fetch balance data from the API
        const balanceData = await getRechargeBalance("json");

        // Check if the balance is below the threshold
        if (balanceData < parseFloat(amount)) {
            console.log(balanceData);
            console.log(amount);
            console.log('Insufficient balance in the unopay fund.');
            return res.status(400).json({ status: false, error:'Insufficient balance in the unopay fund.' });
        }

        //chekc the membership_status of user 
        const [membership_row] = await pool.query(`SELECT membership FROM usersdetails WHERE memberid = ?`,[member_id]);
        const membership_status = membership_row[0]?.membership;
        console.log(membership_status);


        const userBalance = userRows[0].user_total_balance;
        

        // Check if balance is sufficient
        if (parseFloat(userBalance) < parseFloat(amount)) {
            return res.status(400).json({ status: 'false', error: 'Insufficient balance.' });
        }

        //make a connection
        const connection = await pool.getConnection();
    
        try {
            // Begin transaction
            await connection.beginTransaction();




            // Generate unique order ID
            const orderid = generateTransactionId();

            // API URL with parameters
            const apiUrl = `https://business.a1topup.com/recharge/api?username=${encodeURIComponent(username)}&pwd=${encodeURIComponent(pwd)}&circlecode=${encodeURIComponent(circlecode)}&operatorcode=${encodeURIComponent(operatorcode)}&number=${encodeURIComponent(number)}&amount=${encodeURIComponent(amount)}&orderid=${encodeURIComponent(orderid)}&format=json`;

            // Call third-party API using Axios
            const apiResponse = await axios.get(apiUrl);

            // Parse response
            const apiData = apiResponse.data;
            console.log(apiData);
            if (!apiData || !apiData.status) {
                return res.status(500).json({
                    status: 'false',
                    error: 'Failed to get a valid response from the provider.'
                });
            }

            // Save transaction details into the database
            const transactionStatus = apiData.status === 'Success' ? 'success' : 'failed';
         

            // Update user's balance if the transaction was successful
            if (transactionStatus === 'success') {

                const [rows] = await connection.query(
                    `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,recharge_to,amount, status,message)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [orderid, member_id, 'Rechange', 'DTH',number, amount, 'success', 'Recharge done Successfully']
                );
                if (rows.affectedRows>0) {
                    console.log('Addition in universal transaction done successfully');
                    }

                // place entry in flexi wallet table sno, member_id, credit, debit, message, created_at
                const [rows1] = await connection.query(
                    `INSERT INTO flexi_wallet (member_id,transaction_id, credit, debit) VALUES (?, ?, ?, ?)`,
                    [member_id, orderid, 0.00, amount]
                );
                if (rows1.affectedRows > 0) {
                    console.log('Addition in flexi wallet done successfully');
                    await commisionPayout_2(orderid,membership_status,"DTH_RECHARGE",member_id,amount);
                }

                


                await connection.query(
                    `UPDATE users_total_balance SET user_total_balance = user_total_balance - ? WHERE member_id = ?`,
                    [amount, member_id]
                );
            }
            if (transactionStatus === "failed") {
                const [rows] = await connection.query(
                    `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,recharge_to,amount, status,message)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [orderid, member_id, 'Rechange', 'DTH', number, amount, 'failed', 'Recharge failed']
                );
                if (rows.affectedRows > 0) {
                    console.log('Addition in universal transaction done successfully');
                }
            }
             //commit the transaction
             await connection.commit();
            res.status(200).json({
                status: 'true',
                message: `Recharge ${transactionStatus}.`,
                data: apiData,
            });
        } catch (error) {
            console.error(error);
            // Rollback the transaction
            await connection.rollback();
            return res.status(500).json({
                status: 'false',
                error: 'Error while processing recharge.'
            });
        }
    finally {
        // Release the database connection
        connection.release();
    }


    } catch (error) {
        console.error('Error processing mobile recharge:', error);
        res.status(500).json({ status: 'false', error: 'Internal server error.' });
    }
});



// Route: /checkAdminRechargeApiBalance
router.get('/checkAdminRechargeApiBalance', async (req, res) => {
    // const { format = 'json' } = req.query; // Extract query parameters

    // Validate input
    if (!username || !pwd) {
        return res.status(400).json({ status: false, error: 'Username and password are required.' });
    }
    // // Check for SQL injection
    // if (containsSQLInjectionWords(username) || containsSQLInjectionWords(pwd)) {
    //     return res.status(400).json({ status: false, error: "Don't try to hack " });
    // }


    try {
        // const amountThreshold = 500; // Set threshold for balance comparison

        // Fetch balance data from the API
        const balanceData = await getRechargeBalance("json");

        // // Check if the balance is below the threshold
        // if (balanceData < amountThreshold) {
        //     console.log(balanceData);
        //     console.log(amountThreshold);
        //     console.log('Insufficient balance in the unopay fund.');
        //     return res.status(400).json({ status: false, error:'Insufficient balance in the unopay fund.' });
        // }

        // Success response when balance is sufficient
        return res.status(200).json({
            status: true,
            message: 'Balance fetched successfully.',
            data: balanceData
        });
    } catch (error) {
        console.error('Error fetching recharge balance:', error.message);

        return res.status(500).json({
            status: false,
            error: 'Unable to fetch balance. Please try again later.',
            details: error.message
        });
    }
});



// Route: /checkRechargeStatus
router.post('/checkRechargeStatus', async (req, res) => {
  const { order_id, format = 'json' } = req.body;

  // Validate input
  if (!username || !pwd || !order_id) {
      return res.status(400).json({ status: 'false', error: 'Username, password, and order ID are required.' });
  }

  // Check for SQL injection
  if (containsSQLInjectionWords(order_id)) {
      return res.status(400).json({ status: 'false', error: "Don't try to hack " });
  }

  try {

    //first check order_id present in universal_transaction_table
    const [orderRows] = await pool.query(
        `SELECT * FROM universal_transaction_table WHERE transaction_id= ?`,
        [order_id]
    );
    if (orderRows.length === 0) {
      return res.status(404).json({ status: 'false', error: 'Invalid order ID.' });
    }
    const { status } = orderRows[0];
    
    if (status === 'failed') {
      return res.status(200).json({ status: 'false', message: 'Recharge failed.' });
    }
    
    if (status === 'pending') {
      return res.status(200).json({ status: 'false', message: 'Recharge is still pending.' });
    }

      // Third-party API endpoint
      const apiUrl = `http://business.a1topup.com/recharge/status?username=${encodeURIComponent(username)}&pwd=${encodeURIComponent(pwd)}&orderid=${encodeURIComponent(order_id)}&format=${encodeURIComponent(format)}`;

      // Make GET request to the API
      const response = await axios.get(apiUrl);

      // Check the response and send back to the client
      if (format === 'json') {
          return res.status(200).json({
              status: 'true',
              message: 'Recharge status fetched successfully.',
              data: response.data,
          });
      } else {
          // Handle CSV or other formats
          return res.status(200).json({
              status: 'true',
              message: 'Recharge status fetched successfully.',
              data: response.data,
          });
      }
  } catch (error) {
      console.error('Error fetching recharge status:', error.message);

      return res.status(500).json({
          status: 'false',
          error: 'Unable to fetch recharge status. Please try again later.',
      });
  }
});




module.exports = router;






  













