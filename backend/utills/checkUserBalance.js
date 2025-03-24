

const { pool } = require('../config/database');
const moment = require('moment-timezone');

// function to get user credit and debit total from databse flexi wallet
async function getFlexiWalletBalance(member_id) {
    try {
        const [rows] = await pool.query(`
            SELECT total_balance 
                FROM flexi_wallet
                WHERE member_id = ?
                ORDER BY date_time DESC
                LIMIT 1;`,[member_id]);

        // console.log(rows[0].total_credit- rows[0].total_debit);
        // console.log(rows[0].total_balance)
        return rows[0]?.total_balance ? parseFloat(rows[0].total_balance) : 0;

    } catch (error) {
        console.error('Error getting user balance:', error);
        return 0;
    }
}

// function to get user credit and debit total from databse flexi wallet
async function getCommisionWalletBalance(member_id) {
    try {
        // const [rows] = await pool.query(`
        //     SELECT 
        //       SUM(CASE WHEN message = 'Credited Successfully' THEN credit ELSE 0 END) AS total_credit,
        //       SUM(CASE WHEN message = 'Debited Successfully' THEN debit ELSE 0 END) AS total_debit
        //     FROM commission_wallet 
        //     WHERE member_id = ?`, 
        //     [member_id]);

        const [rows] = await pool.query(`
            SELECT total_balance 
                FROM commission_wallet
                WHERE member_id = ?
                ORDER BY date_time DESC
                LIMIT 1;`,[member_id]);

        // console.log(rows[0].total_credit- rows[0].total_debit);
        const totalBalance = rows[0]?.total_balance || 0;

        // console.log(totalBalance-0);
        return parseFloat(totalBalance) || 0;

    } catch (error) {
        console.error('Error getting user balance:', error);
        return 0;
    }
}

async function getOverallTotalIncome(member_id) {
    try {
        // const [rows] = await pool.query(`
        //     SELECT 
        //       SUM(CASE WHEN message = 'Credited Successfully' THEN credit ELSE 0 END) AS total_credit
              
        //     FROM commission_wallet 
        //     WHERE member_id = ?`, 
        //     [member_id]);
        // const [rows] = await pool.query(`
        //     SELECT 
        //       SUM(CASE 
        //             WHEN message = 'Credited Successfully' 
        //             THEN credit 
        //             ELSE 0 
        //           END) AS total_credit
        //     FROM commission_wallet 
        //     WHERE member_id = ?
        //       AND commissionBy NOT IN ('Withdrawal Request', 'Withdrawal Rejected')`, 
        //     [member_id]
        //   );
        //   //crest dr of admin 

        // // console.log(rows[0].total_credit- rows[0].total_debit);
        // return (parseFloat(rows[0]?.total_credit) || 0) - 0;

        const [rows] = await pool.query(`
            SELECT 
              SUM(CASE 
                    WHEN message = 'Credited Successfully' 
                    THEN credit 
                    ELSE 0 
                  END) AS total_credit,
              SUM(CASE 
                    WHEN commissionBy = 'admin' 
                    THEN debit 
                    ELSE 0 
                  END) AS total_debit
            FROM commission_wallet 
            WHERE member_id = ?
              AND commissionBy NOT IN ('Withdrawal Request', 'Withdrawal Rejected','Withdrawal Failed')
          `, [member_id]);
          
          const totalCredit = parseFloat(rows[0]?.total_credit) || 0;
          const totalDebit = parseFloat(rows[0]?.total_debit) || 0;
          
          return totalCredit - totalDebit;
          


    } catch (error) {
        console.error('Error getting user balance:', error);
        return 0;
    }
}






