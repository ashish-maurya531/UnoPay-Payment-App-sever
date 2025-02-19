
const {pool}=require('../config/database');
const transporter = require('../config/mailer');
// const transporter = require('../');


//function that takes the member_id and take out the email address from usersdetails table and send mail using nodemoailer


// Helper function to generate a 6-digit OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Ensures a 6-digit OTP
}
const insertOTP = async (member_id, otp) => {
    try {
        const query = `
            INSERT INTO otp_store (member_id, otp)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE otp = VALUES(otp), created_at = CURRENT_TIMESTAMP
        `;
        await pool.query(query, [member_id, otp]);
    } catch (error) {
        console.error("Error inserting OTP:", error);
        throw new Error("Failed to store OTP");
    }
};


const deleteOtp = async (member_id) => {
    try {
        const query = `
            DELETE FROM otp_store 
            WHERE member_id = ?
        `;
        await pool.query(query, [member_id]);
    } catch (error) {
        console.error("Error deleting OTP:", error);
        throw new Error("Failed to delete OTP");
    }
};


const verifyOtp = async (member_id, inputOtp) => {
    console.log("Verifying OTP");
    try {
        const query = `
            SELECT otp, created_at 
            FROM otp_store 
            WHERE member_id = ?
        `;
        const [results] = await pool.query(query, [member_id]);

        if (results.length === 0) {
            return { success: false, message: "No otp request by this Member ID" };
        }

        const { otp, created_at } = results[0];

        // Check OTP validity
        const currentTime = new Date();
        const createdTime = new Date(created_at);
        const timeDifference = (currentTime - createdTime) / (1000 * 60); // Convert to minutes

        if (otp !== inputOtp) {
            return { success: false, message: "Invalid OTP" };
        } else if (timeDifference > 5) {
            await deleteOtp(member_id);

            return { success: false, message: "OTP expired" };
        }

        // OTP is valid
        // Optionally delete the OTP after successful verification
        await deleteOtp(member_id);
        console.log("OTP verified successfully");
        return { success: true, message: "OTP verified successfully" };
    } catch (error) {
        console.error("Error verifying OTP:", error);
        throw new Error("Failed to verify OTP");
    }
};

// console.log(verifyOtp("UP100700","889737"))



// Function to send an email with the OTP
async function sendOtpEmail(member_id) {
    try {
        // Query to get the email address based on member_id
        const [rows] = await pool.query(
            `SELECT email FROM usersdetails WHERE memberid = ?`,
            [member_id]
        );

        if (!rows.length) {
            console.log('Member not found.');
            return { success: false, message: 'Member not found' };
        }

        const { email } = rows[0];
        // const email="rootleo1571995@gmail.com";
        // const email="apskumar24@gmail.com";


        // Generate a 6-digit OTP
        const otp = generateOtp();
        console.log(otp);
        await insertOTP(member_id, otp);
      
       
        
        // Email options
        const mailOptions = {
            from: `"UnoPay Payment App" ${process.env.EMAIL_USER}`,
            to: email,
            subject: 'Your UnoPay OTP Code',
            html: `
               <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 20px auto;
                                background-color: #ffffff;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                            }
                            .email-header {
                                background-color: #4CAF50;
                                text-align: center;
                                padding: 20px 0;
                                position: relative;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                            }
                            .email-header img {
                                width: 150px;
                                margin-bottom: 10px;
                            }
                            .email-header h1 {
                                margin: 10px 0 0 0;
                                font-size: 24px;
                                color: #ffffff;
                            }
                            .email-body {
                                padding: 20px;
                                color: #333333;
                            }
                            .email-body p {
                                line-height: 1.6;
                            }
                            .otp-code {
                                font-size: 20px;
                                font-weight: bold;
                                color: #4CAF50;
                                text-align: center;
                            }
                            .email-footer {
                                background-color: #f4f4f4;
                                text-align: center;
                                padding: 10px;
                                font-size: 12px;
                                color: #666666;
                            }
                            .email-footer a {
                                color: #4CAF50;
                                text-decoration: none;
                            }
                            .email-contact {
                                margin-top: 20px;
                                font-size: 14px;
                            }
                            img {
                                display: block;
                                margin: 0 auto;
                                scale:1.3
                            }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            <!-- Header with Banner -->
                            <div class="email-header">
                                <img src="cid:unopay_banner" alt="UnoPay Payment App Banner">
                                <h1>UnoPay Payment Service</h1>
                                <p>Provided by UNOTAG MULTI SOLUTION PVT. LTD.</p>
                            </div>
                            <!-- Email Body -->
                            <div class="email-body">
                                <p>Dear Customer,</p>
                                <p>Thank you for using UnoPay. To proceed with your request, please use the following One-Time Password (OTP):</p>
                                <p class="otp-code">${otp}</p>
                                <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
                                <p>If you did not request this, please contact our support team immediately at <a href="mailto:info@unope.com">info@unope.com</a>.</p>
                                <p>Thank you for choosing UnoPay!</p>
                            </div>
                            <!-- Footer -->
                            <div class="email-footer">
                                <p>&copy; ${new Date().getFullYear()} UNOTAG MULTI SOLUTION PVT. LTD. All rights reserved.</p>
                                <p>This email is intended solely for the recipient. Unauthorized use or distribution is strictly prohibited.</p>
                                <p><a href="https://www.unope.com">www.unope.com</a> | <a href="mailto:info@unope.com">info@unope.com</a></p>
                                <p class="email-contact">Contact us: +91-1234567890, +91-0987654321</p>
                            </div>
                        </div>
                    </body>
                    </html>

                    `,
            attachments: [
                {
                    filename: 'unopay.jpeg',
                    path: 'unopay.jpeg', // Replace with the correct path to your image
                    cid: 'unopay_banner' // Same as referenced in the HTML img tag
                }
            ]
        };


        // Sending the email
        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent: ' + info.response);
        // console.log('Email sent: ');
        
        return { success: true, message: 'OTP sent successfully'}; // Return the OTP for testing/debugging
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Error sending OTP email', error };
    }
}



