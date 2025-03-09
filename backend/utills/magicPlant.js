// const { pool } = require('../config/database');
// const generateTransactionId = require('../utills/generateTxnId');

// // Helper function remains the same
// const safeParseJSON = (jsonString) => {
//     if (typeof jsonString === 'object' && jsonString !== null) return jsonString;
//     if (typeof jsonString !== 'string' || jsonString.trim() === '') return [];
//     try {
//         return JSON.parse(jsonString);
//     } catch (error) {
//         console.error("JSON Parse Error:", error);
//         return [];
//     }
// };

// // Enhanced handleMagicPlant with better logging
// const handleMagicPlant = async (memberId) => {
//     try {
//         console.log(`🏁 Starting Magic Plant process for ${memberId}`);
//         const [levels] = await pool.query("SELECT * FROM magic_plant_levels ORDER BY sno ASC");
        
//         if (!levels || levels.length === 0) {
//             throw new Error('No magic plant levels found in database');
//         }

//         let level1Members = safeParseJSON(levels[0].member_list);
//         console.log(`📊 Level 1 members before addition: ${level1Members.length}`);

//         level1Members.push(memberId);
//         await pool.query(
//             "UPDATE magic_plant_levels SET member_list = ? WHERE level_name = 'Level 1'", 
//             [JSON.stringify(level1Members)]
//         );

//         console.log(`✅ ${memberId} added to Level 1. New count: ${level1Members.length}`);
//         await cascadeLevels();
//     } catch (error) {
//         console.error("🚨 Error in handleMagicPlant:", error);
//         throw error;
//     }
// };

// // Fixed cascadeLevels function with proper member reference
// const cascadeLevels = async () => {
//     try {
//         console.log('🌀 Starting cascade process');
//         const moneyRewards = [24, 40, 120, 1200, 14000, 1200000, 0];
//         const maxMembersPerLevel = [2, 4, 8, 16, 32, 64, 128];

//         const [levels] = await pool.query("SELECT * FROM magic_plant_levels ORDER BY sno ASC");
        
//         for (let i = 0; i < 6; i++) {
//             const currentLevel = levels[i];
//             const nextLevel = levels[i + 1];
//             let currentMembers = safeParseJSON(currentLevel.member_list);
//             let nextMembers = safeParseJSON(nextLevel.member_list);

//             console.log(`📦 Level ${i + 1} current members: ${currentMembers.length}/${maxMembersPerLevel[i]}`);

//             while (currentMembers.length > maxMembersPerLevel[i]) {
//                 const movedMember = currentMembers.shift();
//                 nextMembers.push(movedMember);
//                 console.log(`🚚 Moved ${movedMember} from ${currentLevel.level_name} to ${nextLevel.level_name}`);

//                 const txnId = generateTransactionId();
//                 const reward = moneyRewards[i]; 

//                 // Fixed member_id reference to movedMember
//                 const [directs] = await pool.query(
//                     `SELECT mh.member 
//                     FROM member_hierarchy mh
//                     JOIN usersdetails ud ON mh.member = ud.memberid
//                     WHERE mh.upline = ? 
//                     AND mh.level = 1 
//                     AND ud.membership IN ('PREMIUM', 'BASIC')`,
            
//                     [movedMember]
//                 );

//                 if (directs.length < 2) {
//                     console.log(`⏳ Holding commission for ${movedMember} (only ${directs.length} directs)`);
//                     await pool.query(
//                         `INSERT INTO universal_transaction_table 
//                         (transaction_id, member_id, type, subType, amount, status, message) 
//                         VALUES (?, ?, 'Magic Plant', ?, ?, 'success', ?)`,
//                         [txnId, movedMember, `Moved to ${nextLevel.level_name}`, reward, 
//                         `Moved to ${nextLevel.level_name} | Commission not credited due to insufficient directs`]
//                     );
//                     await pool.query(
//                         `INSERT INTO commission_wallet 
//                         (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, level) 
//                         VALUES (?, 'Magic Plant', ?, ?, ?, ?)`,
//                         [movedMember, txnId, txnId, reward, `Moved to ${nextLevel.level_name}`]
//                     );
//                 } else {
//                     console.log(`💸 Crediting commission for ${movedMember}`);
//                     await pool.query(
//                         `INSERT INTO universal_transaction_table 
//                         (transaction_id, member_id, type, subType, amount, status, message) 
//                         VALUES (?, ?, 'Magic Plant', ?, ?, 'success', ?)`,
//                         [txnId, movedMember, `Moved to ${nextLevel.level_name}`, reward, 
//                         `Moved to ${nextLevel.level_name}`]
//                     );

