


const { pool } = require('../config/database');
const generateTransactionId = require('../utills/generateTxnId');

const BASIC_PACKAGE = {
  baseAmount: 550,
  percentages: [40, 8, 4, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
};

// const PREMIUM_PACKAGE = {
//   baseAmount: 1100,
//   percentages: [
//         50,9.0909090909090,4.545454545454545,2.272727272727273,0.9090909090909091,
//         0.9090909090909091,0.9090909090909091,0.9090909090909091,0.9090909090909091,
//         0.9090909090909091,0.9090909090909091,0.9090909090909091,0.9090909090909091,
//         0.9090909090909091,0.9090909090909091,0.9090909090909091,0.9090909090909091,
//         0.9090909090909091,0.9090909090909091,0.9090909090909091
//     ]
// };
const PREMIUM_PACKAGE = {
  baseAmount: 1100,
  amounts: [
    540.00,  // Fixed amount for the 1st value
    100.00,  // Fixed amount for the 2nd value
    50.00,   // Calculated from percentage
    25.00,   // Calculated from percentage
    10.00, 10.00, 10.00, 10.00, 10.00, 10.00,
    10.00, 10.00, 10.00, 10.00, 10.00, 10.00,
    10.00, 10.00, 10.00, 10.00
  ]
};


async function getCommissionList(memberId) {
  const [rows] = await pool.query(
    `SELECT * FROM member_hierarchy WHERE member = ? ORDER BY level`,
    [memberId]
  );

  // const [rows]=await pool.query(`SELECT * FROM member_hierarchy 
  //   WHERE member = ? 
  //   AND level <= 20 
  //   ORDER BY level
  //   `,[memberId]);
  return rows;
}

//in above we can calculate the active direct and then we can set the unlimited level distibution 

async function getUplineDetails(uplineIds) {
  const [rows] = await pool.query(
    `SELECT memberid, status, membership FROM usersdetails WHERE memberid IN (?)`,
    [uplineIds]
  );
  return new Map(rows.map(row => [row.memberid, row]));
}

async function addCommission(table, super_upline, member_id, transaction_id, txn_id_of_commissionBy, credit, level) {
  await pool.query(
    `INSERT INTO ${table} (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, debit, level)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [super_upline, member_id, transaction_id, txn_id_of_commissionBy, credit, 0.0000000000, level]
  );
}

async function commisionPayout(txn_id_of_commissionBy, type, memberId) {
  try {
    const commissionList = await getCommissionList(memberId);
    const uplineIds = [...new Set(commissionList.map(row => row.super_upline))];
    const uplineMap = await getUplineDetails(uplineIds);

    for (let i = 0; i < commissionList.length && i < 20; i++) {
      const { super_upline, member, level } = commissionList[i];
      const transaction_id = generateTransactionId();
      
      const upline = uplineMap.get(super_upline) || {};
      const { status, membership } = upline;

      // Determine commission parameters
      // let packageConfig;
      // if (type === 'PREMIUM' && membership === 'PREMIUM') {
      //   packageConfig = PREMIUM_PACKAGE;
      // } else {
      //   packageConfig = BASIC_PACKAGE;
      // }
      
      // // Calculate commission
      // const commissionRate = packageConfig.percentages[i] / 100;
      // const commission = packageConfig.baseAmount * commissionRate;
      let packageConfig;
      if (type === 'PREMIUM' && membership === 'PREMIUM') {
        packageConfig = PREMIUM_PACKAGE;
      } else {
        packageConfig = BASIC_PACKAGE;
      }

      // Calculate commission
      let commission;

      if (type === 'PREMIUM' && membership === 'PREMIUM') {
        // Use the hardcoded amounts for PREMIUM_PACKAGE
        commission = packageConfig.amounts[i];  // Directly access the amounts array
      } else {
        // Calculate using percentages for BASIC_PACKAGE
        const commissionRate = packageConfig.percentages[i] / 100;
        commission = packageConfig.baseAmount * commissionRate;
      }


      // Determine commission destination
      const isSpecialCase = super_upline === "UP100010" || status === 'inactive' || membership === 'FREE';
      const table = isSpecialCase ? 'commission_of_inactive_user' : 'commission_wallet';

      await addCommission(table, super_upline, member, transaction_id, txn_id_of_commissionBy, commission, level);
    }

    console.log("Commission payout completed successfully");
  } catch (error) {
    console.error("Error in commission payout:", error);
    throw error;
  }
}

module.exports = { commisionPayout };