// const { pool } = require('../config/database');
// const generateTransactionId = require('../utills/generateTxnId');

// // Commission structures for FREE and BASIC membership
// const COMMISSION_RATES = {
//     FREE: {
//         MOBILE_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.033)],
//         DTH_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.033)],
//         // BBPS_FASTAG: [0.25, 0.2, 0.15, 0.1, ...Array(16).fill(0.019)],
//         // GAS_BILL: [0.25, 0.2, 0.15, 0.1, ...Array(16).fill(0.019)],
//         // WATER_BILL: [0.25, 0.2, 0.15, 0.1, ...Array(16).fill(0.019)],
//         // INSURANCE: [1.5, 0.5, 0.4, 0.3, 0.2, ...Array(16).fill(0.1)],
//         // LOAN_EMI: [1.5, 0.5, 0.4, 0.3, 0.2, ...Array(16).fill(0.1)],
//     },
//     BASIC: {
//         MOBILE_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.031)],
//         DTH_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.031)],
//         // BBPS_FASTAG: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
//         // GAS_BILL: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
//         // WATER_BILL: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
//         // INSURANCE: [10, 5, 4, 3, 2, ...Array(16).fill(0.5)],
//         // LOAN_EMI: [10, 5, 4, 3, 2, ...Array(16).fill(0.5)],
//     },
//     PREMIUM: {
//         MOBILE_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.031)],
//         DTH_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.031)],
//         // BBPS_FASTAG: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
//         // GAS_BILL: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
//         // WATER_BILL: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
//         // INSURANCE: [10, 5, 4, 3, 2, ...Array(16).fill(0.5)],
//         // LOAN_EMI: [10, 5, 4, 3, 2, ...Array(16).fill(0.5)],
//     },
// };

// // Fetch commission rates based on membership membership_status and service
// async function getCommissionRates(membership_status, service) {
//     if (!COMMISSION_RATES[membership_status]) {
//         throw new Error(`Invalid membership membership_status: ${membership_status}`);
//     }
//     if (!COMMISSION_RATES[membership_status][service]) {
//         throw new Error(`Invalid service membership_status: ${service}`);
//     }
//     return COMMISSION_RATES[membership_status][service];
// }

// // Fetch member hierarchy
// async function getCommissionList(member_id) {
//     try {
//         const [rows] = await pool.query(
//             `SELECT * FROM member_hierarchy WHERE member = ? ORDER BY member, level`,
//             [member_id]
//         );
//         return rows;
//     } catch (error) {
//         throw new Error(`Error fetching commission list: ${error.message}`);
//     }
// }

// // getCommissionList("UP100070")

// // Add commission to active users
// async function addCommission(super_upline, member_id, transaction_id, txn_id_of_commissionBy, credit, debit, level) {
//     try {
//         await pool.query(
//             `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level)
//              VALUES (?, ?, ?, ?, ?, ?, ?)`,
//             [super_upline, member_id, transaction_id, txn_id_of_commissionBy, credit, debit, level]
//         );
//     } catch (error) {
//         throw new Error(`Error adding commission: ${error.message}`);
//     }
// }

// // Add commission to inactive users
// async function addCommissionforInactive(super_upline, member_id, transaction_id, txn_id_of_commissionBy, credit, debit, level) {
//     try {
//         await pool.query(
//             `INSERT INTO commission_of_inactive_user (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level)
//              VALUES (?, ?, ?, ?, ?, ?, ?)`,
//             [super_upline, member_id, transaction_id, txn_id_of_commissionBy, credit, debit, level]
//         );
//     } catch (error) {
//         throw new Error(`Error adding commission for inactive user: ${error.message}`);
//     }
// }

// // Commission payout logic
// async function commisionPayout_2(txn_id_of_commissionBy, membership_status, service, member_id, amount) {
//     try {
        
            
//         const commissionRates = await getCommissionRates(membership_status, service);
//         const rows = await getCommissionList(member_id);

//         var initiatorCommissionRate=0
//         var initiatorCommission=0
//         if (membership_status === "FREE") {
//             initiatorCommissionRate =  1.5/100;
//             initiatorCommission = amount * initiatorCommissionRate;
            
