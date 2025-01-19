const express=require('express');
const router=express.Router();
const { pool } = require('../config/database');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');
const authenticateToken = require('../middleware/auth');
//test

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
router.get('/get-all-the-users', authenticateToken,async (req, res) => {
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



////////////////////////////////////////////////////////



// Route to create a login issue request
// Function to generate a random login issue ID like "R239665"
const generateLoginIssueId = () => {
    const prefix = 'R';
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
    return prefix + randomNumber;
  };
  
  // Route to create a login issue request
  router.post('/login-issue', async (req, res) => {
    const { email, member_id, message_by_user } = req.body;
  
    // Check if all required fields are provided
    if (!email) {
      return res.status(200).json({ message: 'Missing required fields' });
    }
  
    // Generate a random login issue ID
    const login_issue_id = generateLoginIssueId();
  
    try {
      // SQL query to check if there's already a pending request for the same email or member_id
      const [result] = await pool.query(
        `SELECT * FROM login_issue_help WHERE (email = ? OR member_id = ?) AND status = 'pending'`,
        [email, member_id]
      );
  
      if (result.length > 0) {
        return res.status(200).json({
          message: 'There is already a pending request for this email or member ID.',
        });
      }
  
      // If no pending request, insert the new request with generated login_issue_id
      await pool.query(
        `INSERT INTO login_issue_help (login_issue_id, email, member_id, message_by_user) VALUES (?, ?, ?, ?)`,
        [login_issue_id, email, member_id, message_by_user]
      );
  
      return res.status(201).json({
        status: 'true',
        message: 'Request submitted successfully',
        login_issue_id: login_issue_id,
      });
    } catch (err) {
      console.error('Error checking or inserting request:', err);
      return res.status(500).json({ message: 'Database error' });
    }
  });
  
  // Route to update the status of a login issue request
  router.post('/update-login-issue-status', async (req, res) => {
    const { login_issue_id, status } = req.body;
  
    // Validate the status
    if (!['pending', 'solved'].includes(status)) {
      return res.status(200).json({ message: 'Invalid status' });
    }
  
    try {
      // Check the current status of the login issue request
      const [currentStatusResult] = await pool.query(
        `SELECT status FROM login_issue_help WHERE login_issue_id = ?`,
        [login_issue_id]
      );
  
      if (currentStatusResult.length === 0) {
        return res.status(200).json({ message: 'Login issue not found' });
      }
  
      const currentStatus = currentStatusResult[0].status;
  
      // Prevent changing the status back to "pending" once it's "solved"
      if (currentStatus === 'solved' && status === 'pending') {
        return res.status(200).json({
          message: 'The status cannot be changed back to "pending" after being set to "solved".',
        });
      }
  
      // Update the status of the login issue request
      await pool.query(
        `UPDATE login_issue_help SET status = ? WHERE login_issue_id = ?`,
        [status, login_issue_id]
      );
  
      return res.status(200).json({ message: 'Status updated successfully' });
    } catch (err) {
      console.error('Error updating status:', err);
      return res.status(500).json({ message: 'Database error' });
    }
  });
  
  // Route to get all login issue requests (for admin)
  router.post('/all-login-issues', async (req, res) => {
    try {
      // SQL query to select all login issue requests
      const [result] = await pool.query('SELECT * FROM login_issue_help');
  
      return res.status(200).json({ requests: result });
    } catch (err) {
      console.error('Error fetching requests:', err);
      return res.status(500).json({ message: 'Database error' });
    }
  });


  //route to delete the login issue
  router.post('/delete-login-issue', async (req, res) => {
    const {login_issue_id  } = req.body;
    if (!login_issue_id) {
      return res.status(200).json({ message: 'Missing required fields' });
    }
   
  
    try {
     
      // SQL query to delete the login issue request
      const [login_issue_delete]=await pool.query('DELETE FROM login_issue_help WHERE login_issue_id =?', [login_issue_id]);
      if (login_issue_delete.affectedRows> 0) {
        return res.status(200).json({ message: 'Login issue deleted successfully' });
      }
      else{
        return res.status(200).json({ message: 'Login issue not found' });
      }
     
      
    } catch (err) {
      console.error('Error deleting login issue:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    });


///////////////////////////////////////////////////////


// Export the router for use
module.exports = router;


