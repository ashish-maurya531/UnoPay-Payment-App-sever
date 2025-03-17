// const express = require('express');
// const { pool } = require('../config/database');
// const axios = require('axios');
// const router = express.Router();
// const dotenv = require('dotenv');
// const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');
// const {commisionPayout_2} = require('../utills/commisionPayout_2'); //
// const generateTransactionId = require('../utills/generateTxnId');
// dotenv.config();
// const username = process.env.unopay_username;
// const pwd = process.env.unopay_pwd;

// // await commisionPayout(orderid,membership_status,MOBILE_RECHARGE,member_id,amount);

// //api for mobile recharge

//  //chekc the membership_status of user 
// //  async function abc(){
// //  const [membership_status] = await pool.query(`SELECT membership FROM usersdetails WHERE memberid = ?`,["UP136786"]);
// //  console.log(membership_status);
// //  console.log(membership_status[0]?.membership);

// //  }
// //  abc()
// // // Utility function to check for SQL injection
// // function containsSQLInjectionWords(input) {
// //     const sqlInjectionPatterns = [
// //         /SELECT/i, /INSERT/i, /DELETE/i, /UPDATE/i, /DROP/i, /--/i, /\*/i, /;/i
// //     ];
// //     return sqlInjectionPatterns.some((pattern) => pattern.test(input));
// // }



// // const result = commisionPayout_2(
// //     "TXN123456789",    // Original transaction ID
// //     "PREMIUM",         // User's membership level
// //     "MOBILE_RECHARGE", // Service type
// //     "UP140325",        // User ID
// //     2000               // Transaction amount
// // );

// // console.log('Payout Result:', result);
// // const result = commisionPayout_2(
// //   "TXN_TEST_3000", 
// //   "BASIC",
// //   "DTH_RECHARGE",
// //   "UP140325",
// //   3000
// // );

// // console.log('Payout Result:', result);

// // Function to fetch recharge balance from third-party API
// async function getRechargeBalance(format) {
//     console.log(username , pwd)
//     try {
//         // Third-party API endpoint
//         const apiUrl = `https://business.a1topup.com/recharge/balance?username=${(username)}&pwd=${encodeURIComponent(pwd)}&format=${encodeURIComponent(format)}`;

//         // Make GET request to the API
//         const response = await axios.get(apiUrl);

//         // Return the response data
//         return response.data;
//     } catch (error) {
//         console.error('Error fetching recharge balance:', error);
//         throw error;
//     }
// }




// router.post('/doMobileRecharge', async (req, res) => {
//     const { circlecode, operatorcode, number, amount, member_id } = req.body;
//     console.log("doMobileRecharge Api hit ",circlecode, operatorcode, amount, member_id);

//     // Validate input
//     if (!username || !pwd || !circlecode || !operatorcode || !number || !amount || !member_id) {
//         return res.status(200).json({ status: 'false', message: 'All required fields must be provided.' });
//     }

//     // Check for SQL injection
//     // const checkFields = [username, pwd, circlecode, operatorcode, number, amount, member_id].join(' ');
//     // if (containsSQLInjectionWords(checkFields)) {
//     //     return res.status(400).json({ status: "false", error: "Don't try to hack !" });
//     // }

//     try {
//         // Check if member_id exists
//         const [userRows] = await pool.query(
//             `SELECT user_total_balance FROM users_total_balance WHERE member_id = ?`,
//             [member_id]
//         );

//         if (userRows.length === 0) {
//             return res.status(200).json({ status: 'false', message: 'Invalid member ID.' });
//         }

      
//         // Fetch balance data from the API
//         const balanceData = await getRechargeBalance("json");

//         // Check if the balance is below the threshold
//         if (balanceData < parseFloat(amount)) {
//             console.log(balanceData);
//             console.log(amount);
//             console.log('Insufficient balance in the unopay fund.');
//             return res.status(200).json({ status: false, message:'Insufficient balance in the unopay fund.' });
//         }

//         //chekc the membership_status of user 
//         const [membership_row] = await pool.query(`SELECT membership FROM usersdetails WHERE memberid = ?`,[member_id]);
//         const membership_status = membership_row[0]?.membership;
//         console.log(membership_status);


//         const userBalance = userRows[0].user_total_balance;
//         console.log(userBalance);
        

