const { pool } = require('../config/database');
const moment = require('moment');
const generateTransactionId = require('../utills/generateTxnId');
 // Assuming a function to generate unique transaction IDs
const {getMembershipTransactionsForToday,getMembershipTransactionsForWeek,getMembershipTransactionsForMonth,}= require('../utills/companyTurnover');

const updateTransactionAndBalance = async (memberId, rank_no, amount, type, subType, message) => {
    const transactionId = generateTransactionId(); 

    console.log(transactionId,memberId, rank_no, amount, type, subType, message)
    const query = `
        INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType, amount, status, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [universal_result]=await pool.query(query, [
        transactionId,
        memberId,
        "Rank Income",  
        subType,             
        amount,
        "success",       
        message
    ]);
    if (universal_result.affectedRows > 0) {
        console.log('Transaction added to universal table successfully');
    }
    

    // 2. Update the user's commission wallet and total balance
    const updateCommissionWalletQuery = `
        INSERT INTO commission_wallet
       ( member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, level)VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [commission_result]=await pool.query(updateCommissionWalletQuery, [memberId,"Rank Income" ,transactionId,transactionId, amount,"null"]);
    if (commission_result.affectedRows > 0) {
        console.log(`${subType} Rank Commission added to commission wallet successfully`);
    }
    const updateTotalBalanceQuery = `
        UPDATE users_total_balance
        SET user_total_balance = user_total_balance + ?
        WHERE member_id = ?
    `;
    const [balance_result]=await pool.query(updateTotalBalanceQuery, [amount, memberId]);
    if (balance_result.affectedRows > 0) {
        console.log('Total balance updated successfully');
    }
    console.log('Transaction and balance updated successfully');


};


const distributeDailyrankIncome = async (req, res) => {
    try {
        const todayIncome = await getMembershipTransactionsForToday(); // Assuming this function returns today's total income
        const { todayIncome: totalIncome } = todayIncome;

        // Fetch all members with their rank_nos (You may need to implement this query based on your DB schema)
        const [members] = await pool.query('SELECT member_id, rank_no FROM ranktable where rank_no > 0');
        console.log(members);

        for (let member of members) {
            const { member_id, rank_no } = member;

            // Calculate the commission rate based on the rank_no
            let commissionRate = 0;
            switch (rank_no) {
                case 1:
                    commissionRate = 0.015; // 1.5%
                    break;
                case 2:
                    commissionRate = 0.016; // 1.6%
                    break;
                case 3:
                    commissionRate = 0.0165; // 1.65%
                    break;
                case 4:
                    commissionRate = 0.0175; // 1.75%
                    break;
                case 5:
                    commissionRate = 0.02; // 2%
                    break;
                case 6:
                    commissionRate = 0.01; // 1%
                    break;
                case 7:
                    commissionRate = 0.01; // 1%
                    break;
                default:
                    commissionRate = 0;
            }

            const amount = totalIncome * commissionRate;
            if (amount > 0) {
            // Prepare the message and call the helper function
            const message = `Daily rank Income for ${member_id} ${rank_no} ${amount}`;
            console.log(message);

            // Call the function to update transaction and balance
            await updateTransactionAndBalance(member_id, rank_no, amount, 'Rank Income', 'Daily', 'Daily rank_no Income distributed successfully.');
            }
        }

        return {
            success: 'true',
            message: 'Daily rank_no income distributed successfully.',
        };
    } catch (error) {
        console.error('Error distributing daily rank_no income:', error);
        return {
            success: 'false',
            message: 'Error distributing daily rank_no income',
        };
    }
};

const distributeWeeklyrankIncome = async (req, res) => {
    try {
        const weeklyIncome = await getMembershipTransactionsForWeek(); // Assuming this function returns weekly total income
        const { weeklyIncome: totalIncome } = weeklyIncome;
        // console.log(totalIncome);

        const [members] = await pool.query('SELECT member_id, rank_no FROM ranktable where rank_no > 0');
        console.log(members);

        for (let member of members) {
            const { member_id, rank_no } = member;

            // Calculate the commission rate based on the rank_no
            let commissionRate = 0;
            switch (rank_no) {
                case 1:
                    commissionRate = 0.015; // 1.5%
                    break;
                case 2:
                    commissionRate = 0.016; // 1.6%
                    break;
                case 3:
                    commissionRate = 0.0165; // 1.65%
                    break;
                case 4:
                    commissionRate = 0.0175; // 1.75%
                    break;
                case 5:
                    commissionRate = 0.02; // 2%
                    break;
                case 6:
                    commissionRate = 0.01; // 1%
                    break;
                case 7:
                    commissionRate = 0.01; // 1%
                    break;
                default:
                    commissionRate = 0;
            }

            const amount = totalIncome * commissionRate;
            if (amount > 0) {
            // Prepare the message and call the helper function
            const message = `Weekly rank Income for ${member_id} ${rank_no} ${amount}`;
            console.log(message);

            // Call the function to update transaction and balance
            await updateTransactionAndBalance(member_id, rank_no, amount, 'Rank Income', 'Weekly', 'Weekly rank_no Income distributed successfully.');
            }
        }

        return {
            success: 'true',
            message: 'Weekly rank_no income distributed successfully.',
        };
    } catch (error) {
        console.error('Error distributing weekly rank_no income:', error);
        return {
            success: 'false',
            message: 'Error distributing weekly rank_no income',
        };
    }
};



const distributeMonthlyrankIncome = async (req, res) => {
    try {
        const monthlyIncome = await getMembershipTransactionsForMonth(); // Assuming this function returns monthly total income
        const { monthlyIncome: totalIncome } = monthlyIncome;

        const [members] = await pool.query('SELECT member_id, rank_no FROM ranktable where rank_no > 0');
        console.log(members);

        for (let member of members) {
            const { member_id, rank_no } = member;

            // Calculate the commission rate based on the rank_no
            let commissionRate = 0;
            switch (rank_no) {
                case 1:
                    commissionRate = 0.015; // 1.5%
                    break;
                case 2:
                    commissionRate = 0.016; // 1.6%
                    break;
                case 3:
                    commissionRate = 0.0165; // 1.65%
                    break;
                case 4:
                    commissionRate = 0.0175; // 1.75%
                    break;
                case 5:
                    commissionRate = 0.02; // 2%
                    break;
                case 6:
                    commissionRate = 0.01; // 1%
                    break;
                case 7:
                    commissionRate = 0.01; // 1%
                    break;
                default:
                    commissionRate = 0;
            }

            const amount = totalIncome * commissionRate;
            if (amount > 0) {

           
            const message = `Monthly rank Income for ${member_id} ${rank_no} ${amount}`;
            console.log(message);

           
            await updateTransactionAndBalance(member_id, rank_no, amount, "Rank Income", "Monthly", "Monthly rank_no Income distributed successfully.");
            }
        }

        return({
            success: 'true',
            message: 'Monthly rank income distributed successfully.',
        });
    } catch (error) {
        console.error('Error distributing monthly rank_no income:', error);
        return({ success: 'false', message: 'Error distributing monthly rank_no income' });
    }
};
module.exports = {
    distributeDailyrankIncome,
    distributeWeeklyrankIncome,
    distributeMonthlyrankIncome
};
