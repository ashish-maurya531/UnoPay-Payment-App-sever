const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'UnoPayGallery'); // Corrected path
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
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png','image/jpg' ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
  },
});

// // POST endpoint to upload images to the gallery
// router.post('/post-gallery', authenticateToken, upload.array('images', 10), (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         status: 'false',
//         message: 'No images uploaded. Please upload at least 1 image.',
//       });
//     }

//     if (req.files.length > 10) {
//       return res.status(400).json({
//         status: 'false',
//         message: 'Maximum 10 images can be uploaded at a time.',
//       });
//     }

//     const fileUrls = req.files.map((file) => {
//       return `${req.protocol}://${req.get('host')}/UnoPayGallery/${file.filename}`;
//     });

//     res.json({
//       status: 'true',
//       message: 'Images uploaded successfully',
//       fileUrls: fileUrls,
//     });
//   } catch (error) {
//     console.error('Error uploading images:', error);
//     res.status(500).json({ status: 'false', message: 'Internal server error' });
//   }
// });

// // DELETE endpoint to delete a specific image from the gallery
// router.delete('/delete-gallery-image', authenticateToken, (req, res) => {
//   const { imageUrl } = req.body;

//   if (!imageUrl) {
//     return res.status(400).json({
//       status: 'false',
//       message: 'Please provide the image URL to delete',
//     });
//   }

//   try {
//     const imageName = path.basename(imageUrl);
//     const imagePath = path.join(__dirname, '../UnoPayGallery', imageName);

//     if (fs.existsSync(imagePath)) {
//       fs.unlinkSync(imagePath);
//       res.json({
//         status: 'true',
//         message: 'Image deleted successfully',
//       });
//     } else {
//       res.status(404).json({
//         status: 'false',
//         message: 'Image not found',
//       });
//     }
//   } catch (error) {
//     console.error('Error deleting image:', error);
//     res.status(500).json({ status: 'false', message: 'Internal server error' });
//   }
// });

// // GET endpoint to retrieve all images in the gallery
// router.get('/get-gallery-images', authenticateToken, (req, res) => {
//   try {
//     const galleryPath = path.join(__dirname, '../UnoPayGallery');
//     if (!fs.existsSync(galleryPath)) {
//       return res.status(200).json({
//         status: 'true',
//         images: [],
//       });
//     }

//     const images = fs.readdirSync(galleryPath).map((file) => {
//       return `${req.protocol}://${req.get('host')}/UnoPayGallery/${file}`;
//     });

//     res.json({
//       status: 'true',
//       images: images,
//     });
//   } catch (error) {
//     console.error('Error fetching gallery images:', error);
//     res.status(500).json({ status: 'false', message: 'Internal server error' });
//   }
// });

// POST: Upload images (Ensure they are served from VPS domain)
router.post('/post-gallery', authenticateToken, upload.array('images', 10), (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ status: 'false', message: 'No images uploaded.' });
      }
  
      const BASE_URL = process.env.BASE_URL || 'https://unotag.biz';
  
      const fileUrls = req.files.map((file) => {
        return `https://unotag.biz/UnoPayGallery/${file.filename}`;
      });
      
  
      res.json({ status: 'true', message: 'Images uploaded successfully', fileUrls });
    } catch (error) {
      console.error('Error uploading images:', error);
      res.status(500).json({ status: 'false', message: 'Internal server error' });
    }
  });
  
  // DELETE: Delete images
  router.delete('/delete-gallery-image', authenticateToken, (req, res) => {
    const { imageUrl } = req.body;
  
    if (!imageUrl) {
      return res.status(400).json({ status: 'false', message: 'Provide the image URL to delete' });
    }
  
    try {
      const imageName = path.basename(imageUrl);
      const imagePath = path.join(__dirname, '../UnoPayGallery', imageName);
  
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        res.json({ status: 'true', message: 'Image deleted successfully' });
      } else {
        res.status(404).json({ status: 'false', message: 'Image not found' });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ status: 'false', message: 'Internal server error' });
    }
  });

  // GET endpoint to retrieve all images in the gallery with the correct domain
router.get('/get-gallery-images', authenticateToken, (req, res) => {
  console.log("api hit image wali")
  try {
    const galleryPath = path.join(__dirname, 'UnoPayGallery');
    if (!fs.existsSync(galleryPath)) {
      return res.status(200).json({ status: 'true', images: [] });
    }

    const images = fs.readdirSync(galleryPath).map((file) => {
      return `https://unotag.biz/UnoPayGallery/${file}`;
    });
    

    res.json({ status: 'true', images });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ status: 'false', message: 'Internal server error' });
  }
});

  

module.exports = router;