//         // Check if balance is sufficient
//         if (parseFloat(userBalance) < parseFloat(amount)) {
//             return res.status(200).json({ status: 'false', message: 'User has Insufficient balance.' });
//         }

//         //make a connection
//         const connection = await pool.getConnection();
    
//         try {
//             // Begin transaction
//             await connection.beginTransaction();




//             // Generate unique order ID
//             const orderid = generateTransactionId();

//             // API URL with parameters
//             const apiUrl = `https://business.a1topup.com/recharge/api?username=${encodeURIComponent(username)}&pwd=${encodeURIComponent(pwd)}&circlecode=${encodeURIComponent(circlecode)}&operatorcode=${encodeURIComponent(operatorcode)}&number=${encodeURIComponent(number)}&amount=${encodeURIComponent(amount)}&orderid=${encodeURIComponent(orderid)}&format=json`;

//             // Call third-party API using Axios
//             const apiResponse = await axios.get(apiUrl);

//             // Parse response
//             const apiData = apiResponse.data;
//             console.log(apiData);
//             // if (!apiData || !apiData.status) {
//             //     return res.status(200).json({
//             //         status: 'false',
//             //         error: 'Failed to get a valid response from the provider.'
//             //     });
//             // }

//             // Save transaction details into the database
//             const transactionStatus = (apiData.status === 'Success' || apiData.status === 'Pending') ? 'success' : 'failed';
//             console.log("transaction status",transactionStatus);
         

//             // Update user's balance if the transaction was successful
//             if (transactionStatus === 'success') {

//                 const [rows] = await connection.query(
//                     `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,recharge_to,amount, status,message)
//                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//                     [orderid, member_id, 'Rechange', 'Mobile',number, amount, 'success', 'Recharge done Successfully']
//                 );
//                 if (rows.affectedRows>0) {
//                     console.log('Addition in universal transaction done successfully');
//                     }

//                 // place entry in flexi wallet table sno, member_id, credit, debit, message, created_at
//                 const [rows1] = await connection.query(
//                     `INSERT INTO flexi_wallet (member_id,transaction_id, credit, debit) VALUES (?, ?, ?, ?)`,
//                     [member_id, orderid, 0.00, amount]
//                 );
//                 if (rows1.affectedRows > 0) {
//                     console.log('Addition in flexi wallet done successfully');
//                     await commisionPayout_2(orderid,membership_status,"MOBILE_RECHARGE",member_id,amount);
//                 }

                


//                 await connection.query(
//                     `UPDATE users_total_balance SET user_total_balance = user_total_balance - ? WHERE member_id = ?`,
//                     [amount, member_id]
//                 );
//             }
//             else if (transactionStatus === "failed") {
//                 const [rows] = await connection.query(
//                     `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,recharge_to,amount, status,message)
//                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//                     [orderid, member_id, 'Rechange', 'Mobile', number, amount, 'failed', 'Recharge failed']
//                 );
//                 if (rows.affectedRows > 0) {
//                     console.log('only Addition in universal transaction done successfully');
//                 }
//             }
//              //commit the transaction
//              await connection.commit();
//              console.log({
//                 status: 'true',
//                 message: `Recharge ${transactionStatus}.`,
//                 data: apiData,
//             })
//             res.status(200).json({
//                 status: 'true',
//                 message: `Recharge ${transactionStatus}.`,
//                 data: apiData,
//             });
//         } catch (error) {
//             console.error(error);
//             // Rollback the transaction
//             await connection.rollback();
//             return res.status(200).json({
//                 status: 'false',
//                 message: 'Error while processing recharge.'
//             });
//         }
//     finally {
//         // Release the database connection
//         connection.release();
//     }


//     } catch (error) {
//         console.error('Error processing mobile recharge:', error);
//         res.status(200).json({ status: 'false', error: 'Internal server error.' });
//     }
// });






// router.post('/doDthRecharge', async (req, res) => {
//     const { circlecode, operatorcode, number, amount, member_id } = req.body;
//     console.log("doMobileRecharge Api hit ",circlecode, operatorcode, amount, member_id);

//     // Validate input
//     if (!username || !pwd || !circlecode || !operatorcode || !number || !amount || !member_id) {
//         return res.status(400).json({ status: 'false', error: 'All required fields must be provided.' });
//     }

