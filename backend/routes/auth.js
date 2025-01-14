const express = require('express');
const { pool } = require('../config/database');
const axios = require('axios');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {sendWelcomeEmail,universalOtpEmailSender,verifyOtp} = require('../utills/sendOtpMail');

// // admin login jwt 
// router.post('/adminLogin2', async (req, res) => {
//   const { name, password } = req.body;
  
//   try {
//     const [rows] = await pool.query('SELECT * FROM admin WHERE name = ? LIMIT 1', [name]);
    
//     if (rows.length === 0) {
//       return res.status(401).json({ error: 'Invalid credentials1' });
//     }
    
//     const admin = rows[0];
//     const isPasswordValid = (password===admin.password)

    
//     if (!isPasswordValid) {
//       return res.status(401).json({ error: 'Invalid credentials2' });
//     }
    
//     // Generate JWT token
//     const token = jwt.sign({ adminName:admin?.name,adminPass:admin?.password }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
//     res.json({ message: 'Admin logged in successfully', token });
//   } catch (error) {
//     console.error('Admin login error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });



//

// // Admin Login
// router.post('/adminLogin', async (req, res) => {
//   const { name, password } = req.body;
//   console.log(name, password);
  
//   // Validate inputs
//   if (containsSQLInjectionWords(name) || containsSQLInjectionWords(password)) {
//     return res.status(400).json({ error: "Don't try to hack." });
//   }


//   try {
//     const [rows] = await pool.query('SELECT * FROM admin WHERE name = ? AND password = ?', [name, password]);

//     if (rows.length === 0) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const admin = rows[0];
//     res.json({ message: 'Admin logged in successfully', adminId: admin.id });
//   } catch (error) {
//     console.error('Admin login error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });


///////////////////////

