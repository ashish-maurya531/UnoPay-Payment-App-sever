const express = require('express');
const router = express.Router();
const { getFlexiWalletTransactionList, getCommissionWalletTransactionList,selfTransactionsList,incomeTransactionsList } = require('../utills/checkUserBalance');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');



// Route to get flexi wallet transactions
router.post('/flexiWalletTransactions', async (req, res) => {
    const {member_id} = req.body;
    if(containsSQLInjectionWords(member_id)){
        return res.status(400).json({ success: false, message: 'Invalid SQL Injection detected in member_id' });
    }
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
    if(containsSQLInjectionWords(member_id)){
        return res.status(400).json({ success: false, message: 'Invalid SQL Injection detected in member_id' });
    }
    try {
        const transactions = await getCommissionWalletTransactionList(member_id);
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting commission wallet transactions', error });
    }
});

// Route to get self transactions
router.post('/selfTransactions', async (req, res) => {
    const {member_id} = req.body;
    if(containsSQLInjectionWords(member_id)){
        return res.status(400).json({ success: false, message: 'Invalid SQL Injection detected in member_id' });
    }

    try {
        const transactions = await selfTransactionsList(member_id);
        if (transactions?.message) {
            return res.status(404).json({ success: false, message: transactions.message });
        }
        // console.log(transactions?.data.length===0);
        if (transactions?.data.length === 0) {
            return res.status(404).json({ success: false, message: 'No transactions' });
        }
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting self transactions222', error });
    }
});

//get all income transactions
router.post('/incomeTransactions', async (req, res) => {
    const {member_id} = req.body;
    if(containsSQLInjectionWords(member_id)){
        return res.status(400).json({ success: false, message: 'Invalid SQL Injection detected in member_id' });
    }
    try {
        const transactions = await incomeTransactionsList(member_id);
        if (transactions?.message) {
            return res.status(404).json({ success: false, message: transactions.message });
        }
        if (transactions?.data.length === 0) {
            return res.status(404).json({ success: false, message: 'No transactions' });
        }
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting income transactions', error });
    }
}
);



module.exports = router;