//         }
//         else if (membership_status === "BASIC") {
//             initiatorCommissionRate =  3/ 100;
//             initiatorCommission = amount * initiatorCommissionRate;
//         }
//         else if (membership_status === "PREMIUM") {
//             initiatorCommissionRate = 5/ 100;
//             initiatorCommission = amount * initiatorCommissionRate;
//         }

//         // Add commission for the initiator (first in the list)
        
//         const initiatorTransactionId = generateTransactionId();

//         // Add commission for the initiator
//         await addCommission(member_id, member_id, initiatorTransactionId, txn_id_of_commissionBy, initiatorCommission, 0.0000000000, 0);

//         console.log(`Commission for initiator (${member_id}) added: ${initiatorCommission}`);

//         // Loop through the remaining rows to distribute commissions to the network
//         for (let i = 0; i < rows.length && i < 20; i++) {
//             const { super_upline, member, level } = rows[i];
//             const commissionRate = commissionRates[i] / 100;
//             const commission = amount * commissionRate;
//             const transaction_id = generateTransactionId();

//            //check if user is active or inactive 
//             const [checkMember] = await pool.query(`SELECT status FROM usersdetails WHERE memberid =?`,[super_upline]);
//             console.log(checkMember);
//             console.log(checkMember?.status);
//             if (super_upline==="UP100010"){
//                 await addCommissionforInactive(super_upline, member, transaction_id,txn_id_of_commissionBy, commission, 0.0000000000, level);
//             }
//             else if(checkMember[0]?.status === 'inactive'){
//                 // Add commission record for inactive user
//                 await addCommissionforInactive(super_upline, member, transaction_id,txn_id_of_commissionBy, commission, 0.0000000000, level);
                
//             }
//             else{
//                 // Add commission record for the current upline
//                 await addCommission(super_upline, member, transaction_id, txn_id_of_commissionBy, commission, 0.0000000000, level);
                
//             }
//         }

//         console.log("Commission payout completed.");
//     } catch (error) {
//         console.error(`Error in commission payout: ${error.message}`);
//         throw error;
//     }
// }

// // commisionPayout_2("TXN3456432378","PREMIUM","MOBILE_RECHARGE","UP136786",10000);

// module.exports = { commisionPayout_2 };


const { pool } = require('../config/database');
const generateTransactionId = require('../utills/generateTxnId');
const moment = require('moment-timezone');

// Commission structures
const COMMISSION_RATES = {
    FREE: {
        MOBILE_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.033)],
        DTH_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.033)],
        // BBPS_FASTAG: [0.25, 0.2, 0.15, 0.1, ...Array(16).fill(0.019)],
        // GAS_BILL: [0.25, 0.2, 0.15, 0.1, ...Array(16).fill(0.019)],
        // WATER_BILL: [0.25, 0.2, 0.15, 0.1, ...Array(16).fill(0.019)],
        // INSURANCE: [1.5, 0.5, 0.4, 0.3, 0.2, ...Array(16).fill(0.1)],
        // LOAN_EMI: [1.5, 0.5, 0.4, 0.3, 0.2, ...Array(16).fill(0.1)],
    },
    BASIC: {
        MOBILE_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.031)],
        DTH_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.031)],
        // BBPS_FASTAG: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
        // GAS_BILL: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
        // WATER_BILL: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
        // INSURANCE: [10, 5, 4, 3, 2, ...Array(16).fill(0.5)],
        // LOAN_EMI: [10, 5, 4, 3, 2, ...Array(16).fill(0.5)],
    },
    PREMIUM: {
        MOBILE_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.031)],
        DTH_RECHARGE: [0.4, 0.3, 0.2, 0.1, ...Array(16).fill(0.031)],
        // BBPS_FASTAG: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
        // GAS_BILL: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
        // WATER_BILL: [0.15, 0.1, 0.05, 0.025, ...Array(16).fill(0.023)],
        // INSURANCE: [10, 5, 4, 3, 2, ...Array(16).fill(0.5)],
        // LOAN_EMI: [10, 5, 4, 3, 2, ...Array(16).fill(0.5)],
    }
};

