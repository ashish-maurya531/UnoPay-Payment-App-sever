const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const {sendOtpEmail,verifyOtp,sendOtpRegister,verifyOtpForRegister,universalOtpEmailSender} = require('../utills/sendOtpMail');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');



// Route to send OTP
router.post("/send-otp", async (req, res) => {
    const { identifier } = req.body;

    if (!identifier) {
        return res.status(200).json({ success: false, message: "Fields is required" });
    }
    if (containsSQLInjectionWords(identifier)) {
        return res.status(200).json({ success: false, message: "Don't try to hack." });
    }
    // Check for member existence
    const [userRows] = await pool.query(
        'SELECT memberid ,phoneno,email FROM usersdetails WHERE memberid = ? OR email = ? OR phoneno = ?',
        [identifier, identifier, identifier]
      );
      // console.log(userRows)
  
      if (userRows.length === 0) {
        return res.status(200).json({ status:"false",error: `User with is ${identifier} not registered` });
      }
      //extract member_id 
      const member_id = userRows[0].memberid;


    try {
        const result = await sendOtpEmail(member_id);
        res.status(200).json({ success: true, message: "OTP sent successfully", result });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP", error });
    }
});


/////////////////////////////////////////////////
//new send otp with its type
// Route to send OTP
router.post("/send-otp2", async (req, res) => {
    const { identifier, type } = req.body;
    console.log(identifier, type);

    // Check if identifier or type is missing
    if (!identifier || !type) {
        return res.status(200).json({ success: false, message: "Fields are required" });
    }

    // Check for SQL injection attempt
    if (containsSQLInjectionWords(identifier)) {
        return res.status(200).json({ success: false, message: "Don't try to hack." });
    }
    // Validate the type (only allow 'forget_password' or 'forget_tpin')
    const validTypes = ['forget_password', 'forget_tpin',"kyc"];
    if (!validTypes.includes(type)) {
        return res.status(200).json({ success: false, message: "Invalid type." });
    }


    // Check for user existence
    const [userRows] = await pool.query(
        'SELECT memberid, phoneno, email FROM usersdetails WHERE memberid = ? OR email = ? OR phoneno = ?',
        [identifier, identifier, identifier]
    );

    if (userRows.length === 0) {
        return res.status(200).json({ status: "false", error: `User  not registered` });
    }

    // Extract member_id
    const member_id = userRows[0].memberid;

    try {
        console.log(type+" for "+member_id)
        const result = await universalOtpEmailSender(member_id, type);
        res.status(200).json({ success: true, message: "OTP sent successfully", result });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP", error });
    }
});



/////////////////////////////////////////////////

// Route to verify OTP
router.post("/verify-otp", async (req, res) => {
    const { member_id, otp } = req.body;

    if (!member_id || !otp) {
        return res.status(200).json({ success: false, message: "Member ID and OTP are required" });
    }
    if (containsSQLInjectionWords(member_id + otp)) {
        return res.status(200).json({ success: false, message: "Don't try to hack." });
    }

    try {
        const isValid = await verifyOtp(member_id, otp);
        console.log("isValid:", isValid?.success);
        if (isValid?.success===true && isValid?.message==="OTP verified successfully") {
            res.status(200).json({ success: true, message: "OTP verified successfully" });

        }
        else if (isValid?.success===false && isValid?.message==="No otp request by this Member ID") {
            res.status(200).json({ success: false, message: "No otp request by this Member ID" });
        }
        else if(isValid?.success===false && isValid?.message==="OTP expired") {
            res.status(200).json({ success: false, message: "Otp expired" });

        } else if ( isValid?.success===false && isValid?.message==="Invalid OTP") {
            res.status(200).json({ success: false, message: "Invalid OTP" });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ success: false, message: "Failed to verify OTP", error });
    }
});


////////////////////////////////////////////////////////



// Route to send OTP for registration
router.post("/send-register-otp", async (req, res) => {
    const { identifier } = req.body;

    if (!identifier) {
        return res.status(200).json({ success: false, message: "Identifier (email) is required" });
    }

    if (containsSQLInjectionWords(identifier)) {
        return res.status(200).json({ success: false, message: "Invalid input detected. Do not try to hack." });
    }
    // check if email is already registered
    const [userRows] = await pool.query(
        'SELECT email FROM usersdetails WHERE email =?',
        [identifier]
    );
    if (userRows.length > 0) {
        return res.status(200).json({ success: false, message: "Email is already registered" });
    }

    try {
        const result = await sendOtpRegister(identifier);
        if (result.success) {
            res.status(200).json({ success: true, message: "OTP sent successfully", result });
        } else {
            res.status(500).json({ success: false, message: "Failed to send OTP", error: result.error });
        }
    } catch (error) {
        console.error("Error sending registration OTP:", error);
        res.status(500).json({ success: false, message: "An error occurred while sending OTP", error });
    }
});

