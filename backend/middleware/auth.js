const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  // console.log("auth token---->"+token);

  if (!token) {
    return res.status(200).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(200 ).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // Attach the decoded user data to the request object
    next();
  });
}


// function authenticateToken(req, res, next) {
//   // console.log("Token check is skipped. Allowing all requests.");
//   next(); 
// }
// Export the middleware correctly
module.exports = authenticateToken;