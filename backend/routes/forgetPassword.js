const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const {sendOtpEmail} = require('../utills/sendOtpMail');

// console.log(sendOtpEmail("UP100070"));





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