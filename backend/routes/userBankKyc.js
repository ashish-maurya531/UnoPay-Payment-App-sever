// const express = require('express');
// const { pool } = require('../config/database');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const router = express.Router();
// const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');
// const {verifyOtp} = require('../utills/sendOtpMail');
// const authenticateToken = require('../middleware/auth');



// // Create directories if they don't exist
// const baseDir = path.join(__dirname, 'user_kyc_images');
// // Create base directory if it doesn't exist
// if (!fs.existsSync(baseDir)) {
//     fs.mkdirSync(baseDir, { recursive: true });
//   }
// const subDirs = ['kycPancard', 'kycAadharcardFront',"kycAadharcardBack",'kycPassbook', 'kycUserImage'];
// subDirs.forEach((subDir) => {
//   const dirPath = path.join(baseDir, subDir);
//   if (!fs.existsSync(dirPath)) {
//     fs.mkdirSync(dirPath, { recursive: true });
//   }
// });
// // Configure multer to use memory storage
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 5MB
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       const error = new Error('Only .png, .jpg, and .jpeg formats are allowed!');
//       error.code = 'INVALID_FILE_TYPE'; // Custom error code
//       cb(error, false);
//     }
//   },
// });

// // Error handling middleware
// const handleMulterErrors = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({ status: 'false', message:"123",error: err.message });
//   } else if (err.code === 'INVALID_FILE_TYPE') {
//     return res.status(400).json({ status: 'false', message:"12222",error: err.message });
//   }
//   next(err);
// };


// router.post('/submitUserBankKycDetails', authenticateToken,
//   upload.fields([
//     { name: 'kycPancard', maxCount: 1 },
//     { name: 'kycAadharcardFront', maxCount: 1 },
//     { name: 'kycAadharcardBack', maxCount: 1 },
//     { name: 'kycUserImage', maxCount: 1 },
//     { name: 'kycPassbook', maxCount: 1 }
//   ]), 
//   async (req, res) => {
//     const { member_id, FullName, IFSC_Code, Bank_Name, Account_number, Aadhar_Number, PanCard_Number, Nominee_name,Nominee_relation,kycOtp } = req.body;
//     console.log(member_id, IFSC_Code, Bank_Name, Account_number, PanCard_Number, Nominee_name);
//     // Check if required fields are provided
//     if (!member_id || !FullName || !IFSC_Code || !Bank_Name || !Account_number || !Aadhar_Number || !PanCard_Number || !Nominee_name||!Nominee_relation) {
//       return res.status(200).json({ status: 'false', message:"1", error: 'All required fields must be provided.' });
//     }

//     const checktheData = [member_id, FullName, IFSC_Code, Bank_Name, Account_number, Aadhar_Number, PanCard_Number, Nominee_name,Nominee_relation].join(' ');
//     if (containsSQLInjectionWords(checktheData)) {
//       return res.status(200).json({ status: "false", message:"2", error: "Don't try to hack." });
//     }

//     try {
//       // Check if member_id exists in usersdetails table
//       const [userRows] = await pool.query(
//         `SELECT memberid FROM usersdetails WHERE memberid = ?`,
//         [member_id]
//       );
//       console.log(userRows);
//       console.log(member_id);

//       if (userRows.length === 0) {
//         return res.status(200).json({ status: 'false', message:"4", error: 'Invalid member ID.' });
//       }
//       // Assuming verifyOtp is an async function that returns a response
//       const isOtpValid = await verifyOtp(member_id, kycOtp);

//       if (isOtpValid?.success === true && isOtpValid?.message === "OTP verified successfully") {
          
//           console.log("Kyc OTP verified successfully.");
        
          
//       } else if (isOtpValid?.success === false && isOtpValid?.message === "No otp request by this Member ID") {
//           console.log("No OTP request found for this Member ID.");
//           return res.status(200).json({ status: 'false', message:"5"})
         
//       } else if (isOtpValid?.success === false && isOtpValid?.message === "OTP expired") {
//           console.log("OTP expired. Please request a new OTP.");
//           return res.status(200).json({ status: 'false', message:"6", error: 'OTP expired. Please request a new OTP.' });
       
//       } else if (isOtpValid?.success === false && isOtpValid?.message === "Invalid OTP") {
//           console.log("Invalid OTP entered.");
//           return res.status(200).json({ status: 'false', message:"5", error: 'Invalid OTP entered.' });
        
//       } else {
//           console.log("Unexpected OTP verification result.");
        
//       }

    


//       // Check if user has already submitted bank kyc details and kyc status is pending 
//       const [bankKycRows] = await pool.query(
//         `SELECT member_id, kyc_status FROM user_bank_kyc_details WHERE member_id = ?`,
//         [member_id]
//       );
//       console.log(bankKycRows);

//       const kyc_status = bankKycRows.map(item => item.kyc_status);
//       console.log(kyc_status);

//       if (bankKycRows.length > 0) {
//         if (kyc_status.includes("approved")) {
//           return res.status(200).json({
//             status: 'false',
//             KycStatus: "approved",
//             message: "User has already been approved."
//           });
//         }

//         if (kyc_status.includes("pending")) {
//           return res.status(200).json({
//             status: 'false',
//             KycStatus: "pending",
//             message: "User has already filled bank and kyc details."
//           });
//         }
//       }

//       // If there is a rejected request, then delete that row and images before submitting the new request
//       if (kyc_status.includes("rejected")) {
//         try {
//           await pool.query(`DELETE FROM user_bank_kyc_details WHERE member_id = ? AND Kyc_status = 'rejected'`, [member_id]);
//         } catch (err) {
//           console.error("Error deleting rejected request:", err);
//           return res.status(200).json({ status: 'false', message: "Error deleting rejected request." });

//         }
//       }
      