// Function to update member hierarchy
const updateMemberHierarchy = async (newMember, upline) => {
  try {
    // Get kro existing hierarchy of the upline
    const [uplineHierarchy] = await pool.query(
      'SELECT super_upline, upline, level FROM member_hierarchy WHERE member = ?',
      [upline]
    );

    
    await pool.query(
      'INSERT INTO member_hierarchy (super_upline, upline, member, level) VALUES (?, ?, ?, ?)',
      [upline, upline, newMember, 1]
    );

    for (const row of uplineHierarchy) {
      if (row.level < 20) {
        await pool.query(
          'INSERT INTO member_hierarchy (super_upline, upline, member, level) VALUES (?, ?, ?, ?)',
          [row.super_upline, upline, newMember, row.level + 1]
        );
      }
    }
  } catch (error) {
    console.error('Error updating member hierarchy:', error);
  }
};
// Add a new member
router.post('/addmember', async (req, res) => {
  const { newMember, upline } = req.body;
console.log(newMember, upline);
  try {
  
    const [uplineCheck] = await pool.query('SELECT member FROM member_hierarchy WHERE upline = ? or member=? ', [upline,upline]);
    if (uplineCheck.length === 0) {
      return res.status(400).json({ error: 'Invalid upline' });
    }

    await updateMemberHierarchy(newMember, upline);

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/////////////
// async function getDatafromMembertable(){
//   const [rows] = await pool.query('SELECT * FROM member');
//   console.log(rows)
//   // Perform API calls to get data from Membertable
//   // and return the data in the required format
//   // for elements of rows run /addmember api
//   // for elements of rows run /addmember api
//   // for elements of rows run /addmember api
//   // for elements of rows run /addmember ap
//   for (let i = 0; i < rows.length; i++) {
//     const response = await axios.post('http://localhost:3000/api/auth/addmember', {
//       newMember: rows[i].member_id,
//       upline: rows[i].sponser_id
//       });
//     console.log(response.data);
//   }

    
// }

// do not run this function directly

// getDatafromMembertable();

///////




//////////////////

// Get list of member hierarchy
router.get('/getlist', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM member_hierarchy ORDER BY member,level');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching member hierarchy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});






/////////////////////







const checkSponserId = async (id) => {
  try {
    // Query to check if the id exists in either sponser_id or member_id
    const query = `SELECT 1 FROM member WHERE sponser_id = ? OR member_id = ? LIMIT 1`;
    const [rows] = await pool.query(query, [id, id]);

    // If the query returns a row, the id exists
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking sponsor ID:', error);
    throw error; // Re-throw the error for the caller to handle
  }
};
router.post('/checkSponserId', async(req, res) => {
  const { sponser_id } = req.body;
  //check for sql injection using function imported
  if (containsSQLInjectionWords(sponser_id)) {
    return res.status(400).json({ error: "Don't try to hack." });
  }
  console.log("check this  "+sponser_id);
  try {
    const isSponserIdValid = await checkSponserId(sponser_id);
    var sponserName=[{ username: 'Invalid Sponsor Id' }]
    if (isSponserIdValid){
       [sponserName] = await pool.query('SELECT username FROM usersdetails WHERE memberid =?',[sponser_id])
    }
   
    console.log("Checking",isSponserIdValid,sponserName[0].username);
    res.json({ isValid: isSponserIdValid,
      sponserName: sponserName[0].username
    });
  } catch (error) {
    console.error('Error checking sponsor ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// // User Registration
// router.post('/register', async (req, res) => {
//     const { sponser_id,phoneno,username, email,password,tpin } = req.body;

//     const containsSQLInjectionWords = (input) => {
//       const sqlKeywords = [
//         "SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "WHERE", "OR", "AND", "--", "#", "/\\*", "\\*/", ";", "=", "'", "\""
//       ];
//       const regex = new RegExp(sqlKeywords.join('|'), 'i');
//       console.log(regex.test(input));
//       return regex.test(input);
//     };
  
  
  
  
//     // Validate inputs
//     const checktheData = [sponser_id, phoneno, username, email, password, tpin].join('');
//     console.log(checktheData);
//     if (containsSQLInjectionWords(checktheData)){
//       return res.status(400).json({ error: "Don't try to hack." });
//     }
//     let connection;
  
//     try {
//       // Get a connection from the pool
//       connection = await pool.getConnection();
//       await connection.beginTransaction();
//       checkSponserId(sponser_id);
  
//       // Fetch the maximum ID from the table
//       const [maxIdResult] = await connection.query('SELECT MAX(id) AS maxId FROM useridcollection');
//       const maxId = maxIdResult[0]?.maxId;
  
//       if (!maxId) {
//         throw new Error('No IDs available in the collection');
//       }
  
//       let assignedId;
//       let isIdFound = false;
  
//       while (!isIdFound) {
//         const randomId = Math.floor(Math.random() * maxId) + 1;
  
//         const [idCheck] = await connection.query(
//           'SELECT pregenerated_ids, used FROM userIdCollection WHERE id = ? FOR UPDATE',
//           [randomId]
//         );
  
//         if (idCheck.length && idCheck[0].used === 'false') {
//           assignedId = idCheck[0].pregenerated_ids;
  
//           await connection.query(
//             'UPDATE useridcollection SET used = "true" WHERE pregenerated_ids = ?',
//             [assignedId]
//           );
  
//           isIdFound = true;
//         }
//       }
  
//       // Insert the new user with the assigned ID
//       await connection.query(
//         'INSERT INTO usersdetails (memberid,phoneno, username, email, password, tpin) VALUES (?, ?, ?, ?, ?, ?)',
//         [assignedId, phoneno,username, email,password, tpin]
//       );

//       await connection.query(
//         'INSERT INTO security_details_of_user (member_id,password, tpin) VALUES (?, ?, ?)',
//         [assignedId,password, tpin]
//       );


//       await connection.query(
//         'INSERT INTO member (sponser_id,member_id) VALUES (?, ?)',
//         [sponser_id,assignedId]
//       );
  
   
//       await connection.commit();
  
//       res.status(201).json({
//         message: 'User registered successfully',
//         userId: assignedId,
//       });
//     } catch (error) {
//       console.error('User registration error:', error);
  
//       // Rollback the transaction on error
//       if (connection) await connection.rollback();
  
//       if (error.code === 'ER_DUP_ENTRY') {
//                 res.status(400).json({ error: 'Username or email already exists' });
//               } else {
//                 res.status(500).json({ error: 'Internal server error' });
//               }
//             } finally {
//               // Release the connection back to the pool
//               if (connection) connection.release();
//             }
//           });


/////////////////////////////////////


 // Import axios for making HTTP requests

router.post('/register', async (req, res) => {
  const { sponser_id, phoneno, username, email, password, tpin } = req.body;
  // Validate inputs
  const checktheData = [sponser_id, phoneno, username, email, password, tpin].join(' ');
  console.log(checktheData);
  if (containsSQLInjectionWords(checktheData)) {
    return res.status(200).json({ status: "false", error: "Don't try to hack." });
  }
  if (password === "" || tpin === "" || username === "" || email === "" || phoneno == "") {
    console.log("khali feild mat bhej ")
    return res.status(200).json({ status: "false", error: "Fields cannot be empty." });
  }
  if (sponser_id.length != 8) {
    console.log("sponser id 8 char se choti mat bhej ")
    return res.status(200).json({ status: "false", error: "Sponser ID must be 8 characters long." });
  }
  if (!/^\d{10}$/.test(phoneno)) {
    console.log("phoneno 10 char se chota mat bhej ")
    return res.status(200).json({ status: "false", error: "Phone number must be 10 digits long." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log("email invalid mat bhej ")
    return res.status(200).json({ status: "false", error: "Invalid email address." });
  }
  if (!/^\d{4}$/.test(tpin)) {
    console.log("tpin 4 char se chota mat bhej ")
    return res.status(200).json({ status: "false", error: "TPIN must be 4 digits long." });
  }
  //check sponser id 
  const isSponserIdValid = await checkSponserId(sponser_id);
  if (!isSponserIdValid) {
    console.log("sponser id invalid mat bhej ")
    return res.status(200).json({ status: "false", error: "Invalid sponser ID." });
  }

 // Check if phoneno or email is already used in the usersdetails table
const [isUsed] = await pool.query(
  `SELECT phoneno, email FROM usersdetails WHERE phoneno = ? OR email = ?`,
  [phoneno, email]
);

// Initialize flags for used fields
let phoneUsed = false;
let emailUsed = false;

if (isUsed.length > 0) {
 
  isUsed.forEach((row) => {
    if (row.phoneno === phoneno) phoneUsed = true;
    if (row.email === email) emailUsed = true;
  });

  
  let errorMessage = '';
  if (phoneUsed && emailUsed) {
    errorMessage = "Phone number and email are already used.";
  } else if (phoneUsed) {
    errorMessage = "Phone number is already used.";
  } else if (emailUsed) {
    errorMessage = "Email is already used.";
  }

  console.log("Phone number or email already used.");
  return res.status(200).json({ status: "false", error: errorMessage });
}





  let connection;

  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Fetch the maximum ID from the table
    const [maxIdResult] = await connection.query('SELECT MAX(id) AS maxId FROM useridcollection');
    const maxId = maxIdResult[0]?.maxId;

    if (!maxId) {
      throw new Error('No IDs available in the collection');
    }

    let assignedId;
    let isIdFound = false;

    while (!isIdFound) {
      const randomId = Math.floor(Math.random() * maxId) + 1;

      const [idCheck] = await connection.query(
        'SELECT pregenerated_ids, used FROM useridcollection WHERE id = ? FOR UPDATE',
        [randomId]
      );

      if (idCheck.length && idCheck[0].used === 'false') {
        assignedId = idCheck[0].pregenerated_ids;

        await connection.query(
          'UPDATE useridcollection SET used = "true" WHERE pregenerated_ids = ?',
          [assignedId]
        );

        isIdFound = true;
      }
    }

    // Insert the new user with the assigned ID
    await connection.query(
      'INSERT INTO usersdetails (memberid, phoneno, username, email) VALUES (?, ?, ?, ?)',
      [assignedId, phoneno, username, email]
    );

    await connection.query(
      'INSERT INTO security_details_of_user (member_id, password, tpin) VALUES (?, ?, ?)',
      [assignedId, password, tpin]
    );

    await connection.query(
      'INSERT INTO member (sponser_id, member_id) VALUES (?, ?)',
      [sponser_id, assignedId]
    );

    await connection.query(
      'INSERT INTO users_total_balance (member_id) VALUES (?)',[assignedId]
    );

    // insert user_signup_bonous member_id, signup_bonus, value(0,1,2)
    const signup_bonus = "649";
    const value = 0; // 0: pending, 1: active, 2: deactivated
    await connection.query(
      'INSERT INTO user_signup_bonus (member_id, signup_bonus, value) VALUES (?, ?, ?)',
      [assignedId, signup_bonus, value]
      );

    

    // Trigger the /addmember API
    try {
      const addMemberResponse = await axios.post('http://localhost:3000/api/auth/addmember', {
        newMember: assignedId,
        upline: sponser_id
      });

      if (addMemberResponse.status === 200) {

        await connection.commit();


            // Prepare user details for the welcome email
        const userDetails = {
          memberId: assignedId,
          sponsorId: sponser_id,
          username,
          phoneno,
          email,
          password,
          tpin,
          dateOfJoining: new Date().toLocaleString(),
        };

        // Send the welcome email
        const emailResponse = await sendWelcomeEmail(userDetails);
        if (!emailResponse.success) {
          console.error('Error sending welcome email:', emailResponse.error);
        } else {
          console.log(emailResponse.message);
        }

        res.status(201).json({
          message: 'User registered successfully and member hierarchy updated',
          userId: assignedId,
          name: username
        });
      } else {
        throw new Error('Failed to update member hierarchy'); 
      }
    } catch (apiError) {
      console.error('Error triggering /addmember:', apiError);
      res.status(500).json({ status:"true",error: 'User registered but failed to update hierarchy' });
    }
  } catch (error) {
    console.error('User registration error:', error);
    // Rollback the transaction on error
    if (connection) await connection.rollback();
    
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ status:"false",error: 'Username or email already exists' });
    } else {
      res.status(500).json({ status:"false",error: 'Internal server error' });
    }
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});

////////////////////////////
  
// User Login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; 

  // Validate inputs
  if (containsSQLInjectionWords(identifier) || containsSQLInjectionWords(password)) {
    return res.status(400).json({ status:"false",error: "Don't try to hack." });
  }

  try {
    
    // console.log(identifier);
    const [userRows] = await pool.query(
      'SELECT memberid ,username ,status,membership,phoneno,email,created_at FROM usersdetails WHERE memberid = ? OR email = ? OR phoneno = ?',
      [identifier, identifier, identifier]
    );
    // console.log(userRows)

    if (userRows.length === 0) {
      return res.status(404).json({ status:"false",error: 'User not registered' });
    }

    const memberid = userRows[0].memberid;
    const username=userRows[0].username;
    const status = userRows[0].status;
    const membership = userRows[0].membership;
    //checking the status of the user
    if (status === 'inactive') {
      return res.status(401).json({ status:"false",error: 'Your account is inactive'});
      }
      



    // Verify the password from security_details_of_user
    const [passwordRows] = await pool.query(
      'SELECT password FROM security_details_of_user WHERE member_id = ?',
      [memberid]
    );

    if (passwordRows.length === 0 || passwordRows[0].password !== password) {
      return res.status(401).json({ status:"false",error: 'Wrong password' });
    }

    //update the user_signup_bonous table value 0 to 1
    //first get the current value then update if value is 0 otherwise not update
    const [signupBonusRows] = await pool.query(
      'SELECT value FROM user_signup_bonus WHERE member_id = ?',
      [memberid]
    );
    const currentValue = signupBonusRows[0]?.value;
    if (currentValue === 0) {
      const [updateRows] = await pool.query(
        'UPDATE user_signup_bonus SET value = 1 WHERE member_id = ?',
        [memberid]
        );

        if (updateRows.affectedRows === 0) {
          console.log("Error: Could not update user_signup_bonus table value");
        }
    }
    //yadd rakhna ki user signup bonus table ka trigger chnage krna hai 
    //SHOW CREATE TRIGGER prevent_revert_from_2;
    // console.log(userRows);



    // Successful login
    res.json({ 
      status:"true",
      message: 'User logged in successfully', memberid ,username,membership,phoneNo:userRows[0].phoneno,email:userRows[0].email,date_of_joining:userRows[0].created_at});
    console.log(username+" ka hogya login "+new Date())
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ status:"false",error: 'Internal server error' });
  }
});

//get the membership status of the user
router.post('/getmembershipStatus', async (req, res) => {
  const { member_id } = req.body;

  if (!member_id) {
    return res.status(400).json({ status:"false",error: 'MemberID is required' });
  }
 



  // Validate inputs
  const checktheData = member_id;
  console.log(checktheData);
  if (containsSQLInjectionWords(checktheData)) {
    return res.status(400).json({ status: "false", error: "Don't try to hack." });
  }

  try {
    const [userRows] = await pool.query(
      'SELECT membership FROM usersdetails WHERE memberid = ?',
      [member_id]
    );
    // console.log(userRows)
    if (userRows.length === 0) {
      return res.status(404).json({ status:"false",error: 'User not registered' });
    }
    const membership = userRows[0].membership;
    res.json({ status:"true", membership });
  } catch (error) {
    console.error('Error fetching membership:', error);
    res.status(500).json({ status:"false",error: 'Internal server error' });
  }
});



//////////////////////////////////////////////////////
router.post('/login2', async (req, res) => {
  const { identifier, password, device_id, otp } = req.body;

  // Validate inputs
  if (containsSQLInjectionWords(identifier) || containsSQLInjectionWords(password) || containsSQLInjectionWords(device_id)) {
    return res.status(400).json({ status: "false", error: "Don't try to hack." });
  }

  try {
    // Fetch user details
    const [userRows] = await pool.query(
      'SELECT memberid, username, status, membership, phoneno, email, created_at FROM usersdetails WHERE memberid = ? OR email = ? OR phoneno = ?',
      [identifier, identifier, identifier]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ status: "false", error: 'User not registered' });
    }

    const memberid = userRows[0].memberid;
    const username = userRows[0].username;
    const status = userRows[0].status;
    const membership = userRows[0].membership;
    const email = userRows[0].email;

    // Check if the account is active
    if (status === 'inactive') {
      return res.status(401).json({ status: "false", error: 'Your account is inactive' });
    }

    // Verify the password
    const [passwordRows] = await pool.query(
      'SELECT password FROM security_details_of_user WHERE member_id = ?',
      [memberid]
    );

    if (passwordRows.length === 0 || passwordRows[0].password !== password) {
      return res.status(200).json({ status: "false", error: 'Wrong password' });
    }

    // Check if device_id exists in the login_device_info table
    const [deviceIdRows] = await pool.query(
      'SELECT device_id FROM login_device_info WHERE member_id = ?',
      [memberid]
    );

    if (deviceIdRows.length === 0) {
      // First-time login, no device ID exists
      if (!otp) {
        // Send OTP for first-time login
        const otpResponse = await universalOtpEmailSender(memberid, 'first_time_login');
        if (otpResponse.success) {
          return res.status(200).json({
            status: "false",
            message: 'This is your first time logging in. OTP sent to email for device verification.'
          });
        } else {
          return res.status(500).json({ status: "false", error: 'Failed to send OTP email' });
        }
      } else {
        // Verify OTP for first-time login
        const otpVerification = await verifyOtp(memberid, otp);
        if (otpVerification.success) {
          // Insert the device ID after OTP verification is successful
          await pool.query(
            'INSERT INTO login_device_info (member_id, device_id) VALUES (?, ?)',
            [memberid, device_id]
          );
          return res.status(200).json({
            status: "true",
            message: 'First-time login successful, device verified.',
            memberid,
            username,
            membership,
            phoneNo: userRows[0].phoneno,
            email,
            date_of_joining: userRows[0].created_at
          });
        } else {
          return res.status(200).json({ status: "false", message: otpVerification.message });
        }
      }
    } else {
      // If device_id does not match, verify OTP
      if (deviceIdRows[0].device_id !== device_id) {
        if (!otp) {
          const otpResponse = await universalOtpEmailSender(memberid, 'device_change');
          if (otpResponse.success) {
            return res.status(200).json({
              status: "false",
              message: 'Device does not match. OTP sent to email for verification.'
            });
          } else {
            return res.status(500).json({ status: "false", error: 'Failed to send OTP email' });
          }
        } else {
          // Verify OTP for device change
          const otpVerification = await verifyOtp(memberid, otp);
          if (otpVerification.success) {
            // Update the device_id after OTP verification
            await pool.query(
              'UPDATE login_device_info SET device_id = ? WHERE member_id = ?',
              [device_id, memberid]
            );
            return res.status(200).json({
              status: "true",
              message: 'Device change verified, logged in successfully.',
              memberid,
              username,
              membership,
              phoneNo: userRows[0].phoneno,
              email,
              date_of_joining: userRows[0].created_at
            });
          } else {
            return res.status(200).json({ status: "false", message: otpVerification.message });
          }
        }
      } else {
        // Device ID matches, proceed with login
        return res.status(200).json({
          status: "true",
          message: 'User logged in successfully',
          memberid,
          username,
          membership,
          phoneNo: userRows[0].phoneno,
          email,
          date_of_joining: userRows[0].created_at
        });
      }
    }
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ status: "false", error: 'Internal server error' });
  }
});




