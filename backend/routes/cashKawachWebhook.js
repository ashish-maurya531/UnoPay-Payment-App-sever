const express = require('express');
const axios = require('axios');
const authenticateToken = require("../middleware/auth");
const { payoutTransfer, checkPayoutStatus, getBalance}=require("../utills/cashKawach");
const router = express.Router();






// 4. Webhook Handler
router.post('/cashkavach', (req, res) => {
    
    try {
        const { events, dataContent } = req.body;
        
        if (!events || !dataContent) {
            return res.status(400).json({ message: "Invalid webhook payload" });
        }

        if (events === 'Payout') {
            console.log('🔔 Webhook Received:', JSON.stringify(dataContent, null, 2));
            // Process the payout status update (e.g., verify UTR and update your system) 
        }

        res.status(200).json({ message: "Webhook received successfully" });
    } catch (error) {
        console.error("Webhook Handling Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
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