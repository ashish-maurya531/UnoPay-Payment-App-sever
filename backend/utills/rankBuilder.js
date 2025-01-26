const { pool } = require('../config/database');
const STARTING_ID = 'UP100010'; 
const recreateRankTable = async () => {
    console.log("Recreating rank table...");
    await pool.query(`TRUNCATE TABLE ranktable`);
    // const [users] = await pool.query(`SELECT memberid FROM usersdetails WHERE status = 'active' or status='inactive'`);
    const [users] = await pool.query(`SELECT memberid FROM usersdetails`);

    const updateRank = async (memberId) => {
        const getRankInfo = async (id) => {
            const [result] = await pool.query(`
                SELECT
                    COUNT(*) AS directs,
                    COUNT(CASE WHEN u.status = 'active' AND u.membership IN ('basic', 'premium') THEN 1 END) AS active_directs,
                    JSON_ARRAYAGG(JSON_OBJECT('member_id', m.member_id, 'rank', IFNULL(r.rank_no, 0), 'membership', u.membership)) AS active_directs_list
                FROM member m
                LEFT JOIN usersdetails u ON m.member_id = u.memberid
                LEFT JOIN ranktable r ON m.member_id = r.member_id
                WHERE m.sponser_id = ?
            `, [id]);
            return result[0]; 
        };

        const updateUserRank = async (sponsorId, memberId, directs, activeDirects, rank, activeDirectsList) => {
            const activeDirectsListFiltered = (Array.isArray(activeDirectsList) ? activeDirectsList : []).filter(({ membership }) => membership === 'BASIC' || membership === 'PREMIUM');
            const opalCount = activeDirectsListFiltered.filter(({ rank }) => rank === 1).length;
            const topazCount = activeDirectsListFiltered.filter(({ rank }) => rank === 2).length;
            const jasperCount = activeDirectsListFiltered.filter(({ rank }) => rank === 3).length;
            const alexanderCount = activeDirectsListFiltered.filter(({ rank }) => rank === 4).length;
            const diamondCount = activeDirectsListFiltered.filter(({ rank }) => rank === 5).length;
            const blueDiamondCount = activeDirectsListFiltered.filter(({ rank }) => rank === 6).length;
            const crownDiamondCount = activeDirectsListFiltered.filter(({ rank }) => rank === 7).length;
       
            await pool.query(`
                INSERT INTO ranktable (sponser_id, member_id, directs, active_directs, rank_no, active_directs_list, OPAL, TOPAZ, JASPER, ALEXANDER, DIAMOND, BLUE_DIAMOND, CROWN_DIAMOND, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
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
                JSON.stringify(activeDirectsListFiltered), 
                opalCount,
                topazCount,
                jasperCount,
                alexanderCount,
                diamondCount,
                blueDiamondCount,
                crownDiamondCount
            ]);
        };
        
        const processRank = async (id) => {
            if (id === STARTING_ID) {
                console.log(`Skipping processing for ID: ${STARTING_ID}`);
                return;
            }

            const rankInfo = await getRankInfo(id);

            const {
                directs = 0,
                active_directs: activeDirects = 0,
                active_directs_list: activeDirectsList = [],
            } = rankInfo || {};

            let rank = 0;


            const eligibleRanks = (activeDirectsList || []).filter(({ rank }) => rank >= 1).length;
            const [currentMembership]=await pool.query(`SELECT membership FROM usersdetails WHERE memberid = ?`, [id]);
            const currentMemberMembership=currentMembership[0].membership;
            if (currentMemberMembership === 'BASIC' || currentMemberMembership === 'PREMIUM') {
                if (eligibleRanks >= 2 && rank >= 6) {
                    rank = 7; 
                } else if (eligibleRanks >= 2 && rank >= 5) {
                    rank = 6; 
                } else if (eligibleRanks >= 2 && rank >= 4) {
                    rank = 5; 
                } else if (eligibleRanks >= 2 && rank >= 3) {
                    rank = 4;
                } else if (eligibleRanks >= 2 && rank >= 2) {
                    rank = 3; 
                } else if (eligibleRanks >= 3) {
                    rank = 2; 
                } else if (activeDirects >= 2) {
                    rank = 1; 
                }
            } else {
                console.log(`Skipping rank calculation for member ${id} as their membership is not BASIC or PREMIUM.`);
                rank = 0; 
            }

            // if (currentMemberMembership === 'BASIC' || currentMemberMembership === 'PREMIUM') {
            //     if (eligibleRanks >= 4 && rank >= 6) {
            //         rank = 7; 
            //     } else if (eligibleRanks >= 4 && rank >= 5) {
            //         rank = 6; 
            //     } else if (eligibleRanks >= 4 && rank >= 4) {
            //         rank = 5; 
            //     } else if (eligibleRanks >= 4 && rank >= 3) {
            //         rank = 4; 
            //     } else if (eligibleRanks >= 4 && rank >= 2) {
            //         rank = 3;
            //     } else if (eligibleRanks >= 4) {
            //         rank = 2; 
            //     } else if (activeDirects >= 12) {
            //         rank = 1; 
            //     }
            // } else {
            //     console.log(`Skipping rank calculation for member ${id} as their membership is not BASIC or PREMIUM.`);
            //     rank = 0; 
            // }
    
            const [sponsor] = await pool.query(`SELECT sponser_id FROM member WHERE member_id = ?`, [id]);

            if (sponsor.length > 0) {
                await updateUserRank(sponsor[0].sponser_id, id, directs, activeDirects, rank, activeDirectsList);
                await processRank(sponsor[0].sponser_id); 
            } else {
                await updateUserRank(null, id, directs, activeDirects, rank, activeDirectsList);
            }
        };

        await processRank(memberId);
    };

    
    for (const user of users) {
        await updateRank(user.memberid);
    }

    console.log("Rank table recreated successfully!");
};




//phone no email 


const updateRankAndBacktrack = async (memberId) => {
    const getRankInfo = async (id) => {
        const [result] = await pool.query(`
            SELECT
                COUNT(*) AS directs,
                COUNT(CASE WHEN u.status = 'active' AND u.membership IN ('basic', 'premium') THEN 1 END) AS active_directs,
                JSON_ARRAYAGG(JSON_OBJECT('member_id', m.member_id, 'rank', IFNULL(r.rank_no, 0), 'membership', u.membership)) AS active_directs_list
            FROM member m
            LEFT JOIN usersdetails u ON m.member_id = u.memberid
            LEFT JOIN ranktable r ON m.member_id = r.member_id
            WHERE m.sponser_id = ?
        `, [id]);
        return result[0]; 
    };

    const updateUserRank = async (sponsorId, memberId, directs, activeDirects, rank, activeDirectsList) => {
        const activeDirectsListFiltered = (Array.isArray(activeDirectsList) ? activeDirectsList : []).filter(({ membership }) => membership === 'BASIC' || membership === 'PREMIUM');
        const opalCount = activeDirectsListFiltered.filter(({ rank }) => rank === 1).length;
        const topazCount = activeDirectsListFiltered.filter(({ rank }) => rank === 2).length;
        const jasperCount = activeDirectsListFiltered.filter(({ rank }) => rank === 3).length;
        const alexanderCount = activeDirectsListFiltered.filter(({ rank }) => rank === 4).length;
        const diamondCount = activeDirectsListFiltered.filter(({ rank }) => rank === 5).length;
        const blueDiamondCount = activeDirectsListFiltered.filter(({ rank }) => rank === 6).length;
        const crownDiamondCount = activeDirectsListFiltered.filter(({ rank }) => rank === 7).length;
    

        await pool.query(`
            INSERT INTO ranktable (sponser_id, member_id, directs, active_directs, rank_no, active_directs_list, OPAL, TOPAZ, JASPER, ALEXANDER, DIAMOND, BLUE_DIAMOND, CROWN_DIAMOND, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
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
            JSON.stringify(activeDirectsListFiltered), 
            opalCount,
            topazCount,
            jasperCount,
            alexanderCount,
            diamondCount,
            blueDiamondCount,
            crownDiamondCount
        ]);
    };
    
    const processRank = async (id) => {
        if (id === STARTING_ID) {
            console.log(`Skipping processing for ID: ${STARTING_ID}`);
            return;
        }

        const rankInfo = await getRankInfo(id);

        const {
            directs = 0,
            active_directs: activeDirects = 0,
            active_directs_list: activeDirectsList = [],
        } = rankInfo || {};

        let rank = 0;

       
        const eligibleRanks = (activeDirectsList || []).filter(({ rank }) => rank >= 1).length;
            const [currentMembership]=await pool.query(`SELECT membership FROM usersdetails WHERE memberid = ?`, [id]);
            const currentMemberMembership=currentMembership[0].membership;
            if (currentMemberMembership === 'BASIC' || currentMemberMembership === 'PREMIUM') {
                if (eligibleRanks >= 2 && rank >= 6) {
                    rank = 7; // Crown Diamond
                } else if (eligibleRanks >= 2 && rank >= 5) {
                    rank = 6; // Blue Diamond
                } else if (eligibleRanks >= 2 && rank >= 4) {
                    rank = 5; // Diamond
                } else if (eligibleRanks >= 2 && rank >= 3) {
                    rank = 4; // Alexander
                } else if (eligibleRanks >= 2 && rank >= 2) {
                    rank = 3; // Jasper
                } else if (eligibleRanks >= 3) {
                    rank = 2; // Topaz
                } else if (activeDirects >= 2) {
                    rank = 1; // Opal
                }
            } else {
                console.log(`Skipping rank calculation for member ${id} as their membership is not BASIC or PREMIUM.`);
                rank = 0; 
            }


            // if (currentMemberMembership === 'BASIC' || currentMemberMembership === 'PREMIUM') {
            //     if (eligibleRanks >= 4 && rank >= 6) {
            //         rank = 7; 
            //     } else if (eligibleRanks >= 4 && rank >= 5) {
            //         rank = 6; 
            //     } else if (eligibleRanks >= 4 && rank >= 4) {
            //         rank = 5; 
            //     } else if (eligibleRanks >= 4 && rank >= 3) {
            //         rank = 4; 
            //     } else if (eligibleRanks >= 4 && rank >= 2) {
            //         rank = 3;
            //     } else if (eligibleRanks >= 4) {
            //         rank = 2; 
            //     } else if (activeDirects >= 12) {
            //         rank = 1; 
            //     }
            // } else {
            //     console.log(`Skipping rank calculation for member ${id} as their membership is not BASIC or PREMIUM.`);
            //     rank = 0; 
            // }

        const [sponsor] = await pool.query(`SELECT sponser_id FROM member WHERE member_id = ?`, [id]);

        if (sponsor.length > 0) {
            await updateUserRank(sponsor[0].sponser_id, id, directs, activeDirects, rank, activeDirectsList);
            await processRank(sponsor[0].sponser_id); 
        } else {
            await updateUserRank(null, id, directs, activeDirects, rank, activeDirectsList);
        }
    };

    await processRank(memberId);
};


module.exports = { recreateRankTable ,updateRankAndBacktrack};
