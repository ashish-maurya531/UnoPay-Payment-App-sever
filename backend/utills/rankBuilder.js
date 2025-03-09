const { pool } = require('../config/database');
const STARTING_ID = 'UP100010'; 


// const recreateRankTable = async () => {
//     console.log("Recreating rank table...");
//     await pool.query(`TRUNCATE TABLE ranktable`);
//     const [users] = await pool.query(`SELECT memberid FROM usersdetails`);

//     // Function to get sponsor ID for a member
//     const getSponsorId = async (memberId) => {
//         const [sponsor] = await pool.query(
//             `SELECT sponser_id FROM member WHERE member_id = ?`,
//             [memberId]
//         );
//         return sponsor.length > 0 ? sponsor[0].sponser_id : STARTING_ID;
//     };

//     // Function to calculate team and active team members
//     const getTeamData = async (id) => {
//         const [teamMembers] = await pool.query(
//             `SELECT 
//                 mh.member AS member_id,
//                 u.membership,
//                 IFNULL(r.rank_no, 0) AS \`rank\`
//             FROM member_hierarchy mh
//             LEFT JOIN usersdetails u ON mh.member = u.memberid
//             LEFT JOIN ranktable r ON mh.member = r.member_id
//             WHERE mh.super_upline = ?`,
//             [id]
//         );
    
//         const activeTeamMembers = teamMembers.filter(member => ['BASIC', 'PREMIUM'].includes(member.membership));
//         const activeTeamList = activeTeamMembers.map(member => ({
//             rank: member.rank,
//             member_id: member.member_id,
//             membership: member.membership,
//         }));
    
//         return {
//             team: teamMembers.length,
//             activeTeam: activeTeamMembers.length,
//             activeTeamList: JSON.stringify(activeTeamList),
//         };
//     };
 
//     // Function to calculate directs and active directs
//     const getDirectsData = async (id) => {
//         const [directs] = await pool.query(
//             `SELECT 
//                 m.member_id,
//                 u.membership,
//                 IFNULL(r.rank_no, 0) AS \`rank\`
//             FROM member m
//             LEFT JOIN usersdetails u ON m.member_id = u.memberid
//             LEFT JOIN ranktable r ON m.member_id = r.member_id
//             WHERE m.sponser_id = ?`,
//             [id]
//         );

//         const activeDirects = directs.filter(member => ['BASIC', 'PREMIUM'].includes(member.membership));
//         const activeDirectsList = activeDirects.map(member => ({
//             rank: member.rank,
//             member_id: member.member_id,
//             membership: member.membership,
//         }));

//         return {
//             directs: directs.length,
//             activeDirects: activeDirects.length,
//             activeDirectsList: JSON.stringify(activeDirectsList),
//         };
//     };

//     // Function to calculate rank based on active team count
//     const calculateRank = (activeTeamCount) => {
//         if (activeTeamCount >= 49152) return 7;
//         if (activeTeamCount >= 12288) return 6;
//         if (activeTeamCount >= 3072) return 5;
//         if (activeTeamCount >= 768) return 4;
//         if (activeTeamCount >= 192) return 3;
//         if (activeTeamCount >= 48) return 2;
//         if (activeTeamCount >= 12) return 1;
//         return 0;
//     };

//     // Function to update rank table with error handling
//     const updateRankTable = async (memberId) => {
//         try {
//             const sponsorId = await getSponsorId(memberId);
//             const { team, activeTeam, activeTeamList } = await getTeamData(memberId);
//             const { directs, activeDirects, activeDirectsList } = await getDirectsData(memberId);
//             const rank = calculateRank(activeTeam);

//             await pool.query(
//                 `INSERT INTO ranktable (
//                     sponser_id,
//                     member_id,
//                     directs,
//                     active_directs,
//                     rank_no,
//                     active_directs_list,
//                     team,
//                     active_team,
//                     active_team_list,
//                     OPAL,
//                     TOPAZ,
//                     JASPER,
//                     ALEXANDER,
//                     DIAMOND,
//                     BLUE_DIAMOND,
//                     CROWN_DIAMOND,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, NOW())
//                 ON DUPLICATE KEY UPDATE
//                     sponser_id = VALUES(sponser_id),
//                     directs = VALUES(directs),
//                     active_directs = VALUES(active_directs),
//                     rank_no = VALUES(rank_no),
//                     active_directs_list = VALUES(active_directs_list),
//                     team = VALUES(team),
//                     active_team = VALUES(active_team),
//                     active_team_list = VALUES(active_team_list),
//                     updated_at = NOW()`,
//                 [
//                     sponsorId,
//                     memberId,
//                     directs,
//                     activeDirects,
//                     rank,
//                     activeDirectsList,
//                     team,
//                     activeTeam,
//                     activeTeamList,
//                 ]
//             );
//         } catch (error) {
//             console.error(`Error updating rank table for member ${memberId}:`, error);
//             throw error;
//         }
//     };

