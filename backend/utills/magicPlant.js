const { pool } = require('../config/database');
const generateTransactionId = require('../utills/generateTxnId');

// Helper function remains the same
const safeParseJSON = (jsonString) => {
    if (typeof jsonString === 'object' && jsonString !== null) return jsonString;
    if (typeof jsonString !== 'string' || jsonString.trim() === '') return [];
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("JSON Parse Error:", error);
        return [];
    }
};

// Enhanced handleMagicPlant with better logging
const handleMagicPlant = async (memberId) => {
    try {
        console.log(`🏁 Starting Magic Plant process for ${memberId}`);
        const [levels] = await pool.query("SELECT * FROM magic_plant_levels ORDER BY sno ASC");
        
        if (!levels || levels.length === 0) {
            throw new Error('No magic plant levels found in database');
        }

        let level1Members = safeParseJSON(levels[0].member_list);
        console.log(`📊 Level 1 members before addition: ${level1Members.length}`);

        level1Members.push(memberId);
        await pool.query(
            "UPDATE magic_plant_levels SET member_list = ? WHERE level_name = 'Level 1'", 
            [JSON.stringify(level1Members)]
        );

        console.log(`✅ ${memberId} added to Level 1. New count: ${level1Members.length}`);
        await cascadeLevels();
    } catch (error) {
        console.error("🚨 Error in handleMagicPlant:", error);
        throw error;
    }
};

// Fixed cascadeLevels function with proper member reference
const cascadeLevels = async () => {
    try {
        console.log('🌀 Starting cascade process');
        const moneyRewards = [24, 40, 120, 1200, 14000, 1200000, 0];
        const maxMembersPerLevel = [2, 4, 8, 16, 32, 64, 128];

        const [levels] = await pool.query("SELECT * FROM magic_plant_levels ORDER BY sno ASC");
        
        for (let i = 0; i < 6; i++) {
            const currentLevel = levels[i];
            const nextLevel = levels[i + 1];
            let currentMembers = safeParseJSON(currentLevel.member_list);
            let nextMembers = safeParseJSON(nextLevel.member_list);

            console.log(`📦 Level ${i + 1} current members: ${currentMembers.length}/${maxMembersPerLevel[i]}`);

            while (currentMembers.length > maxMembersPerLevel[i]) {
                const movedMember = currentMembers.shift();
                nextMembers.push(movedMember);
                console.log(`🚚 Moved ${movedMember} from ${currentLevel.level_name} to ${nextLevel.level_name}`);

                const txnId = generateTransactionId();
                const reward = moneyRewards[i]; 

                // Fixed member_id reference to movedMember
                const [directs] = await pool.query(
                    `SELECT mh.member 
                    FROM member_hierarchy mh
                    JOIN usersdetails ud ON mh.member = ud.memberid
                    WHERE mh.upline = ? 
                    AND mh.level = 1 
                    AND ud.membership IN ('PREMIUM', 'BASIC')`,
            
                    [movedMember]
                );

                if (directs.length < 2) {
                    console.log(`⏳ Holding commission for ${movedMember} (only ${directs.length} directs)`);
                    await pool.query(
                        `INSERT INTO universal_transaction_table 
                        (transaction_id, member_id, type, subType, amount, status, message) 
                        VALUES (?, ?, 'Magic Plant', ?, ?, 'success', ?)`,
                        [txnId, movedMember, `Moved to ${nextLevel.level_name}`, reward, 
                        `Moved to ${nextLevel.level_name} | Commission not credited due to insufficient directs`]
                    );
                    await pool.query(
                        `INSERT INTO commission_wallet 
                        (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, level) 
                        VALUES (?, 'Magic Plant', ?, ?, ?, ?)`,
                        [movedMember, txnId, txnId, reward, `Moved to ${nextLevel.level_name}`]
                    );
                } else {
                    console.log(`💸 Crediting commission for ${movedMember}`);
                    await pool.query(
                        `INSERT INTO universal_transaction_table 
                        (transaction_id, member_id, type, subType, amount, status, message) 
                        VALUES (?, ?, 'Magic Plant', ?, ?, 'success', ?)`,
                        [txnId, movedMember, `Moved to ${nextLevel.level_name}`, reward, 
                        `Moved to ${nextLevel.level_name}`]
                    );

                    await pool.query(
                        `INSERT INTO commission_wallet 
                        (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, level) 
                        VALUES (?, 'Magic Plant', ?, ?, ?, ?)`,
                        [movedMember, txnId, txnId, reward, `Moved to ${nextLevel.level_name}`]
                    );
                }
            }

            await pool.query(
                "UPDATE magic_plant_levels SET member_list = ? WHERE level_name = ?",
                [JSON.stringify(currentMembers), currentLevel.level_name]
            );
            await pool.query(
                "UPDATE magic_plant_levels SET member_list = ? WHERE level_name = ?",
                [JSON.stringify(nextMembers), nextLevel.level_name]
            );
        }
        console.log('🎉 Cascade process completed successfully');
    } catch (error) {
        console.error("🚨 Error in cascadeLevels:", error);
        throw error;
    }
};
// async function processHeldTransactionsDirect() {
//     // 1. Get all held transactions with commission errors
//     const [heldTransactions] = await pool.query(
//         `SELECT transaction_id, member_id, amount, message, subType 
//          FROM universal_transaction_table 
//          WHERE message LIKE '%Commission not credited due to insufficient directs%'`
//     );

