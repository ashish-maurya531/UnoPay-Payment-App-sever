const express = require('express');
const { pool } = require('../config/database');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');
const bcrypt = require('bcryptjs');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// admin login jwt 
router.post('/adminLogin2', async (req, res) => {
  const { name, password } = req.body;
  console.log("--------------"+name, password);
  
  try {
    const [rows] = await pool.query('SELECT * FROM admin WHERE name = ? LIMIT 1', [name]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials1' });
    }
    
    const admin = rows[0];
    const isPasswordValid = (password===admin.password)

    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials2' });
    }
    const payload = {
      name,
      role:"admin",
      message: "hack mt kr",
      jti: crypto.randomUUID(), // Generates a unique ID for each token
      iat: Math.floor(Date.now() / 1000), // Issued At
     
    };
    
    
    // Generate JWT token
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' });// 30 days
    
    // const token = jwt.sign({ message: "hack mt kr" }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2m' });

    
    res.json({ message: 'Admin logged in successfully', token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;