////////////////////////////////////////////////////

//to check tpin is correct or not 
router.post('/checktpin', async(req,res)=>{
  const {member_id,tpin} = req.body;
  if (!member_id || !tpin) {
    return res.status(400).json({ error: 'Member ID and TPIN are required' });
  }
  // Validate inputs
  if (containsSQLInjectionWords(member_id) || containsSQLInjectionWords(tpin)) {
    return res.status(400).json({ error: "Don't try to hack." });
  }
  const [tpinRows] = await pool.query('SELECT tpin FROM security_details_of_user WHERE member_id = ?', [member_id]);
  if(tpinRows.length === 0){
    return res.status(404).json({error:'User not registered'});
    }
    if(tpinRows[0].tpin === tpin){
      return res.json({isValid: true});
    }
  return res.json({isValid: false });
})




//to get all users details
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        ud.sno,
        ud.memberid,
        ud.username,
        ud.email,
        ud.phoneno,
        sd.password,
        sd.tpin,
        ud.created_at,
        ud.membership,
        ud.status
      FROM 
        usersdetails ud
      JOIN 
        security_details_of_user sd ON ud.memberid = sd.member_id
    `;
    
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST API to toggle status between active and inactive
// POST API to toggle user status between active and inactive
router.post('/toggleStatus', async (req, res) => {
  const { memberid } = req.body;

  if (!memberid) {
    return res.status(400).json({ error: 'Member ID is required' });
  }
  // Validate inputs
  if (containsSQLInjectionWords(memberid)) {
    return res.status(400).json({ error: "Don't try to hack." });
  }

  try {
    // Check if the user exists and fetch their current status
    const [userResult] = await pool.query('SELECT status FROM usersdetails WHERE memberid = ?', [memberid]);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentStatus = userResult[0].status;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    // Update the user's status
    await pool.query('UPDATE usersdetails SET status = ? WHERE memberid = ?', [newStatus, memberid]);

    // Check for existing delete request
    const [requestResult] = await pool.query('SELECT * FROM user_delete_requests WHERE member_id = ?', [memberid]);

    if (newStatus === 'inactive') {
      if (requestResult.length > 0) {
        // Update delete request to 'done' if it exists
        await pool.query('UPDATE user_delete_requests SET delete_request_status = ? WHERE member_id = ?', ['done', memberid]);
      } else {
        // Insert new entry with status 'done'
        await pool.query(
          'INSERT INTO user_delete_requests (member_id, delete_request_status) VALUES (?, ?)',
          [memberid, 'done']
        );
      }
    } else if (newStatus === 'active') {
      if (requestResult.length === 0) {
        // Insert new entry with status 'pending'
        await pool.query(
          'INSERT INTO user_delete_requests (member_id, delete_request_status, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [memberid, 'pending']
        );
      }
      else {
        // Insert new entry with status 'done'
        await pool.query('UPDATE user_delete_requests SET delete_request_status = ? WHERE member_id = ?', ['pending', memberid]);
      }
    }

    res.status(200).json({ message: `User status changed to ${newStatus}`, newStatus });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});







//generate  users ids in database 
router.post('/generate-user-ids', async (req, res) => {
    try {
        // Fetch the last entry based on the sequential IDs
        const [lastEntryResult] = await pool.query(
            'SELECT pregenerated_ids FROM useridcollection ORDER BY pregenerated_ids DESC LIMIT 1'
        );

        // Extract the last ID and calculate the starting point for the next batch
        const lastId = lastEntryResult.length > 0 
            ? parseInt(lastEntryResult[0].pregenerated_ids.slice(2), 10) 
            : -1;

        const newIds = [];
        for (let i = 100000; i <= 100010; i++) {
            const newId = `UP${String(lastId + i).padStart(6, '0')}`;
            newIds.push([newId, 'false']); // Add default 'false' for the 'used' field
        }

        // Insert the new IDs into the database
        await pool.query(
            'INSERT INTO useridcollection (pregenerated_ids, used) VALUES ?',
            [newIds]
        );

        res.status(200).json({ 
            success: true, 
            message: 'IDs generated successfully', 
            newIds: newIds.map(id => id[0]) // Send back the list of new IDs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error generating IDs' });
    }
});

module.exports = router;