//////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// Function to send a welcome email to the newly registered user
async function sendWelcomeEmail(userDetails) {
    const {
      memberId,
      sponsorId,
      username,
      phoneno,
      email,
      password,
      tpin,
      dateOfJoining,
    } = userDetails;
  
    try {
      // Email options
      const mailOptions = {
        from: `"UnoPay Payment App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to UnoPay - Your Membership Details",
        html: `
                    <!DOCTYPE html>
            <html>
            <head>
            <style>
                
                body {
                font-family: 'Montserrat', Arial, sans-serif;
                background-color: #f3f4f6;
                margin: 0;
                padding: 0;
                }

                .email-container {
                max-width: 650px;
                margin: 30px auto;
                background: linear-gradient(145deg, #ffffff, #f7f7f7);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                animation: fadeIn 1.2s ease-in-out;
                }

                @keyframes fadeIn {
                0% {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
                }

                .email-header {
                background-color: #2a9d8f;
                color: #ffffff;
                text-align: center;
                padding: 25px 0;
                animation: slideIn 1s ease-in-out;
                }

                @keyframes slideIn {
                0% {
                    transform: translateX(-100%);
                }
                100% {
                    transform: translateX(0);
                }
                }

                .email-header img {
                max-width: 150px;
                margin-bottom: 15px;
                opacity: 0.9;
                }

                .email-header h1 {
                margin: 0;
                font-size: 26px;
                font-weight: 700;
                letter-spacing: 1px;
                }

                .email-body {
                padding: 25px;
                color: #444444;
                line-height: 1.7;
                animation: fadeIn 1.2s ease-in-out;
                }

                .email-body p {
                margin: 15px 0;
                font-size: 16px;
                }

                .email-details {
                margin: 20px 0;
                padding: 20px;
                background-color: #f0f7f7;
                border-left: 4px solid #2a9d8f;
                border-radius: 8px;
                animation: popUp 1.5s ease-in-out;
                }

                @keyframes popUp {
                0% {
                    transform: scale(0.9);
                    opacity: 0;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
                }

                .email-details h3 {
                margin-bottom: 10px;
                font-size: 18px;
                font-weight: 600;
                color: #2a9d8f;
                }

                .email-footer {
                background-color: #eeeeee;
                text-align: center;
                padding: 15px;
                font-size: 13px;
                color: #555555;
                animation: fadeIn 1.8s ease-in-out;
                }

                .email-footer a {
                color: #2a9d8f;
                text-decoration: none;
                font-weight: 600;
                }

                .email-footer p {
                margin: 5px 0;
                }

                .cta-button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 25px;
                background-color: #e76f51;
                color: #ffffff;
                text-decoration: none;
                font-size: 16px;
                font-weight: 600;
                border-radius: 6px;
                box-shadow: 0 4px 10px rgba(231, 111, 81, 0.4);
                transition: background-color 0.3s ease, transform 0.3s ease;
                }

                .cta-button:hover {
                background-color: #d65a41;
                transform: translateY(-2px);
                box-shadow: 0 6px 14px rgba(231, 111, 81, 0.6);
                }
            </style>
            </head>
            <body>
            <div class="email-container">
                <!-- Email Header -->
                <div class="email-header">
                <img src="cid:unopay_banner" alt="UnoPay Payment App Banner">
                <h1>Welcome to UnoPay!</h1>
                </div>

                <!-- Email Body -->
                <div class="email-body">
                <p>Dear ${username},</p>
                <p>🎉 Congratulations! Your registration with UnoPay has been successfully completed. Below are your membership details:</p>

                <div class="email-details">
                    <h3>Your Membership Details</h3>
                    <p><strong>Member ID:</strong> ${memberId}</p>
                    <p><strong>Sponsor ID:</strong> ${sponsorId}</p>
                    <p><strong>Name:</strong> ${username}</p>
                    <p><strong>Phone Number:</strong> ${phoneno}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Password:</strong> ${password}</p>
                    <p><strong>TPIN:</strong> ${tpin}</p>
                    <p><strong>Date of Joining:</strong> ${dateOfJoining}</p>
                </div>

                <p>⚠️ <strong>Warning:</strong> Do not share your details with anyone. Keep this email safe for your records and also take screenshot.</p>
                <p>Need assistance? Feel free to reach out to our support team anytime!</p>

                
                </div>

                <!-- Email Footer -->
                <div class="email-footer">
                <p>&copy; ${new Date().getFullYear()} UNOTAG MULTI SOLUTION PVT. LTD.</p>
                <p>This email is confidential. Unauthorized use is strictly prohibited.</p>
                <p><a href="https://www.unope.com">www.unope.com</a> | <a href="mailto:info@unope.com">info@unope.com</a></p>
                <p>Contact us: +91-1234567890, +91-0987654321</p>
                </div>
            </div>
            </body>
            </html>

        `,
        attachments: [
            {
                filename: 'unopay.jpeg',
                path: 'unopay.jpeg', // Replace with the correct path to your image
                cid: 'unopay_banner' // Same as referenced in the HTML img tag
            }
        ]
      };
  
      // Sending the email
      const info = await transporter.sendMail(mailOptions);
  
      console.log("Welcome email sent: " + info?.response);
    //   console.log("Welcome email sent: ");

      return { success: true, message: "Welcome email sent successfully" };
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return { success: false, message: "Error sending welcome email", error };
    }
  }
  


  ///////////////////////////////////////////////
  //widthraw email 
  async function sendWithdrawalEmail(emailData) {
    const {
        member_id,
        Bank_Name,
        Account_number,
        amount
    } = emailData;

    try {
        // Email options
        const mailOptions = {
            from: `"UnoPay Payment App" <${process.env.EMAIL_USER}>`,
            to: emailData.email,  // Assuming email is in withdrawalDetails
            subject: "UnoPay - Withdrawal Request Confirmation",
            html: `
                    <!DOCTYPE html>
            <html>
            <head>
            <style>
                body {
                    font-family: 'Montserrat', Arial, sans-serif;
                    background-color: #f3f4f6;
                    margin: 0;
                    padding: 0;
                }

                .email-container {
                    max-width: 650px;
                    margin: 30px auto;
                    background: linear-gradient(145deg, #ffffff, #f7f7f7);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                    animation: fadeIn 1.2s ease-in-out;
                }

                @keyframes fadeIn {
                    0% {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .email-header {
                    background-color: #2a9d8f;
                    color: #ffffff;
                    text-align: center;
                    padding: 25px 0;
                    animation: slideIn 1s ease-in-out;
                }

                @keyframes slideIn {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(0);
                    }
                }

                .email-header img {
                    max-width: 150px;
                    margin-bottom: 15px;
                    opacity: 0.9;
                }

                .email-header h1 {
                    margin: 0;
                    font-size: 26px;
                    font-weight: 700;
                    letter-spacing: 1px;
                }

                .email-body {
                    padding: 25px;
                    color: #444444;
                    line-height: 1.7;
                    animation: fadeIn 1.2s ease-in-out;
                }

                .email-body p {
                    margin: 15px 0;
                    font-size: 16px;
                }

                .email-details {
                    margin: 20px 0;
                    padding: 20px;
                    background-color: #f0f7f7;
                    border-left: 4px solid #2a9d8f;
                    border-radius: 8px;
                    animation: popUp 1.5s ease-in-out;
                }

                @keyframes popUp {
                    0% {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .email-details h3 {
                    margin-bottom: 10px;
                    font-size: 18px;
                    font-weight: 600;
                    color: #2a9d8f;
                }

                .email-footer {
                    background-color: #eeeeee;
                    text-align: center;
                    padding: 15px;
                    font-size: 13px;
                    color: #555555;
                    animation: fadeIn 1.8s ease-in-out;
                }

                .email-footer a {
                    color: #2a9d8f;
                    text-decoration: none;
                    font-weight: 600;
                }

                .cta-button {
                    display: inline-block;
                    margin-top: 20px;
                    padding: 12px 25px;
                    background-color: #e76f51;
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 16px;
                    font-weight: 600;
                    border-radius: 6px;
                    box-shadow: 0 4px 10px rgba(231, 111, 81, 0.4);
                    transition: background-color 0.3s ease, transform 0.3s ease;
                }

                .cta-button:hover {
                    background-color: #d65a41;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 14px rgba(231, 111, 81, 0.6);
                }
            </style>
            </head>
            <body>
            <div class="email-container">
                <!-- Email Header -->
                <div class="email-header">
                    <img src="cid:unopay_banner" alt="UnoPay Payment App Banner">
                    <h1>UnoPay - Withdrawal Request</h1>
                </div>

                <!-- Email Body -->
                <div class="email-body">
                    <p>Dear Member,</p>
                    <p>Thank you for using UnoPay. Below are the details of your recent withdrawal request:</p>

                    <div class="email-details">
                        <h3>Withdrawal Details</h3>
                        <p><strong>Member ID:</strong> ${member_id}</p>
                        <p><strong>Bank Name:</strong> ${Bank_Name}</p>
                        <p><strong>Account Number:</strong> ${Account_number}</p>
                        <p><strong>Amount:</strong> ₹${amount}</p>
                    </div>

                    <p>Please ensure that your account details are correct. If you have any questions or need further assistance, don't hesitate to reach out to us.</p>

                    <p>Best regards,<br>UnoPay Team</p>
                </div>

                <!-- Email Footer -->
                <div class="email-footer">
                    <p>&copy; ${new Date().getFullYear()} UNOTAG MULTI SOLUTION PVT. LTD.</p>
                    <p><a href="https://www.unope.com">www.unope.com</a> | <a href="mailto:info@unope.com">info@unope.com</a></p>
                    <p>Contact us: +91-1234567890, +91-0987654321</p>
                </div>
            </div>
            </body>
            </html>
            `,
            attachments: [
                {
                    filename: 'unopay.jpeg',
                    path: 'unopay.jpeg', // Replace with the correct path to your image
                    cid: 'unopay_banner' // Same as referenced in the HTML img tag
                }
            ]
        };

        // Sending the email
        const info = await transporter.sendMail(mailOptions);
        console.log("Withdrawal email sent: " + info?.response);

        // console.log("Withdrawal email sent: ");
        return { success: true, message: "Withdrawal email sent successfully" };

    } catch (error) {
        console.error("Error sending withdrawal email:", error);
        return { success: false, message: "Error sending withdrawal email", error };
    }
}









  ///////////////////////////////////////////////////////

//email fro register 


const insertOtpForRegister = async (identifier, otp) => {
    try {
        const query = `
            INSERT INTO otp_store_for_register (identifier, otp)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE otp = VALUES(otp), created_at = CURRENT_TIMESTAMP
        `;
        await pool.query(query, [identifier, otp]);
    } catch (error) {
        console.error("Error inserting OTP for register:", error);
        throw new Error("Failed to store OTP for register");
    }
};

const deleteOtpForRegister = async (identifier) => {
    try {
        const query = `
            DELETE FROM otp_store_for_register 
            WHERE identifier = ?
        `;
        const [toDelete]=await pool.query(query, [identifier]);
        if (toDelete.affectedRows>0){
            return { success: true, message: "OTP deleted successfully" };
        }
        return { success: false, message: "No OTP found for this Email" };
    } catch (error) {
        console.error("Error deleting OTP for register:", error);
        throw new Error("Failed to delete OTP for register");
    }
};






const verifyOtpForRegister = async (identifier, inputOtp) => {
    console.log("Verifying OTP for register");
    try {
        const query = `
            SELECT otp, created_at 
            FROM otp_store_for_register 
            WHERE identifier = ?
        `;
        const [results] = await pool.query(query, [identifier]);

        if (results.length === 0) {
            return { success: false, message: "No OTP request for this Email" };
        }

        const { otp, created_at } = results[0];

        // Check OTP validity
        const currentTime = new Date();
        const createdTime = new Date(created_at);
        const timeDifference = (currentTime - createdTime) / (1000 * 60); // Convert to minutes

        if (otp !== inputOtp) {
            return { success: false, message: "Invalid OTP" };
        } else if (timeDifference > 5) {
            await deleteOtpForRegister(identifier);
            return { success: false, message: "OTP expired" };
        }

        // OTP is valid
        // Optionally delete the OTP after successful verification
        // await deleteOtpForRegister(identifier);
        console.log("OTP verified successfully");
        return { success: true, message: "OTP verified successfully" };
    } catch (error) {
        console.error("Error verifying OTP for register:", error);
        throw new Error("Failed to verify OTP for register");
    }
};



const sendOtpRegister = async (identifier) => {
    try {
        // Validate the email format (optional)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier)) {
            return { success: false, message: "Invalid email format" };
        }

        // Generate a 6-digit OTP
        const otp = generateOtp();
        console.log("Register Generated OTP:", otp);

        // Insert the OTP into the database
        await insertOtpForRegister(identifier, otp);

        // Email options
        const mailOptions = {
            from: `"UnoPay Payment App" <${process.env.EMAIL_USER}>`,
            to: identifier,
            subject: 'Your UnoPay Registration OTP Code',
            html: `
               <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 20px auto;
                                background-color: #ffffff;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                            }
                            .email-header {
                                background-color: #4CAF50;
                                text-align: center;
                                padding: 20px 0;
                                position: relative;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                            }
                            .email-header img {
                                width: 150px;
                                margin-bottom: 10px;
                            }
                            .email-header h1 {
                                margin: 10px 0 0 0;
                                font-size: 24px;
                                color: #ffffff;
                            }
                            .email-body {
                                padding: 20px;
                                color: #333333;
                            }
                            .email-body p {
                                line-height: 1.6;
                            }
                            .otp-code {
                                font-size: 20px;
                                font-weight: bold;
                                color: #4CAF50;
                                text-align: center;
                            }
                            .email-footer {
                                background-color: #f4f4f4;
                                text-align: center;
                                padding: 10px;
                                font-size: 12px;
                                color: #666666;
                            }
                            .email-footer a {
                                color: #4CAF50;
                                text-decoration: none;
                            }
                            .email-contact {
                                margin-top: 20px;
                                font-size: 14px;
                            }
                            img {
                                display: block;
                                margin: 0 auto;
                                scale:1.3
                            }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            <!-- Header with Banner -->
                            <div class="email-header">
                                <img src="cid:unopay_banner" alt="UnoPay Payment App Banner">
                                <h1>UnoPay Payment Service</h1>
                                <p>Provided by UNOTAG MULTI SOLUTION PVT. LTD.</p>
                            </div>
                            <!-- Email Body -->
                            <div class="email-body">
                                <p>Dear Customer,</p>
                                <p>Thank you for using UnoPay. To proceed with your request, please use the following One-Time Password (OTP):</p>
                                <p class="otp-code">${otp}</p>
                                <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
                                <p>If you did not request this, please contact our support team immediately at <a href="mailto:info@unope.com">info@unope.com</a>.</p>
                                <p>Thank you for choosing UnoPay!</p>
                            </div>
                            <!-- Footer -->
                            <div class="email-footer">
                                <p>&copy; ${new Date().getFullYear()} UNOTAG MULTI SOLUTION PVT. LTD. All rights reserved.</p>
                                <p>This email is intended solely for the recipient. Unauthorized use or distribution is strictly prohibited.</p>
                                <p><a href="https://www.unope.com">www.unope.com</a> | <a href="mailto:info@unope.com">info@unope.com</a></p>
                                <p class="email-contact">Contact us: +91-1234567890, +91-0987654321</p>
                            </div>
                        </div>
                    </body>
                    </html>

                    `,
            attachments: [
                {
                    filename: 'unopay.jpeg',
                    path: 'unopay.jpeg', // Replace with the correct path to your image
                    cid: 'unopay_banner' // Same as referenced in the HTML img tag
                }
            ]
        };
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        // console.log('Email sent:');


        return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
        console.error("Error sending OTP email for register:", error);
        return { success: false, message: 'Failed to send OTP email', error };
    }
};



  //////////////////////////////////////////////////
/////////////////////////////////////////////








// Function to send an email with the OTP for login or device change
async function universalOtpEmailSender(member_id, type) {
    try {
        // Query to get the email address based on member_id
        const [rows] = await pool.query(
            `SELECT email FROM usersdetails WHERE memberid = ?`,
            [member_id]
        );

        if (!rows.length) {
            console.log('Member not found.');
            return { success: false, message: 'Member not found' };
        }

        const { email } = rows[0];

        // Generate a 6-digit OTP
        const otp = generateOtp();
        console.log(otp);
        await insertOTP(member_id, otp);

        let subject = '';
        let emailHtml = '';

        // Define the email content based on the type
        if (type === 'first_time_login') {
            subject = 'First-Time Login Verification - UnoPay';
            emailHtml = `
                                <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 20px auto;
                                background-color: #ffffff;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                                border: 1px solid #e0e0e0;
                            }
                            .email-header {
                                background-color: #4CAF50;
                                text-align: center;
                                padding: 20px 0;
                                position: relative;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                            }
                            .email-header img {
                                width: 150px;
                                margin-bottom: 10px;
                            }
                            .email-header h1 {
                                margin: 10px 0 0 0;
                                font-size: 24px;
                                color: #ffffff;
                            }
                            .email-body {
                                padding: 20px;
                                color: #333333;
                            }
                            .email-body h2 {
                                font-size: 22px;
                                color: #4CAF50;
                                text-align: center;
                                margin-bottom: 20px;
                            }
                            .email-body p {
                                line-height: 1.6;
                                margin: 10px 0;
                            }
                            .otp-code {
                                font-size: 28px;
                                font-weight: bold;
                                color: #4CAF50;
                                text-align: center;
                                margin: 20px 0;
                            }
                            .email-footer {
                                background-color: #f4f4f4;
                                text-align: center;
                                padding: 10px;
                                font-size: 12px;
                                color: #666666;
                            }
                            .email-footer a {
                                color: #4CAF50;
                                text-decoration: none;
                            }
                            .email-contact {
                                margin-top: 20px;
                                font-size: 14px;
                            }
                            img {
                                display: block;
                                margin: 0 auto;
                                scale: 1.3;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            <!-- Header with Banner -->
                            <div class="email-header">
                                <img src="cid:unopay_banner" alt="UnoPay Payment App Banner">
                                <h1>UnoPay Payment Service</h1>
                                <p>Provided by UNOTAG MULTI SOLUTION PVT. LTD.</p>
                            </div>
                            <!-- Email Body -->
                            <div class="email-body">
                                <h2>First-Time Login</h2>
                                <p>Dear Customer,</p>
                                <p>This is your first-time login attempt from a device. For security reasons, please use the One-Time Password (OTP) below to verify your login:</p>
                                <p class="otp-code">${otp}</p>
                                <p>The OTP is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
                                <p>If this login attempt was not made by you, please change your password and contact our support team immediately at <a href="mailto:info@unope.com">info@unope.com</a>.</p>
                                <p>Thank you for choosing UnoPay!</p>
                            </div>
                            <!-- Footer -->
                            <div class="email-footer">
                                <p>&copy; ${new Date().getFullYear()} UNOTAG MULTI SOLUTION PVT. LTD. All rights reserved.</p>
                                <p>This email is intended solely for the recipient. Unauthorized use or distribution is strictly prohibited.</p>
                                <p><a href="https://www.unope.com">www.unope.com</a> | <a href="mailto:info@unope.com">info@unope.com</a></p>
                                <p class="email-contact">Contact us: +91-1234567890, +91-0987654321</p>
                            </div>
                        </div>
                    </body>
                    </html>

            `;
        } else if (type === 'device_change') {
            subject = 'Device Change Verification - UnoPay';
            emailHtml = `
                                <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 20px auto;
                                background-color: #ffffff;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                                border: 1px solid #e0e0e0;
                            }
                            .email-header {
                                background-color: #FF5733;
                                text-align: center;
                                padding: 20px 0;
                                position: relative;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                            }
                            .email-header img {
                                width: 150px;
                                margin-bottom: 10px;
                            }
                            .email-header h1 {
                                margin: 10px 0 0 0;
                                font-size: 24px;
                                color: #ffffff;
                            }
                            .email-body {
                                padding: 20px;
                                color: #333333;
                            }
                            .email-body h2 {
                                font-size: 22px;
                                color: #FF5733;
                                text-align: center;
                                margin-bottom: 20px;
                            }
                            .email-body p {
                                line-height: 1.6;
                                margin: 10px 0;
                            }
                            .otp-code {
                                font-size: 28px;
                                font-weight: bold;
                                color: #FF5733;
                                text-align: center;
                                margin: 20px 0;
                            }
                            .email-footer {
                                background-color: #f4f4f4;
                                text-align: center;
                                padding: 10px;
                                font-size: 12px;
                                color: #666666;
                            }
                            .email-footer a {
                                color: #FF5733;
                                text-decoration: none;
                            }
                            .email-contact {
                                margin-top: 20px;
                                font-size: 14px;
                            }
                            img {
                                display: block;
                                margin: 0 auto;
                                scale: 1.3;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            <!-- Header with Banner -->
                            <div class="email-header">
                                <img src="cid:unopay_banner" alt="UnoPay Payment App Banner">
                                <h1>UnoPay Payment Service</h1>
                                <p>Provided by UNOTAG MULTI SOLUTION PVT. LTD.</p>
                            </div>
                            <!-- Email Body -->
                            <div class="email-body">
                                <h2>Device Change Detected</h2>
                                <p>Dear Customer,</p>
                                <p>We noticed a login attempt from a new device. To proceed, please use the One-Time Password (OTP) below to verify this device:</p>
                                <p class="otp-code">${otp}</p>
                                <p>For security purposes, logging in from this new device will log your account out of the previous device.</p>
                                <p>If this login attempt was not initiated by you, we strongly recommend changing your password immediately and contacting our support team at <a href="mailto:info@unope.com">info@unope.com</a>.</p>
                                <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
                                <p>Thank you for choosing UnoPay!</p>
                            </div>
                            <!-- Footer -->
                            <div class="email-footer">
                                <p>&copy; ${new Date().getFullYear()} UNOTAG MULTI SOLUTION PVT. LTD. All rights reserved.</p>
                                <p>This email is intended solely for the recipient. Unauthorized use or distribution is strictly prohibited.</p>
                                <p><a href="https://www.unope.com">www.unope.com</a> | <a href="mailto:info@unope.com">info@unope.com</a></p>
                                <p class="email-contact">Contact us: +91-1234567890, +91-0987654321</p>
                            </div>
                        </div>
                    </body>
                    </html>

            `;
        } 
        else if (type === 'forget_password'){
             subject = 'Password Change Otp - UnoPay';
            emailHtml = `
                                <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 20px auto;
                                background-color: #ffffff;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                                border: 1px solid #e0e0e0;
                            }
                            .email-header {
                                background-color: #4CAF50;
                                text-align: center;
                                padding: 20px 0;
                                position: relative;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                            }
                            .email-header img {
                                width: 150px;
                                margin-bottom: 10px;
                            }
                            .email-header h1 {
                                margin: 10px 0 0 0;
                                font-size: 24px;
                                color: #ffffff;
                            }
                            .email-body {
                                padding: 20px;
                                color: #333333;
                            }
                            .email-body h2 {
                                font-size: 22px;
                                color: #4CAF50;
                                text-align: center;
                                margin-bottom: 20px;
                            }
                            .email-body p {
                                line-height: 1.6;
                                margin: 10px 0;
                            }
                            .otp-code {
                                font-size: 28px;
                                font-weight: bold;
                                color: #4CAF50;
                                text-align: center;
                                margin: 20px 0;
                            }
                            .email-footer {
                                background-color: #f4f4f4;
                                text-align: center;
                                padding: 10px;
                                font-size: 12px;
                                color: #666666;
                            }
                            .email-footer a {
                                color: #4CAF50;
                                text-decoration: none;
                            }
                            .email-contact {
                                margin-top: 20px;
                                font-size: 14px;
                            }
                            img {
                                display: block;
                                margin: 0 auto;
                                scale: 1.3;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            <!-- Header with Banner -->
                            <div class="email-header">
                                <img src="cid:unopay_banner" alt="UnoPay Payment App Banner">
                                <h1>UnoPay Payment Service</h1>
                                <p>Provided by UNOTAG MULTI SOLUTION PVT. LTD.</p>
                            </div>
                            <!-- Email Body -->
                            <div class="email-body">
                                <h2>Forgot Your Password?</h2>
                                <p>Dear Customer,</p>
                                <p>We received a request to reset your UnoPay password. Please use the One-Time Password (OTP) below to reset your password:</p>
                                <p class="otp-code">${otp}</p>
                                <p>The OTP is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
                                <p>If you did not request a password reset, please disregard this email. If you believe someone else is attempting to access your account, please contact us at <a href="mailto:info@unope.com">info@unope.com</a>.</p>
                                <p>Thank you for using UnoPay!</p>
                            </div>
                            <!-- Footer -->
                            <div class="email-footer">
                                <p>&copy; ${new Date().getFullYear()} UNOTAG MULTI SOLUTION PVT. LTD. All rights reserved.</p>
                                <p>This email is intended solely for the recipient. Unauthorized use or distribution is strictly prohibited.</p>
                                <p><a href="https://www.unope.com">www.unope.com</a> | <a href="mailto:info@unope.com">info@unope.com</a></p>
                                <p class="email-contact">Contact us: +91-1234567890, +91-0987654321</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    `;
                               

        }
        else if (type==="forget_tpin"){
            subject = 'Tpin Change Otp - UnoPay';
            emailHtml = `
             <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 20px auto;
                                background-color: #ffffff;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                                border: 1px solid #e0e0e0;
                            }
                            .email-header {
                                background-color: #4CAF50;
                                text-align: center;
                                padding: 20px 0;
                                position: relative;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                            }
                            .email-header img {
                                width: 150px;
                                margin-bottom: 10px;
                            }
                            .email-header h1 {
                                margin: 10px 0 0 0;
                                font-size: 24px;
                                color: #ffffff;
                            }
                            .email-body {
                                padding: 20px;
                                color: #333333;
                            }
                            .email-body h2 {
                                font-size: 22px;
                                color: #4CAF50;
                                text-align: center;
                                margin-bottom: 20px;
                            }
                            .email-body p {
                                line-height: 1.6;
                                margin: 10px 0;
                            }
                            .otp-code {
                                font-size: 28px;
                                font-weight: bold;
                                color: #4CAF50;
                                text-align: center;
                                margin: 20px 0;
                            }
                            .email-footer {
                                background-color: #f4f4f4;
                                text-align: center;
                                padding: 10px;
                                font-size: 12px;
                                color: #666666;
                            }
                            .email-footer a {
                                color: #4CAF50;
                                text-decoration: none;
                            }
                            .email-contact {
                                margin-top: 20px;
                                font-size: 14px;
                            }
                            img {
                                display: block;
                                margin: 0 auto;
                                scale: 1.3;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            <!-- Header with Banner -->
                            <div class="email-header">
                                <img src="cid:unopay_banner" alt="UnoPay Payment App Banner">
                                <h1>UnoPay Payment Service</h1>
                                <p>Provided by UNOTAG MULTI SOLUTION PVT. LTD.</p>
                            </div>
                            <!-- Email Body -->
                            <div class="email-body">
                                <h2>Forgot Your TPIN?</h2>
                                <p>Dear Customer,</p>
                                <p>We received a request to reset your UnoPay TPIN. Please use the One-Time Password (OTP) below to reset your TPIN:</p>
                                <p class="otp-code">${otp}</p>
                                <p>The OTP is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
                                <p>If you did not request a TPIN reset, please disregard this email. If you believe someone else is attempting to access your account, please contact us at <a href="mailto:info@unope.com">info@unope.com</a>.</p>
                                <p>Thank you for using UnoPay!</p>
                            </div>
                            <!-- Footer -->
                            <div class="email-footer">
                                <p>&copy; ${new Date().getFullYear()} UNOTAG MULTI SOLUTION PVT. LTD. All rights reserved.</p>
                                <p>This email is intended solely for the recipient. Unauthorized use or distribution is strictly prohibited.</p>
                                <p><a href="https://www.unope.com">www.unope.com</a> | <a href="mailto:info@unope.com">info@unope.com</a></p>
                                <p class="email-contact">Contact us: +91-1234567890, +91-0987654321</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    

            `;
        }
        else if (type === 'kyc') {
            subject = 'KYC OTP Verification - UnoPay';
            emailHtml = `
                <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e0e0e0;
                }
                .email-header {
                    background-color: #4CAF50;
                    text-align: center;
                    padding: 20px 0;
                    position: relative;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                .email-header img {
                    width: 150px;
                    margin-bottom: 10px;
                }
                .email-header h1 {
                    margin: 10px 0 0 0;
                    font-size: 24px;
                    color: #ffffff;
                }
                .email-body {
                    padding: 20px;
                    color: #333333;
                }
                .email-body h2 {
                    font-size: 22px;
                    color: #4CAF50;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .email-body p {
                    line-height: 1.6;
                    margin: 10px 0;
                }
                .otp-code {
                    font-size: 28px;
                    font-weight: bold;
                    color: #4CAF50;
                    text-align: center;
                    margin: 20px 0;
                }
                .email-footer {
                    background-color: #f4f4f4;
                    text-align: center;
                    padding: 10px;
                    font-size: 12px;
                    color: #666666;
                }
                .email-footer a {
                    color: #4CAF50;
                    text-decoration: none;
                }
                .email-contact {
                    margin-top: 20px;
                    font-size: 14px;
                }
                img {
                    display: block;
                    margin: 0 auto;
                    scale: 1.3;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <!-- Header with Banner -->
                <div class="email-header">
                    <img src="cid:unopay_banner" alt="UnoPay Payment App Banner">
                    <h1>UnoPay Payment Service</h1>
                    <p>Provided by UNOTAG MULTI SOLUTION PVT. LTD.</p>
                </div>
                <!-- Email Body -->
                <div class="email-body">
                    <h2>KYC OTP Verification</h2>
                    <p>Dear Customer,</p>
                    <p>You have successfully submitted your KYC details and documents for verification. To complete the KYC process, please verify your identity by entering the One-Time Password (OTP) provided below:</p>
                    <p class="otp-code">${otp}</p>
                    <p>The OTP is valid for <strong>5 minutes</strong> from the time of receipt. Please do not share this code with anyone.</p>
                    <p>Once the OTP is verified, your KYC submission will be completed and processed.</p>
                    <p>The verification process may take up to 2-3 business days. You will be notified once your KYC submission is processed and approved.</p>
                    <p>If you have any questions or need assistance, please contact our support team at <a href="mailto:info@unope.com">info@unope.com</a>.</p>
                
                   
                </div>
                <!-- Footer -->
                <div class="email-footer">
                    <p>&copy; ${new Date().getFullYear()} UNOTAG MULTI SOLUTION PVT. LTD. All rights reserved.</p>
                    <p>This email is intended solely for the recipient. Unauthorized use or distribution is strictly prohibited.</p>
                    <p><a href="https://www.unope.com">www.unope.com</a> | <a href="mailto:info@unope.com">info@unope.com</a></p>
                    <p class="email-contact">Contact us: +91-1234567890, +91-0987654321</p>
                </div>
            </div>
        </body>
        </html>
            `;
        }
        
        else {
            return { success: false, message: 'Invalid OTP type' };
        }

        // Email options
        const mailOptions = {
            from: `"UnoPay Payment App" ${process.env.EMAIL_USER}`,
            to: email,
            subject: subject,
            html: emailHtml,
            attachments: [
                {
                    filename: 'unopay.jpeg',
                    path: 'unopay.jpeg', // Replace with the correct path to your image
                    cid: 'unopay_banner' // Same as referenced in the HTML img tag
                }
            ]
        };

        // Sending the email
        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent: ' + info.response);
        // console.log('Email sent: ',type);

        return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Error sending OTP email', error };
    }
}

/////////////////////////////////////////////
module.exports = { sendOtpEmail,verifyOtp ,sendWelcomeEmail,sendOtpRegister,verifyOtpForRegister,universalOtpEmailSender,deleteOtpForRegister,sendWithdrawalEmail};

   