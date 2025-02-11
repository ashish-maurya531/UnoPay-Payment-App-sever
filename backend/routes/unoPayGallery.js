const express = require('express');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../UnoPayGallery'); // Corrected path
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Only .png, .jpg and .jpeg formats are allowed!');
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  },
});

// Error handling middleware
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ status: 'false', error: err.message });
  } else if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ status: 'false', error: err.message });
  }
  next(err);
};

// Route to upload images to gallery
router.post('/post-gallery', authenticateToken, upload.array('images', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      status: 'false', 
      error: 'No images uploaded. Please upload at least 1 image.' 
    });
  }

  if (req.files.length > 10) {
    return res.status(400).json({ 
      status: 'false', 
      error: 'Maximum 10 images can be uploaded at a time.' 
    });
  }

  try {
    // Process each file
    for (const file of req.files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = path.extname(file.originalname);
      const fileName = `gallery-${uniqueSuffix}${fileExtension}`;
      const filePath = path.join(uploadPath, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

     
    }

    res.status(201).json({
      status: 'true',
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ status: 'false', error: 'Internal server error.' });
  }
});

// Route to get all gallery image URLs
router.get('/get-gallery-images', authenticateToken, async (req, res) => {
    try {
      if (!fs.existsSync(uploadPath)) {
        return res.status(200).json({
          status: 'true',
          images: []
        });
      }
  
      const files = fs.readdirSync(uploadPath);
      const images = files.map(file => file); // Just return the filenames
  
      res.json({
        status: 'true',
        images: images
      });
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      res.status(500).json({ status: 'false', error: 'Internal server error.' });
    }
  });
  
  // Route to get specific image by filename
  router.post('/get-gallery-image-file',authenticateToken, async (req, res) => {
    const { filename } = req.body;
  
    if (!filename) {
      return res.status(400).json({ status: 'false', error: "Image filename is required." });
    }
  
  
  
    if (containsSQLInjectionWords(filename)) {
      return res.status(400).json({ status: "false", error: "Invalid filename." });
    }
  
    try {
      const filePath = path.join(uploadPath, filename);
  
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ status: 'false', error: "Image file not found." });
      }
  
      // Send the file as response
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ status: 'false', message: 'Internal server error' });
    }
  });
  

module.exports = router;