//                     await pool.query(
//                         `INSERT INTO commission_wallet 
//                         (member_id, commissionBy, transaction_id_for_member_id, transaction_id_of_commissionBy, credit, level) 
//                         VALUES (?, 'Magic Plant', ?, ?, ?, ?)`,
//                         [movedMember, txnId, txnId, reward, `Moved to ${nextLevel.level_name}`]
//                     );
//                 }
//             }

//             await pool.query(
//                 "UPDATE magic_plant_levels SET member_list = ? WHERE level_name = ?",
//                 [JSON.stringify(currentMembers), currentLevel.level_name]
//             );
//             await pool.query(
//                 "UPDATE magic_plant_levels SET member_list = ? WHERE level_name = ?",
//                 [JSON.stringify(nextMembers), nextLevel.level_name]
//             );
//         }
//         console.log('🎉 Cascade process completed successfully');
//     } catch (error) {
//         console.error("🚨 Error in cascadeLevels:", error);
//         throw error;
//     }
// };

// // Revised moneyPlantHoldTransactionsCheck with correct parent/child relationship
// const moneyPlantHoldTransactionsCheck = async (childMemberId) => {
//     try {
//         console.log(`🔍 Starting hold check for child member: ${childMemberId}`);
        
//         // 1. Fix JSON_CONTAINS query for proper array search
//         const [parentRecords] = await pool.query(
//             `SELECT member_id,active_directs ,active_directs_list 
//              FROM ranktable 
//              WHERE JSON_CONTAINS(active_directs_list, ?, '$')`,  // '$' specifies searching at the root level
//             [JSON.stringify({ member_id:childMemberId })]
//         );
        

//         console.log(`👥 Found ${parentRecords.length} parent(s) for ${childMemberId}`);

//         // 2. Add null-check for parent records
//         if (!parentRecords || parentRecords.length === 0) { 
//             console.log('⏩ No parents found with active directs');
//             return;
//         }
//         //check that parent have more than 2 active directs
//         console.log(parentRecords[0]?.active_directs)
//         if (parentRecords[0].active_directs<2) {
//             console.log('⏩ Parent have less than 2 active directs so commission will remain on hold');
//             return;
//             }

//         for (const parent of parentRecords) {
//             console.log(`🔎 Processing parent: ${parent.member_id}`);
            
//             // 3. Use proper destructuring for query results
//             const [heldTransactions] = await pool.query(
//                 `SELECT transaction_id, member_id, amount, message 
//                  FROM universal_transaction_table 
//                  WHERE member_id = ? 
//                  AND message LIKE '%Commission not credited due to insufficient directs%'`,
//                 [parent.member_id]
//             );

//             console.log(`📨 Found ${heldTransactions.length} held transactions for parent ${parent.member_id}`);

//             // 4. Add transaction validation before processing
//             for (const txn of heldTransactions) {
//                 if (!txn.transaction_id || !txn.message) {
//                     console.log('🚫 Invalid transaction record:', txn);
//                     continue;
//                 }

//                 console.log(`🔄 Processing transaction ${txn.transaction_id}`);
                
//                 // 5. Add fallback for message replacement
//                 const newMessage = txn.message.includes(' | Commission not credited') 
//                     ? txn.message.replace(' | Commission not credited due to insufficient directs', '')
//                     : txn.message;

//                 // 6. Use transaction for atomic updates
//                 const connection = await pool.getConnection();
//                 await connection.beginTransaction();

//                 try {
//                     // Update transaction message
//                     await connection.query(
//                         `UPDATE universal_transaction_table 
//                          SET message = ? 
//                          WHERE transaction_id = ?`,
//                         [newMessage, txn.transaction_id]
//                     );

//                     // // Insert into commission wallet
//                     // await connection.query(
//                     //     `INSERT INTO commission_wallet 
//                     //      (member_id, commissionBy, transaction_id_for_member_id, 
//                     //       transaction_id_of_commissionBy, credit, level) 
//                     //      VALUES (?, 'Magic Plant', ?, ?, ?, ?)`,
//                     //     [parent.member_id, txn.transaction_id, txn.transaction_id, 
//                     //      txn.amount, 'Commission Released']
//                     // );

