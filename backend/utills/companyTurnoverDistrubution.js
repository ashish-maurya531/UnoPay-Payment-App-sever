
// //new code


// const { pool } = require('../config/database');
// const moment = require('moment');
// const generateTransactionId = require('../utills/generateTxnId');
// const { getMembershipTransactionsForToday } = require('../utills/companyTurnover');

// // Commission rates configuration for each rank
// const commissionRates = {
//     1: 0.015,
//     2: 0.016,
//     3: 0.0165,
//     4: 0.0175,
//     5: 0.02,
//     6: 0.01,
//     7: 0.01
// };

// const checkDailyClosingExists = async () => {
//     const periodStart = moment().startOf('day').format('YYYY-MM-DD');
//     const [rows] = await pool.query(
//         `SELECT * FROM company_closing 
//         WHERE type = 'daily' AND date_and_time_of_closing >= ? 
//         LIMIT 1`,
//         [periodStart]
//     );
//     return rows.length > 0;
// };

// const distributeDailyRankIncome = async () => {
//     let connection;
//     try {
//         connection = await pool.getConnection();
//         await connection.beginTransaction();

//         if (await checkDailyClosingExists()) {
//             await connection.rollback();
//             return { success: false, message: 'Daily closing already completed' };
//         }

//         // Get daily income
//         const incomeResult = await getMembershipTransactionsForToday();
//         const dailyIncome = incomeResult.dailyIncome;
//         // const dailyIncome = 4000

        
//         if (!dailyIncome || dailyIncome <= 0) {
//             await connection.rollback();
//             await createZeroAmountClosing('daily');
//             return { success: true, message: 'Daily income was zero, closing recorded' };
//         }

//         // Get eligible members with their ranks
//         const [members] = await connection.query(
//             'SELECT member_id, rank_no FROM ranktable WHERE rank_no > 0 ORDER BY rank_no DESC'
//         );

//         let distributedAmount = 0;
//         const membersMap = {};

//         for (const member of members) {
//             const { member_id, rank_no } = member;
//             let memberTotal = 0;
//             const rankDetails = {};

//             // Calculate for current rank and all previous ranks
//             for (let currentRank = 1; currentRank <= rank_no; currentRank++) {
//                 const rate = commissionRates[currentRank] || 0;
//                 const amount = parseFloat((dailyIncome * rate).toFixed(2));
                
//                 if (amount > 0) {
//                     rankDetails[`rank${currentRank}`] = amount;
//                     memberTotal += amount;
//                 }
//             }

//             if (memberTotal > 0) {
//                 await updateMemberBalance(connection, member_id, rankDetails);
//                 distributedAmount += memberTotal;
//                 membersMap[member_id] = rankDetails;
//             }
//         }

//         // Record company closing with detailed breakdown
//         await connection.query(
//             `INSERT INTO company_closing 
//             (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
//             VALUES (?, NOW(), ?, ?, ?)`,
//             ['daily', dailyIncome, distributedAmount, JSON.stringify(membersMap)]
//         );

//         await connection.commit();
//         return { 
//             success: true, 
//             message: 'Daily distribution completed',
//             data: {
//                 totalIncome: dailyIncome,
//                 distributedAmount,
//                 membersCount: Object.keys(membersMap).length
//             }
//         };

//     } catch (error) {
//         if (connection) await connection.rollback();
//         console.error('Daily distribution error:', error);
//         return { success: false, message: 'Daily distribution failed' };
//     } finally {
//         if (connection) connection.release();
//     }
// };

// const updateMemberBalance = async (connection, memberId, rankDetails) => {
//     try {
//         let totalAmount = 0;
//         const transactionIds = {};

//         // Create transactions for each rank
//         for (const [rankKey, amount] of Object.entries(rankDetails)) {
//             const rankNumber = parseInt(rankKey.replace('rank', ''));
//             const txnId = generateTransactionId();
//             transactionIds[rankKey] = txnId;
//             totalAmount += amount;

//             // Universal transaction
//             await connection.query(
//                 `INSERT INTO universal_transaction_table 
//                 (transaction_id, member_id, type, subType, amount, status, message) 
//                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
//                 [txnId, memberId, 'Rank Income', 'Daily', amount, 'success', 
//                 `Daily rank income for rank ${rankNumber}`]
//             );

