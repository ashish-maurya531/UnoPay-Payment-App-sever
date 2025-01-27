const { pool } = require('../config/database');
const moment = require('moment');
const generateTransactionId = require('../utills/generateTxnId');
const { 
    getMembershipTransactionsForToday, 
    getMembershipTransactionsForWeek, 
    getMembershipTransactionsForMonth 
} = require('../utills/companyTurnover');

// Commission rates configuration
const commissionRates = {
    1: 0.015,
    2: 0.016,
    3: 0.0165,
    4: 0.0175,
    5: 0.02,
    6: 0.01,
    7: 0.01
};

// Helper function to get period start date
const getPeriodStart = (type) => {
    switch (type) {
        case 'daily': return moment().startOf('day');
        case 'weekly': return moment().startOf('week');
        case 'monthly': return moment().startOf('month');
        default: throw new Error('Invalid period type');
    }
};

// Check if closing exists for period
const checkClosingExists = async (type) => {
    try {
        const periodStart = getPeriodStart(type).format('YYYY-MM-DD');
        const [rows] = await pool.query(
            `SELECT * FROM company_closing 
            WHERE type = ? AND date_and_time_of_closing >= ? 
            LIMIT 1`,
            [type, periodStart]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Error checking closing exists:', error);
        throw error;
    }
};

// Main distribution function
const distributeRankIncome = async (type) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check if closing already done
        if (await checkClosingExists(type)) {
            await connection.rollback();
            return { success: false, message: `${type} closing already completed` };
        }

        // Get total income for period
        const incomeResult = await getTotalIncome(type);
        const totalIncome = incomeResult[`${type}Income`];
        
        if (!totalIncome || totalIncome <= 0) {
            await connection.rollback();
            await createZeroAmountClosing(type);
            return { success: true, message: `${type} income was zero, closing recorded` };
        }

        // Get eligible members
        const [members] = await connection.query(
            'SELECT member_id, rank_no FROM ranktable WHERE rank_no > 0'
        );

        let distributedAmount = 0;
        const membersList = [];

        // Process each member
        for (const member of members) {
            const { member_id, rank_no } = member;
            const rate = commissionRates[rank_no] || 0;
            const amount = parseFloat((totalIncome * rate).toFixed(2));

            if (amount > 0) {
                await updateMemberBalance(connection, member_id, amount, type, rank_no);
                distributedAmount += amount;
                membersList.push({ member_id, rank: rank_no, amount });
            }
        }

        // Record company closing
        await connection.query(
            `INSERT INTO company_closing 
            (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
            VALUES (?, NOW(), ?, ?, ?)`,
            [type, totalIncome, distributedAmount, JSON.stringify(membersList)]
        );

        await connection.commit();
        return { success: true, message: `${type} distribution completed successfully` };

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`${type} distribution error:`, error);
        return { success: false, message: `${type} distribution failed` };
    } finally {
        if (connection) connection.release();
    }
};

// Helper functions
const getTotalIncome = async (type) => {
    switch (type) {
        case 'daily': return getMembershipTransactionsForToday();
        case 'weekly': return getMembershipTransactionsForWeek();
        case 'monthly': return getMembershipTransactionsForMonth();
        default: throw new Error('Invalid income type');
    }
};

const updateMemberBalance = async (connection, memberId, amount, type, rank) => {
    const txnId = generateTransactionId();
    const subType = type.charAt(0).toUpperCase() + type.slice(1);
    
    try {
        // Update universal transaction table
        await connection.query(
            `INSERT INTO universal_transaction_table 
            (transaction_id, member_id, type, subType, amount, status, message) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [txnId, memberId, 'Rank Income', subType, amount, 'success', 
            `${subType} rank income for rank ${rank}`]
        );

        // Update commission wallet
        await connection.query(
            `INSERT INTO commission_wallet 
            (member_id, commissionBy, transaction_id_for_member_id, credit,level) 
            VALUES (?, ?, ?, ?,?)`,
            [memberId, 'System', txnId, amount,"null"]
        );

        // Update total balance
        await connection.query(
            `UPDATE users_total_balance 
            SET user_total_balance = user_total_balance + ? 
            WHERE member_id = ?`,
            [amount, memberId]
        );
    } catch (error) {
        console.error('Balance update error:', error);
        throw error;
    }
};

const createZeroAmountClosing = async (type) => {
    try {
        await pool.query(
            `INSERT INTO company_closing 
            (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
            VALUES (?, NOW(), 0, 0, '[]')`,
            [type]
        );
    } catch (error) {
        console.error('Zero amount closing error:', error);
        throw error;
    }
};

// Exported functions
const distributeDailyrankIncome = async () => distributeRankIncome('daily');
const distributeWeeklyrankIncome = async () => distributeRankIncome('weekly');
const distributeMonthlyrankIncome = async () => distributeRankIncome('monthly');

module.exports = {
    distributeDailyrankIncome,
    distributeWeeklyrankIncome,
    distributeMonthlyrankIncome
};