//       // Insert user bank KYC details into the database
//       await pool.query(
//         `INSERT INTO user_bank_kyc_details (member_id, FullName, IFSC_Code, Bank_Name, Account_number, Aadhar_Number, PanCard_Number, Nominee_name, Nominee_relation,Kyc_status, Kyc_message, created_at) 
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, 'pending', 'not done', NOW())`,
//         [member_id, FullName, IFSC_Code, Bank_Name, Account_number, Aadhar_Number, PanCard_Number, Nominee_name,Nominee_relation]
//       );

//       // Save files and get paths
//       const filePaths = {};
//       for (const [fieldName, files] of Object.entries(req.files)) {
//         const file = files[0];
//         const uniqueName = `${fieldName}-${Date.now()}-${Math.floor(Math.random() * 100000)}${path.extname(file.originalname)}`;
//         const filePath = path.join(baseDir, fieldName, uniqueName);

//         fs.writeFileSync(filePath, file.buffer);
//         filePaths[fieldName] = uniqueName;
//       }

//       // Insert KYC images into the database
//       await pool.query(
//         `INSERT INTO user_kyc_images (member_id, passbook_image, pancard_image, aadhar_front_image, aadhar_back_image, user_image) 
//          VALUES (?, ?, ?, ?, ?, ?)`,
//         [
//           member_id,
//           filePaths?.kycPassbook || null,
//           filePaths?.kycPancard || null,
//           filePaths?.kycAadharcardFront || null,
//           filePaths?.kycAadharcardBack || null,
//           filePaths?.kycUserImage || null
//         ]
//       );

//       res.status(201).json({
//         status: 'true',
//         message: 'Bank and KYC details and images uploaded successfully.',
//         data: {
//           member_id,
//           filePaths,
//         },
//       });
//     } catch (error) {
//       console.error('Error submitting KYC details:', error);
//       res.status(500).json({ status: 'false', message:"7", error: 'Internal server error.' });
//     }
//   });

// router.use(handleMulterErrors);


// //get kyc status and message
// router.post('/userkycstatus',authenticateToken,async (req,res) => {
//     const {member_id} = req.body;
//     console.log("kyc page status",member_id);
//     //check member id not empty
//     if (!member_id) {
//         return res.status(400).json({ status: 'false', error: 'Member ID is empty'})
//     }

//     //check sql injection
//     if (containsSQLInjectionWords(member_id)) {
//         return res.status(400).json({ status: 'false', error: 'Don\'t try to hack.' });
//     }
//     try {
//         //check if user exists or not 
//         const [userRows] = await pool.query(`SELECT memberid FROM usersdetails WHERE memberid = ?`,[member_id]);
//         if (userRows.length === 0) {
//           return res.status(400).json({ status: 'false', error: 'Member ID does not exist.' });
//         }
//         if (userRows[0].memberid === member_id) {
//         const [result] = await pool.query(`SELECT Kyc_status,Kyc_message FROM user_bank_kyc_details WHERE member_id = ?`,[member_id]);
//           if(result.length === 0){
//               return res.status(200).json({status: 'true', message: 'User has not submitted KYC details yet.'});
//           }
//         res.status(200).json({status: 'true', data: result[0]});
//     }}
//     catch (error) {
//         console.error('Error checking user:', error);
//         return res.status(500).json({ status: 'false', message:"8", error: 'Internal server error.' });
//     }
    

    

// });

// // update user kyc status
// router.post('/updateUserKycStatus',authenticateToken, async (req, res) => {
//   const { member_id, status, message } = req.body;
  
//   // Check fields are not empty
//   if (!member_id || !status || !message) {
//     return res.status(400).json({ status: 'false', error: 'Some fields are empty' });
//   }

//   // Check for SQL injection
//   var input = [member_id, status, message].join(' ');
//   if (containsSQLInjectionWords(input)) {
//     return res.status(400).json({ status: 'false', error: 'Don\'t try to hack.' });
//   }

//   // Check valid status
//   const validStatuses = ['approved', 'rejected'];
//   if (!validStatuses.includes(status)) {
//     return res.status(400).json({ status: 'false', error: 'Invalid status' });
//   }

//   // Check for member
//   const [userRows] = await pool.query(
//     `SELECT memberid FROM usersdetails WHERE memberid = ?`,
//     [member_id]
//   );
//   if (userRows.length === 0) {
//     return res.status(404).json({ status: 'false', error: 'Invalid member ID.' });
//   }

//   try {
//     const [kycDetailsRows] = await pool.query(
//       'SELECT Kyc_status, Kyc_message FROM user_bank_kyc_details WHERE member_id = ?',
//       [member_id]
//     );

//     if (kycDetailsRows.length === 0) {
//       return res.status(404).json({ status: 'false', error: 'No details found' });
//     }

//     const { Kyc_status: currentStatus, Kyc_message } = kycDetailsRows[0];

//     // If the status is already approved or rejected, return a message
//     if (currentStatus === 'approved' || currentStatus === 'rejected') {
//       return res.status(200).json({
//         status: 'true',
//         currentKycStatus: currentStatus,
//         message: currentStatus === 'approved'
//           ? 'User has already been approved.'
//           : currentStatus === 'rejected'
//             ? 'User has been rejected and has no current pending KYC request.'
//             : 'Try Again',
//       });
//     }

//     // Update the KYC status
//     const result = await pool.query(
//       `UPDATE user_bank_kyc_details SET Kyc_status = ?, Kyc_message = ? WHERE member_id = ?`,
//       [
//         status,
//         status === 'approved' ? 'done' : message,
//         member_id
//       ]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ status: 'false', error: 'User not found' });
//     }

//     // If approved or rejected, delete images from user_kyc_images
//   if (status === 'rejected') {
//       // Delete the entry from the `user_kyc_images` table
//       //     // Delete the row from user_kyc_images
//           const [imageRows] = await pool.query(
//             `SELECT * FROM user_kyc_images WHERE member_id = ?`,
//             [member_id]
//           );
//       const [deleteImageResult] = await pool.query(
//         `DELETE FROM user_kyc_images WHERE member_id = ?`,
//         [member_id]
//       );
//       console.log(deleteImageResult);

//       // Assuming the images are stored on the server's filesystem, delete the images
//       if (deleteImageResult.affectedRows > 0) {
//         if (imageRows.length > 0) {
//           // Delete associated image files
//           const baseDir = path.join(__dirname, 'user_kyc_images');
//           const subDirs = ['kycPassbook', 'kycPancard', 'kycAadharcardFront', 'kycAadharcardBack', 'kycUserImage'];
//           const imagePaths = [
//             imageRows[0].passbook_image,
//             imageRows[0].pancard_image,
//             imageRows[0].aadhar_front_image,
//             imageRows[0].aadhar_back_image,
//             imageRows[0].user_image
//           ];
//           // Delete associated image files
//           imagePaths.forEach((image, index) => {
//             if (image) {
//               const filePath = path.join(baseDir, subDirs[index], image);
//               if (fs.existsSync(filePath)) {
//                 try {
//                   fs.unlinkSync(filePath); // Delete the file
//                   console.log(`Deleted file: ${filePath}`);
//                 } catch (err) {
//                   console.error(`Failed to delete file ${filePath}:`, err);
//                 }
//               } else {
//                 console.warn(`File not found: ${filePath}`);
//               }
//             }
//           });
//         }
//       }
//     }

