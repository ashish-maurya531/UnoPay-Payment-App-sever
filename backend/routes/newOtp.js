const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const {sendOtpEmail,verifyOtp,sendOtpRegister,verifyOtpForRegister,universalOtpEmailSender} = require('../utills/sendOtpMail');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');

// const authenticateToken = require('../middleware/auth');




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
        return res.status(200).json({ status: "false", message: `User  not registered` });
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


