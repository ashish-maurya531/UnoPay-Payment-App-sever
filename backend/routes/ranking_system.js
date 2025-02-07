const express = require('express');
const { pool } = require('../config/database'); // Assuming the pool is set up for DB connection
const router = express.Router();
const authenticateToken = require('../middleware/auth');

// Route to get data for all users
router.get('/getAllUsersRank', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT * FROM ranktable');
    // console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Route to get data by member_id
router.post('/getUserRank', async (req, res) => {
  const { member_id } = req.body; 

  console.log(member_id);

  if (!member_id) {
    return res.status(400).json({ error: 'Member ID is required' });
  }

  try {
    const [result] = await pool.query(`SELECT * FROM ranktable WHERE member_id = ?`, [member_id]);
    
    if (result?.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error fetching user by member_id:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

module.exports = router;