//     // Process all users with batch processing
//     const batchSize = 100;
//     for (let i = 0; i < users.length; i += batchSize) {
//         const batch = users.slice(i, i + batchSize);
//         await Promise.all(batch.map(user => updateRankTable(user.memberid)));
//         console.log(`Processed ${Math.min(i + batchSize, users.length)} out of ${users.length} users`);
//     }

//     console.log("Rank table recreated successfully!");
// };





//phoneno no email 


// const updateRankAndBacktrack = async (memberId) => {
//     const getSponsorId = async (memberId) => {
//         const [sponsor] = await pool.query(
//             `SELECT sponser_id FROM member WHERE member_id = ?`,
//             [memberId]
//         );
//         return sponsor.length > 0 ? sponsor[0].sponser_id : STARTING_ID;
//     };

//     const getTeamData = async (id) => {
//         const [teamMembers] = await pool.query(
//             `SELECT 
//                 mh.member AS member_id,
//                 u.membership,
//                 IFNULL(r.rank_no, 0) AS \`rank\`
//             FROM member_hierarchy mh
//             LEFT JOIN usersdetails u ON mh.member = u.memberid
//             LEFT JOIN ranktable r ON mh.member = r.member_id
//             WHERE mh.super_upline = ?`,
//             [id]
//         );

//         const activeTeamMembers = teamMembers.filter(member => ['BASIC', 'PREMIUM'].includes(member.membership));
//         return {
//             team: teamMembers.length,
//             activeTeam: activeTeamMembers.length,
//             activeTeamList: JSON.stringify(activeTeamMembers.map(member => ({
//                 rank: member.rank,
//                 member_id: member.member_id,
//                 membership: member.membership,
//             }))),
//         };
//     };

//     const getDirectsData = async (id) => {
//         const [directs] = await pool.query(
//             `SELECT 
//                 m.member_id,
//                 u.membership,
//                 IFNULL(r.rank_no, 0) AS \`rank\`
//             FROM member m
//             LEFT JOIN usersdetails u ON m.member_id = u.memberid
//             LEFT JOIN ranktable r ON m.member_id = r.member_id
//             WHERE m.sponser_id = ?`,
//             [id]
//         );

//         const activeDirects = directs.filter(member => ['BASIC', 'PREMIUM'].includes(member.membership));
//         return {
//             directs: directs.length,
//             activeDirects: activeDirects.length,
//             activeDirectsList: JSON.stringify(activeDirects.map(member => ({
//                 rank: member.rank,
//                 member_id: member.member_id,
//                 membership: member.membership,
//             }))),
//         };
//     };

//     const calculateRank = (activeTeamCount) => {
//         if (activeTeamCount >= 49152) return 7;
//         if (activeTeamCount >= 12288) return 6;
//         if (activeTeamCount >= 3072) return 5;
//         if (activeTeamCount >= 768) return 4;
//         if (activeTeamCount >= 192) return 3;
//         if (activeTeamCount >= 48) return 2;
//         if (activeTeamCount >= 12) return 1;
//         return 0;
//     };

//     const processMember = async (memberId) => {
//         try {
//             const sponsorId = await getSponsorId(memberId);
//             const { team, activeTeam, activeTeamList } = await getTeamData(memberId);
//             const { directs, activeDirects, activeDirectsList } = await getDirectsData(memberId);
//             const rank = calculateRank(activeTeam);