//             // Commission wallet entry
//             await connection.query(
//                 `INSERT INTO commission_wallet 
//                 (member_id, commissionBy, transaction_id_for_member_id, 
//                  transaction_id_of_commissionBy, credit, level) 
//                 VALUES (?, ?, ?, ?, ?, ?)`,
//                 [memberId, 'Rank Income', txnId, txnId, amount, rankNumber]
//             );
//         }

//         // Update total balance once with combined amount
//         await connection.query(
//             `UPDATE users_total_balance 
//             SET user_total_balance = user_total_balance + ? 
//             WHERE member_id = ?`,
//             [totalAmount, memberId]
//         );

//     } catch (error) {
//         console.error('Balance update error:', error);
//         throw error;
//     }
// };

// const createZeroAmountClosing = async (type) => {
//     await pool.query(
//         `INSERT INTO company_closing 
//         (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
//         VALUES (?, NOW(), 0, 0, '{}')`,
//         [type]
//     );
// };

// // Placeholder functions for weekly/monthly
// const distributeWeeklyRankIncome = async () => ({ success: true, message: 'Not implemented yet' });
// const distributeMonthlyRankIncome = async () => ({ success: true, message: 'Not implemented yet' });

// module.exports = {
//     distributeDailyRankIncome,
//     distributeWeeklyRankIncome,
//     distributeMonthlyRankIncome
// };









const { pool } = require('../config/database');
const moment = require('moment');
const generateTransactionId = require('../utills/generateTxnId');
const { 
    getMembershipTransactionsForToday,
    getMembershipTransactionsForWeek,
    getMembershipTransactionsForMonth 
} = require('../utills/companyTurnover');

// Configuration
const DAILY_COMMISSION_RATES = {
    1: 0.015,
    2: 0.016,
    3: 0.0165,
    4: 0.0175,
    5: 0.02,
    6: 0.01,
    7: 0.01
};

const MONTHLY_COMMISSION_RATES = {
    1: 0.015,
    2: 0.016,
    3: 0.0165,
    4: 0.0175,
    5: 0.02,
    6: 0.01
};

const MONTHLY_LEVEL_LIMITS = {
    1: 15000,
    2: 30000,
    3: 150000,
    4: 1000000,
    5: 12000000,
    6: 25000000
};

const GEMSTONE_COLUMNS = ['OPAL', 'TOPAZ', 'JASPER', 'ALEXANDER', 'DIAMOND', 'BLUE_DIAMOND'];

// Helper Functions
const checkPeriodClosingExists = async (type) => {
    const periodStart = moment().startOf(type).format('YYYY-MM-DD');
    const [rows] = await pool.query(
        `SELECT * FROM company_closing 
        WHERE type = ? AND date_and_time_of_closing >= ? 
        LIMIT 1`,
        [type, periodStart]
    );
    return rows.length > 0;
};

const updateDailyWeeklyMonthlyTable = async (connection, memberId, updates) => {
    const setClause = Object.keys(updates)
        .map(col => `${col} = ${col} + ?`)
        .join(', ');

    const values = Object.values(updates);

    await connection.query(
        `INSERT INTO daily_weekly_monthly_total 
        (member_id, ${Object.keys(updates).join(', ')}) 
        VALUES (?, ${values.map(() => '?').join(', ')})
        ON DUPLICATE KEY UPDATE 
        ${setClause}`,
        [memberId, ...values, ...values]
    );
};

