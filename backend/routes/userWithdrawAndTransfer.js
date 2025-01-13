const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');
const { getFlexiWalletBalance,getCommisionWalletBalance} = require('../utills/checkUserBalance');
const generateTransactionId = require('../utills/generateTxnId');

// code for fund transfer from commissin wallet to flexi wallet 
router.post("/commissin-wallet-to-flexi-wallet",async(req,res)=>{
    const { member_id, commission_amount } = req.body;
    // check if member_id and commission_amount are not empty
    if (!member_id || !commission_amount) {
        return res.status(200).json({status:"false", message: "Member ID and Commission Amount are required"});
    }
    
    //sql injection
    if (containsSQLInjectionWords(member_id) || containsSQLInjectionWords(commission_amount)) {
        return res.status(400).json({ status:"false",message: "Don't try to hack" });
    }
    //check if member id is valid 
    const [user] = await pool.query('SELECT memberid,status FROM usersdetails WHERE memberid =?', [member_id]);
    if (!user.length) {
        return res.status(404).json({ status:"false",message: "Invalid member ID" });
    }
    //check the status of the member
    if (user[0].status!=="active") {
        return res.status(400).json({ status:"false",message: "User is not active" });
    }
    //check if commission amount is valid
    if (commission_amount <= 0) {
        return res.status(200).json({status:"false", message: "Commission Amount should be a positive number" });
    }
    //500 limit 
    if (commission_amount<30){
        return res.status(200).json({status:"false", message: "Commission Amount should be greater than 200" });
    }
    //check if user has enough commission amount in commissin wallet
    const commission_wallet_balance = await getCommisionWalletBalance(member_id)
    console.log("commission amount: ",commission_amount);
    console.log("Commission Wallet Balance: ", commission_wallet_balance);
    if (commission_wallet_balance < commission_amount) {
        return res.status(400).json({ status:"false",message: "Insufficient commission amount in commission wallet" });
    }


    const txn_id = generateTransactionId();
    //make a connection
    const connection = await pool.getConnection();
    try {
        //start transaction
        await connection.beginTransaction();
        const [row1]=await connection.query(`INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,amount, status, message) 
            VALUES (?,?,?,?,?,?,?)`,
            [txn_id,member_id,"Money Transfer","Commission wallet to Flexi Wallet",commission_amount,"success","Money Transfered Successfully"]);
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
    const user_commission_wallet_balance=getCommisionWalletBalance(member_id);
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




// router.post('/update-status-user-withdraw-request', async (req, res) => {
//     const { transaction_id, status,message } = req.body;

//     if (!transaction_id || !status|| !message) {
//         return res.status(400).json({ status: "false", message: "Transaction ID and status are required." });
//     }

//     if (!['rejected', 'done'].includes(status)) {
//         return res.status(400).json({ status: "false", message: "Invalid status value." });
//     }
//     if (status==="done"){
//         var message2="sent to bank"
//     }
//     else{
//         var message2=message
//     }
//     try {
//         const [result] = await pool.query(
//             `UPDATE withdraw_requests SET status = ?, message=? WHERE transaction_id = ?`,
//             [status, message2, transaction_id]
//         );


//         console.log(status);
//         if (status=="rejected"){
//             // make a connection

//             const [result] = await pool.query(`SELECT member_id,amount FROM withdraw_requests WHERE transaction_id=?`, [transaction_id])
//             const member_id=result[0].member_id
//             const amount=result[0].amount
//             const connection = await pool.getConnection();
//             const txn_id=generateTransactionId();
           
//             try {

//                 await connection.beginTransaction();
                
//                 const [universal_result] = await connection.query(
//                     `INSERT INTO universal_transaction_table (transaction_id, member_id, amount, type, status,message) VALUES (?,?,?,?,?,?)`,
//                     [txn_id, member_id, amount, "Withdrawal Rejected", "success", "Withdrawal Rejected,Money Back to You successfully."]
//                 );


//                 if (universal_result.affectedRows === 0) {
//                     return res.status(200).json({ status: "false", message: "Failed to create entry in universal transaction table." });
//                 }
//                 console.log("rejected sp added to universal table2")

//                 // insert the entry in flexi wallet
//                 const [row2]=await connection.query(
//                     `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit,level)
//                     VALUES (?,?,?,?,?,?,?)`,
//                     [member_id,member_id,txn_id,txn_id,amount,0.0000000000,0]
//                 );
//                 if(row2.affectedRows>0){
//                     console.log("rejected so back to commission_wallet");
//                 }
//                 // update user total money
//                 const [user_result] = await connection.query(
//             `UPDATE users_total_balance SET user_total_balance = user_total_balance + ? WHERE member_id = ?`,
//             [amount, member_id]
//             );
            
//             if (user_result.affectedRows===0) {
//                 return res.status(200).json({ status: "false", message: "Failed to update user total balance." });
//             }
//             console.log("rejected so updated user total balance2")



//             await connection.commit();
//             return res.status(200).json({ status: "true", message: "Withdraw request status created successfully." });




//             }
//             catch (error) {
//                 await connection.rollback();
//                 console.error(error);
//                 return res.status(500).json({ status: "false", message: "Internal Server Error." });
//             } finally {
//                 connection.release();
//             }
            

//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ status: "false", message: "Internal Server Error." });
//     }
// });

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
                    [member_id, member_id, txn_id, txn_id, amount, 0.0, 0]
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
    //sql injection 
    
    if (containsSQLInjectionWords(member_id)) {
        return res.status(200).json({ status: "false", message: "Invalid input. SQL injection is not allowed." });
    }

    try {
        const [rows] = await pool.query(
            `SELECT * FROM withdraw_requests WHERE member_id = ?`,
            [member_id]
        );

        if (rows.length > 0) {
            return res.status(200).json({ status: "true", data: rows });
        } else {
            return res.status(200).json({ status: "true", message: "No withdraw requests found for the given Member ID." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "false", message: "Internal Server Error." });
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