//     console.log(`📨 Found ${heldTransactions.length} held transactions to process`);

//     // 2. Process each transaction
//     for (const txn of heldTransactions) {
//         if (!txn.transaction_id || !txn.member_id || !txn.amount) {
//             console.log('🚫 Invalid transaction record:', txn);
//             continue;
//         }

//         const connection = await pool.getConnection();
//         try {
//             await connection.beginTransaction();

//             // 3. Clean transaction message
//             const cleanMessage = txn.message.replace(' | Commission not credited due to insufficient directs', '');

//             // 4. Update original transaction
//             await connection.query(
//                 `UPDATE universal_transaction_table 
//                  SET message = ?
//                  WHERE transaction_id = ?`,
//                 [cleanMessage, txn.transaction_id]
//             );

//             // 5. Prepare commission data
//             const txnId = generateTransactionId();
//             const level = txn.subType.replace('Moved to ', '');

//             // 6. Insert directly to commission table
//             await connection.query(
//                 `INSERT INTO commission_wallet 
//                  (member_id, commissionBy, transaction_id_for_member_id, 
//                   transaction_id_of_commissionBy, credit, level) 
//                  VALUES (?, 'Magic Plant', ?, ?, ?, ?)`,
//                 [
//                     txn.member_id,  // Use member_id from transaction
//                     txnId,
//                     txn.transaction_id,  // Original transaction ID
//                     txn.amount,
//                     `Moved to ${level}`
//                 ]
//             );

//             await connection.commit();
//             console.log(`✅ Commission credited to ${txn.member_id} for ${txn.transaction_id}`);
//         } catch (error) {
//             await connection.rollback();
//             console.error(`🚨 Error processing ${txn.transaction_id}:`, error);
//         } finally {
//             connection.release();
//         }
//     }

//     console.log('🎉 All held transactions processed');
// }

// Run the function
// processHeldTransactionsDirect()

// async function updateTransactionMessages(transactionIds) {
//     if (!transactionIds || transactionIds.length === 0) {
//         console.log('🚫 No transaction IDs provided');
//         return;
//     }

//     try {
//         const connection = await pool.getConnection();
        
//         for (const txnId of transactionIds) {
//             // 1. Fetch the current message
//             const [rows] = await connection.query(
//                 `SELECT message FROM universal_transaction_table 
//                  WHERE transaction_id = ?`,
//                 [txnId]
//             );

//             if (rows.length === 0) {
//                 console.log(`🚫 Transaction ${txnId} not found`);
//                 continue;
//             }

//             const currentMessage = rows[0].message;

//             // 2. Append the text if not already present
//             const newMessage = currentMessage.includes('| Commission not credited due to insufficient directs')
//                 ? currentMessage // If already present, keep as is
//                 : `${currentMessage} | Commission not credited due to insufficient directs`;

//             // 3. Update the message
//             await connection.query(
//                 `UPDATE universal_transaction_table 
//                  SET message = ? 
//                  WHERE transaction_id = ?`,
//                 [newMessage, txnId]
//             );

//             console.log(`✅ Updated message for transaction ${txnId}`);
//         }

//         connection.release();
//         console.log('🎉 All transactions updated successfully');
//     } catch (error) {
//         console.error('🚨 Error updating transaction messages:', error);
//     }
// }