// Daily Distribution
const distributeDailyRankIncome = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (await checkPeriodClosingExists('day')) {
            await connection.rollback();
            return { success: false, message: 'Daily closing already completed' };
        }

        const incomeResult = await getMembershipTransactionsForToday();
        const dailyIncome = incomeResult.todayIncome;
        // const dailyIncome = 4000;

        
        if (!dailyIncome || dailyIncome <= 0) {
            await connection.rollback();
            await createZeroAmountClosing('daily');
            return { success: true, message: 'Daily income was zero, closing recorded' };
        }

        const [members] = await connection.query(
            'SELECT member_id, rank_no FROM ranktable WHERE rank_no > 0 ORDER BY rank_no DESC'
        );

        let distributedAmount = 0;
        const membersMap = {};

        for (const member of members) {
            const { member_id, rank_no } = member;
            let memberTotal = 0;
            const rankDetails = {};

            for (let currentRank = 1; currentRank <= rank_no; currentRank++) {
                const rate = DAILY_COMMISSION_RATES[currentRank] || 0;
                const amount = parseFloat((dailyIncome * rate).toFixed(6));
                
                if (amount > 0) {
                    rankDetails[`rank${currentRank}`] = amount;
                    memberTotal += amount;
                }
            }

            if (memberTotal > 0) {
                await updateMemberBalance(connection, member_id, rankDetails, 'daily');
                await updateDailyWeeklyMonthlyTable(connection, member_id, { daily: memberTotal });
                distributedAmount += memberTotal;
                membersMap[member_id] = rankDetails;
            }
        }

        await connection.query(
            `INSERT INTO company_closing 
            (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
            VALUES (?, NOW(), ?, ?, ?)`,
            ['daily', dailyIncome, distributedAmount, JSON.stringify(membersMap)]
        );

        await connection.commit();
        return { 
            success: true, 
            message: 'Daily distribution completed',
            data: {
                totalIncome: dailyIncome,
                distributedAmount,
                membersCount: Object.keys(membersMap).length
            }
        };

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Daily distribution error:', error);
        return { success: false, message: 'Daily distribution failed' };
    } finally {
        if (connection) connection.release();
    }
};
// Weekly Distribution Configuration
const WEEKLY_COMMISSION_RATE = 0.02; // 2%
const MIN_ACTIVE_DIRECTS = 50;

// Weekly Distribution
// Weekly Distribution
const distributeWeeklyRankIncome = async () => {
    let connection;
    try {
        console.log('[WEEKLY] Starting weekly distribution process');
        connection = await pool.getConnection();
        await connection.beginTransaction();
        console.log('[WEEKLY] Database connection established and transaction started');

        if (await checkPeriodClosingExists('week')) {
            console.log('[WEEKLY] Weekly closing already exists, aborting');
            await connection.rollback();
            return { success: false, message: 'Weekly closing already completed' };
        }

        const incomeResult = await getMembershipTransactionsForWeek();
        const weeklyIncome = incomeResult.weeklyIncome;
        // const weeklyIncome = 1000;
        console.log(`[WEEKLY] Weekly turnover: ${weeklyIncome}`);

        if (!weeklyIncome || weeklyIncome <= 0) {
            console.log('[WEEKLY] Zero weekly income, recording zero closing');
            await connection.rollback();
            await createZeroAmountClosing('weekly');
            return { success: true, message: 'Weekly income was zero, closing recorded' };
        }

        console.log('[WEEKLY] Fetching members with ≥50 active directs');
        const [members] = await connection.query(
            'SELECT member_id, active_directs FROM ranktable WHERE active_directs >= ?',
            [MIN_ACTIVE_DIRECTS]
        );

        if (members.length === 0) {
            console.log('[WEEKLY] No eligible members found');
            await connection.query(
                `INSERT INTO company_closing 
                (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
                VALUES (?, NOW(), ?, ?, ?)`,
                ['weekly', weeklyIncome, 0, JSON.stringify({})]
            );
            await connection.commit();
            return { 
                success: true, 
                message: 'No eligible members for weekly distribution',
                data: { totalIncome: weeklyIncome }
            };
        }

        let distributedAmount = 0;
        const membersMap = {};
        const commissionPerMember = parseFloat((weeklyIncome * WEEKLY_COMMISSION_RATE).toFixed(6));
        console.log(`[WEEKLY] Commission per member: ${commissionPerMember}`);

        for (const member of members) {
            const { member_id } = member;
            console.log(`[WEEKLY] Processing member: ${member_id}`);
            
            // FIX: Pass proper rankDetails object with dummy rank0 key
            const rankDetails = { rank0: commissionPerMember };
            
            console.log(`[WEEKLY] Updating balances for ${member_id} with $${commissionPerMember}`);
            await updateMemberBalance(connection, member_id, rankDetails, 'weekly');
            
            console.log(`[WEEKLY] Updating daily_weekly_monthly_total for ${member_id}`);
            await updateDailyWeeklyMonthlyTable(connection, member_id, { weekly: commissionPerMember });
            
            distributedAmount += commissionPerMember;
            membersMap[member_id] = commissionPerMember;
            console.log(`[WEEKLY] Updated records for ${member_id}`);
        }

        console.log('[WEEKLY] Recording company closing');
        await connection.query(
            `INSERT INTO company_closing 
            (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
            VALUES (?, NOW(), ?, ?, ?)`,
            ['weekly', weeklyIncome, distributedAmount, JSON.stringify(membersMap)]
        );

        await connection.commit();
        console.log('[WEEKLY] Transaction committed successfully');

        return { 
            success: true, 
            message: 'Weekly distribution completed',
            data: {
                totalIncome: weeklyIncome,
                distributedAmount,
                membersCount: members.length,
                commissionPerMember
            }
        };

    } catch (error) {
        console.error('[WEEKLY] Distribution error:', error);
        if (connection) await connection.rollback();
        return { 
            success: false, 
            message: 'Weekly distribution failed',
            error: error.message 
        };
    } finally {
        if (connection) {
            connection.release();
            console.log('[WEEKLY] Database connection released');
        }
    }
};