const INITIATOR_COMMISSION = {
    FREE: 0.015,
    BASIC: 0.03,
    PREMIUM: 0.05
};

const CASHBACK_RATE = 0.015;
const MONTHLY_LIMITS = {
    AMOUNT: 3000,
    TRANSACTIONS: 15
};

// // Helper Functions
// async function getMonthlyRechargeStats(memberId) {
//     try {
//         const startDate = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss');
//         const endDate = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');

//         console.log(`[STATS] Fetching monthly stats for ${memberId}`);
        
//         const [result] = await pool.query(
//             `SELECT 
//                 COUNT(*) AS transaction_count,
//                 COALESCE(SUM(amount), 0) AS total_amount 
//              FROM universal_transaction_table 
//              WHERE member_id = ? 
//                 AND type = 'Recharge' 
//                 AND status = 'success'
//                 AND created_at BETWEEN ? AND ?`,
//             [memberId, startDate, endDate]
//         );

//         return result[0];
//     } catch (error) {
//         console.error('[ERROR] Monthly stats query failed:', error.message);
//         throw error;
//     }
// }
// Helper Functions
async function getMonthlyRechargeStats(memberId) {
    try {
        // Get IST start and end of the month
        const istStart = moment().tz("Asia/Kolkata").startOf('month');
        const istEnd = moment().tz("Asia/Kolkata").endOf('month');

        // Convert to UTC format
        const utcStart = istStart.utc().subtract(5, 'hours').subtract(30, 'minutes');
        const utcEnd = istEnd.utc().add(5, 'hours').add(30, 'minutes');

        console.log(`[STATS] Fetching monthly stats for ${memberId}`);

        const [result] = await pool.query(
            `SELECT 
                COUNT(*) AS transaction_count,
                COALESCE(SUM(amount), 0) AS total_amount 
             FROM universal_transaction_table 
             WHERE member_id = ? 
                AND type = 'Recharge' 
                AND status = 'success'
                AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)`,
            [
                memberId,
                utcStart.format('YYYY-MM-DD'),
                utcEnd.format('YYYY-MM-DD')
            ]
        );

        return result[0];
    } catch (error) {
        console.error('[ERROR] Monthly stats query failed:', error.message);
        throw error;
    }
}

async function getCommissionRates(membership, service) {
    if (!COMMISSION_RATES[membership]?.[service]) {
        throw new Error(`Invalid commission configuration for ${membership}/${service}`);
    }
    return COMMISSION_RATES[membership][service];
}

async function getUplineHierarchy(memberId) {
    try {
        // const [rows] = await pool.query(
        //     `SELECT * FROM member_hierarchy 
        //      WHERE member = ? 
        //      ORDER BY level 
        //      `,
        //     [memberId]
        // );
        const [rows]=await pool.query
        (`SELECT * FROM member_hierarchy 
            WHERE member = ? 
            AND level <= 20 
            ORDER BY level
            `,[memberId])
        return rows;
    } catch (error) {
        console.error('[ERROR] Hierarchy query failed:', error.message);
        throw error;
    }
}

async function getUplineStatuses(uplineIds) {
    try {
        const [rows] = await pool.query(
            `SELECT memberid, status 
             FROM usersdetails 
             WHERE memberid IN (?)`,
            [uplineIds]
        );
        return new Map(rows.map(row => [row.memberid, row.status]));
    } catch (error) {
        console.error('[ERROR] Status query failed:', error.message);
        throw error;
    }
}

