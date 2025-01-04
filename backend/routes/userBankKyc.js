const express = require('express');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');

// Create directories if they don't exist
const baseDir = path.join(__dirname, 'user_kyc_images');
// Create base directory if it doesn't exist
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
const subDirs = ['kycPancard', 'kycAadharcardFront',"kycAadharcardBack",'kycPassbook', 'kycUserImage'];
subDirs.forEach((subDir) => {
  const dirPath = path.join(baseDir, subDir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});
// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Only .png, .jpg, and .jpeg formats are allowed!');
      error.code = 'INVALID_FILE_TYPE'; // Custom error code
      cb(error, false);
    }
  },
});

// Error handling middleware
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ status: 'false', message:"123",error: err.message });
  } else if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ status: 'false', message:"12222",error: err.message });
  }
  next(err);
};


router.post('/submitUserBankKycDetails', 
  upload.fields([
    { name: 'kycPancard', maxCount: 1 },
    { name: 'kycAadharcardFront', maxCount: 1 },
    { name: 'kycAadharcardBack', maxCount: 1 },
    { name: 'kycUserImage', maxCount: 1 },
    { name: 'kycPassbook', maxCount: 1 }
  ]), 
  async (req, res) => {
    const { member_id, FullName, IFSC_Code, Bank_Name, Account_number, Aadhar_Number, PanCard_Number, Nominee_name,Nominee_relation } = req.body;
    console.log(member_id, IFSC_Code, Bank_Name, Account_number, PanCard_Number, Nominee_name);
    // Check if required fields are provided
    if (!member_id || !FullName || !IFSC_Code || !Bank_Name || !Account_number || !Aadhar_Number || !PanCard_Number || !Nominee_name||!Nominee_relation) {
      return res.status(404).json({ status: 'false', message:"1", error: 'All required fields must be provided.' });
    }

    const checktheData = [member_id, FullName, IFSC_Code, Bank_Name, Account_number, Aadhar_Number, PanCard_Number, Nominee_name,Nominee_relation].join(' ');
    if (containsSQLInjectionWords(checktheData)) {
      return res.status(400).json({ status: "false", message:"2", error: "Don't try to hack." });
    }

    try {
      // Check if member_id exists in usersdetails table
      const [userRows] = await pool.query(
        `SELECT memberid FROM usersdetails WHERE memberid = ?`,
        [member_id]
      );
      console.log(userRows);
      console.log(member_id);

      if (userRows.length === 0) {
        return res.status(404).json({ status: 'false', message:"4", error: 'Invalid member ID.' });
      }

      // Check if user has already submitted bank kyc details and kyc status is pending 
      const [bankKycRows] = await pool.query(
        `SELECT member_id, kyc_status FROM user_bank_kyc_details WHERE member_id = ?`,
        [member_id]
      );
      console.log(bankKycRows);

      const kyc_status = bankKycRows.map(item => item.kyc_status);
      console.log(kyc_status);

      if (bankKycRows.length > 0) {
        if (kyc_status.includes("approved")) {
          return res.status(400).json({
            status: 'false',
            KycStatus: "approved",
            message: "User has already been approved."
          });
        }

        if (kyc_status.includes("pending")) {
          return res.status(400).json({
            status: 'false',
            KycStatus: "pending",
            message: "User has already filled bank and kyc details."
          });
        }
      }

      // If there is a rejected request, then delete that row and images before submitting the new request
      if (kyc_status.includes("rejected")) {
        try {
          await pool.query(`DELETE FROM user_bank_kyc_details WHERE member_id = ? AND Kyc_status = 'rejected'`, [member_id]);
        } catch (err) {
          console.error("Error deleting rejected request:", err);
          return res.status(500).json({ status: 'false', message: "Error deleting rejected request." });

        }
      }
      //     // Delete the row from user_kyc_images
      //     const [imageRows] = await pool.query(
      //       `SELECT * FROM user_kyc_images WHERE member_id = ?`,
      //       [member_id]
      //     );

      //     if (imageRows.length > 0) {
      //       // Delete associated image files
      //       const baseDir = path.join(__dirname, 'user_kyc_images');
      //       const subDirs = ['kycPassbook', 'kycPancard', 'kycAadharcardFront', 'kycAadharcardBack', 'kycUserImage'];
      //       const imagePaths = [
      //         imageRows[0].passbook_image,
      //         imageRows[0].pancard_image,
      //         imageRows[0].aadhar_front_image,
      //         imageRows[0].aadhar_back_image,
      //         imageRows[0].user_image
      //       ];
      //       // Delete associated image files
      //       imagePaths.forEach((image, index) => {
      //         if (image) {
      //           const filePath = path.join(baseDir, subDirs[index], image);
      //           if (fs.existsSync(filePath)) {
      //             try {
      //               fs.unlinkSync(filePath); // Delete the file
      //               console.log(`Deleted file: ${filePath}`);
      //             } catch (err) {
      //               console.error(`Failed to delete file ${filePath}:`, err);
      //             }
      //           } else {
      //             console.warn(`File not found: ${filePath}`);
      //           }
      //         }
      //       });
      //     }

      //     await pool.query(`DELETE FROM user_kyc_images WHERE member_id = ?`, [member_id]);
      //   } catch (err) {
      //     console.error("Error deleting rejected request:", err);
      //     return res.status(500).json({ status: 'false', message:"5", error: 'Error deleting rejected request.' });
      //   }
      // }

      // Insert user bank KYC details into the database
      await pool.query(
        `INSERT INTO user_bank_kyc_details (member_id, FullName, IFSC_Code, Bank_Name, Account_number, Aadhar_Number, PanCard_Number, Nominee_name, Nominee_relation,Kyc_status, Kyc_message, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, 'pending', 'not done', NOW())`,
        [member_id, FullName, IFSC_Code, Bank_Name, Account_number, Aadhar_Number, PanCard_Number, Nominee_name,Nominee_relation]
      );

      // Save files and get paths
      const filePaths = {};
      for (const [fieldName, files] of Object.entries(req.files)) {
        const file = files[0];
        const uniqueName = `${fieldName}-${Date.now()}-${Math.floor(Math.random() * 100000)}${path.extname(file.originalname)}`;
        const filePath = path.join(baseDir, fieldName, uniqueName);

        fs.writeFileSync(filePath, file.buffer);
        filePaths[fieldName] = uniqueName;
      }

      // Insert KYC images into the database
      await pool.query(
        `INSERT INTO user_kyc_images (member_id, passbook_image, pancard_image, aadhar_front_image, aadhar_back_image, user_image) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          member_id,
          filePaths?.kycPassbook || null,
          filePaths?.kycPancard || null,
          filePaths?.kycAadharcardFront || null,
          filePaths?.kycAadharcardBack || null,
          filePaths?.kycUserImage || null
        ]
      );

      res.status(201).json({
        status: 'true',
        message: 'Bank and KYC details and images uploaded successfully.',
        data: {
          member_id,
          filePaths,
        },
      });
    } catch (error) {
      console.error('Error submitting KYC details:', error);
      res.status(500).json({ status: 'false', message:"7", error: 'Internal server error.' });
    }
  });

router.use(handleMulterErrors);


//get kyc status and message
router.post('/userkycstatus',async (req,res) => {
    const {member_id} = req.body;
    console.log("kyc page status",member_id);
    //check member id not empty
    if (!member_id) {
        return res.status(400).json({ status: 'false', error: 'Member ID is empty'})
    }

    //check sql injection
    if (containsSQLInjectionWords(member_id)) {
        return res.status(400).json({ status: 'false', error: 'Don\'t try to hack.' });
    }
    try {
        //check if user exists or not 
        const [userRows] = await pool.query(`SELECT memberid FROM usersdetails WHERE memberid = ?`,[member_id]);
        if (userRows.length === 0) {
          return res.status(400).json({ status: 'false', error: 'Member ID does not exist.' });
        }
        if (userRows[0].memberid === member_id) {
        const [result] = await pool.query(`SELECT Kyc_status,Kyc_message FROM user_bank_kyc_details WHERE member_id = ?`,[member_id]);
          if(result.length === 0){
              return res.status(200).json({status: 'true', message: 'User has not submitted KYC details yet.'});
          }
        res.status(200).json({status: 'true', data: result[0]});
    }}
    catch (error) {
        console.error('Error checking user:', error);
        return res.status(500).json({ status: 'false', message:"8", error: 'Internal server error.' });
    }
    

    

});
// //update user kyc status
// router.post('/updateUserKycStatus',async (req,res)=>{
//     const {member_id,status,message} = req.body;
//     //check feilds are not empty
//    if (!member_id || !status || !message) {
//     return res.status(400).json({ status: 'false', error: 'Some fields is empty'})

//     }
//     //check sql injection
//     var input=[member_id,status,message].join(' ')
//     if (containsSQLInjectionWords(input)) {
//         return res.status(400).json({ status: 'false', error: 'Don\'t try to hack.' });
//     }
//     //ceck valid status
//     const validStatuses = ['approved', 'rejected'];
//     if (!validStatuses.includes(status)) {
//         return res.status(400).json({ status: 'false', error: 'Invalid status' });
//     }

//     //check for member
//     const [userRows] = await pool.query(
//         `SELECT memberid FROM usersdetails WHERE memberid = ?`,
//         [member_id]
//     );
//     if (userRows.length === 0) {
//         return res.status(404).json({ status: 'false', error: 'Invalid member ID.' });
//     }

//     try{
    
//         const [kycDetailsRows]= await pool.query(
//             'SELECT Kyc_status,Kyc_message from user_bank_kyc_details where member_id=?',[member_id]
//         )
//         console.log(kycDetailsRows);

//         if (kycDetailsRows.length===0){
//             return res.status(404).json({status: 'false', error: 'No details found'});
//         }

//         const {Kyc_status:currentStatus,Kyc_message}=kycDetailsRows[0];
//         console.log(currentStatus, Kyc_message);

//         if (currentStatus === 'approved' || currentStatus === 'rejected'){
//             return res.status(200).json({
//                 status:'true',
//                 currentKycStatus: currentStatus,
//                 message: currentStatus === "approved"
//                   ? "User has already been approved."
//                   : currentStatus === "rejected"
//                   ? "User has been rejected and has no current pending KYC request."
//                   : "Try Again"
//               });
//         }


//         const result = await pool.query(`UPDATE user_bank_kyc_details SET Kyc_status =?, Kyc_message =? WHERE member_id =?`,[status,
//             status==="approved" ? "done" : message,
//             member_id]);
//         if(result.affectedRows === 0){
//             return res.status(404).json({status: 'false', error: 'User not found'});
//         }
//         res.status(200).json({status: 'true', message: 'KYC status updated successfully'});

//     }
//     catch(err){
//         console.error('Error updating kyc status:', err);
//         res.status(500).json({status: 'false', error: 'Internal server error.'});
//     }

// })


// update user kyc status
router.post('/updateUserKycStatus', async (req, res) => {
  const { member_id, status, message } = req.body;
  
  // Check fields are not empty
  if (!member_id || !status || !message) {
    return res.status(400).json({ status: 'false', error: 'Some fields are empty' });
  }

  // Check for SQL injection
  var input = [member_id, status, message].join(' ');
  if (containsSQLInjectionWords(input)) {
    return res.status(400).json({ status: 'false', error: 'Don\'t try to hack.' });
  }

  // Check valid status
  const validStatuses = ['approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ status: 'false', error: 'Invalid status' });
  }

  // Check for member
  const [userRows] = await pool.query(
    `SELECT memberid FROM usersdetails WHERE memberid = ?`,
    [member_id]
  );
  if (userRows.length === 0) {
    return res.status(404).json({ status: 'false', error: 'Invalid member ID.' });
  }

  try {
    const [kycDetailsRows] = await pool.query(
      'SELECT Kyc_status, Kyc_message FROM user_bank_kyc_details WHERE member_id = ?',
      [member_id]
    );

    if (kycDetailsRows.length === 0) {
      return res.status(404).json({ status: 'false', error: 'No details found' });
    }

    const { Kyc_status: currentStatus, Kyc_message } = kycDetailsRows[0];

    // If the status is already approved or rejected, return a message
    if (currentStatus === 'approved' || currentStatus === 'rejected') {
      return res.status(200).json({
        status: 'true',
        currentKycStatus: currentStatus,
        message: currentStatus === 'approved'
          ? 'User has already been approved.'
          : currentStatus === 'rejected'
            ? 'User has been rejected and has no current pending KYC request.'
            : 'Try Again',
      });
    }

    // Update the KYC status
    const result = await pool.query(
      `UPDATE user_bank_kyc_details SET Kyc_status = ?, Kyc_message = ? WHERE member_id = ?`,
      [
        status,
        status === 'approved' ? 'done' : message,
        member_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'false', error: 'User not found' });
    }

    // If approved or rejected, delete images from user_kyc_images
  if (status === 'rejected' || status === 'approved') {
      // Delete the entry from the `user_kyc_images` table
      //     // Delete the row from user_kyc_images
          const [imageRows] = await pool.query(
            `SELECT * FROM user_kyc_images WHERE member_id = ?`,
            [member_id]
          );
      const [deleteImageResult] = await pool.query(
        `DELETE FROM user_kyc_images WHERE member_id = ?`,
        [member_id]
      );
      console.log(deleteImageResult);

      // Assuming the images are stored on the server's filesystem, delete the images
      if (deleteImageResult.affectedRows > 0) {
        if (imageRows.length > 0) {
          // Delete associated image files
          const baseDir = path.join(__dirname, 'user_kyc_images');
          const subDirs = ['kycPassbook', 'kycPancard', 'kycAadharcardFront', 'kycAadharcardBack', 'kycUserImage'];
          const imagePaths = [
            imageRows[0].passbook_image,
            imageRows[0].pancard_image,
            imageRows[0].aadhar_front_image,
            imageRows[0].aadhar_back_image,
            imageRows[0].user_image
          ];
          // Delete associated image files
          imagePaths.forEach((image, index) => {
            if (image) {
              const filePath = path.join(baseDir, subDirs[index], image);
              if (fs.existsSync(filePath)) {
                try {
                  fs.unlinkSync(filePath); // Delete the file
                  console.log(`Deleted file: ${filePath}`);
                } catch (err) {
                  console.error(`Failed to delete file ${filePath}:`, err);
                }
              } else {
                console.warn(`File not found: ${filePath}`);
              }
            }
          });
        }
      }
    }

    res.status(200).json({ status: 'true', message: 'KYC status updated successfully' });

  } catch (err) {
    console.error('Error updating KYC status:', err);
    res.status(500).json({ status: 'false', error: 'Internal server error.' });
  }
});


//get all users bank and kyc details 
router.get('/bankkycDetails/All', async (req, res)=>{
    try{
        const [results] = await pool.query('SELECT * FROM user_bank_kyc_details');
        res.status(200).json({status: 'true', data: results});

    }
    catch(err){
        console.error('Error fetching kyc details:', err);
        res.status(500).json({status: 'false', error: 'Internal server error.'});
    }
    
})

//get single user bank and kyc details 
router.post('/bankkycDetails/user', async (req, res)=>{
    const {member_id} = req.body;
    //check member id not empty
    if (!member_id) {
        return res.status(400).json({ status: 'false', error: 'Member ID is empty'})
    
    }
    //check sql injection
    if (containsSQLInjectionWords(member_id)) {
        return res.status(400).json({ status: 'false', error: 'Don\'t try to hack.' });
    }
    try{
    const [result] = await pool.query(`SELECT * FROM user_bank_kyc_details WHERE member_id = ?`,[member_id]);
    if(result.length === 0){
        return res.status(404).json({status: 'false', error: 'User not registered'});
    }
    res.status(200).json({status: 'true', data: result[0]});
    }
    catch(err){
        console.error('Error fetching kyc details:', err);
        res.status(500).json({status: 'false', error: 'Internal server error.'});
    }

})


// API to fetch passbook image
router.post('/getPassbookImage', async (req, res) => {
  const { member_id } = req.body;

  if (!member_id) {
      return res.status(400).json({ status: "error", message: "Member ID is required" });
  }
  //check sql injection
  if (containsSQLInjectionWords(member_id)) {
      return res.status(400).json({ status: "error", message: "Don't try to hack." });
  }

  try {
      const [rows] = await pool.query(
          'SELECT passbook_image FROM user_kyc_images WHERE member_id = ?',
          [member_id]
      );

      if (rows.length === 0) {
          return res.status(404).json({ status: "error", message: "Member ID not found" });
      }

      const filePath = path.join(__dirname, 'user_kyc_images', 'kycPassbook', rows[0].passbook_image);
      console.log(filePath);
      if (!fs.existsSync(filePath)) {
          return res.status(404).json({ status: "error", message: "Passbook image not found" });
      }

      res.sendFile(filePath);
  } catch (error) {
      console.error('Error fetching passbook image:', error);
      res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// API to fetch pancard image
router.post('/getPancardImage', async (req, res) => {
  const { member_id } = req.body;

  if (!member_id) {
      return res.status(400).json({ status: "error", message: "Member ID is required" });
  }
  //check sql injection
  if (containsSQLInjectionWords(member_id)) {
      return res.status(400).json({ status: "error", message: "Don't try to hack." });
  }

  try {
      const [rows] = await pool.query(
          'SELECT pancard_image FROM user_kyc_images WHERE member_id = ?',
          [member_id]
      );

      if (rows.length === 0) {
          return res.status(404).json({ status: "error", message: "Member ID not found" });
      }

      const filePath = path.join(__dirname, 'user_kyc_images', 'kycPancard', rows[0].pancard_image);
      console.log(filePath);

      if (!fs.existsSync(filePath)) {
          return res.status(404).json({ status: "error", message: "Pancard image not found" });
      }

      res.sendFile(filePath);
  } catch (error) {
      console.error('Error fetching pancard image:', error);
      res.status(500).json({ status: "error", message: "Internal server error" });
  }
});
// API to fetch aadhar front image
router.post('/getAadharcardFrontImage', async (req, res) => {
  const { member_id } = req.body;
  if (!member_id) {
    return res.status(400).json({ status: "error", message: "Member ID is required" });
  }
  //check sql injection
  if (containsSQLInjectionWords(member_id)) {
    return res.status(400).json({ status: "error", message: "Don't try to hack." });
  }


  try {
    const [rows] = await pool.query(
      'SELECT aadhar_front_image FROM user_kyc_images WHERE member_id = ?',
      [member_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Aadhar front image not found" });
    }

    const filePath = path.join(__dirname, 'user_kyc_images', 'kycAadharcardFront', rows[0].aadhar_front_image);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: "error", message: "Aadhar front image not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error fetching aadhar front image:', error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// API to fetch aadhar back image
router.post('/getAadharcardBackImage', async (req, res) => {
  const { member_id } = req.body;
  if (!member_id) {
    return res.status(400).json({ status: "error", message: "Member ID is required" });
  }
  //check sql injection
  if (containsSQLInjectionWords(member_id)) {
    return res.status(400).json({ status: "error", message: "Don't try to hack." });
  }


  try {
    const [rows] = await pool.query(
      'SELECT aadhar_back_image FROM user_kyc_images WHERE member_id = ?',
      [member_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Aadhar back image not found" });
    }

    const filePath = path.join(__dirname, 'user_kyc_images', 'kycAadharcardBack', rows[0].aadhar_back_image);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: "error", message: "Aadhar back image not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error fetching aadhar back image:', error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// API to fetch user image
router.post('/getUserImage', async (req, res) => {
  const { member_id } = req.body;

  if (!member_id) {
      return res.status(400).json({ status: "error", message: "Member ID is required" });
  }

  //check sql injection
  if (containsSQLInjectionWords(member_id)) {
      return res.status(400).json({ status: "error", message: "Don't try to hack." });
  }
  try {
      const [rows] = await pool.query(
          'SELECT user_image FROM user_kyc_images WHERE member_id = ?',
          [member_id]
      );

      if (rows.length === 0) {
          return res.status(404).json({ status: "error", message: "Member ID not found" });
      }

      const filePath = path.join(__dirname, 'user_kyc_images', 'kycUserImage', rows[0].user_image);
      console.log(filePath);

      if (!fs.existsSync(filePath)) {
          return res.status(404).json({ status: "error", message: "User image not found" });
      }

      res.sendFile(filePath);
  } catch (error) {
      console.error('Error fetching user image:', error);
      res.status(500).json({ status: "error", message: "Internal server error" });
  }
});
module.exports = router;
