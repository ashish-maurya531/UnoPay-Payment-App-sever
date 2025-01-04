const { pool } = require('../config/database');
const generateTransactionId = require('../utills/generateTxnId');

const BASIC_PACKAGE_PERCENTAGES = [
    40, 8, 4, 2, 1, 1, 1, 1, 1, 1, 
    1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5
];
const PREMIUM_PACKAGE_PERCENTAGES = [
    50,9.0909090909090,4.545454545454545,2.272727272727273,0.9090909090909091,
    0.9090909090909091,0.9090909090909091,0.9090909090909091,0.9090909090909091,
    0.9090909090909091,0.9090909090909091,0.9090909090909091,0.9090909090909091,
    0.9090909090909091,0.9090909090909091,0.9090909090909091,0.9090909090909091,
    0.9090909090909091,0.9090909090909091,0.9090909090909091
];






async function getCommissionRates(type){
    if (type === 'BASIC'){
        return BASIC_PACKAGE_PERCENTAGES;
    }
    else if (type === 'PREMIUM'){
        return PREMIUM_PACKAGE_PERCENTAGES;
    }
    else{
        return false;
    }
   

}

async function getCommissionList(memberId) {
    const [rows] = await pool.query(
        `SELECT * FROM member_hierarchy WHERE member = ? ORDER BY member,level`,
        [memberId]
    );
    return rows;
}

async function addCommission(super_upline, member_id, transaction_id,txn_id_of_commissionBy ,credit, debit,level) {
    await pool.query(
        `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id,transaction_id_of_commissionBy, credit, debit, level)
         VALUES (?, ?, ?, ?, ?, ?,?)`,
        [super_upline,member_id, transaction_id,txn_id_of_commissionBy, credit, debit,level]
    );
}

async function addCommissionforInactive(super_upline, member_id, transaction_id,txn_id_of_commissionBy ,credit, debit,level) {
    await pool.query(
        `INSERT INTO commission_of_inactive_user (member_id, commissionBy, transaction_id_for_member_id,transaction_id_of_commissionBy, credit, debit, level)
         VALUES (?, ?, ?, ?, ?, ?,?)`,
        [super_upline,member_id, transaction_id,txn_id_of_commissionBy, credit, debit,level]
    );
}

async function commisionPayout(txn_id_of_commissionBy,type, memberId, amount) {

    //
    // Get commission rates from the database
    const commissionRates = await getCommissionRates(type);


    // const commissionRates = type === "BASIC" ? BASIC_PACKAGE_PERCENTAGES : PREMIUM_PACKAGE_PERCENTAGES;
    const rows = await getCommissionList(memberId);

   

    // Calculate commission for each level
    for (let i = 0; i < rows.length && i < 20; i++) {
        const { super_upline,member, level } = rows[i];
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
}

module.exports = { commisionPayout };