// Route to verify OTP for registration
router.post("/verify-register-otp", async (req, res) => {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
        return res.status(200).json({ success: false, message: "Identifier and OTP are required" });
    }

    if (containsSQLInjectionWords(identifier + otp)) {
        return res.status(200).json({ success: false, message: "Invalid input detected. Do not try to hack." });
    }

    try {
        const isValid = await verifyOtpForRegister(identifier, otp);

        if (isValid.success) {
            res.status(200).json({ success: true, message: "OTP verified successfully" });
        } else {
            res.status(200).json({ success: false, message: isValid.message });
        }
    } catch (error) {
        console.error("Error verifying registration OTP:", error);
        res.status(500).json({ success: false, message: "An error occurred while verifying OTP", error });
    }
});

module.exports = router;



////////////////////////////////////////////////////////





//change password
router.post('/changeUserPassword', async (req, res) => {
    const { member_id,oldPassword, newPassword } = req.body;
    //check member id not empty
    if (!member_id || !oldPassword || !newPassword) {
        return res.status(400).json({ status: 'false', error: 'Some fields are empty'})

    }

    //sql injection check
    const checkthedata=[member_id,newPassword,oldPassword].join(" ");
    if (containsSQLInjectionWords(checkthedata)) {
        return res.status(400).json({ status: 'false', error: 'Don`t try to hack' });
    }

    //check old and new password are not same 
    if(oldPassword === newPassword){
        return res.status(400).json({ status: 'false', error: 'Old and new password cannot be same'});
    }
    //check for member present or not in security_details_of_user
    const [checkMember] = await pool.query(`SELECT * FROM security_details_of_user WHERE member_id =?`,[member_id]);
    if(checkMember.length === 0){
        return res.status(404).json({ status: 'false', error: 'Invalid member ID'});
    }
    console.log(checkMember)
    if (checkMember[0].password !== oldPassword){
        return res.status(401).json({ status: 'false', error: 'Old password is incorrect'});
    }
    // now update the password without hashing
    try{

        const updatePassword = await pool.query(`UPDATE security_details_of_user SET password = ? WHERE member_id=?`,[newPassword,member_id]);
        if(updatePassword.affectedRows === 0){
            return res.status(404).json({ status: 'false', error: 'Failed to update password'});
        }
        res.status(200).json({ status: 'true', message: 'Password updated successfully'});
    }
    catch(err){
        console.error('Error updating password:', err);
        res.status(500).json({ status: 'false', error: 'Internal server error.'});
    }
   
 
});    
    


//change password
router.post('/changeUserTpin', async (req, res) => {
    const { member_id,oldtpin, newtpin } = req.body;
    //check member id not empty
    if (!member_id || !oldtpin || !newtpin) {
        return res.status(400).json({ status: 'false', error: 'Some fields are empty'})

    }

    //check old and new tpin are not same 
    if(oldtpin === newtpin){
        return res.status(400).json({ status: 'false', error: 'Old and new tpin cannot be same'});
    }

    //sql injection check
    const checkthedata=[member_id,newtpin,oldtpin].join(" ");
    if (containsSQLInjectionWords(checkthedata)) {
        return res.status(400).json({ status: 'false', error: 'Don`t try to hack' });
    }
    //check for member present or not in security_details_of_user
    const [checkMember] = await pool.query(`SELECT * FROM security_details_of_user WHERE member_id =?`,[member_id]);
    if(checkMember.length === 0){
        return res.status(404).json({ status: 'false', error: 'Invalid member ID'});
    }
    if (checkMember[0].tpin !== oldtpin){
        return res.status(401).json({ status: 'false', error: 'Old tpin is incorrect'});
    }
    // now update the tpin without hashing
    try{

        const updatetpin = await pool.query(`UPDATE security_details_of_user SET tpin = ? WHERE member_id=?`,[newtpin,member_id]);
        if(updatetpin.affectedRows === 0){
            return res.status(404).json({ status: 'false', error: 'Failed to update tpin'});
        }
        res.status(200).json({ status: 'true', message: 'tpin updated successfully'});
    }
    catch(err){
        console.error('Error updating tpin:', err);
        res.status(500).json({ status: 'false', error: 'Internal server error.'});
    }
   
 
});  




