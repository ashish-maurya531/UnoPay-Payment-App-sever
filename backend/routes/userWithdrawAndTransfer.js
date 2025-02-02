const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');
const {getCommisionWalletBalance} = require('../utills/checkUserBalance');
const generateTransactionId = require('../utills/generateTxnId');



// Code for transferring from sender's commission wallet to receiver's flexi wallet
router.post("/person-to-person-transfer", async (req, res) => {
    const { sender_member_id, receiver_member_id, commission_amount } = req.body;
    console.log(sender_member_id, receiver_member_id, commission_amount)


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

    if (commission_amount < 4) {
        return res.status(200).json({ status: "false", message: "Sending Amount should be greater than or equal to 10" });
    }
     //check kyc is done or not 
     const [kyc] = await pool.query('SELECT * FROM user_bank_kyc_details WHERE member_id=? AND Kyc_status =?', [sender_member_id, 'approved']);
     if (!kyc.length) {
         return res.status(200).json({ status: "false", message: "KYC Not done"});
         }

    const commission_wallet_balance = await getCommisionWalletBalance(sender_member_id);
    if (commission_wallet_balance < commission_amount) {
        return res.status(200).json({ status: "false", message: "Insufficient balance in sender's wallet" });
    }

    const txn_id = generateTransactionId();

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [row1] = await connection.query(
            `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType, amount, status, message)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [txn_id, sender_member_id, "Money Transfer", "P2P Transfer", commission_amount, "success", `Money Transferred to ${receiver_member_id} successfully`]
        );
        if (row1.affectedRows > 0) {
            console.log("Sender Money Transfer Transaction added in universal transaction table");
        }

        const [row2] = await connection.query(
            `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [sender_member_id, sender_member_id, txn_id, txn_id, 0.0000000000, commission_amount, 0]
        );
        if (row2.affectedRows > 0) {
            console.log("Sender Commission Wallet transaction added");
        }

        const [row3] = await connection.query(
            `INSERT INTO flexi_wallet (member_id, transaction_id, credit, debit)
            VALUES (?, ?, ?, ?)`,
            [receiver_member_id, txn_id, commission_amount, 0.00]
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
router.post("/commissin-wallet-to-flexi-wallet",async(req,res)=>{
    const { member_id, commission_amount } = req.body;
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
    if (commission_amount<5){
        return res.status(200).json({status:"false", message: "Commission Amount should be greater than 200" });
    }
    const commission_wallet_balance = await getCommisionWalletBalance(member_id)
    console.log("commission amount: ",commission_amount);
    console.log("Commission Wallet Balance: ", commission_wallet_balance);
    if (commission_wallet_balance < commission_amount) {
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
            [member_id,member_id,txn_id,txn_id,0.0000000000,commission_amount,0]
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


router.post('/user-withdraw-request', async (req, res) => {
    const { member_id, amount } = req.body;

    if (!member_id || !amount) {
        return res.status(200).json({ status: "false", message: "Member ID and amount are required." });
    }

    if (amount <= 0) {
        return res.status(200).json({ status: "false", message: "Invalid Amount" });

    }
    //amount should be 250
    if (amount < 5) {
        return res.status(200).json({ status: "false", message: "Withdrawal amount should be greater than 500." });
    }

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
    const user_commission_wallet_balance=await getCommisionWalletBalance(member_id);
    console.log("withdrawal amount: ", amount);
    console.log("Commission Wallet Balance: ", user_commission_wallet_balance);
    if (user_commission_wallet_balance < amount) {
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
            [member_id,member_id,txn_id,txn_id,0.0000000000,amount,0]
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



router.post('/update-status-user-withdraw-request', async (req, res) => {
    const { transaction_id, status, message } = req.body;

    if (!transaction_id || !status || !message) {
        return res.status(400).json({ status: "false", message: "Transaction ID, status, and message are required." });
    }

    if (!['rejected', 'done'].includes(status)) {
        return res.status(400).json({ status: "false", message: "Invalid status value." });
    }

    let message2 = status === "done" ? "sent to bank" : message;

    try {
        // Update the status and message in the database
        const [updateResult] = await pool.query(
            `UPDATE withdraw_requests SET status = ?, message = ? WHERE transaction_id = ?`,
            [status, message2, transaction_id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({ status: "false", message: "Transaction not found or not updated." });
        }

        // Handle additional logic for rejected status
        if (status === "rejected") {
            const [withdrawalDetails] = await pool.query(
                `SELECT member_id, amount FROM withdraw_requests WHERE transaction_id = ?`,
                [transaction_id]
            );

            if (withdrawalDetails.length === 0) {
                return res.status(400).json({ status: "false", message: "Withdrawal details not found." });
            }

            const { member_id, amount } = withdrawalDetails[0];
            const connection = await pool.getConnection();
            const txn_id = generateTransactionId();

            try {
                await connection.beginTransaction();

                // Log the transaction in the universal transaction table
                await connection.query(
                    `INSERT INTO universal_transaction_table (transaction_id, member_id, amount, type, status, message) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [txn_id, member_id, amount, "Withdrawal Rejected", "success", "Withdrawal rejected, money refunded."]
                );

                // Update the user's wallet balance
                await connection.query(
                    `UPDATE users_total_balance 
                     SET user_total_balance = user_total_balance + ? 
                     WHERE member_id = ?`,
                    [amount, member_id]
                );

                // Log the refund in the commission wallet
                await connection.query(
                    `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [member_id, "Withdrawal Rejected", txn_id, txn_id, amount, 0.0, 0]
                );

                await connection.commit();
                return res.status(200).json({ status: "true", message: "Withdrawal request rejected successfully, funds refunded." });
            } catch (error) {
                await connection.rollback();
                console.error(error);
                return res.status(500).json({ status: "false", message: "Failed to process rejection." });
            } finally {
                connection.release();
            }
        }

        // Response for approved requests
        return res.status(200).json({ status: "true", message: "Withdrawal request processed successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "false", message: "Internal Server Error." });
    }
});





router.post('/get-user-withdraw-request', async (req, res) => {
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
            `SELECT * FROM universal_transaction_table WHERE type IN ('Money Transfer', 'Self Transfer')`
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


router.get('/all-withdraw-request', async (req, res) => {
    try {
        // Fetch all withdraw requests
        const [withdrawRequests] = await pool.query(`
            SELECT * FROM withdraw_requests
        `);

        if (withdrawRequests.length > 0) {
            // Fetch all KYC details
            const [kycDetails] = await pool.query(`
                SELECT * FROM user_bank_kyc_details
            `);

            // Map each withdraw request with its corresponding KYC details
            const data = withdrawRequests.map(request => {
                const kycDetail = kycDetails.filter(kyc => kyc.member_id === request.member_id);
                return {
                    ...request,
                    kyc_details: kycDetail || [], // Attach corresponding KYC details or an empty array
                };
            });

            return res.status(200).json({ status: "true", data });
        } else {
            return res.status(404).json({ status: "false", message: "No withdraw requests found." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "false", message: "Internal Server Error." });
    }
});



module.exports = router;