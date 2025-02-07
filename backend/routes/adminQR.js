const express = require('express');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const authenticateToken = require('../middleware/auth');

// Directory for storing QR images
const uploadPath = path.join(__dirname, 'adminQRS');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const error = new Error('Only .png, .jpg and .jpeg formats are allowed!');
        error.code = 'INVALID_FILE_TYPE'; // Custom error code
        cb(error, false);
      }
    },
  });


// Error handling middleware
const handleMulterErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      return res.status(400).json({ status: 'false', error: err.message });
    } else if (err.code === 'INVALID_FILE_TYPE') {
      // Handle custom file type error
      return res.status(400).json({ status: 'false', error: err.message });
    }

    next(err);
  };

// Route to upload QR code and UPI ID
router.post('/postAdminQRS', upload.single('qr'), async (req, res) => {
  const { upi_id } = req.body;

  if (!upi_id || !req.file) {
    return res.status(400).json({ status: 'false', error: 'UPI ID and QR file are required.' });
  }
  // check in table upi_id do not present 
  const [upi_id_present] = await pool.query(`SELECT * FROM admin_qrs WHERE upi_id=?`,[upi_id])
//   console.log(upi_id_present)
  if(upi_id_present.length>0){
    return res.status(400).json({ status: 'false', error: 'UPI ID already present.' });
    }



  try {
    // Validate UPI ID (if applicable)
    // Example: Validate format, uniqueness, etc.

    // Generate a unique file name for the QR file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(req.file.originalname);
    const qrFileName = `qr-${uniqueSuffix}${fileExtension}`;

    // Insert data into the admin_qrs table
    const [result] = await pool.query(
      'INSERT INTO admin_qrs (upi_id, qr) VALUES (?, ?)',
      [upi_id, qrFileName]
    );

    // Save the file to disk only after the database operation succeeds
    const filePath = path.join(uploadPath, qrFileName);
    fs.writeFileSync(filePath, req.file.buffer);

    res.status(201).json({
      message: 'QR code uploaded successfully.',
      status: 'true',
      data: {
        id: result.insertId,
        upi_id,
        qr: qrFileName,
      },
    });
  } catch (error) {
    console.error('Error uploading QR code:', error);
    res.status(500).json({ status: 'false', error: 'Internal server error.' });
  }
});
router.use(handleMulterErrors)

module.exports = router;





// Route to get a random QR code and its details
router.get('/getRandomQR', async (req, res) => {
    try {
      // Fetch all entries
      const [rows] = await pool.query('SELECT * FROM admin_qrs');
      
      if (rows.length === 0) {
        return res.status(404).json({ status:'false',error: 'No QR codes found.' });
      }
  
      // Pick a random entry
      const randomIndex = Math.floor(Math.random() * rows.length);
      const randomQR = rows[randomIndex];
  
      res.json({ status: 'true', data: randomQR });
    } catch (error) {
      console.error('Error fetching random QR:', error);
      res.status(500).json({ status:'false',error: 'Internal server error.' });
    }
  });
  router.post('/getQRimage', async (req, res) => {
    const  {qr } = req.body; 

    

    if (!qr) {
        return res.status(400).json({ status:'false',error: "QR filename is required." });
    }
    const containsSQLInjectionWords = (input) => {
        const sqlKeywords = [
          "SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "WHERE", "OR", "AND", "--", "#", "/\\*", "\\*/", ";", "=", "'", "\""
        ];
        const regex = new RegExp(sqlKeywords.join('|'), 'i');
        return regex.test(input);
      };
      // Validate inputs
      if (containsSQLInjectionWords(qr)) {
        return res.status(400).json({ status:"false",error: "Don't try to hack." });
      }

    try {
      
        const qrDirectory = path.join(__dirname, 'adminQRS');
        const filePath = path.join(qrDirectory, qr);

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "QR file not found." });
        }

        // Send the file as a response
        res.sendFile(filePath);
        // res.json(filePath);
    } catch (error) {
        console.error('Error while fetching QR image:', error);
        res.status(500).json({ error: "Internal server error." });
    }
});



  // Route to get all QR codes and their details
  router.get('/getAllAdminQRS', async (req, res) => {
    try {
      // Fetch all entries
      const [rows] = await pool.query('SELECT * FROM admin_qrs');
      
      if (rows.length === 0) {
        return res.status(404).json({ status:'false',error: 'No QR codes found.' });
      }
  
      res.json({ message: 'All QR codes fetched successfully.', 
        status:'true',
        data: rows 
    });
    } catch (error) {
      console.error('Error fetching all QRs:', error);
      res.status(500).json({ status:'false',error: 'Internal server error.' });
    }
  });




  //delete admin_qrs
  router.delete('/deleteAdminQR/:id', async (req, res) => {
    const { id } = req.params;
    try {
      // Delete the entry
      const [result] = await pool.query('DELETE FROM admin_qrs WHERE id = ?', [
        id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 'false', error: 'QR code not found' });
          }
          res.json({ status: 'true', message: 'QR code deleted successfully.' });
      } catch (error) {
        console.error('Error deleting QR code:', error);
        res.status(500).json({ status: 'false', error: 'Internal server error.' });
      }
    });







module.exports = router;