// Route to reset password after OTP verification
router.post('/forgetPassword', async (req, res) => {
    const { identifier, newPassword, otp } = req.body;

    // Validate input fields
    if (!identifier || !newPassword || !otp) {
        return res.status(400).json({ status: 'false', error: 'Some fields are empty' });
    }

    // Check for SQL injection attempts
    const checkthedata = [identifier, newPassword, otp].join(" ");
    if (containsSQLInjectionWords(checkthedata)) {
        return res.status(400).json({ status: 'false', error: 'Don’t try to hack' });
    }
      // Check for member existence
      const [userRows] = await pool.query(
        'SELECT memberid ,phoneno,email FROM usersdetails WHERE memberid = ? OR email = ? OR phoneno = ?',
        [identifier, identifier, identifier]
      );
      // console.log(userRows)
  
      if (userRows.length === 0) {
        return res.status(404).json({ status:"false",error: 'User not registered' });
      }
      //extract member_id 
      const member_id = userRows[0].memberid;
     

    // Verify OTP
    try {
        const isValid = await verifyOtp(member_id, otp);
        console.log("isValid:", isValid?.success);
        if (isValid?.success===true && isValid?.message==="OTP verified successfully") {
            // Update password
            const updatePassword = await pool.query(`UPDATE security_details_of_user SET password = ? WHERE member_id=?`, [newPassword, member_id]);
            if (updatePassword.affectedRows === 0) {
                return res.status(404).json({ status: 'false', error: 'Failed to update password' });
            }
            res.status(200).json({ status: 'true', message: 'Password updated successfully' });
    

        }
        else if (isValid?.success===false && isValid?.message==="No otp request by this Member ID") {
            res.status(404).json({ success: false, message: "No otp request by this Member ID" });
        }
        else if(isValid?.success===false && isValid?.message==="OTP expired") {
            res.status(400).json({ success: false, message: "Otp expired" });

        } else if ( isValid?.success===false && isValid?.message==="Invalid OTP") {
            res.status(400).json({ success: false, message: "Invalid OTP" });
        }
        
      

        
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ status: 'false', error: 'Internal server error.' });
    }
});

// Route to reset TPin after OTP verification
router.post('/forgetTpin', async (req, res) => {
    const { member_id, newTpin, otp } = req.body;

    // Validate input fields
    if (!member_id || !newTpin || !otp) {
        return res.status(400).json({ status: 'false', error: 'Some fields are empty' });
    }

    // Check for SQL injection attempts
    const checkthedata = [member_id, newTpin, otp].join(" ");
    if (containsSQLInjectionWords(checkthedata)) {
        return res.status(400).json({ status: 'false', error: 'Don’t try to hack' });
    }
    // Check for member existence
    const [checkMember] = await pool.query(`SELECT * FROM security_details_of_user WHERE member_id =?`, [member_id]);
    if (checkMember.length === 0) {
        return res.status(404).json({ status: 'false', error: 'Invalid member ID' });
    }

    // Verify OTP
    try {
        const isValid = await verifyOtp(member_id, otp);
        console.log("isValid:", isValid?.success);
        if (isValid?.success===true && isValid?.message==="OTP verified successfully") {
            // Update password
            const updateTpin = await pool.query(`UPDATE security_details_of_user SET tpin = ? WHERE member_id=?`, [newTpin, member_id]);
            if (updateTpin.affectedRows === 0) {
                res.status(404).json({ status: 'false', error: 'Failed to update tpin' });
            }
            res.status(200).json({ status: 'true', message: 'TPin updated successfully' });

           

        }
        else if (isValid?.success===false && isValid?.message==="No otp request by this Member ID") {
            res.status(404).json({ success: false, message: "No otp request by this Member ID" });
        }
        else if(isValid?.success===false && isValid?.message==="OTP expired") {
            res.status(400).json({ success: false, message: "Otp expired" });

        } else if ( isValid?.success===false && isValid?.message==="Invalid OTP") {
            res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        

       

    } catch (error) {
        console.error('Error resetting TPin:', error);
        res.status(500).json({ status: 'false', error: 'Internal server error.' });
    }
});





module.exports = router;