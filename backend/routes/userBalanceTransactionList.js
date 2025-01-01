const express = require('express');
const router = express.Router();
const { getFlexiWalletTransactionList, getCommissionWalletTransactionList } = require('../utills/checkUserBalance');



// Route to get flexi wallet transactions
router.post('/flexiWalletTransactions', async (req, res) => {
    const {member_id} = req.body;
    try {
        const transactions = await getFlexiWalletTransactionList(member_id);
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting flexi wallet transactions', error });
    }
});

// Route to get commission wallet transactions
router.post('/commissionWalletTransactions', async (req, res) => {
    const {member_id} = req.body;
    try {
        const transactions = await getCommissionWalletTransactionList(member_id);
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting commission wallet transactions', error });
    }
});

module.exports = router;