//     // // Check for SQL injection
//     // const checkFields = [username, pwd, circlecode, operatorcode, number, amount, member_id].join(' ');
//     // if (containsSQLInjectionWords(checkFields)) {
//     //     return res.status(400).json({ status: "false", error: "Don't try to hack !" });
//     // }

//     try {
//         // Check if member_id exists
//         const [userRows] = await pool.query(
//             `SELECT user_total_balance FROM users_total_balance WHERE member_id = ?`,
//             [member_id]
//         );

//         if (userRows.length === 0) {
//             return res.status(404).json({ status: 'false', error: 'Invalid member ID.' });
//         }

      
//         // Fetch balance data from the API
//         const balanceData = await getRechargeBalance("json");

//         // Check if the balance is below the threshold
//         if (balanceData < parseFloat(amount)) {
//             console.log(balanceData);
//             console.log(amount);
//             console.log('Insufficient balance in the unopay fund.');
//             return res.status(400).json({ status: false, error:'Insufficient balance in the unopay fund.' });
//         }

//         //chekc the membership_status of user 
//         const [membership_row] = await pool.query(`SELECT membership FROM usersdetails WHERE memberid = ?`,[member_id]);
//         const membership_status = membership_row[0]?.membership;
//         console.log(membership_status);


//         const userBalance = userRows[0].user_total_balance;
//         console.log(userBalance);

//         // Check if balance is sufficient
//         if (parseFloat(userBalance) < parseFloat(amount)) {
//             return res.status(400).json({ status: 'false', error: 'Insufficient balance.' });
//         }

//         //make a connection
//         const connection = await pool.getConnection();
    
//         try {
//             // Begin transaction
//             await connection.beginTransaction();

//             // Generate unique order ID
//             const orderid = generateTransactionId();

//             // API URL with parameters
//             const apiUrl = `https://business.a1topup.com/recharge/api?username=${encodeURIComponent(username)}&pwd=${encodeURIComponent(pwd)}&circlecode=${encodeURIComponent(circlecode)}&operatorcode=${encodeURIComponent(operatorcode)}&number=${encodeURIComponent(number)}&amount=${encodeURIComponent(amount)}&orderid=${encodeURIComponent(orderid)}&format=json`;
//             // Call third-party API using Axios
//             const apiResponse = await axios.get(apiUrl);

//             // Parse response
//             const apiData = apiResponse.data;
//             console.log("api ka response->",apiData);
//             if (!apiData || !apiData.status) {
//                 return res.status(500).json({
//                     status: 'false',
//                     error: 'Failed to get a valid response from the provider.'
//                 });
//             }

//             // Save transaction details into the database
//             const transactionStatus = (apiData.status === 'Success' || apiData.status === 'Pending') ? 'success' : 'failed';
//             console.log("transaction status",transactionStatus);
         

//             // Update user's balance if the transaction was successful
//             if (transactionStatus === 'success') {

//                 const [rows] = await connection.query(
//                     `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,recharge_to,amount, status,message)
//                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//                     [orderid, member_id, 'Recharge', 'DTH',number, amount, 'success', 'Recharge done Successfully']
//                 );
//                 if (rows.affectedRows>0) {
//                     console.log('Addition in universal transaction done successfully');
//                     }

//                 // place entry in flexi wallet table sno, member_id, credit, debit, message, created_at
//                 const [rows1] = await connection.query(
//                     `INSERT INTO flexi_wallet (member_id,transaction_id, credit, debit) VALUES (?, ?, ?, ?)`,
//                     [member_id, orderid, 0.00, amount]
//                 );
//                 if (rows1.affectedRows > 0) {
//                     console.log('Addition in flexi wallet done successfully');
//                     await commisionPayout_2(orderid,membership_status,"DTH_RECHARGE",member_id,amount);
//                 }

                