// Commission Insertion Functions
// async function insertCommission(table, data) {
//     try {
//         await pool.query(
//             `INSERT INTO ${table} 
//              (member_id, commissionBy, transaction_id_for_member_id,
//               transaction_id_of_commissionBy, credit, debit, level)
//              VALUES ?`,
//             [[Object.values(data)]]
//         );
//     } catch (error) {
//         console.error(`[ERROR] ${table} insert failed:`, error.message);
//         throw error;
//     }
// }
async function insertCommission(table, data) {
    try {
        let retries = 3;
        while (retries > 0) {
            try {
                data.transaction_id_for_member_id = generateTransactionId();
                await pool.query(
                    `INSERT INTO ${table} 
                     (member_id, commissionBy, transaction_id_for_member_id,
                      transaction_id_of_commissionBy, credit, debit, level)
                     VALUES ?`,
                    [[Object.values(data)]]
                );
                return; // Success, exit loop
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.warn(`[RETRY] Duplicate transaction ID detected, retrying...`);
                    retries--;
                } else {
                    throw error;
                }
            }
        }
        console.error(`[ERROR] Failed to insert after multiple retries`);
    } catch (error) {
        console.error(`[ERROR] ${table} insert failed:`, error.message);
        throw error;
    }
}

// Main Payout Function
async function commisionPayout_2(txn_id_of_commissionBy, membership, service, member_id, amount) {
    try {
        console.log(`[START] Processing commission for ${member_id} (${service} - ₹${amount})`);

        // 1. Get commission configuration
        const commissionRates = await getCommissionRates(membership, service);
        const hierarchy = await getUplineHierarchy(member_id);
        console.log(`[INFO] Found ${hierarchy.length} upline members`);

        // 2. Calculate initiator commission
        const baseCommission = amount * INITIATOR_COMMISSION[membership];
        let cashback = 0;

        // 3. Calculate cashback if eligible
        const { transaction_count, total_amount } = await getMonthlyRechargeStats(member_id);
        console.log(`[STATS] Monthly usage: ${transaction_count} txns / ₹${total_amount}`);
        
        if (transaction_count >= MONTHLY_LIMITS.TRANSACTIONS || total_amount >= MONTHLY_LIMITS.AMOUNT) {
            cashback = amount * CASHBACK_RATE;
            console.log(`[CASHBACK] Applying ₹${cashback} (1.5%)`);
        }

        // 4. Process initiator commission
        const totalInitiatorCommission = baseCommission + cashback;
        console.log(`[COMMISSION] Initiator total: ₹${totalInitiatorCommission}`);
        
        await insertCommission('commission_wallet', {
            member_id: member_id,
            commissionBy: member_id,
            transaction_id_for_member_id: generateTransactionId(),
            transaction_id_of_commissionBy: txn_id_of_commissionBy,
            credit: totalInitiatorCommission,
            debit: 0,
            level: 0
        });

        // 5. Process upline commissions
        if (hierarchy.length > 0) {
            const uplineIds = [...new Set(hierarchy.map(row => row.super_upline))];
            const statusMap = await getUplineStatuses(uplineIds);
            
            console.log(`[PROCESSING] Distributing to ${hierarchy.length} uplines`);
            
            const commissionPromises = hierarchy.map(async (row, index) => {
                if (index >= 20) return; // Limit to 20 levels
                
                const { super_upline, member, level } = row;
                const commission = amount * (commissionRates[index] / 100);
                const status = statusMap.get(super_upline);
                
                const commissionData = {
                    member_id: super_upline,
                    commissionBy: member,
                    transaction_id_for_member_id: generateTransactionId(),
                    transaction_id_of_commissionBy: txn_id_of_commissionBy,
                    credit: commission,
                    debit: 0,
                    level: level// previous - level-1
                };

                const table = (super_upline === "UP100010" || status === 'inactive') 
                            ? 'commission_of_inactive_user' 
                            : 'commission_wallet';

                console.log(`[DISTRIBUTE] L${level} → ${super_upline}: ₹${commission} (${table})`);
                return insertCommission(table, commissionData);
            });

            await Promise.all(commissionPromises);
        }

        console.log(`[COMPLETE] Successfully processed all commissions`);
        return {
            success: true,
            initiatorCommission: totalInitiatorCommission,
            cashbackApplied: cashback,
            uplineCommissions: hierarchy.length
        };

    } catch (error) {
        console.error(`[FAILED] Commission processing failed: ${error.message}`);
        throw error;
    }
}

module.exports = { commisionPayout_2 };