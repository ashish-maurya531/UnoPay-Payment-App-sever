





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
    console.log('Closing ---check result:', rows);
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

// // Daily Distribution
// const distributeDailyRankIncome = async () => {
//     let connection;
//     try {
//         connection = await pool.getConnection();
//         await connection.beginTransaction();

//         if (await checkPeriodClosingExists('day')) {
//             await connection.rollback();
//             return { success: false, message: 'Daily closing already completed' };
//         }
//         const incomeResult = await getMembershipTransactionsForToday();
//         const dailyIncome = incomeResult.todayIncome;
//         // const dailyIncome = 550;

//         if (!dailyIncome || dailyIncome <= 0) {
//             await connection.rollback();
//             await createZeroAmountClosing('daily');
//             return { success: true, message: 'Daily income was zero, closing recorded' };
//         }

//         const [members] = await connection.query(
//             'SELECT member_id, rank_no FROM ranktable WHERE rank_no > 0 ORDER BY rank_no DESC'
//         );

//         const memberIds = members.map(member => member.member_id);
//         // console.log("member ids->>>"+memberIds)
//         if (!memberIds ||memberIds==""){
//             await connection.query(
//                 `INSERT INTO company_closing 
//                 (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
//                 VALUES (?, NOW(), ?, ?, ?)`,
//                 ['daily', dailyIncome, 0, "{}"]
//             );
//             await connection.commit();
//             return { 
//                 success: true, 
//                 message: 'Daily distribution completed || to 0 members',
//                 data: {
//                     totalIncome: dailyIncome,
//                     distributedAmount:0,
//                     membersCount:0
//                 }
//             };
//         }
//         const [userDetails] = await connection.query(
//             'SELECT username as name, memberid as member_id FROM usersdetails WHERE memberid IN (?)',
//             [memberIds]
//         );

//         const nameMap = {};
//         userDetails.forEach(user => {
//             nameMap[user.member_id] = user.name;
//         });
//         console.log(nameMap);

//         let distributedAmount = 0;
//         const membersMap = {};

//         for (const member of members) {
//             const { member_id, rank_no } = member;
            
//             // Skip processing for member UP100010
//             if (member_id === 'UP100010') {
//                 continue;
//             }

//             let memberTotal = 0;
//             const rankDetails = {
//                 name: nameMap[member_id] || 'Unknown'
//             };

//             for (let currentRank = 1; currentRank <= rank_no; currentRank++) {
//                 const rate = DAILY_COMMISSION_RATES[currentRank] || 0;
//                 const amount = parseFloat((dailyIncome * rate).toFixed(6));
                
//                 if (amount > 0) {
//                     rankDetails[`rank${currentRank}`] = amount;
//                     memberTotal += amount;
//                 }
//             }

