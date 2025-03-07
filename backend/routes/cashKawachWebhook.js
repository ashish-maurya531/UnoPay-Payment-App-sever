const express = require('express');
const authenticateToken = require("../middleware/auth");
const { payoutTransfer, checkPayoutStatus, getBalance}=require("../utills/cashKawach");
const router = express.Router();
const { pool } = require('../config/database');
const {sendWithdrawalEmail} = require('../utills/sendOtpMail');







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
                console.log(`Payout FAILED for OrderId: ${OrderId}. Taking no action as per requirements.`);
                
               
                
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