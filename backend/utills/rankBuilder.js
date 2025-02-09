const { pool } = require('../config/database');
const STARTING_ID = 'UP100010'; 


const recreateRankTable = async () => {
    console.log("Recreating rank table...");
    await pool.query(`TRUNCATE TABLE ranktable`);
    const [users] = await pool.query(`SELECT memberid FROM usersdetails`);

    // Function to get sponsor ID for a member
    const getSponsorId = async (memberId) => {
        const [sponsor] = await pool.query(
            `SELECT sponser_id FROM member WHERE member_id = ?`,
            [memberId]
        );
        return sponsor.length > 0 ? sponsor[0].sponser_id : STARTING_ID;
    };

    // Function to calculate team and active team members
    const getTeamData = async (id) => {
        const [teamMembers] = await pool.query(
            `SELECT 
                mh.member AS member_id,
                u.membership,
                IFNULL(r.rank_no, 0) AS \`rank\`
            FROM member_hierarchy mh
            LEFT JOIN usersdetails u ON mh.member = u.memberid
            LEFT JOIN ranktable r ON mh.member = r.member_id
            WHERE mh.super_upline = ?`,
            [id]
        );
    
        const activeTeamMembers = teamMembers.filter(member => ['BASIC', 'PREMIUM'].includes(member.membership));
        const activeTeamList = activeTeamMembers.map(member => ({
            rank: member.rank,
            member_id: member.member_id,
            membership: member.membership,
        }));
    
        return {
            team: teamMembers.length,
            activeTeam: activeTeamMembers.length,
            activeTeamList: JSON.stringify(activeTeamList),
        };
    };

    // Function to calculate directs and active directs
    const getDirectsData = async (id) => {
        const [directs] = await pool.query(
            `SELECT 
                m.member_id,
                u.membership,
                IFNULL(r.rank_no, 0) AS \`rank\`
            FROM member m
            LEFT JOIN usersdetails u ON m.member_id = u.memberid
            LEFT JOIN ranktable r ON m.member_id = r.member_id
            WHERE m.sponser_id = ?`,
            [id]
        );

        const activeDirects = directs.filter(member => ['BASIC', 'PREMIUM'].includes(member.membership));
        const activeDirectsList = activeDirects.map(member => ({
            rank: member.rank,
            member_id: member.member_id,
            membership: member.membership,
        }));

        return {
            directs: directs.length,
            activeDirects: activeDirects.length,
            activeDirectsList: JSON.stringify(activeDirectsList),
        };
    };

    // Function to calculate rank based on active team count
    const calculateRank = (activeTeamCount) => {
        if (activeTeamCount >= 49152) return 7;
        if (activeTeamCount >= 12288) return 6;
        if (activeTeamCount >= 3072) return 5;
        if (activeTeamCount >= 768) return 4;
        if (activeTeamCount >= 192) return 3;
        if (activeTeamCount >= 48) return 2;
        if (activeTeamCount >= 12) return 1;
        return 0;
    };

    // Function to update rank table with error handling
    const updateRankTable = async (memberId) => {
        try {
            const sponsorId = await getSponsorId(memberId);
            const { team, activeTeam, activeTeamList } = await getTeamData(memberId);
            const { directs, activeDirects, activeDirectsList } = await getDirectsData(memberId);
            const rank = calculateRank(activeTeam);

            await pool.query(
                `INSERT INTO ranktable (
                    sponser_id,
                    member_id,
                    directs,
                    active_directs,
                    rank_no,
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, NOW())
                ON DUPLICATE KEY UPDATE
                    sponser_id = VALUES(sponser_id),
                    directs = VALUES(directs),
                    active_directs = VALUES(active_directs),
                    rank_no = VALUES(rank_no),
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
                    activeDirectsList,
                    team,
                    activeTeam,
                    activeTeamList,
                ]
            );
        } catch (error) {
            console.error(`Error updating rank table for member ${memberId}:`, error);
            throw error;
        }
    };

    // Process all users with batch processing
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        await Promise.all(batch.map(user => updateRankTable(user.memberid)));
        console.log(`Processed ${Math.min(i + batchSize, users.length)} out of ${users.length} users`);
    }

    console.log("Rank table recreated successfully!");
};

module.exports = { recreateRankTable };



//phone no email 



const updateRankAndBacktrack = async (memberId) => {
    // Get team data for a member
    const getTeamData = async (id) => {
        const [result] = await pool.query(`
            SELECT
                COUNT(*) AS directs,
                COUNT(CASE WHEN u.membership IN ('BASIC', 'PREMIUM') THEN 1 END) AS active_directs,
                JSON_ARRAYAGG(
                    CASE WHEN u.membership IN ('BASIC', 'PREMIUM') 
                    THEN JSON_OBJECT(
                        'member_id', m.member_id, 
                        'rank', IFNULL(r.rank_no, 0), 
                        'membership', u.membership,
                        'status', u.status
                    )
                    END
                ) AS active_directs_list
            FROM member m
            LEFT JOIN usersdetails u ON m.member_id = u.memberid
            LEFT JOIN ranktable r ON m.member_id = r.member_id
            WHERE m.sponser_id = ?
        `, [id]);

        // Clean up null values from JSON_ARRAYAGG
        let activeDirectsList = JSON.parse(result[0].active_directs_list || '[]');
        activeDirectsList = activeDirectsList.filter(item => item !== null);

        return {
            ...result[0],
            active_directs_list: activeDirectsList
        };
    };

    // Update rank table for a member
    const updateUserRank = async (sponsorId, memberId, directs, activeDirects, rank, activeDirectsList) => {
        // Calculate rank counts
        const rankCounts = {
            OPAL: 0,
            TOPAZ: 0,
            JASPER: 0,
            ALEXANDER: 0,
            DIAMOND: 0,
            BLUE_DIAMOND: 0,
            CROWN_DIAMOND: 0
        };

        // Count members with each rank
        activeDirectsList.forEach(member => {
            switch(member.rank) {
                case 1: rankCounts.OPAL++; break;
                case 2: rankCounts.TOPAZ++; break;
                case 3: rankCounts.JASPER++; break;
                case 4: rankCounts.ALEXANDER++; break;
                case 5: rankCounts.DIAMOND++; break;
                case 6: rankCounts.BLUE_DIAMOND++; break;
                case 7: rankCounts.CROWN_DIAMOND++; break;
            }
        });

        // Update ranktable
        await pool.query(`
            INSERT INTO ranktable (
                sponser_id, 
                member_id, 
                directs, 
                active_directs, 
                rank_no, 
                active_directs_list, 
                OPAL, 
                TOPAZ, 
                JASPER, 
                ALEXANDER, 
                DIAMOND, 
                BLUE_DIAMOND, 
                CROWN_DIAMOND, 
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                sponser_id = VALUES(sponser_id),
                directs = VALUES(directs),
                active_directs = VALUES(active_directs),
                rank_no = VALUES(rank_no),
                active_directs_list = VALUES(active_directs_list),
                OPAL = VALUES(OPAL),
                TOPAZ = VALUES(TOPAZ),
                JASPER = VALUES(JASPER),
                ALEXANDER = VALUES(ALEXANDER),
                DIAMOND = VALUES(DIAMOND),
                BLUE_DIAMOND = VALUES(BLUE_DIAMOND),
                CROWN_DIAMOND = VALUES(CROWN_DIAMOND),
                updated_at = NOW()
        `, [
            sponsorId,
            memberId,
            directs,
            activeDirects,
            rank,
            JSON.stringify(activeDirectsList),
            rankCounts.OPAL,
            rankCounts.TOPAZ,
            rankCounts.JASPER,
            rankCounts.ALEXANDER,
            rankCounts.DIAMOND,
            rankCounts.BLUE_DIAMOND,
            rankCounts.CROWN_DIAMOND
        ]);
    };

    // Process rank for a member and backtrack
    const processRank = async (id) => {
        try {
            // Skip processing for starting ID
            if (id === STARTING_ID) {
                console.log(`Skipping processing for ID: ${STARTING_ID}`);
                return;
            }

            // Get member's current data
            const [membershipResult] = await pool.query(
                `SELECT membership FROM usersdetails WHERE memberid = ?`, 
                [id]
            );

            if (!membershipResult.length) {
                console.log(`Member ${id} not found in usersdetails`);
                return;
            }

            const currentMembership = membershipResult[0].membership;
            
            // Get team data
            const teamData = await getTeamData(id);
            const {
                directs = 0,
                active_directs: activeDirects = 0,
                active_directs_list: activeDirectsList = []
            } = teamData;

            // Calculate rank
            let rank = 0;
            const eligibleRanks = activeDirectsList.filter(({ rank }) => rank >= 1).length;

            if (currentMembership === 'BASIC' || currentMembership === 'PREMIUM') {
                if (eligibleRanks >= 2 && rank >= 6) rank = 7;        // Crown Diamond
                else if (eligibleRanks >= 2 && rank >= 5) rank = 6;   // Blue Diamond
                else if (eligibleRanks >= 2 && rank >= 4) rank = 5;   // Diamond
                else if (eligibleRanks >= 2 && rank >= 3) rank = 4;   // Alexander
                else if (eligibleRanks >= 2 && rank >= 2) rank = 3;   // Jasper
                else if (eligibleRanks >= 3) rank = 2;                // Topaz
                else if (activeDirects >= 2) rank = 1;                // Opal
            }

            // Get sponsor and update
            const [sponsor] = await pool.query(
                `SELECT sponser_id FROM member WHERE member_id = ?`, 
                [id]
            );

            if (sponsor.length > 0) {
                await updateUserRank(sponsor[0].sponser_id, id, directs, activeDirects, rank, activeDirectsList);
                await processRank(sponsor[0].sponser_id); // Backtrack to sponsor
            } else {
                await updateUserRank(null, id, directs, activeDirects, rank, activeDirectsList);
            }

        } catch (error) {
            console.error(`Error processing rank for member ${id}:`, error);
            throw error;
        }
    };

    // Start processing from the given member
    await processRank(memberId);
};



module.exports = { recreateRankTable ,updateRankAndBacktrack};
