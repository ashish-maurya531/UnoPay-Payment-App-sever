const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');


router.post("/getDirectMemberList", async (req, res) => {
    const { member_id } = req.body;
    //check input not empty
    if (!member_id) {
        return res.status(400).json({ success: false, message: 'Member ID is required' });
    }
    //check for sql injection
    if (containsSQLInjectionWords(member_id)) {
        return res.status(400).json({ success: false, message: 'Dont try to hack' });
    }
    try {
        // Query to fetch direct members from member_hierarchy
        const [rows] = await pool.query(
            `SELECT upline, member, level FROM member_hierarchy WHERE upline = ? AND level = ?`,
            [member_id, 1]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'No directs found' });
        }

        // List of all member IDs from rows
        const memberList = rows.map(row => row.member);

        // Query to fetch member details from usersdetails
        const [rows2] = await pool.query(
            `SELECT memberid, username, membership, created_at FROM usersdetails WHERE memberid IN (?)`,
            [memberList]
        );

        if (!rows2.length) {
            return res.status(404).json({ success: false, message: 'Invalid member IDs' });
        }

        // Combine rows and rows2 data
        const combinedData = rows.map(row => {
            const memberDetails = rows2.find(detail => detail.memberid === row.member);
            return {
                ...row,
                username: memberDetails?.username || null,
                membership: memberDetails?.membership || null,
                date_of_joining: memberDetails?.created_at || null,
            };
        });

        res.status(200).json({ success: true, directMember: combinedData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting directs', error });
    }
});





router.post("/getTeamList", async (req, res) => {
    const { member_id } = req.body;
    //check input not empty
    if (!member_id) {
        return res.status(400).json({ success: false, message: 'Member ID is required' });
    }
    //check for sql injection
    if (containsSQLInjectionWords(member_id)) {
        return res.status(400).json({ success: false, message: 'Dont try to hack' });
    }
    try {
        // Query to fetch team members based on super_upline
        const [rows] = await pool.query(
            `SELECT super_upline, member, level FROM member_hierarchy WHERE super_upline = ? ORDER BY level`,
            [member_id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'No team members found' });
        }

        // List of all member IDs from rows
        const memberList = rows.map(row => row.member);
        console.log(memberList);

        // Query to fetch member details from usersdetails
        const [rows2] = await pool.query(
            `SELECT memberid, username, membership, created_at FROM usersdetails WHERE memberid IN (?)`,
            [memberList]
        );

        if (!rows2.length) {
            return res.status(404).json({ success: false, message: 'Invalid member IDs' });
        }

        // Combine rows and rows2 data
        const combinedData = rows.map(row => {
            const memberDetails = rows2.find(detail => detail.memberid === row.member);
            return {
                ...row,
                username: memberDetails?.username || null,
                membership: memberDetails?.membership || null,
                date_of_joining: memberDetails?.created_at || null,
            };
        });

        res.status(200).json({ success: true, teamMembers: combinedData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting team list', error });
    }
});





module.exports = router;