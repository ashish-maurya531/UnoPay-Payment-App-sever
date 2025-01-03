require('dotenv').config(); // Load environment variables
const nodemailer = require('nodemailer');

// Global transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Replace with your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

module.exports = transporter;