//             if (memberTotal > 0) {
//                 await updateMemberBalance(connection, member_id, rankDetails, 'daily');
//                 await updateDailyWeeklyMonthlyTable(connection, member_id, { daily: memberTotal });
//                 distributedAmount += memberTotal;
//                 membersMap[member_id] = rankDetails;
//             }
//         }

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
// Daily Distribution
const distributeDailyRankIncome = async (custom_daily_amount_distribution) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (await checkPeriodClosingExists('day')) {
            await connection.rollback();
            return { success: false, message: 'Daily closing already completed' };
        }

        const incomeResult = await getMembershipTransactionsForToday();
        const dailyIncome = (custom_daily_amount_distribution && custom_daily_amount_distribution > 0) 
            ? custom_daily_amount_distribution
            : incomeResult.todayIncome;
        // const dailyIncome = 1000;

        if (!dailyIncome || dailyIncome <= 0) {
            await connection.rollback();
            await createZeroAmountClosing('daily');
            return { success: true, message: 'Daily income was zero, closing recorded' };
        }

        // Get members with their rank_no and rank_array
        const [members] = await connection.query(
            'SELECT member_id, rank_no, rank_array FROM ranktable WHERE rank_no > 0 ORDER BY rank_no DESC'
        );

        // Get member names from usersdetails table
        const memberIds = members.map(member => member.member_id);
        if (!memberIds || memberIds.length === 0) {
            await connection.query(
                `INSERT INTO company_closing 
                (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
                VALUES (?, NOW(), ?, ?, ?)`,
                ['daily', dailyIncome, 0, "{}"]
            );
            await connection.commit();
            return { 
                success: true, 
                message: 'No eligible members for Daily distribution',
                data: {
                    totalIncome: dailyIncome,
                    distributedAmount: 0,
                    membersCount: 0
                }
            };
        }
        
        const [userDetails] = await connection.query(
            'SELECT username as name, memberid as member_id FROM usersdetails WHERE memberid IN (?)',
            [memberIds]
        );

        // Create name mapping object
        const nameMap = {};
        userDetails.forEach(user => {
            nameMap[user.member_id] = user.name;
        });

        let distributedAmount = 0;
        const membersMap = {};

        for (const member of members) {
            const { member_id, rank_no, rank_array } = member;
            
            // Skip processing for member UP100010
            if (member_id === 'UP100010') {
                continue;
            }

            // Parse the rank array if it's stored as a JSON string
            let rankLevels = [];
            try {
                rankLevels = rank_array ? (typeof rank_array === 'string' ? JSON.parse(rank_array) : rank_array) : [];
            } catch (e) {
                console.error(`Error parsing rank array for ${member_id}:`, e);
                rankLevels = [];
            }

            // If no valid rank array, use old method with rank_no for backward compatibility
            if (!rankLevels || !Array.isArray(rankLevels) || rankLevels.length === 0) {
                rankLevels = Array.from({ length: rank_no }, (_, i) => i + 1);
            }

            const rankDetails = {
                name: nameMap[member_id] || 'Unknown', // Add member name
                levels: rankLevels.join(',') // Add achieved levels as comma-separated string
            };
            const gemstoneUpdates = {};

            // Process only the ranks in the rank array
            for (const currentRank of rankLevels) {
                const rate = DAILY_COMMISSION_RATES[currentRank] || 0;
                const fullAmount = parseFloat((dailyIncome * rate).toFixed(6));
                const gemstoneColumn = GEMSTONE_COLUMNS[currentRank - 1];
                const limit = Infinity; // No limit for daily distribution

                if (fullAmount > 0) {
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
                await updateMemberBalance(connection, member_id, rankDetails, 'daily');
                await updateDailyWeeklyMonthlyTable(connection, member_id, gemstoneUpdates);
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
        // const weeklyIncome = 3000;

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
        console.log(members);
        // Get member names
        

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
        const memberIds = members.map(member => member.member_id);
        console.log(memberIds);
        const [userDetails] = await connection.query(
            `SELECT username as name, memberid as member_id FROM usersdetails WHERE memberid IN (?)`,
            [memberIds]
        );

        const nameMap = {};
        userDetails.forEach(user => {
            nameMap[user.member_id] = user.name;
        });

        let distributedAmount = 0;
        const membersMap = {};
        const commissionPerMember = parseFloat((weeklyIncome * WEEKLY_COMMISSION_RATE).toFixed(6));
        console.log(`[WEEKLY] Commission per member: ${commissionPerMember}`);

        for (const member of members) {
            const { member_id } = member;
            
            // Skip UP100010
            if (member_id === 'UP100010') {
                console.log(`[WEEKLY] Skipping excluded member: ${member_id}`);
                continue;
            }

            console.log(`[WEEKLY] Processing member: ${member_id}`);
            
            const rankDetails = {
                name: nameMap[member_id] || 'Unknown',
                rank0: commissionPerMember // Keep rank0 for transaction processing
            };

            console.log(`[WEEKLY] Updating balances for ${member_id} with $${commissionPerMember}`);
            await updateMemberBalance(connection, member_id, rankDetails, 'weekly');
            
            console.log(`[WEEKLY] Updating daily_weekly_monthly_total for ${member_id}`);
            await updateDailyWeeklyMonthlyTable(connection, member_id, { weekly: commissionPerMember });
            
            distributedAmount += commissionPerMember;
            
            // Create clean output format
            membersMap[member_id] = {
                name: rankDetails.name,
                amount: commissionPerMember
            };
            
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
                membersCount: Object.keys(membersMap).length,
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
// const distributeMonthlyRankIncome = async (custom_monthly_amount_distribution) => {
//     let connection;
//     try {
//         connection = await pool.getConnection();
//         await connection.beginTransaction();

//         if (await checkPeriodClosingExists('month')) {
//             await connection.rollback();
//             return { success: false, message: 'Monthly closing already completed' };
//         }

//         const monthlyIncome = (custom_monthly_amount_distribution && custom_monthly_amount_distribution > 0) 
//             ? custom_monthly_amount_distribution
//             : (await getMembershipTransactionsForMonth()).monthlyIncome;

//         if (!monthlyIncome || monthlyIncome <= 0) {
//             await connection.rollback();
//             await createZeroAmountClosing('monthly');
//             return { success: true, message: 'Monthly income was zero, closing recorded' };
//         }

//         const [members] = await connection.query(
//             'SELECT member_id, rank_no FROM ranktable WHERE rank_no > 0 ORDER BY rank_no DESC'
//         );

//         // Get member names from usersdetails table
//         const memberIds = members.map(member => member.member_id);
//         if (!memberIds ||memberIds==""){
//             await connection.query(
//                 `INSERT INTO company_closing 
//                 (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
//                 VALUES (?, NOW(), ?, ?, ?)`,
//                 ['monthly', monthlyIncome, 0, "{}"]
//             );
//             await connection.commit();
//             return { 
//                 success: true, 
//                 message: 'No eligible members for Monthly distribution',
//                 data: {
//                     totalIncome: dailyIncome,
//                     distributedAmount:0,
//                     membersCount:0
//                 }
//             };
//         }
//         const [userDetails] = await connection.query(
//             'SELECT username as name, memberid as member_id FROM usersdetails WHERE memberid IN (?)',
//             [memberIds]
//         );

//         // Create name mapping object
//         const nameMap = {};
//         userDetails.forEach(user => {
//             nameMap[user.member_id] = user.name;
//         });

//         let distributedAmount = 0;
//         const membersMap = {};

//         for (const member of members) {
//             const { member_id, rank_no } = member;
            
//             // Skip processing for member UP100010
//             if (member_id === 'UP100010') {
//                 continue;
//             }

//             const rankDetails = {
//                 name: nameMap[member_id] || 'Unknown' // Add member name
//             };
//             const gemstoneUpdates = {};

//             for (let currentRank = 1; currentRank <= rank_no; currentRank++) {
//                 const rate = MONTHLY_COMMISSION_RATES[currentRank] || 0;
//                 const fullAmount = parseFloat((monthlyIncome * rate).toFixed(6));
//                 const gemstoneColumn = GEMSTONE_COLUMNS[currentRank - 1];
//                 const limit = MONTHLY_LEVEL_LIMITS[currentRank] || 0;

//                 if (fullAmount > 0) {
//                     const [currentTotals] = await connection.query(
//                         `SELECT ${gemstoneColumn} 
//                         FROM daily_weekly_monthly_total 
//                         WHERE member_id = ?`,
//                         [member_id]
//                     );

//                     const currentAmount = currentTotals[0]?.[gemstoneColumn] || 0;
//                     const remainingLimit = Math.max(0, limit - currentAmount);
//                     const payableAmount = Math.min(fullAmount, remainingLimit);

//                     if (payableAmount > 0) {
//                         rankDetails[`rank${currentRank}`] = payableAmount;
//                         gemstoneUpdates[gemstoneColumn] = payableAmount;
//                     }
//                 }
//             }

//             if (Object.keys(gemstoneUpdates).length > 0) {
//                 const memberTotal = Object.values(gemstoneUpdates).reduce((sum, val) => sum + val, 0);
//                 await updateMemberBalance(connection, member_id, rankDetails, 'monthly');
//                 await updateDailyWeeklyMonthlyTable(connection, member_id, gemstoneUpdates);
//                 distributedAmount += memberTotal;
//                 membersMap[member_id] = rankDetails;
//             }
//         }

//         await connection.query(
//             `INSERT INTO company_closing 
//             (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
//             VALUES (?, NOW(), ?, ?, ?)`,
//             ['monthly', monthlyIncome, distributedAmount, JSON.stringify(membersMap)]
//         );

//         await connection.commit();
//         return { 
//             success: true, 
//             message: 'Monthly distribution completed',
//             data: {
//                 totalIncome: monthlyIncome,
//                 distributedAmount,
//                 membersCount: Object.keys(membersMap).length
//             }
//         };

//     } catch (error) {
//         if (connection) await connection.rollback();
//         console.error('Monthly distribution error:', error);
//         return { success: false, message: 'Monthly distribution failed' };
//     } finally {
//         if (connection) connection.release();
//     }
// };


// // Shared Functions with Enhanced Logging
// const updateMemberBalance = async (connection, memberId, rankDetails, type) => {
//     try {
//         console.log(`[${type}] Starting balance update for ${memberId}`);
//         let totalAmount = 0;
        
//         // Filter only rank-related entries (rank0, rank1, rank2, etc.)
//         const rankEntries = Object.entries(rankDetails).filter(
//             ([key]) => key.startsWith('rank')
//         );

//         console.log(`[${type}] Processing ranks:`, rankEntries);

//         for (const [rankKey, amount] of rankEntries) {
//             const rankNumber = parseInt(rankKey.replace('rank', '')) || 0; // Handle rank0
//             const txnId = generateTransactionId();
            
//             if (typeof amount !== 'number' || isNaN(amount)) {
//                 console.error(`[${type}] Invalid amount for ${rankKey}:`, amount);
//                 continue;
//             }

//             totalAmount += amount;

//             // Insert into universal transaction table
//             console.log(`[${type}] Logging transaction for ${rankKey}: ${amount}`);
//             await connection.query(
//                 `INSERT INTO universal_transaction_table 
//                 (transaction_id, member_id, type, subType, amount, status, message) 
//                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
//                 [
//                     txnId, 
//                     memberId, 
//                     'Rank Income', 
//                     type,
//                     amount, 
//                     'success', 
//                     `${type} income${rankNumber > 0 ? ` for rank ${rankNumber}` : ''}`
//                 ]
//             );

//             // Insert into commission wallet
//             console.log(`[${type}] Updating commission wallet for level ${rankNumber}`);
//             await connection.query(
//                 `INSERT INTO commission_wallet 
//                 (member_id, commissionBy, transaction_id_for_member_id, 
//                  transaction_id_of_commissionBy, credit, level) 
//                 VALUES (?, ?, ?, ?, ?, ?)`,
//                 [memberId, 'Rank Income', txnId, txnId, amount, rankNumber]
//             );
//         }

//         // Update total balance only if there's valid amount
//         if (totalAmount > 0) {
//             console.log(`[${type}] Updating total balance with ${totalAmount}`);
//             await connection.query(
//                 `UPDATE users_total_balance 
//                 SET user_total_balance = user_total_balance + ? 
//                 WHERE member_id = ?`,
//                 [totalAmount, memberId]
//             );
//         } else {
//             console.log(`[${type}] No valid amounts to update for ${memberId}`);
//         }

//         console.log(`[${type}] Successfully processed ${memberId}`);
//     } catch (error) {
//         console.error(`[${type}] Update error:`, error);
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


const distributeMonthlyRankIncome = async (custom_monthly_amount_distribution) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (await checkPeriodClosingExists('month')) {
            await connection.rollback();
            return { success: false, message: 'Monthly closing already completed' };
        }

        const monthlyIncome = (custom_monthly_amount_distribution && custom_monthly_amount_distribution > 0) 
            ? custom_monthly_amount_distribution
            : (await getMembershipTransactionsForMonth()).monthlyIncome;

        if (!monthlyIncome || monthlyIncome <= 0) {
            await connection.rollback();
            await createZeroAmountClosing('monthly');
            return { success: true, message: 'Monthly income was zero, closing recorded' };
        }

        // Get members with their rank_no and rank_array
        const [members] = await connection.query(
            'SELECT member_id, rank_no, rank_array FROM ranktable WHERE rank_no > 0 ORDER BY rank_no DESC'
        );

        // Get member names from usersdetails table
        const memberIds = members.map(member => member.member_id);
        if (!memberIds || memberIds.length === 0) {
            await connection.query(
                `INSERT INTO company_closing 
                (type, date_and_time_of_closing, turnover, distributed_amount, list_of_members) 
                VALUES (?, NOW(), ?, ?, ?)`,
                ['monthly', monthlyIncome, 0, "{}"]
            );
            await connection.commit();
            return { 
                success: true, 
                message: 'No eligible members for Monthly distribution',
                data: {
                    totalIncome: monthlyIncome,
                    distributedAmount: 0,
                    membersCount: 0
                }
            };
        }
        
        const [userDetails] = await connection.query(
            'SELECT username as name, memberid as member_id FROM usersdetails WHERE memberid IN (?)',
            [memberIds]
        );

        // Create name mapping object
        const nameMap = {};
        userDetails.forEach(user => {
            nameMap[user.member_id] = user.name;
        });

        let distributedAmount = 0;
        const membersMap = {};

        for (const member of members) {
            const { member_id, rank_no, rank_array } = member;
            
            // Skip processing for member UP100010
            if (member_id === 'UP100010') {
                continue;
            }

            // Parse the rank array if it's stored as a JSON string
            let rankLevels = [];
            try {
                rankLevels = rank_array ? (typeof rank_array === 'string' ? JSON.parse(rank_array) : rank_array) : [];
            } catch (e) {
                console.error(`Error parsing rank array for ${member_id}:`, e);
                rankLevels = [];
            }

            // If no valid rank array, use old method with rank_no for backward compatibility
            if (!rankLevels || !Array.isArray(rankLevels) || rankLevels.length === 0) {
                rankLevels = Array.from({ length: rank_no }, (_, i) => i + 1);
            }

            const rankDetails = {
                name: nameMap[member_id] || 'Unknown', // Add member name
                levels: rankLevels.join(',') // Add achieved levels as comma-separated string
            };
            const gemstoneUpdates = {};

            // Process only the ranks in the rank array
            for (const currentRank of rankLevels) {
                const rate = MONTHLY_COMMISSION_RATES[currentRank] || 0;
                const fullAmount = parseFloat((monthlyIncome * rate).toFixed(6));
                const gemstoneColumn = GEMSTONE_COLUMNS[currentRank - 1];
                const limit = MONTHLY_LEVEL_LIMITS[currentRank] || 0;

                if (fullAmount > 0) {
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
        return { success: false, message: 'Monthly distribution failed', error: error.toString() };
    } finally {
        if (connection) connection.release();
    }
};

// Shared Functions with Enhanced Logging
const updateMemberBalance = async (connection, memberId, rankDetails, type) => {
    try {
        console.log(`[${type}] Starting balance update for ${memberId}`);
        let totalAmount = 0;
        
        // Filter only rank-related entries (rank0, rank1, rank2, etc.)
        const rankEntries = Object.entries(rankDetails).filter(
            ([key]) => key.startsWith('rank')
        );
        
        // Get the levels achieved for this member
        const levels = rankDetails.levels || '';
        console.log(`[${type}] Processing ranks for levels ${levels}:`, rankEntries);

        for (const [rankKey, amount] of rankEntries) {
            const rankNumber = parseInt(rankKey.replace('rank', '')) || 0; // Handle rank0
            const txnId = generateTransactionId();
            
            if (typeof amount !== 'number' || isNaN(amount)) {
                console.error(`[${type}] Invalid amount for ${rankKey}:`, amount);
                continue;
            }

            totalAmount += amount;

            // Insert into universal transaction table with level information
            console.log(`[${type}] Logging transaction for ${rankKey}: ${amount}`);
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
                    `${type} income for L${rankNumber}|${GEMSTONE_COLUMNS[rankNumber-1]}|(achieved levels: ${levels})`
                ]
            );

            // Insert into commission wallet
            console.log(`[${type}] Updating commission wallet for level ${rankNumber}`);
            await connection.query(
                `INSERT INTO commission_wallet 
                (member_id, commissionBy, transaction_id_for_member_id, 
                 transaction_id_of_commissionBy, credit, level) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [memberId, 'Rank Income', txnId, txnId, amount, `${type} income|${GEMSTONE_COLUMNS[rankNumber-1]}|L${rankNumber}`]
            );
        }

        // Update total balance only if there's valid amount
        if (totalAmount > 0) {
            console.log(`[${type}] Updating total balance with ${totalAmount}`);
            await connection.query(
                `UPDATE users_total_balance 
                SET user_total_balance = user_total_balance + ? 
                WHERE member_id = ?`,
                [totalAmount, memberId]
            );
        } else {
            console.log(`[${type}] No valid amounts to update for ${memberId}`);
        }

        console.log(`[${type}] Successfully processed ${memberId}`);
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
                periodStart = now.startOf('day').format('YYYY-MM-DD');
                console.log('Checking daily closing for:', periodStart);
                break;
            case 'weekly':
                periodStart = now.startOf('week').format('YYYY-MM-DD');
                console.log('Checking weekly closing for:', periodStart);
                break;
            case 'monthly':
                periodStart = now.startOf('month').format('YYYY-MM-DD');
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
        console.log('Closing check result:', rows);

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
// checkDaily()
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

const checkMonthly = async (custom_monthly_amount_distribution) => {
    try {
        console.log('🔍 Checking previous monthly closing...');
        const exists = await checkPreviousPeriodClosing('monthly');
        
        if (exists) {
            console.log('✅ Previous monthly closing already exists');
            return { success: true, message: 'Monthly closing already completed' };
        }

        console.log('⏳ Previous monthly closing not found, starting distribution...');
        return await distributeMonthlyRankIncome(custom_monthly_amount_distribution);
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