async function getTodayCommissionWalletBalance(member_id) {
    try {
        // Get current IST date boundaries
        // const istStart = moment().tz("Asia/Kolkata").startOf('day');
        // const istEnd = moment().tz("Asia/Kolkata").endOf('day');

        // // Convert to UTC format covering full IST day
        // const utcStart = istStart.utc().subtract(5, 'hours').subtract(30, 'minutes');
        // const utcEnd = istEnd.utc().add(5, 'hours').add(30, 'minutes');
        const utcStart = moment().tz("Asia/Kolkata").startOf('day');
        const utcEnd = moment().tz("Asia/Kolkata").endOf('day');

       
        const [rows] = await pool.query(
            `SELECT
              COALESCE(SUM(
                CASE WHEN message = 'Credited Successfully'
                  THEN credit
                END
              ), 0) AS total_credit,
              COALESCE(SUM(
                CASE WHEN message = 'Debited Successfully'
                  THEN debit
                END
              ), 0) AS total_debit
            FROM commission_wallet
            WHERE member_id = ?
              AND DATE(date_time) BETWEEN DATE(?) AND DATE(?)
              AND commissionBy NOT IN ('Withdrawal Request', 'Withdrawal Rejected','Withdrawal Failed',"admin")`,
            [
              member_id,
              utcStart.format('YYYY-MM-DD'),
              utcEnd.format('YYYY-MM-DD')
            ]
          );
          

        return Number((Number(rows[0]?.total_credit || 0).toFixed(10)));

    
    } catch (error) {
        console.error('Date-only commission error:', error);
        return 0
    }
}