// Monthly Distribution
const distributeMonthlyRankIncome = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (await checkPeriodClosingExists('month')) {
            await connection.rollback();
            return { success: false, message: 'Monthly closing already completed' };
        }

        const incomeResult = await getMembershipTransactionsForMonth();
        const monthlyIncome = incomeResult.monthlyIncome;
        // const monthlyIncome = 10000;

        
        if (!monthlyIncome || monthlyIncome <= 0) {
            await connection.rollback();
            await createZeroAmountClosing('monthly');
            return { success: true, message: 'Monthly income was zero, closing recorded' };
        }

        const [members] = await connection.query(
            'SELECT member_id, rank_no FROM ranktable WHERE rank_no > 0 ORDER BY rank_no DESC'
        );

        let distributedAmount = 0;
        const membersMap = {};

        for (const member of members) {
            const { member_id, rank_no } = member;
            const rankDetails = {};
            const gemstoneUpdates = {};

            for (let currentRank = 1; currentRank <= rank_no; currentRank++) {
                const rate = MONTHLY_COMMISSION_RATES[currentRank] || 0;
                const fullAmount = parseFloat((monthlyIncome * rate).toFixed(6));
                const gemstoneColumn = GEMSTONE_COLUMNS[currentRank - 1];
                const limit = MONTHLY_LEVEL_LIMITS[currentRank] || 0;

                if (fullAmount > 0) {
                    // Get current gemstone total
                    const [currentTotals] = await connection.query(
                        `SELECT ${gemstoneColumn} 
                        FROM daily_weekly_monthly_total 
                        WHERE member_id = ?`,
                        [member_id]
                    );

                    const currentAmount = currentTotals[0]?.[gemstoneColumn] || 0;
                    const remainingLimit = Math.max(0, limit - currentAmount);
                    const payableAmount = Math.min(fullAmount, remainingLimit);

                    if (payableAmount > 0) {
                        rankDetails[`rank${currentRank}`] = payableAmount;
                        gemstoneUpdates[gemstoneColumn] = payableAmount;
                    }
                }
            }

            if (Object.keys(gemstoneUpdates).length > 0) {
                const memberTotal = Object.values(gemstoneUpdates).reduce((sum, val) => sum + val, 0);
                await updateMemberBalance(connection, member_id, rankDetails, 'monthly');
                await updateDailyWeeklyMonthlyTable(connection, member_id, gemstoneUpdates);
                distributedAmount += memberTotal;
                membersMap[member_id] = rankDetails;
            }
        }

        await connection.query(
            `INSERT INTO company_closing 
            (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
            VALUES (?, NOW(), ?, ?, ?)`,
            ['monthly', monthlyIncome, distributedAmount, JSON.stringify(membersMap)]
        );

        await connection.commit();
        return { 
            success: true, 
            message: 'Monthly distribution completed',
            data: {
                totalIncome: monthlyIncome,
                distributedAmount,
                membersCount: Object.keys(membersMap).length
            }
        };

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Monthly distribution error:', error);
        return { success: false, message: 'Monthly distribution failed' };
    } finally {
        if (connection) connection.release();
    }
};


