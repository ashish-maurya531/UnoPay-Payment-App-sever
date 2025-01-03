const express = require('express');
const { pool } = require('../config/database');
const axios = require('axios');
const { rmSync } = require('fs');

const router = express.Router();

// Admin Login
router.post('/adminLogin', async (req, res) => {
  const { name, password } = req.body;
  console.log(name, password);
  const containsSQLInjectionWords = (input) => {
    const sqlKeywords = [
      "SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "WHERE", "OR", "AND", "--", "#", "/\\*", "\\*/", ";", "=", "'", "\""
    ];
    const regex = new RegExp(sqlKeywords.join('|'), 'i');
    return regex.test(input);
  };
  // Validate inputs
  if (containsSQLInjectionWords(name) || containsSQLInjectionWords(password)) {
    return res.status(400).json({ error: "Don't try to hack." });
  }


  try {
    const [rows] = await pool.query('SELECT * FROM admin WHERE name = ? AND password = ?', [name, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];
    res.json({ message: 'Admin logged in successfully', adminId: admin.id });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


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
  console.log("gandu se aya "+sponser_id);
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

  const containsSQLInjectionWords = (input) => {
    const sqlKeywords = [
      "SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "WHERE", "OR", "AND", "--", "#", "/\\*", "\\*/", ";", "=", "'", "\""
    ];
    const regex = new RegExp(sqlKeywords.join('|'), 'i');
    console.log(regex.test(input));
    return regex.test(input);
  };




  // Validate inputs
  const checktheData = [sponser_id, phoneno, username, email, password, tpin].join(' ');
  console.log(checktheData);
  if (containsSQLInjectionWords(checktheData)) {
    return res.status(400).json({ status: "false", error: "Don't try to hack." });
  }
  if (password === "" || tpin === "" || username === "" || email === "" || phoneno == "") {
    console.log("khali feild mat bhej ")
    return res.status(400).json({ status: "false", error: "Fields cannot be empty." });
  }
  if (sponser_id.length != 8) {
    console.log("sponser id 8 char se choti mat bhej ")
    return res.status(400).json({ status: "false", error: "Sponser ID must be 8 characters long." });
  }
  if (!/^\d{10}$/.test(phoneno)) {
    console.log("phoneno 10 char se chota mat bhej ")
    return res.status(400).json({ status: "false", error: "Phone number must be 10 digits long." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log("email invalid mat bhej ")
    return res.status(400).json({ status: "false", error: "Invalid email address." });
  }
  if (!/^\d{4}$/.test(tpin)) {
    console.log("tpin 4 char se chota mat bhej ")
    return res.status(400).json({ status: "false", error: "TPIN must be 4 digits long." });
  }
  //check sponser id 
  const isSponserIdValid = await checkSponserId(sponser_id);
  if (!isSponserIdValid) {
    console.log("sponser id invalid mat bhej ")
    return res.status(400).json({ status: "false", error: "Invalid sponser ID." });
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

  // Function to check for SQL injection-related words
  const containsSQLInjectionWords = (input) => {
    const sqlKeywords = [
      "SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "WHERE", "OR", "AND", "--", "#", "/\\*", "\\*/", ";", "=", "'", "\""
    ];
    const regex = new RegExp(sqlKeywords.join('|'), 'i');
    return regex.test(input);
  };
  // Validate inputs
  if (containsSQLInjectionWords(identifier) || containsSQLInjectionWords(password)) {
    return res.status(400).json({ status:"false",error: "Don't try to hack." });
  }

  try {
    
    // console.log(identifier);
    const [userRows] = await pool.query(
      'SELECT memberid ,username ,status,membership FROM usersdetails WHERE memberid = ? OR email = ? OR phoneno = ?',
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
    res.json({ status:"true",message: 'User logged in successfully', memberid ,username,membership });
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
  const containsSQLInjectionWords = (input) => {
    const sqlKeywords = [
      "SELECT", "DROP", "DELETE", "INSERT", "UPDATE", "WHERE", "OR", "AND", "--", "#", "/\\*", "\\*/", ";", "=", "'", "\""
    ];
    const regex = new RegExp(sqlKeywords.join('|'), 'i');
    console.log(regex.test(input));
    return regex.test(input);
  };




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



//to check tpin is correct or not 
router.post('/checktpin', async(req,res)=>{
  const {member_id,tpin} = req.body;
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
router.get('/users', async (req, res) => {
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
router.post('/toggleStatus', async (req, res) => {
  const { memberid } = req.body;

  if (!memberid) {
    return res.status(400).json({ error: 'MemberID is required' });
  }

  try {
    // Check the current status of the user
    const [user] = await pool.query('SELECT status FROM usersdetails WHERE memberid = ?', [memberid]);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine the new status
    const currentStatus = user[0].status;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    // Update the user's status
    await pool.query('UPDATE usersdetails SET status = ? WHERE memberid = ?', [newStatus, memberid]);

    res.status(200).json({ message: `Status changed to ${newStatus}` });
  } catch (error) {
    console.error('Error changing status:', error);
    res.status(500).json({ error: 'Internal server error' });
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