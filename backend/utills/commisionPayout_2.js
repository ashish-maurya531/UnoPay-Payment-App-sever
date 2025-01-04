const { pool } = require('../config/database');
const generateTransactionId = require('../utills/generateTxnId');

// Commission structures for FREE and BASIC membership
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
    },
};

// Fetch commission rates based on membership membership_status and service
async function getCommissionRates(membership_status, service) {
    if (!COMMISSION_RATES[membership_status]) {
        throw new Error(`Invalid membership membership_status: ${membership_status}`);
    }
    if (!COMMISSION_RATES[membership_status][service]) {
        throw new Error(`Invalid service membership_status: ${service}`);
    }
    return COMMISSION_RATES[membership_status][service];
}

// Fetch member hierarchy
async function getCommissionList(member_id) {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM member_hierarchy WHERE member = ? ORDER BY member, level`,
            [member_id]
        );
        return rows;
    } catch (error) {
        throw new Error(`Error fetching commission list: ${error.message}`);
    }
}

// getCommissionList("UP100070")

// Add commission to active users
async function addCommission(super_upline, member_id, transaction_id, txn_id_of_commissionBy, credit, debit, level) {
    try {
        await pool.query(
            `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [super_upline, member_id, transaction_id, txn_id_of_commissionBy, credit, debit, level]
        );
    } catch (error) {
        throw new Error(`Error adding commission: ${error.message}`);
    }
}

// Add commission to inactive users
async function addCommissionforInactive(super_upline, member_id, transaction_id, txn_id_of_commissionBy, credit, debit, level) {
    try {
        await pool.query(
            `INSERT INTO commission_of_inactive_user (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [super_upline, member_id, transaction_id, txn_id_of_commissionBy, credit, debit, level]
        );
    } catch (error) {
        throw new Error(`Error adding commission for inactive user: ${error.message}`);
    }
}

// Commission payout logic
async function commisionPayout_2(txn_id_of_commissionBy, membership_status, service, member_id, amount) {
    try {
        
            
        const commissionRates = await getCommissionRates(membership_status, service);
        const rows = await getCommissionList(member_id);

        var initiatorCommissionRate=0
        var initiatorCommission=0
        if (membership_status === "FREE") {
             initiatorCommission = 1.5;
            
        }
        else if (membership_status === "BASIC") {
            initiatorCommissionRate =  3/ 100;
            initiatorCommission = amount * initiatorCommissionRate;
        }
        else if (membership_status === "PREMIUM") {
            initiatorCommissionRate = 5/ 100;
            initiatorCommission = amount * initiatorCommissionRate;
        }

        // Add commission for the initiator (first in the list)
        
        const initiatorTransactionId = generateTransactionId();

        // Add commission for the initiator
        await addCommission(member_id, member_id, initiatorTransactionId, txn_id_of_commissionBy, initiatorCommission, 0.00, 0);

        console.log(`Commission for initiator (${member_id}) added: ${initiatorCommission}`);

        // Loop through the remaining rows to distribute commissions to the network
        for (let i = 0; i < rows.length && i < 20; i++) {
            const { super_upline, member, level } = rows[i];
            const commissionRate = commissionRates[i] / 100;
            const commission = amount * commissionRate;
            const transaction_id = generateTransactionId();

           //check if user is active or inactive 
            const [checkMember] = await pool.query(`SELECT status FROM usersdetails WHERE memberid =?`,[super_upline]);
            console.log(checkMember);
            console.log(checkMember?.status);
            if (super_upline==="UP100010"){
                await addCommissionforInactive(super_upline, member, transaction_id,txn_id_of_commissionBy, commission, 0.00, level);
            }
            else if(checkMember[0]?.status === 'inactive'){
                // Add commission record for inactive user
                await addCommissionforInactive(super_upline, member, transaction_id,txn_id_of_commissionBy, commission, 0.00, level);
                
            }
            else{
                // Add commission record for the current upline
                await addCommission(super_upline, member, transaction_id, txn_id_of_commissionBy, commission, 0.00, level);
                
            }
        }

        console.log("Commission payout completed.");
    } catch (error) {
        console.error(`Error in commission payout: ${error.message}`);
        throw error;
    }
}

// commisionPayout_2("TXN3456432378","PREMIUM","MOBILE_RECHARGE","UP136786",10000);

module.exports = { commisionPayout_2 };