//             await pool.query(
//                 `INSERT INTO ranktable (
//                     sponser_id, member_id, directs, active_directs, rank_no,
//                     active_directs_list, team, active_team, active_team_list,
//                     OPAL, TOPAZ, JASPER, ALEXANDER, DIAMOND, BLUE_DIAMOND,
//                     CROWN_DIAMOND, updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, NOW())
//                 ON DUPLICATE KEY UPDATE
//                     sponser_id = VALUES(sponser_id),
//                     directs = VALUES(directs),
//                     active_directs = VALUES(active_directs),
//                     rank_no = VALUES(rank_no),
//                     active_directs_list = VALUES(active_directs_list),
//                     team = VALUES(team),
//                     active_team = VALUES(active_team),
//                     active_team_list = VALUES(active_team_list),
//                     updated_at = NOW()`,
//                 [
//                     sponsorId, memberId, directs, activeDirects, rank,
//                     activeDirectsList, team, activeTeam, activeTeamList
//                 ]
//             );
//         } catch (error) {
//             console.error(`Error updating rank for ${memberId}:`, error);
//             throw error;
//         }
//     };

//     let currentId = memberId;
//     const processed = new Set();

//     while (currentId !== STARTING_ID && !processed.has(currentId)) {
//         await processMember(currentId);
//         processed.add(currentId);
//         currentId = await getSponsorId(currentId);
//     }

//     // Process STARTING_ID if not already processed
//     if (!processed.has(STARTING_ID)) {
//         await processMember(STARTING_ID);
//     }
//     console.log("Update and BackTrack successfully!");
// };










////////////////////////////////////////////

