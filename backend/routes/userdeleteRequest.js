const express=require('express');
const router=express.Router();
const { pool } = require('../config/database');

const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');


// Create or Update Delete Request
router.post('/deleteRequest', async (req, res) => {
    const { memberid ,password,tpin} = req.body;

    // Validate input
    if (!memberid||!password||!tpin) {
        return res.status(400).json({ 
            success: false, 
            message: 'Member ID is required' 
        });
    }
    
  //sql injection
  if (containsSQLInjectionWords(memberid+password+tpin)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Don\'t try to hack!' 
        });
    }
    // Check if member exists and password and tpin is valid
    const [result] = await pool.query(`SELECT * FROM security_details_of_user WHERE member_id =? AND password=? AND tpin = ?`, [memberid, password,tpin]);
        
    if (result.length === 0) {
        return res.status(401).json({
            success: false,
            message: 'Invalid member ID or password or tpin'
        });
        }


    try {
        const query = `
            INSERT INTO user_delete_requests (member_id, delete_request_status)
            VALUES (?, 'pending')
            ON DUPLICATE KEY UPDATE 
                created_at = CURRENT_TIMESTAMP, 
                delete_request_status = 'pending'
        `;

        await pool.query(query, [memberid]);

        res.status(201).json({ 
            success: true, 
            message: 'Delete request created or updated successfully' 
        });
    } catch (error) {
        console.error('Error creating or updating delete request:', error);

        res.status(500).json({ 
            success: false, 
            message: 'Error creating delete request', 
            error: error.message 
        });
    }
});


// Get all delete requests
// Get all delete requests with user name and status
router.get('/deleteRequests', async (req, res) => {
    try {
        // Join the user_delete_requests table with usersdetails table to get username and status
        const query = `
            SELECT 
                r.member_id, 
                u.username, 
                u.status, 
                r.delete_request_status, 
                r.created_at, 
                r.updated_at
            FROM 
                user_delete_requests r
            JOIN 
                usersdetails u 
            ON 
                r.member_id = u.memberid
        `;

        const [rows] = await pool.query(query);
        
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving delete requests', error });
    }
});


// // Update delete request status
// router.put('/deleteRequestStatus', async (req, res) => {
//     const { member_id, status } = req.body;

//     if (!member_id || !status) {
//         return res.status(400).json({ success: false, message: 'Member ID and status are required' });
//     }

//     if (!['pending', 'done'].includes(status)) {
//         return res.status(400).json({ success: false, message: 'Invalid status value' });
//     }

//     try {
//         const query = `
//             UPDATE user_delete_requests
//             SET delete_request_status = ?
//             WHERE member_id = ?
//         `;
//         const [result] = await pool.query(query, [status, member_id]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ success: false, message: 'Delete request not found' });
//         }

//         res.status(200).json({ success: true, message: 'Delete request status updated successfully' });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Error updating delete request status', error });
//     }
// });

// Delete a request
router.delete('/deleteRequest', async (req, res) => {
    const { member_id } = req.body;

    if (!member_id) {
        return res.status(400).json({ success: false, message: 'Member ID is required' });
    }

    try {
        const query = `
            DELETE FROM user_delete_requests
            WHERE member_id = ?
        `;
        const [result] = await pool.query(query, [member_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Delete request not found' });
        }

        res.status(200).json({ success: true, message: 'Delete request removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting delete request', error });
    }
});

module.exports = router;
