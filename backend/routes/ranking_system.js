const express = require('express');
const { pool } = require('../config/database'); // Assuming the pool is set up for DB connection
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');

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
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error fetching user by member_id:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});


// router.get('/getAllUsersRank', authenticateToken, async (req, res) => {
//   try {
//     const [result] = await pool.query('SELECT * FROM ranktable');
//     // Parse active_directs_list and active_team_list
//     const parsedResult = result.map((row) => ({
//       ...row,
//       active_directs_list: row.active_directs_list ? JSON.parse(row.active_directs_list) : [],
//       active_team_list: row.active_team_list ? JSON.parse(row.active_team_list) : [],
//     }));
//     res.status(200).json(parsedResult);
//   } catch (error) {
//     console.error('Error fetching all users:', error);
//     res.status(500).json({ error: 'Failed to fetch data' });
//   }
// });

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

module.exports = router;