const recreateRankTable = async () => {
    console.log("Recreating rank table...");
    
    try {
        // First, check if rank_array column exists, add it if it doesn't
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'ranktable' 
            AND COLUMN_NAME = 'rank_array'
        `);
        
        if (columns.length === 0) {
            console.log("Adding rank_array column to ranktable...");
            await pool.query(`
                ALTER TABLE ranktable 
                ADD COLUMN rank_array JSON AFTER rank_no
            `);
        }
        
        // Truncate the table to start fresh
        await pool.query(`TRUNCATE TABLE ranktable`);
        
        // Get all users
        const [users] = await pool.query(`SELECT memberid FROM usersdetails`);
        console.log(`Found ${users.length} users to process`);

        // Function to get sponsor ID for a member
        const getSponsorId = async (memberId) => {
            const [sponsor] = await pool.query(
                `SELECT sponser_id FROM member WHERE member_id = ?`,
                [memberId]
            );
            return sponsor.length > 0 ? sponsor[0].sponser_id : STARTING_ID;
        };

        // Function to calculate team and active team members using the new approach
        const getTeamData = async (id) => {
            // Get all team members up to level 7
            const [teamMembers] = await pool.query(
                `SELECT 
                    mh.super_upline, 
                    mh.member, 
                    mh.level,
                    u.username,
                    u.membership,
                    u.phoneno,
                    IFNULL(r.rank_no, 0) AS \`rank\`
                FROM member_hierarchy mh
                LEFT JOIN usersdetails u ON mh.member = u.memberid
                LEFT JOIN ranktable r ON mh.member = r.member_id
                WHERE mh.super_upline = ? AND mh.level <= 7
                ORDER BY mh.level`,
                [id]
            );

            // Filter active members (BASIC or PREMIUM)
            const activeTeamMembers = teamMembers.filter(member => 
                ['BASIC', 'PREMIUM'].includes(member.membership)
            );

            // Group active members by level
            const membersByLevel = {};
            for (let i = 1; i <= 7; i++) {
                membersByLevel[i] = activeTeamMembers.filter(member => member.level === i);
            }

            // Calculate ranks based on level criteria
            const rankArray = [];
            const levelThresholds = {
                1: 12,
                2: 48,
                3: 192,
                4: 768,
                5: 3072,
                6: 12288,
                7: 49152
            };

            // Check criteria for each level independently
            for (let level = 1; level <= 7; level++) {
                const membersAtThisLevelAndBelow = activeTeamMembers.filter(m => m.level <= level);
                
                if (membersAtThisLevelAndBelow.length >= levelThresholds[level]) {
                    rankArray.push(level);
                }
            }

            // Format active team list with additional fields
            const formattedActiveTeamList = activeTeamMembers.map(member => ({
                rank: member.rank,
                member_id: member.member,
                membership: member.membership,
                username: member.username,
                phoneno: member.phoneno,
                level: member.level
            }));

            return {
                team: teamMembers.length,
                activeTeam: activeTeamMembers.length,
                activeTeamList: JSON.stringify(formattedActiveTeamList),
                rankArray
            };
        };

        // Function to calculate directs and active directs with the new fields
        const getDirectsData = async (id) => {
            const [directs] = await pool.query(
                `SELECT 
                    m.member_id,
                    u.username,
                    u.membership,
                    u.phoneno,
                    IFNULL(r.rank_no, 0) AS \`rank\`
                FROM member m
                LEFT JOIN usersdetails u ON m.member_id = u.memberid
                LEFT JOIN ranktable r ON m.member_id = r.member_id
                WHERE m.sponser_id = ?`,
                [id]
            );

            const activeDirects = directs.filter(member => ['BASIC', 'PREMIUM'].includes(member.membership));
            
            // Format active directs list with additional fields
            const formattedActiveDirectsList = activeDirects.map(member => ({
                rank: member.rank,
                member_id: member.member_id,
                membership: member.membership,
                username: member.username,
                phoneno: member.phoneno,
                level: 1 // Direct members are at level 1
            }));

            return {
                directs: directs.length,
                activeDirects: activeDirects.length,
                activeDirectsList: JSON.stringify(formattedActiveDirectsList)
            };
        };

        // Function to update rank table with error handling
        const updateRankTable = async (memberId) => {
            try {
                const sponsorId = await getSponsorId(memberId);
                const { team, activeTeam, activeTeamList, rankArray } = await getTeamData(memberId);
                const { directs, activeDirects, activeDirectsList } = await getDirectsData(memberId);
                
                // The highest rank in the rankArray is now the member's rank
                const rank = rankArray.length > 0 ? Math.max(...rankArray) : 0;
                const rankArrayString = JSON.stringify(rankArray);

                await pool.query(
                    `INSERT INTO ranktable (
                        sponser_id,
                        member_id,
                        directs,
                        active_directs,
                        rank_no,
                        rank_array,
                        active_directs_list,
                        team,
                        active_team,
                        active_team_list,
                        OPAL,
                        TOPAZ,
                        JASPER,
                        ALEXANDER,
                        DIAMOND,
                        BLUE_DIAMOND,
                        CROWN_DIAMOND,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, NOW())
                    ON DUPLICATE KEY UPDATE
                        sponser_id = VALUES(sponser_id),
                        directs = VALUES(directs),
                        active_directs = VALUES(active_directs),
                        rank_no = VALUES(rank_no),
                        rank_array = VALUES(rank_array),
                        active_directs_list = VALUES(active_directs_list),
                        team = VALUES(team),
                        active_team = VALUES(active_team),
                        active_team_list = VALUES(active_team_list),
                        updated_at = NOW()`,
                    [
                        sponsorId,
                        memberId,
                        directs,
                        activeDirects,
                        rank,
                        rankArrayString,
                        activeDirectsList,
                        team,
                        activeTeam,
                        activeTeamList,
                    ]
                );
                return true;
            } catch (error) {
                console.error(`Error updating rank table for member ${memberId}:`, error);
                return false;
            }
        };

        // Process all users with batch processing and track progress
        const batchSize = 50; // Reduced batch size for more stable processing
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            const results = await Promise.allSettled(batch.map(user => updateRankTable(user.memberid)));
            
            // Count successes and failures
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value === true) {
                    successCount++;
                } else {
                    failCount++;
                }
            });
            
            console.log(`Processed ${Math.min(i + batchSize, users.length)} out of ${users.length} users (Success: ${successCount}, Failed: ${failCount})`);
        }

        console.log(`Rank table recreated successfully! Total: ${users.length}, Success: ${successCount}, Failed: ${failCount}`);
    } catch (error) {
        console.error("Error recreating rank table:", error);
        throw error;
    }
};






