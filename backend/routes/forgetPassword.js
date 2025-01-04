const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const {sendOtpEmail,verifyOtp} = require('../utills/sendOtpMail');

// console.log(sendOtpEmail("UP100070"));
// console.log(verifyOtp("UP100070","123456"));
// (async () => {
//     try {
//         // const sendResult = await sendOtpEmail("UP100070");
//         // console.log("Send OTP result:", sendResult);

//         const verifyResult = await verifyOtp("UP100070", "844270");
//         console.log("Verify OTP result:", verifyResult);
//     } catch (error) {
//         console.error("Error:", error);
//     }
// })();

// (async () => {
//     try {
//         const sendResult = await sendOtpEmail("UP100070");
//         console.log("Send OTP result:", sendResult);

//         // const verifyResult = await verifyOtp("UP100070", "706242");
//         // console.log("Verify OTP result:", verifyResult);
//     } catch (error) {
//         console.error("Error:", error);
//     }
// })();

// Route to send OTP
router.post("/send-otp", async (req, res) => {
    const { member_id } = req.body;

    if (!member_id) {
        return res.status(400).json({ success: false, message: "Member ID is required" });
    }

    try {
        const result = await sendOtpEmail(member_id);
        res.status(200).json({ success: true, message: "OTP sent successfully", result });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP", error });
    }
});

// Route to verify OTP
router.post("/verify-otp", async (req, res) => {
    const { member_id, otp } = req.body;

    if (!member_id || !otp) {
        return res.status(400).json({ success: false, message: "Member ID and OTP are required" });
    }

    try {
        const isValid = await verifyOtp(member_id, otp);
        console.log("isValid:", isValid?.success);
        if (isValid?.success===true && isValid?.message==="OTP verified successfully") {
            res.status(200).json({ success: true, message: "OTP verified successfully" });

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
        console.error("Error verifying OTP:", error);
        res.status(500).json({ success: false, message: "Failed to verify OTP", error });
    }
});






// Helper function to check for SQL injection
const containsSQLInjectionWords = (input) => {
    const sqlKeywords = [
      "SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "WHERE", "OR", "AND", "--", "#", "/\\*", "\\*/", ";", "=", "'", "\""
    ];
    const regex = new RegExp(sqlKeywords.join('|'), 'i');
    return regex.test(input);
  };
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


module.exports = router;