const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();
const containsSQLInjectionWords=require('../utills/sqlInjectionCheck');

const authenticateToken = require('../middleware/auth');


router.post('/postMeetingDetails', authenticateToken, async (req, res) => {
  const { title, link, date, time } = req.body;  // Separate date and time

  if (!title || !link || !date || !time) {
      return res.status(400).json({
          status: 'false',
          message: 'Please provide title, link, date, and time'
      });
  }

  try {
      let finalDateTime;

      // Check if date is "everyday" and merge with time
      if (date.toLowerCase() === "everyday") {
          finalDateTime = `1970-01-01 ${time}`;
      } else {
          finalDateTime = `${date} ${time}`;
      }

      const [existingMeeting] = await pool.query('SELECT sno FROM meeting_table LIMIT 1');  // Only 1 meeting is allowed

      if (existingMeeting.length > 0) {
          const meeting_id = existingMeeting[0].sno;
          
          await pool.query(
              'UPDATE meeting_table SET title = ?, link = ?, date_time = ? WHERE sno = ?', 
              [title, link, finalDateTime, meeting_id]
          );

          console.log("Meeting details updated:", { title, link, finalDateTime });

          res.json({
              status: 'true',
              message: 'Meeting details updated successfully',
          });
      } else {
          await pool.query(
              'INSERT INTO meeting_table (title, link, date_time) VALUES (?, ?, ?)', 
              [title, link, finalDateTime]
          );

          console.log("New meeting created:", { title, link, finalDateTime });

          res.json({
              status: 'true',
              message: 'New meeting created successfully',
          });
      }
  } catch (error) {
      console.error('Error posting or updating meeting details:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

  


  router.post('/getMeetingDetails', authenticateToken,async (req, res) => {
  
    try {
      const [meetingDetails] = await pool.query('SELECT title, link, date_time FROM meeting_table');
  
      if (meetingDetails.length === 0) {
        return res.status(200).json({
            status: 'false',
          message: 'Meeting not found'
        });
      }
  
      console.log("Meeting details:", meetingDetails[0]);
  
      res.json({
        status: "true",
        meetingDetails: meetingDetails[0] // Send the meeting details
      });
  
    } catch (error) {
      console.error('Error fetching meeting details:', error);
      res.status(500).json({ status:"false",message: 'Internal server error' });
    }
  });
  
  
  module.exports = router;