// Shared Functions with Enhanced Logging
const updateMemberBalance = async (connection, memberId, rankDetails, type) => {
    try {
        console.log(`[${type}] Starting balance update for ${memberId} (${type})`);
        let totalAmount = 0;

        for (const [rankKey, amount] of Object.entries(rankDetails)) {
            const rankNumber = parseInt(rankKey.replace('rank', ''));
            const txnId = generateTransactionId();
            totalAmount += amount;

            console.log(`[${type}] Inserting to universal_transaction_table: 
                ${txnId}, ${memberId}, ${type}, ${amount}`);
            await connection.query(
                `INSERT INTO universal_transaction_table 
                (transaction_id, member_id, type, subType, amount, status, message) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    txnId, 
                    memberId, 
                    'Rank Income', 
                    type,
                    amount, 
                    'success', 
                    `${type} income${rankKey !== 'rank0' ? ' for rank ' + rankNumber : ''}`
                ]
            );

            console.log(`[${type}] Inserting to commission_wallet: 
                ${memberId}, ${txnId}, ${amount}, ${rankNumber}`);
            await connection.query(
                `INSERT INTO commission_wallet 
                (member_id, commissionBy, transaction_id_for_member_id, 
                 transaction_id_of_commissionBy, credit, level) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [memberId, 'Rank Income', txnId, txnId, amount, rankNumber]
            );
        }

        console.log(`[${type}] Updating users_total_balance for ${memberId} with ${totalAmount}`);
        await connection.query(
            `UPDATE users_total_balance 
            SET user_total_balance = user_total_balance + ? 
            WHERE member_id = ?`,
            [totalAmount, memberId]
        );

        console.log(`[${type}] Successfully updated balances for ${memberId}`);
    } catch (error) {
        console.error(`[${type}] Update error:`, error);
        throw error;
    }
};
const createZeroAmountClosing = async (type) => {
    await pool.query(
        `INSERT INTO company_closing 
        (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
        VALUES (?, NOW(), 0, 0, '{}')`,
        [type]
    );
};










// New Helper Functions
const checkPreviousPeriodClosing = async (type) => {
    try {
        let periodStart;
        const now = moment().tz("Asia/Kolkata");
        
        switch(type) {
            case 'daily':
                periodStart = now.subtract(1, 'day').startOf('day').format('YYYY-MM-DD');
                console.log('Checking daily closing for:', periodStart);
                break;
            case 'weekly':
                periodStart = now.subtract(1, 'week').startOf('week').format('YYYY-MM-DD');
                console.log('Checking weekly closing for:', periodStart);
                break;
            case 'monthly':
                periodStart = now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
                console.log('Checking monthly closing for:', periodStart);
                break;
            default:
                throw new Error('Invalid period type');
        }

        const [rows] = await pool.query(
            `SELECT * FROM company_closing 
            WHERE type = ? AND date_and_time_of_closing >= ? 
            LIMIT 1`,
            [type, periodStart]
        );

        return rows.length > 0;
    } catch (error) {
        console.error(`Error checking ${type} closing:`, error);
        throw error;
    }
};

// Main Check Functions
const checkDaily = async () => {
    try {
        console.log('🔍 Checking previous daily closing...');
        const exists = await checkPreviousPeriodClosing('daily');
        
        if (exists) {
            console.log('✅ Previous daily closing already exists');
            return { success: true, message: 'Daily closing already completed' };
        }

        console.log('⏳ Previous daily closing not found, starting distribution...');
        return await distributeDailyRankIncome();
    } catch (error) {
        console.error('Daily check failed:', error);
        return { success: false, message: 'Daily check failed' };
    }
};

const checkWeekly = async () => {
    try {
        console.log('🔍 Checking previous weekly closing...');
        const exists = await checkPreviousPeriodClosing('weekly');
        
        if (exists) {
            console.log('✅ Previous weekly closing already exists');
            return { success: true, message: 'Weekly closing already completed' };
        }

        console.log('⏳ Previous weekly closing not found, starting distribution...');
        return await distributeWeeklyRankIncome();
    } catch (error) {
        console.error('Weekly check failed:', error);
        return { success: false, message: 'Weekly check failed' };
    }
};

const checkMonthly = async () => {
    try {
        console.log('🔍 Checking previous monthly closing...');
        const exists = await checkPreviousPeriodClosing('monthly');
        
        if (exists) {
            console.log('✅ Previous monthly closing already exists');
            return { success: true, message: 'Monthly closing already completed' };
        }

        console.log('⏳ Previous monthly closing not found, starting distribution...');
        return await distributeMonthlyRankIncome();
    } catch (error) {
        console.error('Monthly check failed:', error);
        return { success: false, message: 'Monthly check failed' };
    }
};

// Update Module Exports
module.exports = {
    distributeDailyRankIncome,
    distributeWeeklyRankIncome,
    distributeMonthlyRankIncome,
    checkDaily,
    checkWeekly,
    checkMonthly
};