//     res.status(200).json({ status: 'true', message: 'KYC status updated successfully' });

//   } catch (err) {
//     console.error('Error updating KYC status:', err);
//     res.status(500).json({ status: 'false', error: 'Internal server error.' });
//   }
// });


// //get all users bank and kyc details 
// router.get('/bankkycDetails/All', authenticateToken,async (req, res)=>{
//     try{
//         const [results] = await pool.query('SELECT * FROM user_bank_kyc_details');
//         res.status(200).json({status: 'true', data: results});

//     }
//     catch(err){
//         console.error('Error fetching kyc details:', err);
//         res.status(500).json({status: 'false', error: 'Internal server error.'});
//     }
    
// })

// //get single user bank and kyc details 
// router.post('/bankkycDetails/user',authenticateToken, async (req, res)=>{
//     const {member_id} = req.body;
//     //check member id not empty
//     if (!member_id) {
//         return res.status(400).json({ status: 'false', error: 'Member ID is empty'})
    
//     }
//     //check sql injection
//     if (containsSQLInjectionWords(member_id)) {
//         return res.status(400).json({ status: 'false', error: 'Don\'t try to hack.' });
//     }
//     try{
//     const [result] = await pool.query(`SELECT * FROM user_bank_kyc_details WHERE member_id = ?`,[member_id]);
//     if(result.length === 0){
//         return res.status(404).json({status: 'false', error: 'User not registered'});
//     }
//     res.status(200).json({status: 'true', data: result[0]});
//     }
//     catch(err){
//         console.error('Error fetching kyc details:', err);
//         res.status(500).json({status: 'false', error: 'Internal server error.'});
//     }

// })


// // API to fetch passbook image
// router.post('/getPassbookImage', authenticateToken,async (req, res) => {
//   const { member_id } = req.body;

//   if (!member_id) {
//       return res.status(400).json({ status: "error", message: "Member ID is required" });
//   }
//   //check sql injection
//   if (containsSQLInjectionWords(member_id)) {
//       return res.status(400).json({ status: "error", message: "Don't try to hack." });
//   }

//   try {
//       const [rows] = await pool.query(
//           'SELECT passbook_image FROM user_kyc_images WHERE member_id = ?',
//           [member_id]
//       );

//       if (rows.length === 0) {
//           return res.status(404).json({ status: "error", message: "Member ID not found" });
//       }

//       const filePath = path.join(__dirname, 'user_kyc_images', 'kycPassbook', rows[0].passbook_image);
//       console.log(filePath);
//       if (!fs.existsSync(filePath)) {
//           return res.status(404).json({ status: "error", message: "Passbook image not found" });
//       }

//       res.sendFile(filePath);
//   } catch (error) {
//       console.error('Error fetching passbook image:', error);
//       res.status(500).json({ status: "error", message: "Internal server error" });
//   }
// });

// // API to fetch pancard image
// router.post('/getPancardImage', authenticateToken,async (req, res) => {
//   const { member_id } = req.body;

//   if (!member_id) {
//       return res.status(400).json({ status: "error", message: "Member ID is required" });
//   }
//   //check sql injection
//   if (containsSQLInjectionWords(member_id)) {
//       return res.status(400).json({ status: "error", message: "Don't try to hack." });
//   }

//   try {
//       const [rows] = await pool.query(
//           'SELECT pancard_image FROM user_kyc_images WHERE member_id = ?',
//           [member_id]
//       );

//       if (rows.length === 0) {
//           return res.status(404).json({ status: "error", message: "Member ID not found" });
//       }

//       const filePath = path.join(__dirname, 'user_kyc_images', 'kycPancard', rows[0].pancard_image);
//       console.log(filePath);

//       if (!fs.existsSync(filePath)) {
//           return res.status(404).json({ status: "error", message: "Pancard image not found" });
//       }

//       res.sendFile(filePath);
//   } catch (error) {
//       console.error('Error fetching pancard image:', error);
//       res.status(500).json({ status: "error", message: "Internal server error" });
//   }
// });
// // API to fetch aadhar front image
// router.post('/getAadharcardFrontImage',authenticateToken, async (req, res) => {
//   const { member_id } = req.body;
//   if (!member_id) {
//     return res.status(400).json({ status: "error", message: "Member ID is required" });
//   }
//   //check sql injection
//   if (containsSQLInjectionWords(member_id)) {
//     return res.status(400).json({ status: "error", message: "Don't try to hack." });
//   }


//   try {
//     const [rows] = await pool.query(
//       'SELECT aadhar_front_image FROM user_kyc_images WHERE member_id = ?',
//       [member_id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ status: "error", message: "Aadhar front image not found" });
//     }

//     const filePath = path.join(__dirname, 'user_kyc_images', 'kycAadharcardFront', rows[0].aadhar_front_image);
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ status: "error", message: "Aadhar front image not found" });
//     }

//     res.sendFile(filePath);
//   } catch (error) {
//     console.error('Error fetching aadhar front image:', error);
//     res.status(500).json({ status: "error", message: "Internal server error" });
//   }
// });

// // API to fetch aadhar back image
// router.post('/getAadharcardBackImage', authenticateToken,async (req, res) => {
//   const { member_id } = req.body;
//   if (!member_id) {
//     return res.status(400).json({ status: "error", message: "Member ID is required" });
//   }
//   //check sql injection
//   if (containsSQLInjectionWords(member_id)) {
//     return res.status(400).json({ status: "error", message: "Don't try to hack." });
//   }


//   try {
//     const [rows] = await pool.query(
//       'SELECT aadhar_back_image FROM user_kyc_images WHERE member_id = ?',
//       [member_id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ status: "error", message: "Aadhar back image not found" });
//     }