//                 await connection.query(
//                     `UPDATE users_total_balance SET user_total_balance = user_total_balance - ? WHERE member_id = ?`,
//                     [amount, member_id]
//                 );
//             }
//             if (transactionStatus === "failed") {
//                 const [rows] = await connection.query(
//                     `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,recharge_to,amount, status,message)
//                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//                     [orderid, member_id, 'Recharge', 'DTH', number, amount, 'failed', 'Recharge failed']
//                 );
//                 if (rows.affectedRows > 0) {
//                     console.log('Addition in universal transaction done successfully');
//                 }
//             }
//              //commit the transaction
//              await connection.commit();
//             res.status(200).json({
//                 status: 'true',
//                 message: `Recharge ${transactionStatus}.`,
//                 data: apiData,
//             });
//         } catch (error) {
//             console.error(error);
//             // Rollback the transaction
//             await connection.rollback();
//             return res.status(500).json({
//                 status: 'false',
//                 error: 'Error while processing recharge.'
//             });
//         }
//     finally {
//         // Release the database connection
//         connection.release();
//     }


//     } catch (error) {
//         console.error('Error processing mobile recharge:', error);
//         res.status(500).json({ status: 'false', error: 'Internal server error.' });
//     }
// });



// // Route: /checkAdminRechargeApiBalance
// router.get('/checkAdminRechargeApiBalance', async (req, res) => {
//     // const { format = 'json' } = req.query; // Extract query parameters

//     // Validate input
//     if (!username || !pwd) {
//         return res.status(400).json({ status: false, error: 'Username and password are required.' });
//     }
//     // // Check for SQL injection
//     // if (containsSQLInjectionWords(username) || containsSQLInjectionWords(pwd)) {
//     //     return res.status(400).json({ status: false, error: "Don't try to hack " });
//     // }


//     try {
//         // const amountThreshold = 500; // Set threshold for balance comparison

//         // Fetch balance data from the API
//         const balanceData = await getRechargeBalance("json");

//         // // Check if the balance is below the threshold
//         // if (balanceData < amountThreshold) {
//         //     console.log(balanceData);
//         //     console.log(amountThreshold);
//         //     console.log('Insufficient balance in the unopay fund.');
//         //     return res.status(400).json({ status: false, error:'Insufficient balance in the unopay fund.' });
//         // }

//         // Success response when balance is sufficient
//         return res.status(200).json({
//             status: true,
//             message: 'Balance fetched successfully.',
//             data: balanceData
//         });
//     } catch (error) {
//         console.error('Error fetching recharge balance:', error.message);

//         return res.status(500).json({
//             status: false,
//             error: 'Unable to fetch balance. Please try again later.',
//             details: error.message
//         });
//     }
// });



// // Route: /checkRechargeStatus
// router.post('/checkRechargeStatus', async (req, res) => {
//   const { order_id, format = 'json' } = req.body;

//   // Validate input
//   if (!username || !pwd || !order_id) {
//       return res.status(400).json({ status: 'false', error: 'Username, password, and order ID are required.' });
//   }

//   // Check for SQL injection
//   if (containsSQLInjectionWords(order_id)) {
//       return res.status(400).json({ status: 'false', error: "Don't try to hack " });
//   }

//   try {

//     //first check order_id present in universal_transaction_table
//     const [orderRows] = await pool.query(
//         `SELECT * FROM universal_transaction_table WHERE transaction_id= ?`,
//         [order_id]
//     );
//     if (orderRows.length === 0) {
//       return res.status(404).json({ status: 'false', error: 'Invalid order ID.' });
//     }
//     const { status } = orderRows[0];
    
//     if (status === 'failed') {
//       return res.status(200).json({ status: 'false', message: 'Recharge failed.' });
//     }
    
//     if (status === 'pending') {
//       return res.status(200).json({ status: 'false', message: 'Recharge is still pending.' });
//     }

//       // Third-party API endpoint
//       const apiUrl = `http://business.a1topup.com/recharge/status?username=${encodeURIComponent(username)}&pwd=${encodeURIComponent(pwd)}&orderid=${encodeURIComponent(order_id)}&format=${encodeURIComponent(format)}`;

//       // Make GET request to the API
//       const response = await axios.get(apiUrl);

//       // Check the response and send back to the client
//       if (format === 'json') {
//           return res.status(200).json({
//               status: 'true',
//               message: 'Recharge status fetched successfully.',
//               data: response.data,
//           });
//       } else {
//           // Handle CSV or other formats
//           return res.status(200).json({
//               status: 'true',
//               message: 'Recharge status fetched successfully.',
//               data: response.data,
//           });
//       }
//   } catch (error) {
//       console.error('Error fetching recharge status:', error.message);

//       return res.status(500).json({
//           status: 'false',
//           error: 'Unable to fetch recharge status. Please try again later.',
//       });
//   }
// });




