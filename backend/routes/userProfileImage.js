const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Directory setup
const profileDir = path.join(__dirname, '..', 'user_profile_images');
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG/PNG allowed'));
    }
  }
});

// Helper function to save image
const saveProfileImage = (memberId, file) => {
  const uniqueName = `profile-${Date.now()}-${Math.floor(Math.random() * 1e5)}${path.extname(file.originalname)}`;
  const filePath = path.join(profileDir, uniqueName);
  fs.writeFileSync(filePath, file.buffer);
  return uniqueName;
};

// Upload Profile Image Route
router.post('/upload-profile-image', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const { member_id } = req.body;
    
    // Validate member exists
    const [user] = await pool.query('SELECT memberid FROM usersdetails WHERE memberid = ?', [member_id]);
    if (user.length === 0) {
      return res.status(404).json({ status: 'false', message: 'Member not found' });
    }

    // Check for existing image
    const [existing] = await pool.query('SELECT image_name FROM user_profile_images WHERE member_id = ?', [member_id]);
    
    // Save new image
    const imageName = saveProfileImage(member_id, req.file);
    
    // Delete old image if exists
    if (existing.length > 0) {
      const oldPath = path.join(profileDir, existing[0].image_name);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Update database
    await pool.query(`
      INSERT INTO user_profile_images (member_id, image_name)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        image_name = VALUES(image_name),
        created_at = NOW()
    `, [member_id, imageName]);

    res.status(201).json({ status: 'true', message: 'Profile image uploaded successfully' });
  } catch (error) {
    res.status(500).json({ status: 'false', message: error.message });
  }
});

// Get Profile Image Route
router.post('/profile-image', authenticateToken, async (req, res) => {
  try {
    const { member_id } = req.body;
    
    // Check member exists
    const [user] = await pool.query('SELECT memberid FROM usersdetails WHERE memberid = ?', [member_id]);
    if (user.length === 0) {
      return res.status(404).json({ status: 'false', message: 'Member not found' });
    }

    // Get image record
    const [imageRecord] = await pool.query('SELECT image_name FROM user_profile_images WHERE member_id = ?', [member_id]);
    
    if (imageRecord.length === 0) {
      return res.status(200).json({ status: 'false', message: 'Profile image not uploaded' });
    }

    const imagePath = path.join(profileDir, imageRecord[0].image_name);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ status: 'false', message: 'Image file not found' });
    }

    res.sendFile(imagePath);
  } catch (error) {
    res.status(500).json({ status: 'false', message: error.message });
  }
});

module.exports = router;