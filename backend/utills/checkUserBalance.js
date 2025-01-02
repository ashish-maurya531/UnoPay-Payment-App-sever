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

//get self transaction list 
async function selfTransactionsList(member_id) {
    try {
        // check if member_id is present in usersdetails table
        const [user] = await pool.query(`SELECT * FROM usersdetails WHERE memberid = ?`, [member_id]);
        if (user.length === 0) {
            return { message: 'User not found' };
        }
        
        // get self transactions from universal_transaction_table table
        const [rows] = await pool.query(`
            SELECT 
                transaction_id,
                member_id,
                type,
                subType,
                recharge_to,
                amount,
                status,
                created_at,
                message
            FROM universal_transaction_table
            WHERE member_id = ?`, 
            [member_id]);

        const customResponse = rows.map(row => {
            const isCredit = row.type === 'Add Fund Request';
            return {
                transaction_id: row.transaction_id,
                member_id: row.member_id,
                type: row.type,
                subType: row.subType,
                recharge_to: row.recharge_to,
                ...(isCredit ? { credit: row.amount } : { debit: row.amount }),
                status: row.status,
                created_at: row.created_at,
                message: row.message,
            };
        });

        return { data: customResponse };
    } catch (error) {
        console.error('Error getting self transactions list', error);
        return 0;
    }
}



async function incomeTransactionsList(member_id) {
    try {
         // check if member_id is present in usersdetails table
         const [user] = await pool.query(`SELECT * FROM usersdetails WHERE memberid = ?`, [member_id]);
         if (user.length === 0) {
             return { message: 'User not found' };
         }
        // Fetch data from commission_wallet based on member_id
        const [commissionWalletRows] = await pool.query(`
            SELECT 
                member_id,
                commissionBy,
                transaction_id_for_member_id,
                transaction_id_of_commissionBy,
                credit,
                debit,
                message,
                date_time,
                level
            FROM commission_wallet
            WHERE member_id = ?`, [member_id]);

        // Prepare response by mapping commission wallet rows
        const response = await Promise.all(commissionWalletRows.map(async (walletRow) => {
            const { transaction_id_of_commissionBy } = walletRow;
            //remove transaction_id_of_commissionBy from walletRow
            delete walletRow.transaction_id_of_commissionBy;

            // Fetch data from universal_transaction_table using transaction_id_of_commissionBy
            const [transactionRows] = await pool.query(`
                SELECT 
                    transaction_id,
                    member_id,
                    type,
                    subType,
                    recharge_to,
                    amount,
                    created_at,
                    message
                FROM universal_transaction_table
                WHERE transaction_id = ?`, [transaction_id_of_commissionBy]);

            if (transactionRows.length > 0) {
                const transaction = transactionRows[0];

                // Adjust amount for Membership type
                if (transaction.type === 'Membership') {
                    transaction.amount =(transaction.amount / 1.18);
                }

                // Add additional fields to the commission wallet response
                return {
                    ...walletRow,
                    type: transaction.type,
                    subType: transaction.subType,
                    recharge_to: transaction.recharge_to,
                    amount: transaction.amount,
                };
            } else {
                return walletRow; // If no matching transaction, return wallet row as is
            }
        }));

        return { data: response };
    } catch (error) {
        console.error('Error fetching commission transactions list', error);
        return 0;
    }
}







module.exports = { getFlexiWalletTransactionList,getCommissionWalletTransactionList,selfTransactionsList ,getFlexiWalletBalance,getCommisionWalletBalance,incomeTransactionsList};