// module.exports = router;






  









const express = require('express');
const { pool } = require('../config/database');
const axios = require('axios');
const router = express.Router();
const generateTransactionId = require('../utills/generateTxnId');
const { commisionPayout_2 } = require('../utills/commisionPayout_2');
const { validateRechargeInput, containsSQLInjectionWords } = require('../utills/validators');
const { SERVICE_TYPES } = require('../config/constants');
const {getFlexiWalletBalance}= require('../utills/checkUserBalance.js');
const authenticateToken = require('../middleware/auth');

// Configuration
const RECHRAGE_API_BASE = 'https://business.a1topup.com/recharge/api';
const BALANCE_API_BASE = 'https://business.a1topup.com/recharge/balance';
const STATUS_API_BASE = 'http://business.a1topup.com/recharge/status';

// Shared transaction handler
async function handleRechargeTransaction(serviceType, req, res) {
    const transactionId = generateTransactionId();
    const startTime = Date.now();
    
    try {
        // Validate input
        const { error, value } = validateRechargeInput(req.body);
        if (error) {
            console.error(`[${transactionId}] Validation failed: ${error.message}`);
            return res.status(400).json({ 
                status: false,
                error: error.message 
            });
        }

        let { circlecode, operatorcode, number, amount, member_id } = value;
        if (operatorcode==="VI"){
            operatorcode = "V";
        }
        const serviceConfig = SERVICE_TYPES[serviceType];

        console.log(`[${transactionId}] Starting ${serviceConfig.name} recharge for ${member_id}, Amount: ${amount}`);

        // Check member existence and balance
        const [userData] = await pool.query(
            `SELECT u.user_total_balance, ud.membership 
             FROM users_total_balance u
             JOIN usersdetails ud ON u.member_id = ud.memberid
             WHERE u.member_id = ?`,
            [member_id]
        );

        if (!userData.length) {
            console.error(`[${transactionId}] Member not found: ${member_id}`);
            return res.status(200).json({ 
                status: "false",
                message: 'MemberId not found' 
            });
        }

        const { membership } = userData[0];
        const user_total_balance = await getFlexiWalletBalance(member_id);
        console.log(`[${transactionId}] User balance: ${user_total_balance}, Membership: ${membership}`);

        // Validate balances
        if (parseFloat(user_total_balance) < amount) {
            console.error(`[${transactionId}] Insufficient user balance`);
            return res.status(200).json({ 
                status: "false",
                message: 'Insufficient account balance' 
            });
        }

        // Get system balance
        const systemBalance = await getRechargeBalance();
        if (systemBalance < amount) {
            console.error(`[${transactionId}] Insufficient system balance`);
            return res.status(200).json({ 
                status: "false",
                message: 'Service temporarily unavailable' 
            });
        }

        const connection = await pool.getConnection();
        console.log(`[${transactionId}] Database connection acquired`);

        try {
            await connection.beginTransaction();
            console.log(`[${transactionId}] Transaction started`);

            // API Call
            const apiParams = new URLSearchParams({
                username: process.env.unopay_username,
                pwd: process.env.unopay_pwd,
                circlecode,
                operatorcode,
                number,
                amount,
                orderid: transactionId,
                format: 'json'
            });

            const apiResponse = await axios.get(`${RECHRAGE_API_BASE}?${apiParams}`, {
                timeout: 40000 // 10-second timeout
            });
            
            

            const apiData = apiResponse.data;
            console.log(`[${transactionId}] API response: ${JSON.stringify(apiData)}`);

            // Determine transaction status
            const transactionStatus = ['Success', 'Pending'].includes(apiData.status) ? 'success' : 'failed';
            console.log(`[${transactionId}] Transaction status: ${transactionStatus}`);

            // Save transaction
            await connection.query(
                `INSERT INTO universal_transaction_table 
                (transaction_id, member_id, type, subType, recharge_to, amount, status, message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    transactionId,
                    member_id,
                    serviceConfig.type,
                    serviceConfig.subType,
                    number,
                    amount,
                    transactionStatus,
                    `Recharge ${transactionStatus}`
                ]
            );

            if (transactionStatus === 'success') {
                // Update balances
                await connection.query(
                    `INSERT INTO flexi_wallet 
                    (member_id, transaction_id, credit, debit)
                    VALUES (?, ?, ?, ?)`,
                    [member_id, transactionId, 0, amount]
                );

                await connection.query(
                    `UPDATE users_total_balance 
                    SET user_total_balance = user_total_balance - ? 
                    WHERE member_id = ?`,
                    [amount, member_id]
                );

                // Process commission
                console.log(`[${transactionId}] Initiating commission payout`);
                await commisionPayout_2(
                    transactionId,
                    membership,
                    serviceConfig.commissionType,
                    member_id,
                    amount
                );
            }

            await connection.commit();
            console.log(`[${transactionId}] Transaction committed in ${Date.now() - startTime}ms`);
            console.log("-->",{
                status: "true",
                transactionId,
                transactionStatus,
                message: `Recharge ${transactionStatus}`,
                data: apiData
            })
            res.status(200).json({
                status: "true",
                transactionId,
                transactionStatus,
                message: `Recharge ${transactionStatus}`,
                data: apiData
            });

        } catch (error) {
            await connection.rollback();
            console.error(`[${transactionId}] Transaction failed: ${error.message}`);
            res.status(500).json({
                status: false,
                error: 'Transaction processing failed',
                transactionId
            });
        } finally {
            connection.release();
            console.log(`[${transactionId}] Connection released`);
        }

    } catch (error) {
        console.error(`[${transactionId}] System error: ${error.message}`);
        res.status(500).json({
            status: "false",
            error: 'System error',
            transactionId
        });
    }
}

// Routes
router.post('/doMobileRecharge', authenticateToken,async (req, res) => {
    await handleRechargeTransaction('MOBILE', req, res);
});

router.post('/doDthRecharge',authenticateToken, async (req, res) => {
    await handleRechargeTransaction('DTH', req, res);
});

// Additional endpoints
router.post('/checkAdminRechargeApiBalance', authenticateToken,async (req, res) => {
    try {
        const balanceData = await getRechargeBalance();
        res.status(200).json({
            status: true,
            balance: balanceData
        });
    } catch (error) {
        console.error('Balance check failed:', error.message);
        res.status(500).json({
            status: false,
            error: 'Balance check failed'
        });
    }
});

// Route: /checkRechargeStatus
router.post('/checkRechargeStatus', authenticateToken,async (req, res) => {
  const { order_id, format = 'json' } = req.body;

//   // Validate input
//   if (!username || !pwd || !order_id) {
//       return res.status(400).json({ status: 'false', error: 'Username, password, and order ID are required.' });
//   }

  // Check for SQL injection
//   if (await containsSQLInjectionWords(order_id)) {
//       return res.status(400).json({ status: 'false', error: "Don't try to hack " });
//   }

  try {

    // //first check order_id present in universal_transaction_table
    // const [orderRows] = await pool.query(
    //     `SELECT * FROM universal_transaction_table WHERE transaction_id= ?`,
    //     [order_id]
    // );
    // if (orderRows.length === 0) {
    //   return res.status(404).json({ status: 'false', error: 'Invalid order ID.' });
    // }
    // const { status } = orderRows[0];
    
    // if (status === 'failed') {
    //   return res.status(200).json({ status: 'false', message: 'Recharge failed.' });
    // }
    
    // if (status === 'pending') {
    //   return res.status(200).json({ status: 'false', message: 'Recharge is still pending.' });
    // }

      // Third-party API endpoint
      const apiUrl = `http://business.a1topup.com/recharge/status?username=${encodeURIComponent(process.env.unopay_username)}&pwd=${encodeURIComponent(process.env.unopay_pwd)}&orderid=${encodeURIComponent(order_id)}&format=${encodeURIComponent("json")}`;

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


// Helper functions
async function getRechargeBalance() {
    try {
        const params = new URLSearchParams({
            username: process.env.unopay_username,
            pwd: process.env.unopay_pwd,
            format: 'json'
        });


        const response = await axios.get(`${BALANCE_API_BASE}?${params}`, {
            timeout: 5000
        });
        // console.log(`System balance API response: ${JSON.stringify(response.data)}`);
        console.log(`System balance: ${response.data}`);

        return response.data || 0;
    } catch (error) {
        console.error('Balance API error:', error.message);
        throw new Error('Failed to retrieve system balance');
    }
}

module.exports = router;



