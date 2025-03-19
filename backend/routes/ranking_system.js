const express = require('express');
const { pool } = require('../config/database'); // Assuming the pool is set up for DB connection
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const containsSQLInjectionWords=require('../utills/sqlInjectionCheck');

// Route to get data for all users
router.get('/getAllUsersRank',authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('SELECT * FROM ranktable');
    // console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.post('/get-active-team-no',authenticateToken, async (req, res) => {
  const { member_id } = req.body;
  //member_id is not empty
  if (!member_id) {
    return res.status(400).json({ error: 'Member ID is required' });
  }
  // Validate inputs
  // Check for SQL injection
  const checkFields = [member_id].join(' ');
  if (containsSQLInjectionWords(checkFields)) {
    return res.status(400).json({ error: "Don't try to hack !" });
  }
  try {
    const [result] = await pool.query(`SELECT active_team FROM ranktable WHERE member_id = ?`, [member_id]);
    // Check if user exists
    if (result?.length === 0) {
      return res.status(200).json({ active_team: 0 }); // Return 0 if no data found
    }
    res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error fetching user by member_id:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }

});



// Route to get data by member_id
router.post('/getUserRank',authenticateToken, async (req, res) => {
  const { member_id } = req.body; 

  console.log(member_id);

  if (!member_id) {
    return res.status(200).json({ error: 'Member ID is required' });
  }

  try {
    const [result] = await pool.query(`SELECT * FROM ranktable WHERE member_id = ?`, [member_id]);
    
    if (result?.length === 0) {
      return res.status(200).json({ error: 'User not found' });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error fetching user by member_id:', error);
    res.status(200).json({ error: 'Failed to fetch data' });
  }
});



//get eligibile users list with names 

// router.post('/getEligibleUsers', authenticateToken, async (req, res) => {
//   try {
//     // Fetching rank_array and member_id from ranktable
//     const [rankResults] = await pool.query(`
//       SELECT rt.rank_array, rt.rank_no,rt.member_id, ud.username
//       FROM ranktable rt
//       JOIN usersdetails ud ON rt.member_id = ud.memberid
//       WHERE rt.rank_no != 0 AND rt.rank_array IS NOT NULL

//     `);
//     console.log(rankResults);

//     // Reference array for rank mapping
//     const rankLabels = ['OPAL', 'TOPAZ', 'JASPER', 'ALEXANDER', 'DIAMOND', 'BLUE_DIAMOND', 'CROWN DIAMOND'];

//     // Initialize the response object with all rank labels as keys
//     const response = rankLabels.reduce((acc, rank) => {
//       acc[rank] = {};  // Initialize empty object for each rank
//       return acc;
//     }, {});

//     // Map the database results to the response format
//     rankResults.forEach((row) => {
//       const { rank_array, member_id, username } = row;

//       // Parse the rank_array into an array
//       const ranks = JSON.parse(rank_array);  // Assuming it's stored as JSON string

//       ranks.forEach((rankIndex) => {
//         if (rankIndex >= 1 && rankIndex <= rankLabels.length) {
//           const rankName = rankLabels[rankIndex - 1];  // Map the index to label
          
//           // Add member details to the appropriate rank
//           response[rankName] = {
//             member_id: member_id,
//             name: username
//           };
//         }
//       });
//     });

//     res.json(response);
//   } catch (error) {
//     console.error('Error fetching eligible users:', error);
//     res.status(500).json({ error: 'Failed to fetch data' });
//   }
// });



module.exports = router;
