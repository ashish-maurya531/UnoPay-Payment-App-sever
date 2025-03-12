const express = require('express');
const authenticateToken = require("../middleware/auth");
const { payoutTransfer, checkPayoutStatus, getBalance}=require("../utills/cashKawach");
const router = express.Router();
const { pool } = require('../config/database');
const {sendWithdrawalEmail} = require('../utills/sendOtpMail');
const generateTransactionId = require('../utills/generateTxnId');








// 4. Webhook Handler
router.post('/cashkavach',async (req, res) => {
    
    try {
        const { events, dataContent } = req.body;
        
        if (!events || !dataContent) {
            return res.status(400).json({ message: "Invalid webhook payload" });
        }

        if (events === 'Payout') {
            console.log('🔔 Payout Webhook Data:', JSON.stringify(dataContent, null, 2));
            
            // Extract data from webhook
            const { OrderId, UTR, status, amount } = dataContent;
            
            if (!OrderId) {
                console.error('Invalid webhook data: Missing OrderId');
                return res.status(400).json({ message: 'Invalid webhook data' });
            }
            
            // Check if status is FAILED
            if (status === 'FAILED') {
                console.log(`Payout FAILED for OrderId: ${OrderId}. Initiliation refund.`);
                //////////////////////////////
                 // Process successful payment
                const connection_on_failed = await pool.getConnection();
                
                try {
                    await connection_on_failed.beginTransaction();
                    
                    // First, get the withdrawal details to ensure it exists
                    const [withdrawalDetails] = await connection_on_failed.query(
                        `SELECT wr.transaction_id,wr.message,wr.member_id, wr.amount, wr.status as current_status, 
                        u.email, b.FullName, b.IFSC_Code, b.Bank_Name, b.Account_number 
                        FROM withdraw_requests wr
                        JOIN usersdetails u ON wr.member_id = u.memberid
                        JOIN user_bank_kyc_details b ON wr.member_id = b.member_id
                        WHERE wr.order_id = ?`,
                        [OrderId]
                    );
                    
                    if (withdrawalDetails.length === 0) {
                        console.error(`No withdrawal request found for OrderId: ${OrderId}`);
                        await connection_on_failed.rollback();
                        return res.status(404).json({ message: 'Withdrawal request not found' });
                    }
                    
                    
                    const withdrawalDetail = withdrawalDetails[0];
                    //now check the status of the withdraw if failed then no need to do anything
                    if(withdrawalDetail.current_status === 'failed' && withdrawalDetail.message === 'Withdrawal Failed,money refunded.'){
                        console.log(`Withdrawal request already failed for OrderId: ${OrderId}`);
                        await connection_on_failed.rollback();
                        return res.status(200).json({ message: 'Withdrawal request already failed' });
                    }
                    console.log(`Found withdrawal request for OrderId: ${OrderId}`, withdrawalDetail);
                    const txn_id_of_widthraw = withdrawalDetail.transaction_id;
                    const txn_id = generateTransactionId();
                    const member_id = withdrawalDetail.member_id;
                    const amount = withdrawalDetail.amount
                    
                    // Update the withdrawal request with the UTR
                    const [updateResult] = await connection_on_failed.query(
                        `UPDATE withdraw_requests 
                        SET status = ?,message = ?
                        WHERE order_id = ?`,
                        ["failed","Withdrawal Failed,money will be refunded.",OrderId]
                    );
                    
                    if (updateResult.affectedRows === 0) {
                        console.error(`Failed to update status for OrderId: ${OrderId}`);
                        await connection_on_failed.rollback();
                        return res.status(500).json({ message: 'Failed to update withdrawal request' });
                    }
                    
                    console.log(`Successfully updated status {failed} for OrderId: ${OrderId} `);
                    //make the enrty in universal table 
                    // console.log('Transaction started for failed payout process');

                    // // Log the transaction in the universal transaction table
                    // const [row1]=await connection_on_failed.query(
                    //     `INSERT INTO universal_transaction_table (transaction_id, member_id, amount, type, status, message) 
                    //     VALUES (?, ?, ?, ?, ?, ?)`,
                    //     [txn_id, member_id, amount, "Withdrawal Failed", "success", "Withdrawal Failed, money refunded."]
                    // );
                    // if (row1.affectedRows === 0) {
                    //     console.error(`Failed to log transaction in universal_transaction_table for OrderId: ${OrderId}`);
                    //     await connection_on_failed.rollback();
                    //     return res.status(500).json({ message: 'Failed to log transaction in universal_transaction_table' });
                    // }
                    // console.log('Logged transaction in universal_transaction_table');
                    
                    // // Update the user's wallet balance
                    // const [row2]=await connection_on_failed.query(
                    //     `UPDATE users_total_balance 
                    //     SET user_total_balance = user_total_balance + ? 
                    //     WHERE member_id = ?`,
                    //     [amount, member_id]
                    // );
                    // if (row2.affectedRows === 0) {
                    //     console.error(`Failed to update user wallet balance for OrderId: ${OrderId}`);
                    //     await connection_on_failed.rollback();
                    //     return res.status(500).json({ message: 'Failed to update user wallet balance' });
                    // }
                    // console.log(`Updated user wallet balance: credited ${amount} back to member ${member_id}`);

                    // // Log the refund in the commission wallet
                    // const [row3]=await connection_on_failed.query(
                    //     `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level) 
                    //     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    //     [member_id, "Withdrawal Failed", txn_id, txn_id, amount, 0.0000000000, 0]
                    // );
                    // if (row3.affectedRows === 0) {
                    //     console.error(`Failed to log refund in commission_wallet for OrderId: ${OrderId}`);
                    //     await connection_on_failed.rollback();
                    //     return res.status(500).json({ message: 'Failed to log refund in commission_wallet' });
                    // }
                    // console.log('Logged refund in commission_wallet');

                    
                   
                    /////////////////////
                    
                    
                    await connection_on_failed.commit();
                    console.log('Transaction committed successfully for failed payout process by webhook');
                } catch (error) {
                    console.error('Error processing payout webhook:', error);
                    await connection_on_failed.rollback();
                    return res.status(500).json({ message: 'Internal server error' });
                } finally {
                    connection_on_failed.release();

                }

                ///////////////////////////
                
               
                
                // Return success response to webhook provider
                return res.status(200).json({ 
                    message: 'Failed payment webhook received. No action taken as per requirements.',
                    orderId: OrderId,
                    status: status
                });
            }
            
            // If status is not FAILED, proceed with normal processing
            if (!UTR) {
                console.error('Invalid webhook data: Missing UTR for successful payment');
                return res.status(400).json({ message: 'Invalid webhook data' });
            }
            
            // Process successful payment
            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();
                
                // First, get the withdrawal details to ensure it exists
                const [withdrawalDetails] = await connection.query(
                    `SELECT wr.member_id, wr.amount, wr.status as current_status, 
                     u.email, b.FullName, b.IFSC_Code, b.Bank_Name, b.Account_number 
                     FROM withdraw_requests wr
                     JOIN usersdetails u ON wr.member_id = u.memberid
                     JOIN user_bank_kyc_details b ON wr.member_id = b.member_id
                     WHERE wr.order_id = ?`,
                    [OrderId]
                );
                
                if (withdrawalDetails.length === 0) {
                    console.error(`No withdrawal request found for OrderId: ${OrderId}`);
                    await connection.rollback();
                    return res.status(404).json({ message: 'Withdrawal request not found' });
                }
                
                const withdrawalDetail = withdrawalDetails[0];
                console.log(`Found withdrawal request for OrderId: ${OrderId}`, withdrawalDetail);
                
                // Update the withdrawal request with the UTR
                const [updateResult] = await connection.query(
                    `UPDATE withdraw_requests 
                     SET utr_no = ?
                     WHERE order_id = ?`,
                    [UTR,OrderId]
                );
                
                if (updateResult.affectedRows === 0) {
                    console.error(`Failed to update utr for OrderId: ${OrderId}`);
                    await connection.rollback();
                    return res.status(500).json({ message: 'Failed to update withdrawal request' });
                }
                
                console.log(`Successfully updated utr for OrderId: ${OrderId} with UTR: ${UTR}`);
                
                await connection.commit();
                console.log('Database transaction committed successfully');
                
                // Send confirmation email to the user
                const emailData = {
                    member_id: withdrawalDetail.member_id,
                    amount: withdrawalDetail.amount,
                    email: withdrawalDetail.email,
                    Bank_Name: withdrawalDetail.Bank_Name,
                    Account_number: withdrawalDetail.Account_number,
                    utr_no: UTR,
                    status: status
                };
                
                console.log('Sending withdrawal confirmation email:', emailData);
                
                await sendWithdrawalEmail(emailData);
                console.log(`Withdrawal confirmation email sent to user: ${emailData.email}`);
                
                // Return success response to webhook provider
                return res.status(200).json({ 
                    message: 'Webhook processed successfully',
                    orderId: OrderId,
                    status: status
                });
            } catch (error) {
                console.error('Error processing payout webhook:', error);
                await connection.rollback();
                return res.status(500).json({ message: 'Internal server error' });
            } finally {
                connection.release();
            }
        }
        
        // Handle other webhook events as needed
        return res.status(200).json({ message: 'Webhook received' });
        
    } catch (error) {
        console.error('Error in webhook handler:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

//route to get balance

router.get('/balance', authenticateToken, async (req, res) => {
    try {
        const balance = await getBalance();
        
        res.json({ success: true, balance: balance.dataContent });
        // res.json({ success: true, balance: "100000" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = router;



// // Usage Examples
// (async () => {
//     // Make a payout
//     const transferResponse = await payoutTransfer({
//         OrderId: 'UNIQUE_ORDER_ID_123',
//         BankName: 'UNION BANK OF INDIA',
//         AccountNo: '6713XXXXXXXXX',
//         Ifsc: 'UBINXXXXXX',
//         AccountHolderName: 'Test User',
//         AccountType: 'Saving',
//         Amount: '500',
//         TxnMode: 'IMPS',
//         Remarks: 'Salary Payment',
//         latitude: '28.6798',
//         longitude: '77.0927'
//     });
//     console.log('Transfer Response:', transferResponse);

//     // Check status
//     const status = await checkPayoutStatus('UNIQUE_ORDER_ID_123');
//     console.log('Status Check:', status);

//     // Get balance
//     const balance = await getBalance();
//     console.log('Current Balance:', balance.dataContent);
// })();