async function getHoldTotalCommission(member_id) {
    try {
        

        // Query to calculate the sum of amounts where the message contains the specified text
        const [rows] = await pool.query(
            `SELECT 
                COALESCE(SUM(credit), 0) AS holdTotalCommission
             FROM commission_wallet
             WHERE member_id = ?
             AND commissionBy=?`,
            [member_id,"Magic Plant"] // Parameters should be passed as a separate array
        );
        const [directs] = await pool.query(
            `SELECT mh.member 
            FROM member_hierarchy mh
            JOIN usersdetails ud ON mh.member = ud.memberid
            WHERE mh.upline = ? 
            AND mh.level = 1 
            AND ud.membership IN ('PREMIUM', 'BASIC')`,
    
            [member_id]
        );
        if (directs.length <2) {
            return Number(Number(rows[0]?.holdTotalCommission || 0).toFixed(10));
        }
        else{
            return 0;
        }
     

        // Return the sum of held commissions
        

    
    } catch (error) {
        console.error('Error calculating holdTotalCommission:', error);
        return 0; // Return 0 in case of any error
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
                ...(isCredit ? { credit: row.amount,debit:0.00 } : { credit:0.00,debit: row.amount }),
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
       // Fetch data from commission_wallet based on member_id
       const [commissionWalletRows] = await pool.query(`
        SELECT 
            cw.member_id,
            cw.commissionBy,
            CONCAT(cw.commissionBy, '-', COALESCE(ud.username, '')) AS commissionBy,
            cw.transaction_id_for_member_id,
            cw.transaction_id_of_commissionBy,
            cw.credit,
            cw.debit,
            cw.message,
            cw.date_time,
            cw.level
        FROM commission_wallet cw
        LEFT JOIN usersdetails ud ON cw.commissionBy = ud.memberid
        WHERE cw.member_id = ?`, 
        [member_id]
    );
    

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
async function TransactionsListForPassBook(member_id) {
    try {
        // Check if member_id exists
        const [user] = await pool.query(`SELECT * FROM usersdetails WHERE memberid = ?`, [member_id]);
        if (user.length === 0) {
            return { message: 'User not found' };
        }
        // Fetch commission wallet data
        const [commissionWalletRows2] = await pool.query(`
            SELECT 
                cw.member_id,
                cw.commissionBy,
                CONCAT(cw.commissionBy, '-', COALESCE(ud.username, '')) AS commissionBy,
                cw.transaction_id_for_member_id,
                cw.transaction_id_of_commissionBy,
                cw.credit,
                cw.debit,
                cw.message,
                cw.date_time,
                cw.level
            FROM commission_wallet cw
            LEFT JOIN usersdetails ud ON cw.commissionBy = ud.memberid
            WHERE cw.member_id = ? AND cw.message IN ('Credited Successfully', 'Debited Successfully')`, [member_id]);
        // console.log(commissionWalletRows2);
        
        // Fetch commission wallet data

        const [commissionWalletRows] = await pool.query(`
            SELECT 
                member_id,
                transaction_id_for_member_id,
                transaction_id_of_commissionBy,
                commissionBy,
                credit,
                debit,
                total_balance,
                date_time,
                message,
                level
                FROM commission_wallet
                WHERE member_id = ?
                AND message IN ('Credited Successfully', 'Debited Successfully')`, [member_id]);
                
                // console.log(commissionWalletRows);
        // Fetch flexi wallet data
        const [flexiWalletRows] = await pool.query(`
            SELECT 
                member_id,
                transaction_id,
                credit,
                debit,
                total_balance,
                date_time
            FROM flexi_wallet
            WHERE member_id = ?`, [member_id]);

        // Helper function to convert null/undefined to empty string
        const normalizeValue = (value) => {
            return value === null || value === undefined ? "" : value;
        };

        // Helper function to normalize object values
        const normalizeObject = (obj) => {
            const normalized = {};
            for (const [key, value] of Object.entries(obj)) {
                normalized[key] = normalizeValue(value);
            }
            return normalized;
        };

        // Process commission wallet data
        const commissionResponse = await Promise.all(commissionWalletRows.map(async (walletRow) => {
            const { transaction_id_of_commissionBy } = walletRow;
            delete walletRow.transaction_id_of_commissionBy;

            const [transactionRows] = await pool.query(`
                SELECT 
                    transaction_id,
                    member_id,
                    type,
                    subType,
                    recharge_to,
                    created_at,
                    message
                FROM universal_transaction_table
                WHERE transaction_id = ?`, [transaction_id_of_commissionBy]);

            if (transactionRows.length > 0) {
                const transaction = normalizeObject(transactionRows[0]);
                
                if (transaction.type === 'Membership') {
                    transaction.amount = (transaction.amount / 1.18);
                }

                return normalizeObject({
                    ...walletRow,
                    wallet_type: 'commission_wallet',
                    type: transaction.type,
                    subType: transaction.subType,
                    recharge_to: (transaction.recharge_to || "") +"-"+(/^UP\d+$/.test(walletRow.commissionBy) ? walletRow.commissionBy : " ")+(walletRow.level >= 1 && walletRow.level <= 20 ? ` - L${walletRow.level}` : " "),

                    amount: transaction.amount,
                    message: transaction.message
                });
            } else {
                return normalizeObject({
                    ...walletRow,
                    wallet_type: 'commission_wallet',
                    type: "",
                    subType: "",
                    recharge_to: "",
                    amount: "",
                    message: ""
                });
            }
        }));

        // Process flexi wallet data
        const flexiResponse = await Promise.all(flexiWalletRows.map(async (walletRow) => {
            const [transactionRows] = await pool.query(`
                SELECT 
                    transaction_id,
                    member_id,
                    type,
                    subType,
                    recharge_to,
                    created_at,
                    message,
                    -- Extract receiver_id for Money Transfer
                    CASE 
                        WHEN message LIKE 'Money Transferred to UP%' 
                        THEN CONCAT('to UP', SUBSTRING_INDEX(SUBSTRING_INDEX(message, 'Money Transferred to UP', -1), ' ', 1))
                        ELSE NULL 
                    END AS receiver_id,
                    -- Extract sender_id for Money Received
                    CASE 
                        WHEN message LIKE 'Money Received from UP%' 
                        THEN CONCAT('from UP', SUBSTRING_INDEX(SUBSTRING_INDEX(message, 'Money Received from UP', -1), ' ', 1))
                        ELSE NULL 
                    END AS sender_id
                FROM universal_transaction_table
                WHERE transaction_id = ?`, 
                [walletRow.transaction_id]
            );
        
            if (transactionRows.length > 0) {
                const transaction = normalizeObject(transactionRows[0]);
        
                return normalizeObject({
                    ...walletRow,
                    wallet_type: 'flexi_wallet',
                    type: transaction.type,
                    subType: transaction.subType,
                    recharge_to: `${[transaction.recharge_to+ transaction.receiver_id]}`+` ${(transaction.sender_id ??transaction.receiver_id) || ""}`, 
                    amount: transaction.amount,
                    message: transaction.message
                    
                });
            } else {
                return normalizeObject({
                    ...walletRow,
                    wallet_type: 'flexi_wallet',
                    type: "",
                    subType: "",
                    recharge_to: "",
                    amount: "",
                    message: ""
                    
                });
            }
        }));
        // Combine both responses
        const combinedResponse = [...commissionResponse, ...flexiResponse];

        // Sort by date_time in descending order
        combinedResponse.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

        return { data: combinedResponse };
    } catch (error) {
        console.error('Error fetching transactions list', error);
        return 0;
    }
}




module.exports = { getFlexiWalletTransactionList,
    getCommissionWalletTransactionList,
    selfTransactionsList ,
    getFlexiWalletBalance,
    getCommisionWalletBalance,
    getTodayCommissionWalletBalance,
    incomeTransactionsList,
    TransactionsListForPassBook,
    getHoldTotalCommission,
    getOverallTotalIncome
};