//                     await connection.commit();
//                     console.log(`✅ Released ${txn.amount} for ${parent.member_id} (TX: ${txn.transaction_id})`);
//                 } catch (innerError) {
//                     await connection.rollback();
//                     console.error('🔴 Transaction rollback:', innerError);
//                     throw innerError;
//                 } finally {
//                     connection.release();
//                 }
//             }
//         }
//         console.log(`🏁 Completed hold check for ${childMemberId}`);
//     } catch (error) {
//         console.error("🚨 Error in moneyPlantHoldTransactionsCheck:", error);
//         throw error;
//     }
// };




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

















///////////////////////////////////////

const { pool } = require('../config/database');
const generateTransactionId = require('../utills/generateTxnId');



// Enhanced safeParseJSON to handle both legacy and new formats
const safeParseJSON = (jsonString) => {
    if (typeof jsonString === 'object') return jsonString;
    if (!jsonString || jsonString.trim() === '') return [];

    try {
        const parsed = JSON.parse(jsonString);

        // Convert legacy format (array of strings) to node structure
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            return parsed.map(member => ({ member, children: [] }));
        }

        // Ensure the new format is correct
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            return parsed;
        }

        return [];
    } catch (error) {
        console.error("JSON Parse Error:", error);
        return [];
    }
};

// Magic Plant Configuration
const MAX_LEVELS = 7;
const LEVEL_CONFIG = {
    maxChildren: [2, 4, 8, 16, 32, 64, 128],
    rewards: [24, 40, 120, 1200, 14000, 1200000, 0]
};

const handleMagicPlant = async (memberId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        console.log(`\n🌱 Starting Magic Plant process for ${memberId}`);

        // 1. Fetch Level 1 data
        const [level1Data] = await connection.query(
            "SELECT * FROM magic_plant_levels WHERE level_name = 'Level 1'"
        );

        if (!level1Data || level1Data.length === 0) {
            throw new Error('Level 1 data not found in database');
        }

        // Parse member_list with enhanced error handling
        let level1Nodes = safeParseJSON(level1Data[0].member_list);
        console.log(`📊 Level 1 nodes:`, level1Nodes);

        if (!Array.isArray(level1Nodes)) {
            throw new Error('Level 1 nodes must be an array');
        }

        // 2. Find first available node
        const parentNode = level1Nodes.find(node => 
            node.children.length < LEVEL_CONFIG.maxChildren[0]
        );

        if (!parentNode) {
            throw new Error('No available node in Level 1');
        }

        // 3. Add new member to parent node
        parentNode.children.push(memberId);
        console.log(`➕ Added ${memberId} to ${parentNode.member}'s children`);

        // 4. Update Level 1
        await connection.query(
            "UPDATE magic_plant_levels SET member_list = ? WHERE level_name = 'Level 1'",
            [JSON.stringify(level1Nodes)]
        );

        // 5. Check if parent node needs promotion
        if (parentNode.children.length >= LEVEL_CONFIG.maxChildren[0]) {
            console.log(`⚡ ${parentNode.member} reached capacity (${parentNode.children.length} children)`);
            await cascadePromotion(connection, parentNode, 0);
        }

        await connection.commit();
        console.log('✅ Magic Plant process completed');
    } catch (error) {
        await connection.rollback();
        console.error('🚨 Transaction failed:', error);
        throw error;
    } finally {
        connection.release();
    }
};