// // Example usage
// const transactionIds = [
//     "TXN1523277541", "TXN3116495402", "TXN3541135248", "TXN3184580536", 
//     "TXN9901265942", "TXN0132315890", "TXN9485678617", "TXN3896815268", 
//     "TXN2784971559", "TXN2429885198", "TXN7304963251", "TXN1387237285", 
//     "TXN6668373880", "TXN2475098054", "TXN8305832524", "TXN7161704579", 
//     "TXN7520811548", "TXN1574144150", "TXN1496175444", "TXN5619380969", 
//     "TXN0702631533", "TXN7152093530", "TXN0067465533", "TXN7691260564", 
//     "TXN8539420258", "TXN9524972275", "TXN5977006502", "TXN4023051205", 
//     "TXN5769557116", "TXN0404949544", "TXN3389597595", "TXN6942592455"
// ]
// updateTransactionMessages(transactionIds)
// Revised moneyPlantHoldTransactionsCheck with correct parent/child relationship
const moneyPlantHoldTransactionsCheck = async (childMemberId) => {
    try {
        console.log(`🔍 Starting hold check for child member: ${childMemberId}`);
        
        // 1. Fix JSON_CONTAINS query for proper array search
        const [parentRecords] = await pool.query(
            `SELECT member_id,active_directs ,active_directs_list 
             FROM ranktable 
             WHERE JSON_CONTAINS(active_directs_list, ?, '$')`,  // '$' specifies searching at the root level
            [JSON.stringify({ member_id:childMemberId })]
        );
        

        console.log(`👥 Found ${parentRecords.length} parent(s) for ${childMemberId}`);

        // 2. Add null-check for parent records
        if (!parentRecords || parentRecords.length === 0) {
            console.log('⏩ No parents found with active directs');
            return;
        }
        //check that parent have more than 2 active directs
        console.log(parentRecords[0]?.active_directs)
        if (parentRecords[0].active_directs<2) {
            console.log('⏩ Parent have less than 2 active directs so commission will remain on hold');
            return;
            }

        for (const parent of parentRecords) {
            console.log(`🔎 Processing parent: ${parent.member_id}`);
            
            // 3. Use proper destructuring for query results
            const [heldTransactions] = await pool.query(
                `SELECT transaction_id, member_id, amount, message 
                 FROM universal_transaction_table 
                 WHERE member_id = ? 
                 AND message LIKE '%Commission not credited due to insufficient directs%'`,
                [parent.member_id]
            );

            console.log(`📨 Found ${heldTransactions.length} held transactions for parent ${parent.member_id}`);

            // 4. Add transaction validation before processing
            for (const txn of heldTransactions) {
                if (!txn.transaction_id || !txn.message) {
                    console.log('🚫 Invalid transaction record:', txn);
                    continue;
                }

                console.log(`🔄 Processing transaction ${txn.transaction_id}`);
                
                // 5. Add fallback for message replacement
                const newMessage = txn.message.includes(' | Commission not credited') 
                    ? txn.message.replace(' | Commission not credited due to insufficient directs', '')
                    : txn.message;

                // 6. Use transaction for atomic updates
                const connection = await pool.getConnection();
                await connection.beginTransaction();

                try {
                    // Update transaction message
                    await connection.query(
                        `UPDATE universal_transaction_table 
                         SET message = ? 
                         WHERE transaction_id = ?`,
                        [newMessage, txn.transaction_id]
                    );

                    // // Insert into commission wallet
                    // await connection.query(
                    //     `INSERT INTO commission_wallet 
                    //      (member_id, commissionBy, transaction_id_for_member_id, 
                    //       transaction_id_of_commissionBy, credit, level) 
                    //      VALUES (?, 'Magic Plant', ?, ?, ?, ?)`,
                    //     [parent.member_id, txn.transaction_id, txn.transaction_id, 
                    //      txn.amount, 'Commission Released']
                    // );

                    await connection.commit();
                    console.log(`✅ Released ${txn.amount} for ${parent.member_id} (TX: ${txn.transaction_id})`);
                } catch (innerError) {
                    await connection.rollback();
                    console.error('🔴 Transaction rollback:', innerError);
                    throw innerError;
                } finally {
                    connection.release();
                }
            }
        }
        console.log(`🏁 Completed hold check for ${childMemberId}`);
    } catch (error) {
        console.error("🚨 Error in moneyPlantHoldTransactionsCheck:", error);
        throw error;
    }
};
module.exports = { handleMagicPlant, moneyPlantHoldTransactionsCheck };