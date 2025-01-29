const { pool } = require('../config/database');

/**
 * Handles the cascading of members across levels in the Magic Plant system.
 * @param {string} memberId - ID of the new member.
 */
const handleMagicPlant = async (memberId) => {
    try {
        // Add the new member to level 1 in the next available row
        await pool.query("INSERT INTO magic_plant_levels (level_1) VALUES (?)", [memberId]);

        console.log(`${memberId} added to level 1.`);
        await cascadeLevels();
    } catch (error) {
        console.error("Error handling Magic Plant:", error);
    }
};

/**
 * Cascades members across levels based on predefined rules.
 */
const cascadeLevels = async () => {
    try {
        const moneyRewards = [24, 40, 120, 1200, 14000, 1200000, 0]; // Rewards for each level jump
        const maxMembersPerLevel = [2, 4, 8, 16, 32, 64, 128]; // Maximum members per level
        const [rows] = await pool.query("SELECT * FROM magic_plant_levels ORDER BY sno ASC");

        for (let level = 1; level <= 7; level++) {
            const currentLevelKey = `level_${level}`;
            const nextLevelKey = `level_${level + 1}`;

            for (const row of rows) {
                const membersAtCurrentLevel = row[currentLevelKey] ? row[currentLevelKey].split(',') : [];

                // If the current level exceeds its maximum, cascade to the next level
                while (membersAtCurrentLevel.length > maxMembersPerLevel[level - 1]) {
                    const topMember = membersAtCurrentLevel.shift(); // Remove the top member

                    if (level < 7) {
                        // Add the member to the next level
                        const nextLevelMembers = row[nextLevelKey] ? row[nextLevelKey].split(',') : [];
                        nextLevelMembers.push(topMember);

                        await pool.query(
                            `UPDATE magic_plant_levels 
                             SET ${nextLevelKey} = ? 
                             WHERE sno = ?`,
                            [nextLevelMembers.join(','), row.sno]
                        );

                        console.log(`${topMember} moved from level ${level} to level ${level + 1}.`);

                        // Add transaction and reward details
                        const txnId = `TXN_${Date.now()}`;
                        const reward = moneyRewards[level - 1];

                        await pool.query(
                            `INSERT INTO universal_transaction_table 
                             (transaction_id, member_id, type, subType, amount, status, message) 
                             VALUES (?, ?, 'Magic Plant', ?, ?, 'success', ?)`,
                            [txnId, topMember, `level ${level + 1}`, reward, `Moved to level ${level + 1}`]
                        );

                        await pool.query(
                            `INSERT INTO commission_wallet 
                             (member_id, commissionBy, transaction_id_for_member_id, credit, level) 
                             VALUES (?, 'Magic Plant', ?, ?, ?)`,
                            [topMember, txnId, reward, `level ${level + 1}`]
                        );
                    }

                    // Update the current level
                    await pool.query(
                        `UPDATE magic_plant_levels 
                         SET ${currentLevelKey} = ? 
                         WHERE sno = ?`,
                        [membersAtCurrentLevel.join(','), row.sno]
                    );
                }
            }
        }
    } catch (error) {
        console.error("Error in cascadeLevels:", error);
    }
};

module.exports = { handleMagicPlant };
