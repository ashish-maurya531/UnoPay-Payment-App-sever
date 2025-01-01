const { pool } = require('../config/database');


// function to get user credit and debit total from databse flexi wallet
async function getFlexiWalletBalance(member_id) {
    try {
        const [rows] = await pool.query(`
            SELECT 
              SUM(CASE WHEN message = 'Credited Successfully' THEN credit ELSE 0 END) AS total_credit,
              SUM(CASE WHEN message = 'Debited Successfully' THEN debit ELSE 0 END) AS total_debit
            FROM flexi_wallet 
            WHERE member_id = ?`, 
            [member_id]);

        // console.log(rows[0].total_credit- rows[0].total_debit);
        return rows[0].total_credit - rows[0].total_debit;
    } catch (error) {
        console.error('Error getting user balance:', error);
        return 0;
    }
}

async function getFlexiWalletTransactionList(member_id) {
    
    try {
        const [rows] = await pool.query(`
             SELECT 
              member_id,
              transaction_id,
              credit,
              debit,
              message,
              date_time
            FROM flexi_wallet 
            WHERE member_id = ?`, 
            [member_id]);

            const filteredRows = rows.map(row => {
                
                if (row.credit === 0) {
                    delete row.credit;
                }
                if (row.debit === 0) {
                    delete row.debit;
                }
                return row;
            });
            // console.log({totalBalance:await getFlexiWalletBalance(member_id),data:filteredRows});
            return {totalBalance:await getFlexiWalletBalance(member_id),data:filteredRows};
    } catch (error) {
        console.error('Error getting user flexi wallet list ', error);
        return 0;
    }
}

// getFlexiWalletTransactionList("UP109796");

async function getCommissionWalletTransactionList(member_id) {
    
    try {
        const [rows] = await pool.query(`
             SELECT 
              member_id,
              commissionBy,
              credit,
              debit,
              date_time
            FROM commission_wallet 
            WHERE member_id = ?`, 
            [member_id]);

            const filteredRows = rows.map(row => {
                
                if (row.credit === 0) {
                    delete row.credit;
                }
                if (row.debit === 0) {
                    delete row.debit;
                }
                return row;
            });
            // console.log({totalBalance:await getCommisionWalletBalance(member_id),data:filteredRows});
            return {totalBalance:await getCommisionWalletBalance(member_id),data:filteredRows};
    } catch (error) {
        console.error('Error getting user Commission wallet list ', error);
        return 0;
    }
}


// function to get user credit and debit total from databse flexi wallet
async function getCommisionWalletBalance(member_id) {
    try {
        const [rows] = await pool.query(`
            SELECT 
              SUM(CASE WHEN message = 'Credited Successfully' THEN credit ELSE 0 END) AS total_credit,
              SUM(CASE WHEN message = 'Debited Successfully' THEN debit ELSE 0 END) AS total_debit
            FROM commission_wallet 
            WHERE member_id = ?`, 
            [member_id]);

        // console.log(rows[0].total_credit- rows[0].total_debit);
        return rows[0].total_credit - rows[0].total_debit;
    } catch (error) {
        console.error('Error getting user balance:', error);
        return 0;
    }
}







module.exports = { getFlexiWalletTransactionList,getCommissionWalletTransactionList };