//     const filePath = path.join(__dirname, 'user_kyc_images', 'kycAadharcardBack', rows[0].aadhar_back_image);
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ status: "error", message: "Aadhar back image not found" });
//     }

//     res.sendFile(filePath);
//   } catch (error) {
//     console.error('Error fetching aadhar back image:', error);
//     res.status(500).json({ status: "error", message: "Internal server error" });
//   }
// });

// // API to fetch user image
// router.post('/getUserImage', authenticateToken,async (req, res) => {
//   const { member_id } = req.body;

//   if (!member_id) {
//       return res.status(400).json({ status: "error", message: "Member ID is required" });
//   }

//   //check sql injection
//   if (containsSQLInjectionWords(member_id)) {
//       return res.status(400).json({ status: "error", message: "Don't try to hack." });
//   }
//   try {
//       const [rows] = await pool.query(
//           'SELECT user_image FROM user_kyc_images WHERE member_id = ?',
//           [member_id]
//       );

//       if (rows.length === 0) {
//           return res.status(404).json({ status: "error", message: "Member ID not found" });
//       }

//       const filePath = path.join(__dirname, 'user_kyc_images', 'kycUserImage', rows[0].user_image);
//       console.log(filePath);

//       if (!fs.existsSync(filePath)) {
//           return res.status(404).json({ status: "error", message: "User image not found" });
//       }

//       res.sendFile(filePath);
//   } catch (error) {
//       console.error('Error fetching user image:', error);
//       res.status(500).json({ status: "error", message: "Internal server error" });
//   }
// });
// module.exports = router;




// routes/kycRoutes.js
const express = require('express');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {verifyOtp} = require('../utills/sendOtpMail');
const containsSQLInjectionWords = require('../utills/sqlInjectionCheck');
const axios = require('axios');

// Directory setup
const baseDir = path.join(__dirname, '..', 'user_kyc_images');
const parts = ['user', 'pancard', 'aadhar_front', 'aadhar_back', 'bank'];
parts.forEach(part => {
  const dir = path.join(baseDir, part);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'), false);
  }
});

// Helper functions
const saveImage = (memberId, part, file) => {
  const uniqueName = `${part}-${Date.now()}-${Math.floor(Math.random() * 1e5)}${path.extname(file.originalname)}`;
  const filePath = path.join(baseDir, part, uniqueName);
  fs.writeFileSync(filePath, file.buffer);
  return uniqueName;
};

const checkExistingSubmission = async (memberId, part) => {
  const tables = {
    user: 'user_details',
    pancard: 'pancard_details',
    aadhar_front: 'aadhar_details',
    aadhar_back: 'aadhar_details',
    bank: 'bank_details'
  };
  
  const [rows] = await pool.query(`SELECT status FROM ${tables[part]} WHERE member_id = ?`, [memberId]);
  return rows.length ? rows[0].status : null;
};

// 1. User Details Submission
router.post('/submit-user-details', authenticateToken,
  upload.single('kycUserImage'),
  async (req, res) => {
    try {
      const { member_id, FullName, Nominee_name, Nominee_relation} = req.body;
      //check the member_id in userdetails table 
      const [userRows] = await pool.query(`SELECT memberid FROM usersdetails WHERE memberid = ?`,[member_id]);
      if (userRows.length === 0) {
        return res.status(404).json({ status: 'false', message: 'Member ID not found' });
      }
      
      // // Validate OTP
      // const otpResult = await verifyOtp(member_id, kycOtp);
      // if (!otpResult.success) return res.status(400).json({ status: 'error', message: otpResult.message });
      
      // Check existing status
      const existingStatus = await checkExistingSubmission(member_id, 'user');
      if (existingStatus === 'approved') return res.status(200).json({ status: 'false', message: 'User details already approved' });
      //pending
      if (existingStatus === 'pending') return res.status(200).json({ status: 'false', message: 'User details already submitted' });
      
    

      // Save to DB
      await pool.query(`
        INSERT INTO user_details 
        (member_id, FullName, Nominee_name, Nominee_relation,status, message) 
        VALUES (?, ?, ?, ?,?,?)
        ON DUPLICATE KEY UPDATE 
        FullName = VALUES(FullName),
        Nominee_name = VALUES(Nominee_name),
        Nominee_relation = VALUES(Nominee_relation),
        status = VALUES(status),
        message = VALUES(message)
      `, [member_id, FullName, Nominee_name, Nominee_relation,"pending",null]);

      // Save image
      const imageName = saveImage(member_id, 'user', req.file);
      await pool.query(`
        INSERT INTO user_kyc_images 
        (member_id, image_name, part) 
        VALUES (?, ?, 'user')
        ON DUPLICATE KEY UPDATE image_name = ?
      `, [member_id, imageName, imageName]);

      res.status(201).json({ status: 'true', message: 'User details submitted' });
    } catch (error) {
      res.status(500).json({ status: 'false', message: error.message });
    }
  });

// 2. Pancard Submission
router.post('/submit-pancard', authenticateToken,
  upload.single('kycPancard'),
  async (req, res) => {
    try {
      const { member_id, PanCard_Number } = req.body;
       //check the member_id in userdetails table 
       const [userRows] = await pool.query(`SELECT memberid FROM usersdetails WHERE memberid = ?`,[member_id]);
       if (userRows.length === 0) {
         return res.status(404).json({ status: 'false', message: 'Member ID not found' });
       }
      
      // // Validate OTP
      // const otpResult = await verifyOtp(member_id, kycOtp);
      // if (!otpResult.success) return res.status(400).json({ status: 'error', message: otpResult.message });
      
      // Check existing status
      const existingStatus = await checkExistingSubmission(member_id, 'pancard');
      if (existingStatus === 'approved') return res.status(200).json({ status: 'false', message: 'Pancard already approved' });
      if (existingStatus === 'pending') return res.status(200).json({ status: 'false', message: 'Pancard details already submitted' });

      // Save to DB
      await pool.query(`
        INSERT INTO pancard_details 
        (member_id, PanCard_Number,status,message) 
        VALUES (?, ?,?,?)
        ON DUPLICATE KEY UPDATE PanCard_Number = VALUES(PanCard_Number),status = VALUES(status),message = VALUES(message)
      `, [member_id, PanCard_Number,"pending",null]);

      // Save image
      const imageName = saveImage(member_id, 'pancard', req.file);
      await pool.query(`
        INSERT INTO user_kyc_images 
        (member_id, image_name, part) 
        VALUES (?, ?, 'pancard')
        ON DUPLICATE KEY UPDATE image_name = ?
      `, [member_id, imageName, imageName]);

      res.status(201).json({ status: 'true', message: 'Pancard submitted' });
    } catch (error) {
      res.status(500).json({ status: 'false', message: error.message });
    }
  });