const updateRankAndBacktrack = async (memberId) => {
    const getSponsorId = async (memberId) => {
        const [sponsor] = await pool.query(
            `SELECT sponser_id FROM member WHERE member_id = ?`,
            [memberId]
        );
        return sponsor.length > 0 ? sponsor[0].sponser_id : STARTING_ID;
    };

    const getTeamData = async (id) => {
        // Get all team members up to level 7
        const [teamMembers] = await pool.query(
            `SELECT 
                mh.super_upline, 
                mh.member, 
                mh.level,
                u.username,
                u.membership,
                u.phoneno,
                IFNULL(r.rank_no, 0) AS \`rank\`
            FROM member_hierarchy mh
            LEFT JOIN usersdetails u ON mh.member = u.memberid
            LEFT JOIN ranktable r ON mh.member = r.member_id
            WHERE mh.super_upline = ? AND mh.level <= 7
            ORDER BY mh.level`,
            [id]
        );

        // Filter active members (BASIC or PREMIUM)
        const activeTeamMembers = teamMembers.filter(member => 
            ['BASIC', 'PREMIUM'].includes(member.membership)
        );

        // Group active members by level
        const membersByLevel = {};
        for (let i = 1; i <= 7; i++) {
            membersByLevel[i] = activeTeamMembers.filter(member => member.level === i);
        }

        // Calculate ranks based on level criteria
        const rankArray = [];
        const levelThresholds = {
            1: 12,
            2: 48,
            3: 192,
            4: 768,
            5: 3072,
            6: 12288,
            7: 49152
        };

        // Check criteria for each level independently
        for (let level = 1; level <= 7; level++) {
            const membersAtThisLevelAndBelow = activeTeamMembers.filter(m => m.level <= level);
            
            if (membersAtThisLevelAndBelow.length >= levelThresholds[level]) {
                rankArray.push(level);
            }
        }

        // Format active team list with additional fields
        const formattedActiveTeamList = activeTeamMembers.map(member => ({
            rank: member.rank,
            member_id: member.member,
            membership: member.membership,
            username: member.username,
            phoneno: member.phoneno,
            level: member.level
        }));

        return {
            team: teamMembers.length,
            activeTeam: activeTeamMembers.length,
            activeTeamList: JSON.stringify(formattedActiveTeamList),
            rankArray
        };
    };

    const getDirectsData = async (id) => {
        const [directs] = await pool.query(
            `SELECT 
                m.member_id,
                u.username,
                u.membership,
                u.phoneno,
                IFNULL(r.rank_no, 0) AS \`rank\`
            FROM member m
            LEFT JOIN usersdetails u ON m.member_id = u.memberid
            LEFT JOIN ranktable r ON m.member_id = r.member_id
            WHERE m.sponser_id = ?`,
            [id]
        );

        const activeDirects = directs.filter(member => ['BASIC', 'PREMIUM'].includes(member.membership));
        
        // Format active directs list with additional fields
        const formattedActiveDirectsList = activeDirects.map(member => ({
            rank: member.rank,
            member_id: member.member_id,
            membership: member.membership,
            username: member.username,
            phoneno: member.phoneno,
            level: 1 // Direct members are at level 1
        }));

        return {
            directs: directs.length,
            activeDirects: activeDirects.length,
            activeDirectsList: JSON.stringify(formattedActiveDirectsList)
        };
    };

    const processMember = async (memberId) => {
        try {
            const sponsorId = await getSponsorId(memberId);
            const { team, activeTeam, activeTeamList, rankArray } = await getTeamData(memberId);
            const { directs, activeDirects, activeDirectsList } = await getDirectsData(memberId);
            
            // The highest rank in the rankArray is now the member's rank
            const rank = rankArray.length > 0 ? Math.max(...rankArray) : 0;
            const rankArrayString = JSON.stringify(rankArray);

            await pool.query(
                `INSERT INTO ranktable (
                    sponser_id, member_id, directs, active_directs, rank_no,
                    active_directs_list, team, active_team, active_team_list,
                    rank_array, OPAL, TOPAZ, JASPER, ALEXANDER, DIAMOND, BLUE_DIAMOND,
                    CROWN_DIAMOND, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, NOW())
                ON DUPLICATE KEY UPDATE
                    sponser_id = VALUES(sponser_id),
                    directs = VALUES(directs),
                    active_directs = VALUES(active_directs),
                    rank_no = VALUES(rank_no),
                    active_directs_list = VALUES(active_directs_list),
                    team = VALUES(team),
                    active_team = VALUES(active_team),
                    active_team_list = VALUES(active_team_list),
                    rank_array = VALUES(rank_array),
                    updated_at = NOW()`,
                [
                    sponsorId, memberId, directs, activeDirects, rank,
                    activeDirectsList, team, activeTeam, activeTeamList,
                    rankArrayString
                ]
            );
        } catch (error) {
            console.error(`Error updating rank for ${memberId}:`, error);
            throw error;
        }
    };

    let currentId = memberId;
    const processed = new Set();

    while (currentId !== STARTING_ID && !processed.has(currentId)) {
        await processMember(currentId);
        processed.add(currentId);
        currentId = await getSponsorId(currentId);
    }

    // Process STARTING_ID if not already processed
    if (!processed.has(STARTING_ID)) {
        await processMember(STARTING_ID);
    }
    console.log("Update and BackTrack successfully!");
};
///////////////////////////////////
module.exports = { recreateRankTable ,updateRankAndBacktrack};
