const express=require('express');
const router=express.Router();
const { pool } = require('../config/database');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');

// // Route to add a new ticket
// router.post('/raiseTicket', async (req, res) => {
//     const { member_id, message_by_user } = req.body;

//     // Validate input
//     if (!member_id || !message_by_user) {
//         return res.status(400).json({ success: false, message: 'Member ID and Message are required' });
//     }

//     // Check for SQL injection
//     //join the input
//     const checkFields = [member_id, message_by_user].join('');
//     const sqlInjectionWords = containsSQLInjectionWords(checkFields);
//     if (sqlInjectionWords) {
//         return res.status(400).json({ success: false, message: 'Dont try to hack' });
//     }
//     //check if user is valid 
//     const [user] = await pool.query('SELECT * FROM usersdetails WHERE memberid =?', [member_id]);
//     if (!user.length) {
//         return res.status(404).json({ success: false, message: 'Invalid member ID' });
//     }

//     // Generate an 8-digit random ticket ID
//     const ticket_id = Math.floor(10000000 + Math.random() * 90000000); // 8-digit random number

//     try {
//         const query = `
//             INSERT INTO user_raise_ticket (member_id, ticket_id, message_by_user, ticket_status)
//             VALUES (?, ?, ?, 'pending')
//         `;

//         await pool.query(query, [member_id, ticket_id, message_by_user]);

//         res.status(201).json({
//             success: true,
//             message: 'Ticket raised successfully',
//             ticket_id
//         });
//     } catch (error) {
//         console.error('Error raising ticket:', error);
//         res.status(500).json({ success: false, message: 'Error raising ticket', error: error.message });
//     }
// });

// // Route to update ticket status (mark as solved)
// router.put('/updateTicketStatus', async (req, res) => {
//     const { member_id,ticket_id, ticket_status } = req.body;

//     // Validate input
//     if (!ticket_id || !ticket_status) {
//         return res.status(400).json({ success: false, message: 'Ticket ID and Status are required' });
//     }

//     // Ensure status is either 'pending' or 'solved'
//     if (!['pending', 'solved'].includes(ticket_status)) {
//         return res.status(400).json({ success: false, message: 'Invalid ticket status' });
//     }
//     //check if user is valid 
//     const [user] = await pool.query('SELECT * FROM usersdetails WHERE memberid =?', [member_id]);
//     if (!user.length) {
//         return res.status(404).json({ success: false, message: 'Invalid member ID' });
//     }

//     try {
//         // Update ticket status
//         const query = `
//             UPDATE user_raise_ticket
//             SET ticket_status = ?
//             WHERE ticket_id = ?
//         `;

//         const [result] = await pool.query(query, [ticket_status, ticket_id]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ success: false, message: 'Ticket not found' });
//         }

//         res.status(200).json({
//             success: true,
//             message: `Ticket status updated to ${ticket_status}`,
//         });
//     } catch (error) {
//         console.error('Error updating ticket status:', error);
//         res.status(500).json({ success: false, message: 'Error updating ticket status', error: error.message });
//     }
// });










// // Utility function to generate ticket IDs
// function generateTicketId() {
//     return Math.random().toString(36).substr(2, 8).toUpperCase();
// }

// Routes

// Route: /send-message
router.post('/send-message', async (req, res) => {
    const { member_id, ticket_id, message_by, message } = req.body;

    if (!member_id || !ticket_id || !message_by || !message) {
        return res.status(400).send({ error: "Missing required fields" });
    }

    try {
        // Replace this with your database query
        const query = `
            INSERT INTO user_raise_ticket (ticket_id, member_id, message, message_by)
            VALUES (?, ?, ?, ?)
        `;
        await pool.query(query, [ticket_id, member_id, message, message_by]);

        res.send({ success: true, message: "Message sent successfully" });
    } catch (error) {
        res.status(500).send({ error: "Failed to send message", details: error.message });
    }
});

// Route: /get-user-admin-chat
router.post('/get-user-admin-chat', async (req, res) => {
    const { member_id, ticket_id } = req.body;

    if (!member_id || !ticket_id) {
        return res.status(400).send({ error: "Missing required fields" });
    }

    try {
        // Replace this with your database query
        const query = `
            SELECT message, message_by, created_at
            FROM user_raise_ticket
            WHERE member_id = ? AND ticket_id = ?
            ORDER BY created_at ASC
        `;
        const [rows] = await pool.query(query, [member_id, ticket_id]);

        res.send(rows); // Replace with actual data
    } catch (error) {
        res.status(500).send({ error: "Failed to fetch chat history", details: error.message });
    }
});

// Route: /get-all-the-users
router.get('/get-all-the-users', async (req, res) => {
    try {
        // Replace this with your database query
        const query = `
            SELECT DISTINCT member_id, ticket_id
            FROM user_raise_ticket
            ORDER BY ticket_id
        `;
        const [rows] = await pool.query(query);

        res.send(rows); // Replace with actual data
    } catch (error) {
        res.status(500).send({ error: "Failed to fetch users", details: error.message });
    }
});

// Export the router for use
module.exports = router;