const cascadePromotion = async (conn, node, currentLevelIndex) => {
    if (currentLevelIndex >= MAX_LEVELS - 1) return;

    const nextLevelIndex = currentLevelIndex + 1;
    console.log(`\n🌀 Processing promotion from Level ${currentLevelIndex + 1} to ${nextLevelIndex + 1} for ${node.member}`);

    // 1. Remove from current level
    const [currentLevelData] = await conn.query(
        "SELECT * FROM magic_plant_levels WHERE sno = ?",
        [currentLevelIndex + 1]
    );
    let currentNodes = safeParseJSON(currentLevelData[0].member_list);
    currentNodes = currentNodes.filter(n => n.member !== node.member);
    
    // Add children as new nodes
    const newNodes = node.children.map(child => ({ member: child, children: [] }));
    currentNodes.push(...newNodes);
    
    await conn.query(
        "UPDATE magic_plant_levels SET member_list = ? WHERE sno = ?",
        [JSON.stringify(currentNodes), currentLevelIndex + 1]
    );
    console.log(`🔀 Promoted ${node.children.length} children to Level ${currentLevelIndex + 1}`);

    // 2. Add to next level
    const [nextLevelData] = await conn.query(
        "SELECT * FROM magic_plant_levels WHERE sno = ?",
        [nextLevelIndex + 1]
    );
    let nextNodes = safeParseJSON(nextLevelData[0].member_list);
    
    // Find available parent in next level
    const nextParent = nextNodes.find(n => 
        n.children.length < LEVEL_CONFIG.maxChildren[nextLevelIndex]
    );

    if (nextParent) {
        nextParent.children.push(node.member);
        console.log(`⬆️ Added ${node.member} to ${nextParent.member}'s children in Level ${nextLevelIndex + 1}`);
    } else {
        nextNodes.push({ member: node.member, children: [] });
        console.log(`🆕 Created new node for ${node.member} in Level ${nextLevelIndex + 1}`);
    }

    await conn.query(
        "UPDATE magic_plant_levels SET member_list = ? WHERE sno = ?",
        [JSON.stringify(nextNodes), nextLevelIndex + 1]
    );

    // 3. Process reward
    const reward = LEVEL_CONFIG.rewards[currentLevelIndex];
    if (reward > 0) {
        const txnId = generateTransactionId();
        console.log(`💰 Crediting ${reward} to ${node.member} for Level ${currentLevelIndex + 1} promotion`);
                        // Fixed member_id reference to movedMember
        const [directs] = await pool.query(
            `SELECT mh.member 
            FROM member_hierarchy mh
            JOIN usersdetails ud ON mh.member = ud.memberid
            WHERE mh.upline = ? 
            AND mh.level = 1 
            AND ud.membership IN ('PREMIUM', 'BASIC')`,
    
            [node.member]
        );
        if (directs.length < 2) {
        console.log(`⏳ Holding commission for ${node.member} (only ${directs.length} directs)`);

            await conn.query(
                `INSERT INTO universal_transaction_table 
                (transaction_id, member_id, type, subType, amount, status, message) 
                VALUES (?, ?, 'Magic Plant', ?, ?, 'success', ?)`,
                [txnId, node.member, `Moved to Level ${currentLevelIndex + 2}`, reward, 
                `Moved to ${currentLevelIndex + 2} | Commission not credited due to insufficient directs`]
            );
    
            await conn.query(
                `INSERT INTO commission_wallet 
                (member_id, commissionBy, transaction_id_for_member_id, 
                transaction_id_of_commissionBy, credit, level) 
                VALUES (?, 'Magic Plant', ?, ?, ?, ?)`,
                [node.member, txnId, txnId, reward, `Moved to Level ${currentLevelIndex + 2}`]
            );
            
                console.log(`Updating total balance with ${reward}`);
                await conn.query(
                    `UPDATE users_total_balance 
                    SET user_total_balance = user_total_balance + ? 
                    WHERE member_id = ?`,
                    [reward, node.member]
                );
        
        }else{
            console.log(`💸 Crediting commission for ${node.member}`);
            await conn.query(
                `INSERT INTO universal_transaction_table 
                (transaction_id, member_id, type, subType, amount, status, message) 
                VALUES (?, ?, 'Magic Plant', ?, ?, 'success', ?)`,
                [txnId, node.member, `Moved to Level ${currentLevelIndex + 2}`, reward, 
                `Moved to ${currentLevelIndex + 1}`]
            );
    
            await conn.query(
                `INSERT INTO commission_wallet 
                (member_id, commissionBy, transaction_id_for_member_id, 
                transaction_id_of_commissionBy, credit, level) 
                VALUES (?, 'Magic Plant', ?, ?, ?, ?)`,
                [node.member, txnId, txnId, reward, `Moved to Level ${currentLevelIndex + 2}`]
            );
            console.log(`Updating total balance with ${reward}`);
            await conn.query(
                `UPDATE users_total_balance 
                SET user_total_balance = user_total_balance + ? 
                WHERE member_id = ?`,
                [reward, node.member]
            );
        }
         
       
    }

    // 4. Check if next level needs cascading
    if (nextParent && nextParent.children.length >= LEVEL_CONFIG.maxChildren[nextLevelIndex]) {
        console.log(`⚡ Triggering next level cascade for ${nextParent.member}`);
        await cascadePromotion(conn, nextParent, nextLevelIndex);
    }
};

// Updated hold check with tree structure support
const moneyPlantHoldTransactionsCheck = async (childMemberId) => {
    console.log(`\n🔍 Checking holds for ${childMemberId}`);
    
    
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

module.exports = {
    handleMagicPlant,
    moneyPlantHoldTransactionsCheck
};



/////////////////////////////////



// module.exports = { handleMagicPlant, moneyPlantHoldTransactionsCheck };