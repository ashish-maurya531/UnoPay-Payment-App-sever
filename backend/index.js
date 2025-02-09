
// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const bodyParser = require('body-parser');
// const http = require("http");
// const { setupWebSocket } = require("./config/websocket");


// const authRoutes = require('./routes/auth');
// const transactionRoutes = require('./routes/userAddFund');
// const adminQR= require('./routes/adminQR');
// const userBankKyc= require('./routes/userBankKyc');
// const rechargeRoutes = require('./routes/rechargeRoutes'); //
// const forgetPassword = require('./routes/forgetPassword');//
// const { connectToDatabase } = require('./config/database');
// const buyMembership = require('./routes/buyMembership');
// const userBalanceTransactionList = require('./routes/userBalanceTransactionList');
// const userTeamAndDirect = require('./routes/userTeamAndDirect');
// const user_delete_requests = require('./routes/userdeleteRequest');
// const userRaiseTicket=require('./routes/userRaiseTicket');
// const userWithdrawAndTransfer = require('./routes/userWithdrawAndTransfer')

// const authenticateToken  = require('./middleware/auth');
// const adminLoginRoute = require('./routes/adminLoginRoute');
// const ranking_system = require('./routes/ranking_system');




// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3000;

// app.use(bodyParser.json({ strict: true }));
// app.use(cors());
// app.use(express.json());
// // index.js



// // Connect to the database
// connectToDatabase();

// // Public routes (no authentication required)
// app.use('/', adminLoginRoute);

// // Apply authenticateToken middleware selectively to protected routes
// app.use('/api/auth', authRoutes); // Public routes (e.g., login, register)
// app.use('/api/auth', authenticateToken, transactionRoutes); // Protected
// app.use('/api/auth', authenticateToken, adminQR); // Protected
// app.use('/api/auth', authenticateToken, userBankKyc); // Protected
// app.use('/api/auth', authenticateToken, rechargeRoutes); // Protected
// app.use('/api/auth', authenticateToken, forgetPassword); // Protected
// app.use('/api/auth', authenticateToken, buyMembership); // Protected
// app.use('/api/auth', authenticateToken, userBalanceTransactionList); // Protected
// app.use('/api/auth', authenticateToken, userTeamAndDirect); // Protected
// app.use('/api/auth', authenticateToken, user_delete_requests); // Protected
// app.use('/api/auth', authenticateToken, userRaiseTicket); // Protected
// app.use('/api/auth', authenticateToken, userWithdrawAndTransfer); // Protected
// app.use('/api/auth', authenticateToken,ranking_system)
// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.log(req.body); // Log the request body

//   console.error(err.stack);
//   res.status(500).send('Something broke!');
// });

// // Admin API for sending notifications
// app.post("/send-notification", (req, res) => {
//   const { title, body } = req.body;
//   console.log(title,body)

//   if (!title || !body) {
//     return res.status(400).send({ error: "Title and body are required" });
//   }

//   // Use the WebSocket function to broadcast the message
//   const message = JSON.stringify({ title, body }); // Prepare as JSON string
//   global.broadcastMessage(message); // `broadcastMessage` is globally available
//   res.send({ success: true, message: "Notification sent" });
// });

// // Create HTTP server
// const server = http.createServer(app);

// // Setup WebSocket server
// setupWebSocket(server);


// const PORT = 3000;
// server.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

// app.listen(port,"0.0.0.0" ,() => {
//   console.log(`Server running on port ${port}`);
// });




const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const http = require("http");
const { setupWebSocket } = require("./config/websocket");
const { connectToDatabase } = require('./config/database');
// Add at the end of your main server file
require('./utills/scheduler');
const fs = require('fs');

// Routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/userAddFund');
const adminQR = require('./routes/adminQR');
const userBankKyc = require('./routes/userBankKyc');
const rechargeRoutes = require('./routes/rechargeRoutes');
const forgetPassword = require('./routes/forgetPassword');
const buyMembership = require('./routes/buyMembership');
const userBalanceTransactionList = require('./routes/userBalanceTransactionList');
const userTeamAndDirect = require('./routes/userTeamAndDirect');
const user_delete_requests = require('./routes/userdeleteRequest');
const userRaiseTicket = require('./routes/userRaiseTicket');
const userWithdrawAndTransfer = require('./routes/userWithdrawAndTransfer');
const adminLoginRoute = require('./routes/adminLoginRoute');
const ranking_system = require('./routes/ranking_system');
const closingRoutes = require('./routes/closingRoutes');
const zoomMeeting = require('./routes/zoomMeeting');
const UnoPayGallery = require('./routes/unoPayGallery');
const path = require('path');



// Middleware
const authenticateToken = require('./middleware/auth');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ strict: true }));
app.use(cors());
app.use(express.json());
// Serve static files from the "UnoPayGallery" directory
// Serve static files correctly from VPS
app.use('/UnoPayGallery', express.static(path.join(__dirname, 'UnoPayGallery')));

// Ensure image URLs use the VPS domain
const BASE_URL = process.env.BASE_URL || 'https://unotag.biz';




// Your other routes and middleware
// app.use('/api', require('./routes/gallery'));

// Connect to the database
connectToDatabase();

// Public routes (no authentication required)
app.use('/api/auth', adminLoginRoute);

// Protected routes (require authentication)
app.use('/api/auth', authRoutes); // Public routes (e.g., login, register)
app.use('/api/auth', authenticateToken, transactionRoutes);
app.use('/api/auth', authenticateToken, adminQR);
app.use('/api/auth', authenticateToken, userBankKyc);
app.use('/api/auth', authenticateToken, rechargeRoutes);
app.use('/api/auth', authenticateToken, forgetPassword);
app.use('/api/auth', authenticateToken, buyMembership);
app.use('/api/auth', authenticateToken, userBalanceTransactionList);
app.use('/api/auth', authenticateToken, userTeamAndDirect);
app.use('/api/auth', authenticateToken, user_delete_requests);
app.use('/api/auth', authenticateToken, userRaiseTicket);
app.use('/api/auth', authenticateToken, userWithdrawAndTransfer);
app.use('/api/auth', authenticateToken, ranking_system);
app.use('/api/auth', authenticateToken, closingRoutes);
app.use('/api/auth', authenticateToken, zoomMeeting);
app.use('/api/auth', authenticateToken, UnoPayGallery);

// Admin API for sending notifications
app.post("/send-notification", (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).send({ error: "Title and body are required" });
  }

  const message = JSON.stringify({ title, body }); // Prepare as JSON string
  global.broadcastMessage(message); // Broadcast to all WebSocket clients
  res.send({ success: true, message: "Notification sent" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Create HTTP server
// const server = http.createServer(app);

// Setup WebSocket server
// setupWebSocket(server);


// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});

