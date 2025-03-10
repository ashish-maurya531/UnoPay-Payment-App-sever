const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const containsSQLInjectionWords=require('../utills/sqlInjectionCheck');
const {getCommisionWalletBalance, getHoldTotalCommission} = require('../utills/checkUserBalance');
const generateTransactionId = require('../utills/generateTxnId');
const {sendWithdrawalEmail} = require('../utills/sendOtpMail');
const moment = require('moment-timezone');
const authenticateToken = require('../middleware/auth');
const { payoutTransfer, checkPayoutStatus, getBalance}=require("../utills/cashKawach");
function generateOrderId() {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const randomLetters = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const randomNumbers = Math.floor(1000000000 + Math.random() * 9000000000); // 13-digit random number
    return randomLetters + randomNumbers;
}




// Code for transferring from sender's commission wallet to receiver's flexi wallet
router.post("/person-to-person-transfer", authenticateToken,async (req, res) => {
    const { sender_member_id, receiver_member_id, commission_amount } = req.body;

    console.log(sender_member_id, receiver_member_id, commission_amount)
    // return res.status(200).json({status: 'false',message: "server is down"});


    if (!sender_member_id || !receiver_member_id || !commission_amount) {
        return res.status(200).json({ status: "false", message: "Sender Member ID, Receiver Member ID, and Commission Amount are required" });
    }

    if (containsSQLInjectionWords(sender_member_id) || containsSQLInjectionWords(receiver_member_id) || containsSQLInjectionWords(commission_amount)) {
        return res.status(200).json({ status: "false", message: "Don't try to hack" });
    }

    const [senderUser] = await pool.query('SELECT memberid, membership,status FROM usersdetails WHERE memberid =?', [sender_member_id]);
    const [receiverUser] = await pool.query('SELECT memberid,membership, status FROM usersdetails WHERE memberid =?', [receiver_member_id]);
    console.log("sender user: ", senderUser);
    console.log("receiver user: ", receiverUser);

    if (!senderUser.length) {
        return res.status(404).json({ status: "false", message: "Invalid sender Member ID" });
    }

    if (!receiverUser.length) {
        return res.status(200).json({ status: "false", message: "Invalid receiver Member ID" });
    }

    if (senderUser[0].status !== "active") {
        return res.status(200).json({ status: "false", message: "Sender user is not active" });
    }

    if (senderUser[0].membership==="FREE") {
        return res.status(200).json({ status: "false", message: "Sender user is not allowed to transfer money, he is a free member" });
    }

    if (receiverUser[0].status !== "active") {
        return res.status(200).json({ status: "false", message: "Receiver user is not active" });
    }

    if (commission_amount < 50) {
        return res.status(200).json({ status: "false", message: "Sending Amount should be greater than or equal to 50" });
    }
     //check kyc is done or not 
     const [kyc] = await pool.query('SELECT * FROM user_bank_kyc_details WHERE member_id=? AND Kyc_status =?', [sender_member_id, 'approved']);
     if (!kyc.length) {
         return res.status(200).json({ status: "false", message: "KYC Not done"});
         }

    const commission_wallet_balance = await getCommisionWalletBalance(sender_member_id);
    const holdTotalCommission = await getHoldTotalCommission(sender_member_id);
    const final_balance = Math.max(commission_wallet_balance - holdTotalCommission, 0);

    if (final_balance < commission_amount) {
        return res.status(200).json({ status: "false", message: "Insufficient balance in sender's wallet" });
    }

    const txn_id_for_sender = generateTransactionId();
    const txn_id_for_receiver = generateTransactionId();



    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [row1] = await connection.query(
            `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType, amount, status, message)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [txn_id_for_sender, sender_member_id, "Money Transfer", "P2P Transfer", commission_amount, "success", `Money Transferred to ${receiver_member_id} successfully`]
        );
        if (row1.affectedRows > 0) {
            console.log("Sender Money Transfer Transaction added in universal transaction table");
        }

        const [row0] = await connection.query(
            `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType, amount, status, message)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [txn_id_for_receiver, receiver_member_id, "Money Transfer", "P2P Transfer", commission_amount, "success", `Money Received from ${sender_member_id} successfully`]
        );
        if (row0.affectedRows > 0) {
            console.log("Sender Money Transfer Transaction added in universal transaction table2");
        }

        const [row2] = await connection.query(
            `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [sender_member_id, "Money Transfer", txn_id_for_sender, txn_id_for_sender, 0.0000000000, commission_amount, 0]
        );
        if (row2.affectedRows > 0) {
            console.log("Sender Commission Wallet transaction added");
        }

        const [row3] = await connection.query(
            `INSERT INTO flexi_wallet (member_id, transaction_id, credit, debit)
            VALUES (?, ?, ?, ?)`,
            [receiver_member_id, txn_id_for_receiver, commission_amount, 0.00]
        );
        if (row3.affectedRows > 0) {
            console.log("Receiver Flexi Wallet transaction added");
        }

        // Update sender's total money
        const [row4] = await connection.query(
            `UPDATE users_total_balance SET user_total_balance = user_total_balance - ?
            WHERE member_id =?`,
            [commission_amount, sender_member_id]
        );
        if (row4.affectedRows > 0) {
            console.log("Sender's total balance updated successfully");
        }

        // Update receiver's total money
        const [row5] = await connection.query(
            `UPDATE users_total_balance SET user_total_balance = user_total_balance + ?
            WHERE member_id =?`,
            [commission_amount, receiver_member_id]
        );
        if (row5.affectedRows > 0) {
            console.log("Receiver's total balance updated successfully");
        }

        await connection.commit();
        res.status(200).json({ status: "true", message: "Commission wallet transfer to receiver's flexi wallet successful" });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ status: "false", message: "Internal Server Error" });
    } finally {
        connection.release();
    }
});




// code for fund transfer from commissin wallet to flexi wallet 
router.post("/commissin-wallet-to-flexi-wallet",authenticateToken,async(req,res)=>{
    const { member_id, commission_amount } = req.body;
    console.log(member_id, commission_amount)
    // return res.status(200).json({status: 'false',message: "server is down"});
    if (!member_id || !commission_amount) {
        return res.status(200).json({status:"false", message: "Member ID and Commission Amount are required"});
    }
    
    if (containsSQLInjectionWords(member_id) || containsSQLInjectionWords(commission_amount)) {
        return res.status(400).json({ status:"false",message: "Don't try to hack" });
    }
    const [user] = await pool.query('SELECT memberid,status FROM usersdetails WHERE memberid =?', [member_id]);
    if (!user.length) {
        return res.status(404).json({ status:"false",message: "Invalid member ID" });
    }
    if (user[0].status!=="active") {
        return res.status(400).json({ status:"false",message: "User is not active" });
    }
     const [kyc] = await pool.query('SELECT * FROM user_bank_kyc_details WHERE member_id=? AND Kyc_status =?', [member_id, 'approved']);
     if (!kyc.length) {
         return res.status(200).json({ status: "false", message: "KYC Not done"});
         }
    if (commission_amount <= 0) {
        return res.status(200).json({status:"false", message: "Commission Amount should be a positive number" });
    }
    if (commission_amount<50){
        return res.status(200).json({status:"false", message: "Commission Amount should be greater than 50" });
    }
    const commission_wallet_balance = await getCommisionWalletBalance(member_id);
    const holdTotalCommission = await getHoldTotalCommission(member_id);
    const final_balance = Math.max(commission_wallet_balance - holdTotalCommission, 0);
    console.log("commission amount: ",commission_amount);
    console.log("Commission Wallet Balance: ", commission_wallet_balance);
    if (final_balance < commission_amount) {
        return res.status(400).json({ status:"false",message: "Insufficient commission amount in commission wallet" });
    }


    const txn_id = generateTransactionId();
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [row1]=await connection.query(`INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,amount, status, message) 
            VALUES (?,?,?,?,?,?,?)`,
            [txn_id,member_id,"Self Transfer","Commission wallet to Flexi Wallet",commission_amount,"success","Money Transfered Successfully"]);
        if(row1.affectedRows>0){
            console.log("Money Transafer Transaction added in universal transaction table");
            
        }
        const [row2]=await connection.query(
            `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit,level)
            VALUES (?,?,?,?,?,?,?)`,
            [member_id,"Self Transfer",txn_id,txn_id,0.0000000000,commission_amount,0]
        );
        if(row2.affectedRows>0){
            console.log("Commission Wallet transaction added in commission wallet");
        }
        const [row3]=await connection.query(
            `INSERT INTO flexi_wallet (member_id, transaction_id, credit, debit)
            VALUES (?,?,?,?)`,
            [member_id,txn_id,commission_amount,0.00]
            );
        if(row3.affectedRows>0){
            console.log("Flexi Wallet transaction added in flexi wallet");
        }
        //update user total money 
        const [row4]=await connection.query(`UPDATE users_total_balance SET user_total_balance = user_total_balance + ?
            WHERE member_id =?`,
            [commission_amount,member_id]
        );
        if(row4.affectedRows>0){
            console.log("User total money updated successfully");
        }

        //commit transaction
        await connection.commit();
        res.status(200).json({status:"true", message: "Commission wallet transfer successful"});
    } catch (error) {
        //rollback transaction
        await connection.rollback();
        console.error(error);
        res.status(500).json({status:"false", message: "Internal Server Error"});
        
    } finally {
        //release connection
        connection.release();
    }


})






//code for widthdraw request 


router.post('/user-withdraw-request', authenticateToken,async (req, res) => {
    const { member_id, amount } = req.body;
    // return res.status(200).json({status: 'false',message: "server is down"});

    if (!member_id || !amount) {
        return res.status(200).json({ status: "false", message: "Member ID and amount are required." });
    }

    if (amount <= 0) {
        return res.status(200).json({ status: "false", message: "Invalid Amount" });

    }
    //amount should be 250
    if (amount <250) {
        return res.status(200).json({ status: "false", message: "Withdrawal amount should be greater than 250." });
    }
    const user_commission_wallet_balance=await getCommisionWalletBalance(member_id);
    
    const holdTotalCommission = await getHoldTotalCommission(member_id);
    const final_balance = Math.max(user_commission_wallet_balance - holdTotalCommission, 0);
    console.log(final_balance)

    //sql injection 
    if (containsSQLInjectionWords(member_id) || containsSQLInjectionWords(amount)) {
        return res.status(400).json({ status: "false", message: "Don't try to hack." });
    }
    
    // check if member id is valid
    const [user] = await pool.query('SELECT memberid, status,membership FROM usersdetails WHERE memberid =?', [member_id]);
    const user_status=user[0]?.status
    const user_membership=user[0]?.membership
    if (!user.length) {
        return res.status(404).json({ status: "false", message: "Invalid member ID." });
    }
    // check if member is active
    if (user[0].status !== 'active') {
        return res.status(400).json({ status: "false", message: "Member is not active"});
    }

    //check kyc is done or not 
    const [kyc] = await pool.query('SELECT * FROM user_bank_kyc_details WHERE member_id=? AND Kyc_status =?', [member_id, 'approved']);
    if (!kyc.length) {
        return res.status(200).json({ status: "false", message: "KYC Not done"});
        }
    const kyc_status=kyc[0]?.Kyc_status;


    
    // check if user has enough money in flexi wallet
   
    
    console.log("withdrawal amount: ", amount);
    console.log("Commission Wallet Balance: ", user_commission_wallet_balance);
    if (final_balance < amount) {
        return res.status(200).json({ status: "false", message: "Insufficient balance in Commission Wallet." });
    }
    
    const txn_id = generateTransactionId();
    // make a connection
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            `INSERT INTO withdraw_requests (transaction_id, member_id, amount,kyc_status, membership, user_status, message) 
            VALUES (?,?,?,?,?,?,?)`,
            [txn_id, member_id, amount,kyc_status,user_membership,user_status,"withdrawal request pending"]
        );
    

        if (result.affectedRows===0) {
            return res.status(200).json({ status: "false", message: "Failed to create withdraw request." });
        } 
        console.log("added to withdraw request table");
        // entry in universal_transaction_table
        const [universal_result] = await connection.query(
            `INSERT INTO universal_transaction_table (transaction_id, member_id, amount, type, status,message) VALUES (?,?,?,?,?,?)`,
            [txn_id, member_id, amount, "Withdrawal Request", "success", "Withdrawal request created successfully."]
        );

     
        if (universal_result.affectedRows===0) {
            return res.status(200).json({ status: "false", message: "Failed to create entry in universal transaction table." });
        }  
        console.log("added to universal table")
        
        // insert the entry in commission wallet
        const [row2]=await connection.query(
            `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit,level)
            VALUES (?,?,?,?,?,?,?)`,
            [member_id,"Withdrawal Request",txn_id,txn_id,0.0000000000,amount,0]
        );
        if(row2.affectedRows>0){
            console.log("Commission Wallet transaction added in commission wallet");
        }
        // update user total money
        const [user_result] = await connection.query(
            `UPDATE users_total_balance SET user_total_balance = user_total_balance - ? WHERE member_id = ?`,
            [amount, member_id]
            );
            
            if (user_result.affectedRows===0) {
                return res.status(200).json({ status: "false", message: "Failed to update user total balance." });
            }
            console.log("updated user total balance")



        await connection.commit();
        return res.status(200).json({ status: "true", message: "Withdraw request created successfully." });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ status: "false", message: "Internal Server Error." });
    }
    finally {
        connection.release();
    
    }
}); 








////////////////////////////////////////////////////////////////
router.post('/update-status-user-withdraw-request', authenticateToken, async (req, res) => {
    console.log('Processing withdrawal status update request:', req.body);
    const { transaction_id, status, message, mode } = req.body;

    // Input validation
    if (!transaction_id || !status || !message || !mode) {
        console.log('Validation failed: Missing required fields');
        return res.status(400).json({ status: "false", message: "Transaction ID, status, message, and mode are required." });
    }

    if (!['rejected', 'done'].includes(status)) {
        console.log('Validation failed: Invalid status value:', status);
        return res.status(400).json({ status: "false", message: "Invalid status value." });
    }

    if (!['manual', 'api',"rejected"].includes(mode)) {
        console.log('Validation failed: Invalid mode value:', mode);
        return res.status(400).json({ status: "false", message: "Invalid mode value." });
    }

    try {
        // Fetch withdrawal details
        const [withdrawalDetails] = await pool.query(
            `SELECT member_id, amount, status as current_status FROM withdraw_requests WHERE transaction_id = ?`,
            [transaction_id]
        );

        if (withdrawalDetails.length === 0) {
            console.log('Withdrawal not found for transaction_id:', transaction_id);
            return res.status(400).json({ status: "false", message: "Withdrawal details not found." });
        }

        const { member_id, amount, current_status } = withdrawalDetails[0];
        
        // Check if withdrawal is already processed
        if (current_status === 'done' || current_status === 'rejected') {
            console.log('Withdrawal already processed:', current_status);
            return res.status(400).json({ status: "false", message: "Withdrawal already processed." });
        }
        
        console.log(`Processing withdrawal for member_id: ${member_id}, amount: ${amount}`);

        // CASE 1: Handle rejected withdrawals (regardless of mode)
        if (status === "rejected") {
            console.log('Handling REJECTION flow for transaction:', transaction_id);
            return await handleRejectedWithdrawal(member_id, amount, transaction_id, res);
        }
        
        // CASE 2: Handle approved withdrawals (status = done)
        // Get bank details first (needed for both manual and API modes)
        const [bankDetails] = await pool.query(
            `SELECT u.email, b.FullName, b.IFSC_Code, b.Bank_Name, b.Account_number 
             FROM usersdetails u
             INNER JOIN user_bank_kyc_details b ON u.memberid = b.member_id
             WHERE u.memberid = ?`,
            [member_id]
        );
        
        if (bankDetails.length === 0) {
            console.log('Bank details not found for member_id:', member_id);
            return res.status(400).json({ status: "false", message: "Bank details not found." });
        }

        const bankDetail = bankDetails[0];
        console.log('Bank details retrieved successfully for member:', member_id);

        // Process based on mode
        if (mode === "api") {
            console.log('Processing withdrawal via API for transaction:', transaction_id);
            return await handleApiWithdrawal(transaction_id, member_id, amount, bankDetail, res);
        } else if (mode === "manual") {
            console.log('Processing withdrawal manually for transaction:', transaction_id);
            return await handleManualWithdrawal(transaction_id, member_id, amount, bankDetail, res);
        }
    } catch (error) {
        console.error("Error processing withdrawal request:", error);
        return res.status(500).json({ status: "false", message: "Internal Server Error." });
    }
});
/**
 * Handles rejection of a withdrawal request
 */
async function handleRejectedWithdrawal(member_id, amount, transaction_id, res) {
    const connection = await pool.getConnection();
    const txn_id = generateTransactionId();
    console.log(`Generating refund transaction ${txn_id} for rejected withdrawal ${transaction_id}`);

    try {
        await connection.beginTransaction();
        console.log('Transaction started for rejection process');

        // Log the transaction in the universal transaction table
        await connection.query(
            `INSERT INTO universal_transaction_table (transaction_id, member_id, amount, type, status, message) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [txn_id, member_id, amount, "Withdrawal Rejected", "success", "Withdrawal rejected, money refunded."]
        );
        console.log('Logged transaction in universal_transaction_table');
        
        // Update the user's wallet balance
        await connection.query(
            `UPDATE users_total_balance 
             SET user_total_balance = user_total_balance + ? 
             WHERE member_id = ?`,
            [amount, member_id]
        );
        console.log(`Updated user wallet balance: credited ${amount} back to member ${member_id}`);

        // Log the refund in the commission wallet
        await connection.query(
            `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [member_id, "Withdrawal Rejected", txn_id, txn_id, amount, 0.0, 0]
        );
        console.log('Logged refund in commission_wallet');

        // Update the withdrawal request status
        await connection.query(
            `UPDATE withdraw_requests SET status = ?, message = ? WHERE transaction_id = ?`,
            ["rejected", "Withdrawal rejected, money refunded.", transaction_id]
        );
        console.log('Updated withdraw_requests status to rejected');

        await connection.commit();
        console.log('Transaction committed successfully for rejection process');
        
        return res.status(200).json({ 
            status: "true", 
            message: "Withdrawal request rejected successfully, funds refunded." 
        });
    } catch (error) {
        await connection.rollback();
        console.error("Error in rejection process:", error);
        return res.status(500).json({ status: "false", message: "Failed to process rejection." });
    } finally {
        connection.release();
    }
}

/**
 * Handles the API-based withdrawal process
 */
async function handleApiWithdrawal(transaction_id, member_id, amount, bankDetail, res) {
    console.log('Preparing API payload for transaction:', transaction_id);
    const order_id = generateOrderId();
    await pool.query(
        `UPDATE withdraw_requests SET order_id=? WHERE transaction_id = ?`,
        [order_id,transaction_id]
    );
    
    // Prepare payload for API
    const payload = {
        "OrderId": order_id,
        "BankName": bankDetail.Bank_Name,
        "AccountNo": bankDetail.Account_number,
        "Ifsc": bankDetail.IFSC_Code,
        "AccountHolderName": bankDetail.FullName,
        "AccountType": "Saving",
        "Amount": `${parseInt(amount)}`,
        "TxnMode": "IMPS",
        "Remarks": `Unopay withdrawal for ${bankDetail.FullName}`,
        "latitude": "28.6798",
        "longitude": "77.0927"
    };
    //  const payload = 
    //             {
    //                 "OrderId": order_id,
    //                 "BankName": "UNION BANK OF INDIA",
    //                 "AccountNo": "089422010000036",
    //                 "Ifsc": "UBIN0908941",
    //                 "AccountHolderName": "ASHISH",
    //                 "AccountType": "Saving",
    //                 "Amount": "100",
    //                 "TxnMode": "IMPS",
    //                 "Remarks": `okok`,
    //                 "latitude": "34.9",
    //                 "longitude": "56.9"
    //             }
            
    
    console.log('API Payload:', payload);
    
    try {
        // Call the payment gateway API
        // In production, replace this with: const result = await payoutTransfer(payload);
        // For now, using mock response
        const result = await payoutTransfer(payload);

        
        // Mock API response for testing
        // const result = {
        //     "statusCode": "TUP",
        //     "statusMsg": "Transaction Pending",
        //     "dataContent": {
        //         "OrderId": transaction_id,
        //         "bankrrnno": "lkf340930932093203",
        //         "accountno": bankDetail.Account_number,
        //         "amount": amount,
        //         "status": "PENDING", // Can be SUCCESS, PENDING, FAILED
        //         "Ifsccode": bankDetail.IFSC_Code,
        //         "name": bankDetail.FullName,
        //         "UTRNumber": "UTR" + Date.now().toString().substring(0, 10)
        //     }
        // };
        
        console.log('API Response:', result);
        
        // Check API response status
        if (!result || !result.dataContent) {
            console.log('Invalid API response received');
            return res.status(400).json({ 
                status: "false", 
                message: "Invalid response from payment gateway" 
            });
        }
        
        const apiStatus = result.dataContent.status;
        console.log('API transaction status:', apiStatus);
        
        // Handle based on API response
        if (apiStatus === 'SUCCESS' || apiStatus === 'PENDING') {
            console.log('API transfer successful or pending, updating database');
            
            // Update database with successful/pending transaction
            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();
                
                // Update withdrawal request status
                await connection.query(
                    `UPDATE withdraw_requests SET status = ?, message = ? WHERE transaction_id = ?`,
                    ["done", "sent to bank", transaction_id]
                );
                console.log('Updated withdraw_requests with status: done');
                
                // Update daily report
                const currentDateInKolkata = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
                await connection.query(
                    `INSERT INTO daily_AddFund_Withdraw_Report (Total_Bank_Withdraw, date_time)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE
                    Total_Bank_Withdraw = Total_Bank_Withdraw + VALUES(Total_Bank_Withdraw),
                    updated_at = CURRENT_TIMESTAMP`,
                    [amount, currentDateInKolkata]
                );
                console.log('Updated daily report with withdrawal amount');
                
                await connection.commit();
                console.log('Database transaction committed successfully');
                
                // // Send email notification
                // const emailData = {
                //     member_id,
                //     amount,
                //     email: bankDetail.email,
                //     Bank_Name: bankDetail.Bank_Name,
                //     Account_number: bankDetail.Account_number,
                //     utr_no: result.dataContent.UTRNumber,
                //     status: apiStatus
                // };
                // console.log('Sending withdrawal confirmation email to user', emailData);
                
                // await sendWithdrawalEmail(emailData);
                // console.log('Withdrawal confirmation email sent to user');
                
                return res.status(200).json({ 
                    status: "true", 
                    message: `Withdrawal processed ${apiStatus === 'PENDING' ? 'and pending' : 'successfully'}`, 
                    details: {
                        transaction_id: transaction_id,
                        status: apiStatus
                    }
                });
            } catch (error) {
                await connection.rollback();
                console.error("Database error during API withdrawal:", error);
                return res.status(500).json({ status: "false", message: "Database operation failed." });
            } finally {
                connection.release();
            }
        } else {
            // API transaction failed
            console.log('API transfer failed, returning error without database changes');
            return res.status(400).json({ 
                status: "false", 
                message: "Payment gateway transfer failed", 
                details: result 
            });
        }
    } catch (apiError) {
        console.error("API call failed:", apiError);
        return res.status(500).json({ 
            status: "false", 
            message: "Payment gateway error", 
            error: apiError.message 
        });
    }
}

/**
 * Handles manual withdrawal processing
 */
async function handleManualWithdrawal(transaction_id, member_id, amount, bankDetail, res) {
    console.log('Processing manual withdrawal for transaction:', transaction_id);
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        console.log('Database transaction started for manual withdrawal');
        
        // Update withdrawal request status
        const [updateResult] = await connection.query(
            `UPDATE withdraw_requests SET status = ?, message = ? WHERE transaction_id = ?`,
            ["done", "sent to bank", transaction_id]
        );
        
        if (updateResult.affectedRows === 0) {
            console.log('No rows updated for transaction_id:', transaction_id);
            await connection.rollback();
            return res.status(400).json({ status: "false", message: "Transaction not found or not updated." });
        }
        
        console.log('Updated withdraw_requests with status: done');
        
        // Update daily report
        const currentDateInKolkata = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
        await connection.query(
            `INSERT INTO daily_AddFund_Withdraw_Report (Total_Bank_Withdraw, date_time)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
            Total_Bank_Withdraw = Total_Bank_Withdraw + VALUES(Total_Bank_Withdraw),
            updated_at = CURRENT_TIMESTAMP`,
            [amount, currentDateInKolkata]
        );
        console.log('Updated daily report with withdrawal amount');
        
        await connection.commit();
        console.log('Database transaction committed successfully');
        
        // Send email notification
        const emailData = {
            member_id,
            amount,
            email: bankDetail.email,
            Bank_Name: bankDetail.Bank_Name,
            Account_number: bankDetail.Account_number,
            status: "sent to bank"
        };
        
        await sendWithdrawalEmail(emailData);
        console.log('Withdrawal confirmation email sent to user');
        
        return res.status(200).json({ 
            status: "true", 
            message: "Withdrawal processed manually and details sent successfully." 
        });
    } catch (error) {
        await connection.rollback();
        console.error("Database error during manual withdrawal:", error);
        return res.status(500).json({ status: "false", message: "Database operation failed." });
    } finally {
        connection.release();
    }
}
/////////////////////////////////////////////////////
























router.post('/get-user-withdraw-request',authenticateToken, async (req, res) => {
    const { member_id } = req.body;
    console.log("get user withdraw request api hit ")

    if (!member_id) {
        return res.status(200).json({ status: "false", message: "Member ID is required." });
    }
    
    if (containsSQLInjectionWords(member_id)) {
        return res.status(200).json({ status: "false", message: "Invalid input. SQL injection is not allowed." });
    }

    try {
        const [withdrawRows] = await pool.query(
            `SELECT * FROM withdraw_requests WHERE member_id = ?`,
            [member_id]
        );
    
        const [transactionRows] = await pool.query(
            `SELECT * FROM universal_transaction_table WHERE type IN ('Money Transfer', 'Self Transfer') AND member_id = ?`, 
            [member_id]
        );
    
        const formatTransactionData = (transaction) => {
            let formattedTransaction = {
                type: transaction.type,
                amount: transaction.amount,
                date_time: transaction.created_at, 
            };
    
            if (transaction.type === "Money Transfer") {
                const receiverMatch = transaction.message.match(/Money Transferred to (\S+)/);
                if (receiverMatch) {
                    formattedTransaction.receiver = receiverMatch[1];
                }
            }
    
            return formattedTransaction;
        };
    
        const withdrawData = withdrawRows.map((row) => ({
            type: "Bank Transfer",
            amount: row.amount,
            status: row.status,
            date_time: row.date_time, 
        }));
    
        const transactionData = transactionRows.map(formatTransactionData);
    
        const combinedData = [...withdrawData, ...transactionData];
    
        if (combinedData.length > 0) {
            return res.status(200).json({ success: "true", data: combinedData });
        } else {
            return res.status(200).json({
                success: "true",
                message: "No Transaction Data Found",
            });
        }
    
    } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(500).json({ success: "false", message: "Internal Server Error" });
    }
    
});

router.get('/all-withdraw-request', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 100;
        const offset = (page - 1) * limit;

        // Optimized query with proper JOIN and column selection
        const [withdrawRequests] = await pool.query(`
            SELECT 
                wr.*,
                wr.membership,
                kyc.bank_name,
                kyc.FullName,
                kyc.account_number,
                kyc.ifsc_code,
                kyc.Aadhar_Number

            FROM withdraw_requests wr
            LEFT JOIN user_bank_kyc_details kyc 
                ON wr.member_id = kyc.member_id
            ORDER BY 
                wr.date_time DESC,
                CASE wr.membership
                    WHEN 'PREMIUM' THEN 1
                    WHEN 'BASIC' THEN 2
                    ELSE 3
                END
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Get total count using a cheaper query
        const [totalCount] = await pool.query('SELECT COUNT(*) AS total FROM withdraw_requests');

        if (withdrawRequests.length === 0) {
            return res.status(404).json({
                status: "false",
                message: "No withdraw requests found."
            });
        }

        // Format data to include KYC details directly
        const data = withdrawRequests.map(request => ({
            ...request,
            kyc_details: {
                membership: request.membership,
                bank_name: request.bank_name,
                account_number: request.account_number,
                ifsc_code: request.ifsc_code,
                Aadhar_Number: request.Aadhar_Number,
                FullName: request.FullName
            }
        }));

        res.status(200).json({
            status: "true",
            data,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalRecords: totalCount[0].total
            }
        });

    } catch (error) {
        console.error('[Withdraw Request Error]:', error);
        res.status(500).json({ 
            status: "false", 
            message: "Internal Server Error." 
        });
    }
});
module.exports = router;