// 3. Aadhar Front Submission
router.post('/submit-aadhar-front', authenticateToken,
  upload.single('kycAadharFront'),
  async (req, res) => {
    try {
      const { member_id, Aadhar_Number} = req.body;
       //check the member_id in userdetails table 
       const [userRows] = await pool.query(`SELECT memberid FROM usersdetails WHERE memberid = ?`,[member_id]);
       if (userRows.length === 0) {
         return res.status(404).json({ status: 'true', message: 'Member ID not found' });
       }
      
      // Validate OTP
      // const otpResult = await verifyOtp(member_id, kycOtp);
      // if (!otpResult.success) return res.status(400).json({ status: 'error', message: otpResult.message });
      
      // Check existing status
      const existingStatus = await checkExistingSubmission(member_id, 'aadhar_front');
      if (existingStatus === 'approved') return res.status(200).json({ status: 'false', message: 'Aadhar front already approved' });
      if (existingStatus === 'pending') return res.status(200).json({ status: 'false', message: 'Aadhar front already submitted' });


      // Save to DB
      await pool.query(`
        INSERT INTO aadhar_details 
        (member_id, Aadhar_Number,status,message) 
        VALUES (?, ?,?,?)
        ON DUPLICATE KEY UPDATE Aadhar_Number = VALUES(Aadhar_Number),status = VALUES(status),message = VALUES(message)
      `, [member_id, Aadhar_Number,"pending",null]);

      // Save image
      const imageName = saveImage(member_id, 'aadhar_front', req.file);
      await pool.query(`
        INSERT INTO user_kyc_images 
        (member_id, image_name, part) 
        VALUES (?, ?, 'aadhar_front')
        ON DUPLICATE KEY UPDATE image_name = ?
      `, [member_id, imageName, imageName]);

      res.status(201).json({ status: 'true', message: 'Aadhar front submitted' });
    } catch (error) {
      res.status(500).json({ status: 'false', message: error.message });
    }
  });

// 4. Aadhar Back Submission
router.post('/submit-aadhar-back', authenticateToken,
  upload.single('kycAadharBack'),
  async (req, res) => {
    try {
      const { member_id} = req.body;
       //check the member_id in userdetails table 
       const [userRows] = await pool.query(`SELECT memberid FROM usersdetails WHERE memberid = ?`,[member_id]);
       if (userRows.length === 0) {
         return res.status(404).json({ status: 'false', message: 'Member ID not found' });
       }
      
      // Validate OTP
      // const otpResult = await verifyOtp(member_id, kycOtp);
      // if (!otpResult.success) return res.status(400).json({ status: 'error', message: otpResult.message });
      
      // Check existing status
      const existingStatus = await checkExistingSubmission(member_id, 'aadhar_back');
      if (existingStatus === 'approved') return res.status(200).json({ status: 'false', message: 'Aadhar back already approved' });
      // if (existingStatus === 'pending') return res.status(200).json({ status: 'false', message: 'Aadhar back already submitted' });


      // Save image
      const imageName = saveImage(member_id, 'aadhar_back', req.file);
      await pool.query(`
        INSERT INTO user_kyc_images 
        (member_id, image_name, part) 
        VALUES (?, ?, 'aadhar_back')
        ON DUPLICATE KEY UPDATE image_name = ?
      `, [member_id, imageName, imageName]);

      res.status(201).json({ status: 'true', message: 'Aadhar back submitted' });
    } catch (error) {
      res.status(500).json({ status: 'false', message: error.message });
    }
  });

// 5. Bank Details Submission
router.post('/submit-bank-details', authenticateToken,
  upload.single('kycPassbook'),
  async (req, res) => {
    try {
      const { member_id, Bank_Name, IFSC_Code, Account_number} = req.body;
       //check the member_id in userdetails table 
       const [userRows] = await pool.query(`SELECT memberid FROM usersdetails WHERE memberid = ?`,[member_id]);
       if (userRows.length === 0) {
         return res.status(404).json({ status: 'false', message: 'Member ID not found' });
       }
      
      // Validate OTP
      // const otpResult = await verifyOtp(member_id, kycOtp);
      // if (!otpResult.success) return res.status(400).json({ status: 'error', message: otpResult.message });
      
      // Check existing status
      const existingStatus = await checkExistingSubmission(member_id, 'bank');
      if (existingStatus === 'approved') return res.status(200).json({ status: 'false', message: 'Bank details already approved' });
      if (existingStatus === 'pending') return res.status(200).json({ status: 'false', message: 'Bank details already submitted' });


      // Save to DB
      await pool.query(`
        INSERT INTO bank_details 
        (member_id, Bank_Name, IFSC_Code, Account_number,status, message) 
        VALUES (?, ?, ?, ?,?,?)
        ON DUPLICATE KEY UPDATE 
        Bank_Name = VALUES(Bank_Name),
        IFSC_Code = VALUES(IFSC_Code),
        Account_number = VALUES(Account_number),
        status = VALUES(status),
        message = VALUES(message)
      `, [member_id, Bank_Name, IFSC_Code, Account_number,"pending",null]);

      // Save image
      const imageName = saveImage(member_id, 'bank', req.file);
      await pool.query(`
        INSERT INTO user_kyc_images 
        (member_id, image_name, part) 
        VALUES (?, ?, 'bank')
        ON DUPLICATE KEY UPDATE image_name = ?
      `, [member_id, imageName, imageName]);

      res.status(201).json({ status: 'true', message: 'Bank details submitted' });
    } catch (error) {
      res.status(200).json({ status: 'false', message: error.message });
    }
  });

