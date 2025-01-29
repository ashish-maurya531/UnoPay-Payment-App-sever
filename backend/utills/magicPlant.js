const { pool } = require('../config/database');
const generateTransactionId = require('../utills/generateTxnId');


/**
 * Safely parse JSON or return an empty array.
 * @param {string|object|null} jsonString - JSON string from DB or an object.
 * @returns {Array} - Parsed array or empty array.
 */
const safeParseJSON = (jsonString) => {
    if (typeof jsonString === 'object' && jsonString !== null) {
        return jsonString; // If it's already an object, return it directly
    }

    if (typeof jsonString !== 'string' || jsonString.trim() === '') {
        return []; // If it's not a string or is an empty string, return an empty array
    }

    try {
        return JSON.parse(jsonString); // Attempt to parse the JSON string
    } catch (error) {
        console.error("JSON Parse Error:", error);
        return []; // Return an empty array if parsing fails
    }
};

/**
 * Handles new member registration and adds them to Level 1.
 * @param {string} memberId - New member ID.
 */
const handleMagicPlant = async (memberId) => {
    try {
        // Fetch all levels
        const [levels] = await pool.query("SELECT * FROM magic_plant_levels ORDER BY sno ASC");

        // Get Level 1 members & add new member
        let level1Members = safeParseJSON(levels[0].member_list);
        level1Members.push(memberId);

        // Update Level 1 in DB
        await pool.query("UPDATE magic_plant_levels SET member_list = ? WHERE level_name = 'Level 1'", 
            [JSON.stringify(level1Members)]
        );

        console.log(`${memberId} added to Level 1.`);
        await cascadeLevels(); // Trigger cascade check
    } catch (error) {
        console.error("Error in handleMagicPlant:", error);
    }
};

/**
 * Moves members to higher levels based on capacity.
 */
const cascadeLevels = async () => {
    try {
        const moneyRewards = [24, 40, 120, 1200, 14000, 1200000, 0]; // Rewards per level
        const maxMembersPerLevel = [2, 4, 8, 16, 32, 64, 128]; // Max members per level

        const [levels] = await pool.query("SELECT * FROM magic_plant_levels ORDER BY sno ASC");

        for (let i = 0; i < 6; i++) { // Process levels 1 to 6
            let currentLevel = levels[i];
            let nextLevel = levels[i + 1];

            let currentMembers = safeParseJSON(currentLevel.member_list);
            let nextMembers = safeParseJSON(nextLevel.member_list);

            while (currentMembers.length > maxMembersPerLevel[i]) {
                let movedMember = currentMembers.shift(); // Remove member from current level
                nextMembers.push(movedMember); // Move to next level

                console.log(`${movedMember} moved from ${currentLevel.level_name} to ${nextLevel.level_name}`);

                // Reward system (optional)
                const txnId = generateTransactionId();
                const reward = moneyRewards[i];

                // Uncomment these if you want to insert transactions
                
                await pool.query(
                    `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType, amount, status, message) 
                     VALUES (?, ?, 'Magic Plant', ?, ?, 'success', ?)`,
                    [txnId, movedMember, `Moved to ${nextLevel.level_name}`, reward, `Moved to ${nextLevel.level_name}`]
                );

                await pool.query(
                    `INSERT INTO commission_wallet (member_id, commissionBy, transaction_id_for_member_id, credit, level) 
                     VALUES (?, 'Magic Plant', ?, ?, ?);`,
                    [movedMember, txnId, reward, `Moved to ${nextLevel.level_name}`]
                );
                
            }

            // Update both current and next levels in DB
            await pool.query("UPDATE magic_plant_levels SET member_list = ? WHERE level_name = ?", 
                [JSON.stringify(currentMembers), currentLevel.level_name]
            );
            await pool.query("UPDATE magic_plant_levels SET member_list = ? WHERE level_name = ?", 
                [JSON.stringify(nextMembers), nextLevel.level_name]
            );
        }

        console.log("Cascade process completed.");
    } catch (error) {
        console.error("Error in cascadeLevels:", error);
    }
};

module.exports = { handleMagicPlant };