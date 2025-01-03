
const {pool}=require('../config/database');
const transporter = require('../config/mailer');
// const transporter = require('../');


//function that takes the member_id and take out the email address from usersdetails table and send mail using nodemoailer


// Helper function to generate a 6-digit OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Ensures a 6-digit OTP
}
// console.log(generateOtp());

// const cleanExpiredOTPs = async () => {
//     const query = `
//         DELETE FROM otp_store WHERE expiry < NOW();
//     `;
//     await pool.query(query);
// };
// cleanExpiredOTPs();



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

        // const { email } = rows[0];
        // const email="rootleo1571995@gmail.com";
        const email="apskumar24@gmail.com";


        // Generate a 6-digit OTP
        const otp = generateOtp();
        console.log(otp);
        const insertOTP = async (memberId, otp) => {
            const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
            const query = `
                INSERT INTO otp_store (member_id, otp, expiry)
                VALUES (?, ?, ?)
            `;
            await pool.query(query, [memberId, otp, expiryTime]);
        };
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
        return { success: true, message: 'OTP sent successfully', otp }; // Return the OTP for testing/debugging
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Error sending OTP email', error };
    }
}
module.exports = { sendOtpEmail };
// Example usage
// console.log(await sendOtpEmail("UP100070"));

   