// KYC Status Check
router.post('/kyc-status', authenticateToken, async (req, res) => {
  try {
    const { member_id } = req.body;
     //check the member_id in userdetails table 
     const [userRows] = await pool.query(`SELECT memberid FROM usersdetails WHERE memberid = ?`,[member_id]);
     if (userRows.length === 0) {
       return res.status(404).json({ status: 'false', message: 'Member ID not found' });
     }
    
    // Get all parts status
    const [user] = await pool.query('SELECT * FROM user_details WHERE member_id = ?', [member_id]);
    const [pancard] = await pool.query('SELECT * FROM pancard_details WHERE member_id = ?', [member_id]);
    const [aadhar] = await pool.query('SELECT * FROM aadhar_details WHERE member_id = ?', [member_id]);
    const [bank] = await pool.query('SELECT * FROM bank_details WHERE member_id = ?', [member_id]);
    
    // Determine overall status
    const partsStatus = [user[0]?.status||"not_filled", pancard[0]?.status||"not_filled", aadhar[0]?.status||"not_filled", bank[0]?.status||"not_filled"];
    // console.log(partsStatus)
    const overallStatus = partsStatus.every(s => s === 'approved')
      ? 'approved'
      : partsStatus.every(s => s === "not_filled") ? "not done" : partsStatus.some(s => s === 'rejected')
        ? 'rejected'
        : 'pending';

    res.json({
      status: 'true',
      member_id,
      "kyc_status": overallStatus,
      userdata: {
        overall_status: overallStatus,
        user_details: user[0] || { status: 'not_filled' },
        pancard_details: pancard[0] || { status: 'not_filled' },
        aadhar_details: aadhar[0] || { status: 'not_filled' },
        bank_details: bank[0] || { status: 'not_filled' }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'false', message: error.message });
  }
});
//just like old api 
router.post('/userkycstatus', authenticateToken, async (req, res) => {
  try {
    const { member_id } = req.body;
     //check the member_id in userdetails table 
     const [userRows] = await pool.query(`SELECT memberid FROM usersdetails WHERE memberid = ?`,[member_id]);
     if (userRows.length === 0) {
       return res.status(404).json({ status: 'false', message: 'Member ID not found' });
     }
    
    // Get all parts status
    const [user] = await pool.query('SELECT * FROM user_details WHERE member_id = ?', [member_id]);
    const [pancard] = await pool.query('SELECT * FROM pancard_details WHERE member_id = ?', [member_id]);
    const [aadhar] = await pool.query('SELECT * FROM aadhar_details WHERE member_id = ?', [member_id]);
    const [bank] = await pool.query('SELECT * FROM bank_details WHERE member_id = ?', [member_id]);
    
    // Determine overall status
    const partsStatus = [user[0]?.status||"not_filled", pancard[0]?.status||"not_filled", aadhar[0]?.status||"not_filled", bank[0]?.status||"not_filled"];
    // console.log(partsStatus)
    const overallStatus = partsStatus.every(s => s === 'approved')
      ? 'approved'
      : partsStatus.every(s => s === "not_filled") ? "not done" : partsStatus.some(s => s === 'rejected')
        ? 'rejected'
        : 'pending';

    res.json({
      status: 'true',
      data:{
        "Kyc_status": overallStatus,
        "Kyc_message": overallStatus==="approved"?"done":"not done"

      }
      
    });
  } catch (error) {
    res.status(200).json({ status: 'false', message: error.message });
  }
});


// // Admin Update Part Status
// router.post('/admin/update-part-status', authenticateToken, async (req, res) => {
//   try {
//     const { member_id, part, status, message } = req.body;
    
//     // Validate part
//     const validParts = ['user', 'pancard', 'aadhar', 'bank'];
//     if (!validParts.includes(part)) return res.status(400).json({ status: 'error', message: 'Invalid part' });
    
//     // Determine table
//     const tableMap = {
//       user: 'user_details',
//       pancard: 'pancard_details',
//       aadhar: 'aadhar_details',
//       bank: 'bank_details'
//     };
    
//     // Update status
//     await pool.query(`
//       UPDATE ${tableMap[part]} 
//       SET status = ?, message = ? 
//       WHERE member_id = ?
//     `, [status, message, member_id]);

    


//     // Handle rejection
//     if (status === 'rejected') {
//       // Delete images
//       const [images] = await pool.query(`
//         SELECT * FROM user_kyc_images 
//         WHERE member_id = ? AND part = ?
//       `, [member_id, part]);
      
//       images.forEach(img => {
//         const filePath = path.join(baseDir, part, img.image_name);
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//       });
      
//       await pool.query(`
//         DELETE FROM user_kyc_images 
//         WHERE member_id = ? AND part = ?
//       `, [member_id, part]);
//     }

//     res.json({ status: 'success', message: 'Status updated' });
//   } catch (error) {
//     res.status(500).json({ status: 'error', message: error.message });
//   }
// });
// Admin Update Part Status
router.post('/admin/update-part-status', authenticateToken, async (req, res) => {
  try {
    const { member_id, part, status, message } = req.body;
     //check the member_id in userdetails table 
     const [userRows] = await pool.query(`SELECT memberid FROM usersdetails WHERE memberid = ?`,[member_id]);
     if (userRows.length === 0) {
       return res.status(404).json({ status: 'false', message: 'Member ID not found' });
     }
    
    // Validate part
    const validParts = ['user', 'pancard', 'aadhar', 'bank'];
    if (!validParts.includes(part)) return res.status(400).json({ status: 'error', message: 'Invalid part' });
    
    // Determine table
    const tableMap = {
      user: 'user_details',
      pancard: 'pancard_details',
      aadhar: 'aadhar_details',
      bank: 'bank_details'
    };

    // Check current status to prevent modifying approved parts
    const [currentStatusResult] = await pool.query(`SELECT status FROM ${tableMap[part]} WHERE member_id = ?`, [member_id]);
    const currentStatus = currentStatusResult[0]?.status;

    if (currentStatus === 'approved' && status !== 'approved') {
      return res.status(400).json({ status: 'false', message: 'Cannot modify an already approved part' });
    }
    
    // Update status
    await pool.query(`
      UPDATE ${tableMap[part]} 
      SET status = ?, message = ? 
      WHERE member_id = ?
    `, [status, message, member_id]);

    // Handle rejection
    if (status === 'rejected') {
      const [images] = await pool.query(`
        SELECT * FROM user_kyc_images 
        WHERE member_id = ? AND part = ?
      `, [member_id, part]);
      
      images.forEach(img => {
        const filePath = path.join(baseDir, part, img.image_name);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
      
      await pool.query(`
        DELETE FROM user_kyc_images 
        WHERE member_id = ? AND part = ?
      `, [member_id, part]);
    }

    // Check if all parts are approved and update consolidated table
    if (status === 'approved') {
      const [user] = await pool.query('SELECT status FROM user_details WHERE member_id = ?', [member_id]);
      const [pancard] = await pool.query('SELECT status FROM pancard_details WHERE member_id = ?', [member_id]);
      const [aadhar] = await pool.query('SELECT status FROM aadhar_details WHERE member_id = ?', [member_id]);
      const [bank] = await pool.query('SELECT status FROM bank_details WHERE member_id = ?', [member_id]);

      const allApproved = [user[0]?.status, pancard[0]?.status, aadhar[0]?.status, bank[0]?.status].every(s => s === 'approved');

      if (allApproved) {
        // Fetch all required details
        const [userData] = await pool.query('SELECT FullName, Nominee_name, Nominee_relation FROM user_details WHERE member_id = ?', [member_id]);
        const [pancardData] = await pool.query('SELECT PanCard_Number FROM pancard_details WHERE member_id = ?', [member_id]);
        const [aadharData] = await pool.query('SELECT Aadhar_Number FROM aadhar_details WHERE member_id = ?', [member_id]);
        const [bankData] = await pool.query('SELECT Bank_Name, IFSC_Code, Account_number FROM bank_details WHERE member_id = ?', [member_id]);

        const FullName = userData[0].FullName;
        const Nominee_name = userData[0].Nominee_name;
        const Nominee_relation = userData[0].Nominee_relation;
        const PanCard_Number = pancardData[0].PanCard_Number;
        const Aadhar_Number = aadharData[0].Aadhar_Number;
        const Bank_Name = bankData[0].Bank_Name;
        const IFSC_Code = bankData[0].IFSC_Code;
        const Account_number = bankData[0].Account_number;

        // Update consolidated KYC table
        await pool.query(`
          INSERT INTO user_bank_kyc_details 
          (member_id, FullName, IFSC_Code, Bank_Name, Account_number, Aadhar_Number, PanCard_Number, Nominee_name, Nominee_relation, Kyc_status, Kyc_message, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'done', NOW())
          ON DUPLICATE KEY UPDATE 
          FullName = VALUES(FullName),
          IFSC_Code = VALUES(IFSC_Code),
          Bank_Name = VALUES(Bank_Name),
          Account_number = VALUES(Account_number),
          Aadhar_Number = VALUES(Aadhar_Number),
          PanCard_Number = VALUES(PanCard_Number),
          Nominee_name = VALUES(Nominee_name),
          Nominee_relation = VALUES(Nominee_relation),
          Kyc_status = 'approved',
          Kyc_message = 'done',
          created_at = NOW()
        `, [member_id, FullName, IFSC_Code, Bank_Name, Account_number, Aadhar_Number, PanCard_Number, Nominee_name, Nominee_relation]);
      }
    }

    res.json({ status: 'success', message: 'Status updated' });
  } catch (error) {
    res.status(200).json({ status: 'false', message: error.message });
  }
});

// Image retrieval endpoints
const getImage = (part) => async (req, res) => {
  try {
    const { member_id } = req.body;
    const [image] = await pool.query(`
      SELECT image_name FROM user_kyc_images 
      WHERE member_id = ? AND part = ?
    `, [member_id, part]);

    if (!image.length) return res.status(404).json({ error: 'Image not found' });

    const filePath = path.join(baseDir, part, image[0].image_name);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
};

router.post('/user-image', authenticateToken, getImage('user'));
router.post('/pancard-image', authenticateToken, getImage('pancard'));
router.post('/aadhar-front-image', authenticateToken, getImage('aadhar_front'));
router.post('/aadhar-back-image', authenticateToken, getImage('aadhar_back'));
router.post('/bank-image', authenticateToken, getImage('bank'));



// routes/kycRoutes.js
// routes/kycRoutes.js
// router.post('/getAllKycDetails', authenticateToken, async (req, res) => {
//   try {
//     const [users] = await pool.query(`
//       SELECT 
//         u.memberid,
//         ud.status AS user_status,
//         ud.FullName,
//         ud.Nominee_name,
//         ud.Nominee_relation,
//         pd.status AS pancard_status,
//         pd.PanCard_Number,
//         ad.status AS aadhar_status,
//         ad.Aadhar_Number,
//         bd.status AS bank_status,
//         bd.Bank_Name,
//         bd.IFSC_Code,
//         bd.Account_number,
//         uki_user.image_name AS user_image,
//         uki_pancard.image_name AS pancard_image,
//         uki_aadhar_front.image_name AS aadhar_front_image,
//         uki_aadhar_back.image_name AS aadhar_back_image,
//         uki_bank.image_name AS bank_image,
//         GREATEST(
//           COALESCE(ud.created_at, '1970-01-01'),
//           COALESCE(pd.created_at, '1970-01-01'),
//           COALESCE(ad.created_at, '1970-01-01'),
//           COALESCE(bd.created_at, '1970-01-01')
//         ) AS last_updated
//       FROM usersdetails u
//       LEFT JOIN user_details ud ON u.memberid = ud.member_id
//       LEFT JOIN pancard_details pd ON u.memberid = pd.member_id
//       LEFT JOIN aadhar_details ad ON u.memberid = ad.member_id
//       LEFT JOIN bank_details bd ON u.memberid = bd.member_id
//       LEFT JOIN user_kyc_images uki_user ON u.memberid = uki_user.member_id AND uki_user.part = 'user'
//       LEFT JOIN user_kyc_images uki_pancard ON u.memberid = uki_pancard.member_id AND uki_pancard.part = 'pancard'
//       LEFT JOIN user_kyc_images uki_aadhar_front ON u.memberid = uki_aadhar_front.member_id AND uki_aadhar_front.part = 'aadhar_front'
//       LEFT JOIN user_kyc_images uki_aadhar_back ON u.memberid = uki_aadhar_back.member_id AND uki_aadhar_back.part = 'aadhar_back'
//       LEFT JOIN user_kyc_images uki_bank ON u.memberid = uki_bank.member_id AND uki_bank.part = 'bank'
//       ORDER BY last_updated DESC
//     `);

//     const formattedUsers = users.map(user => {
//       const partsStatus = [
//         user.user_status,
//         user.pancard_status,
//         user.aadhar_status,
//         user.bank_status
//       ];

//       const overallStatus = partsStatus.every(s => s === 'approved') 
//         ? 'approved'
//         : partsStatus.every(s => !s) 
//           ? 'not done' 
//           : partsStatus.some(s => s === 'rejected') 
//             ? 'rejected' 
//             : 'pending';

//       return {
//         member_id: user.memberid,
//         overall_status: overallStatus,
//         last_updated: user.last_updated,
//         user_details: {
//           status: user.user_status || 'not_filled',
//           data: user.FullName ? {
//             FullName: user.FullName,
//             Nominee_name: user.Nominee_name,
//             Nominee_relation: user.Nominee_relation
//           } : null,
//           image: user.user_image || null
//         },
//         pancard_details: {
//           status: user.pancard_status || 'not_filled',
//           data: user.PanCard_Number ? { PanCard_Number: user.PanCard_Number } : null,
//           image: user.pancard_image || null
//         },
//         aadhar_details: {
//           status: user.aadhar_status || 'not_filled',
//           data: user.Aadhar_Number ? { Aadhar_Number: user.Aadhar_Number } : null,
//           images: {
//             front: user.aadhar_front_image || null,
//             back: user.aadhar_back_image || null
//           }
//         },
//         bank_details: {
//           status: user.bank_status || 'not_filled',
//           data: user.Bank_Name ? {
//             Bank_Name: user.Bank_Name,
//             IFSC_Code: user.IFSC_Code,
//             Account_number: user.Account_number
//           } : null,
//           image: user.bank_image || null
//         }
//       };
//     });

//     res.status(200).json({ status: 'success', data: formattedUsers });
//   } catch (error) {
//     console.error('Error fetching all KYC details:', error);
//     res.status(500).json({ status: 'error', message: 'Internal server error' });
//   }
// });
router.post('/getAllKycDetails', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.body.page, 10) || 1); // Default to page 1
    const limit = 10;
    const offset = (page - 1) * limit;

    // Get total user count
    const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM usersdetails');
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    // Fetch paginated users
    const [users] = await pool.query(`
      SELECT 
        u.memberid,
        ud.status AS user_status,
        ud.FullName,
        ud.Nominee_name,
        ud.Nominee_relation,
        pd.status AS pancard_status,
        pd.PanCard_Number,
        ad.status AS aadhar_status,
        ad.Aadhar_Number,
        bd.status AS bank_status,
        bd.Bank_Name,
        bd.IFSC_Code,
        bd.Account_number,
        uki_user.image_name AS user_image,
        uki_pancard.image_name AS pancard_image,
        uki_aadhar_front.image_name AS aadhar_front_image,
        uki_aadhar_back.image_name AS aadhar_back_image,
        uki_bank.image_name AS bank_image,
        GREATEST(
          COALESCE(ud.created_at, '1970-01-01'),
          COALESCE(pd.created_at, '1970-01-01'),
          COALESCE(ad.created_at, '1970-01-01'),
          COALESCE(bd.created_at, '1970-01-01')
        ) AS last_updated
      FROM usersdetails u
      LEFT JOIN user_details ud ON u.memberid = ud.member_id
      LEFT JOIN pancard_details pd ON u.memberid = pd.member_id
      LEFT JOIN aadhar_details ad ON u.memberid = ad.member_id
      LEFT JOIN bank_details bd ON u.memberid = bd.member_id
      LEFT JOIN user_kyc_images uki_user ON u.memberid = uki_user.member_id AND uki_user.part = 'user'
      LEFT JOIN user_kyc_images uki_pancard ON u.memberid = uki_pancard.member_id AND uki_pancard.part = 'pancard'
      LEFT JOIN user_kyc_images uki_aadhar_front ON u.memberid = uki_aadhar_front.member_id AND uki_aadhar_front.part = 'aadhar_front'
      LEFT JOIN user_kyc_images uki_aadhar_back ON u.memberid = uki_aadhar_back.member_id AND uki_aadhar_back.part = 'aadhar_back'
      LEFT JOIN user_kyc_images uki_bank ON u.memberid = uki_bank.member_id AND uki_bank.part = 'bank'
      ORDER BY last_updated DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Format response
    const formattedUsers = users.map(user => {
      const partsStatus = [
        user.user_status,
        user.pancard_status,
        user.aadhar_status,
        user.bank_status
      ];

      const overallStatus = partsStatus.every(s => s === 'approved') 
        ? 'approved'
        : partsStatus.every(s => !s) 
          ? 'not done' 
          : partsStatus.some(s => s === 'rejected') 
            ? 'rejected' 
            : 'pending';

      return {
        member_id: user.memberid,
        overall_status: overallStatus,
        last_updated: user.last_updated,
        user_details: {
          status: user.user_status || 'not_filled',
          data: user.FullName ? {
            FullName: user.FullName,
            Nominee_name: user.Nominee_name,
            Nominee_relation: user.Nominee_relation
          } : null,
          image: user.user_image || null
        },
        pancard_details: {
          status: user.pancard_status || 'not_filled',
          data: user.PanCard_Number ? { PanCard_Number: user.PanCard_Number } : null,
          image: user.pancard_image || null
        },
        aadhar_details: {
          status: user.aadhar_status || 'not_filled',
          data: user.Aadhar_Number ? { Aadhar_Number: user.Aadhar_Number } : null,
          images: {
            front: user.aadhar_front_image || null,
            back: user.aadhar_back_image || null
          }
        },
        bank_details: {
          status: user.bank_status || 'not_filled',
          data: user.Bank_Name ? {
            Bank_Name: user.Bank_Name,
            IFSC_Code: user.IFSC_Code,
            Account_number: user.Account_number
          } : null,
          image: user.bank_image || null
        }
      };
    });

    res.status(200).json({
      status: 'success',
      data: formattedUsers,
      pagination: {
        page,
        total_pages: totalPages,
        total_records: totalRecords
      }
    });

  } catch (error) {
    console.error('Error fetching KYC details:', error);
    res.status(200).json({ status: 'false', message: 'Internal server error' });
  }
});
module.exports = router;  