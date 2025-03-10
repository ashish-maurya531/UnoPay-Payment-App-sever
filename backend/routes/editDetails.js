// const express = require('express');
// const { pool } = require('../config/database');
// const router = express.Router();

// const authenticateToken = require('../middleware/auth'); 

// // Route to get all details for a specific member
// router.post('/userDetails', authenticateToken, async (req, res) => {
//     try {
//         const { member_id } = req.body;
        
//         const [userDetails] = await pool.query(
//             'SELECT * FROM usersdetails WHERE memberid = ?',
//             [member_id]
//         );

//         if (userDetails.length === 0) {
//             return res.status(404).json({ 
//                 success: false, 
//                 message: 'Member not found' 
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: {
//                 memberid:userDetails[0]?.memberid,
//                 username:userDetails[0]?.username,
//                 phoneno:userDetails[0]?.phoneno,
//                 email: userDetails[0]?.email,
//                 membership:userDetails[0]?.membership,
    
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching member details:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: error.message
//         });
//     }
// });

// // Route to edit individual details for a member
// router.patch('/update-userdetails', authenticateToken, async (req, res) => {
//     try {
//         const { member_id,updateData } = req.body;
        
        
//         // Verify member exists
//         const [memberExists] = await pool.query(
//             'SELECT * FROM usersdetails WHERE memberid = ?',
//             [member_id]
//         );

//         if (memberExists.length === 0) {
//             return res.status(404).json({ 
//                 success: false, 
//                 message: 'Member not found' 
//             });
//         }

//         // Prevent memberid modification
//         if (updateData.memberid) {
//             delete updateData.memberid;
//         }

//         // Check for empty updates
//         if (Object.keys(updateData).length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'No valid fields to update'
//             });
//         }

//         // Build dynamic update query
//         const fields = Object.keys(updateData);
//         const values = Object.values(updateData);
//         const setClause = fields.map(field => `${field} = ?`).join(', ');
        
//         await pool.query(
//             `UPDATE usersdetails SET ${setClause} WHERE memberid = ?`,
//             [...values, member_id]
//         );

//         // Return updated details
//         const [updatedDetails] = await pool.query(
//             'SELECT * FROM usersdetails WHERE memberid = ?',
//             [member_id]
//         );

//         res.status(200).json({
//             success: true,
//             message: 'Member details updated successfully',
//             data: {
//                 memberid:updatedDetails[0]?.memberid,
//                 username:updatedDetails[0]?.username,
//                 phoneno:updatedDetails[0]?.phoneno,
//                 email: updatedDetails[0]?.email,
//                 membership:updatedDetails[0]?.membership,
    
//             }
//         });
//     } catch (error) {
//         console.error('Error updating member details:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: error.message
//         });
//     }
// });

// module.exports = router;


const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

// Helper function for database operations
const handleTableOperation = async (table, req, res, idField = 'member_id') => {
  try {
    const { member_id } = req.body;
    const [result] = await pool.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [member_id]);
    
    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `No data found in ${table} for member ${member_id}`
      });
    }
    
    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    res.status(500).json({ 
      success: false, 
      message: `Error fetching ${table} data`,
      error: error.message 
    });
  }
};

// Individual table routes
const createTableRoutes = (table, idField = 'member_id') => {
  // Get route
  router.post(`/${table}`, authenticateToken, async (req, res) => {
    await handleTableOperation(table, req, res, idField);
  });

  // Update route
  router.patch(`/update-${table}`, authenticateToken, async (req, res) => {
    try {
      const { member_id, updateData } = req.body;
      const fields = Object.keys(updateData);
      
      if (fields.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      const query = `
        UPDATE ${table} 
        SET ${fields.map(f => `${f} = ?`).join(', ')} 
        WHERE ${idField} = ?
      `;
      
      await pool.query(query, [...Object.values(updateData), member_id]);
      const [updated] = await pool.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [member_id]);
      
      res.json({ success: true, data: updated[0] });
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      res.status(500).json({ 
        success: false, 
        message: `Error updating ${table}`,
        error: error.message 
      });
    }
  });
};
// Example for usersdetails route
router.post('/usersdetails', authenticateToken, async (req, res) => {
    try {
        const { member_id } = req.body;
        const [details] = await pool.query(
            'SELECT * FROM usersdetails WHERE memberid = ?', 
            [member_id]
        );
        
        if (details.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User details not found' 
            });
        }
        
        // Ensure the response structure matches expectations
        res.json({ 
            success: true, 
            data: {
                memberid: details[0].memberid,
                username: details[0].username,
                phoneno: details[0].phoneno,
                email: details[0].email,
                membership: details[0].membership,
                status: details[0].status
            }
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});
// Create routes for all tables
createTableRoutes('usersdetails', 'memberid');
createTableRoutes('user_details');
createTableRoutes('pancard_details');
createTableRoutes('aadhar_details');
createTableRoutes('bank_details');
createTableRoutes('user_bank_kyc_details');

module.exports = router;