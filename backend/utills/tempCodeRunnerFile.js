function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Ensures a 6-digit OTP
}
console.log(generateOtp());