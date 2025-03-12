
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const http = require('http');
const { setupWebSocket } = require('./config/websocket');
const { connectToDatabase } = require('./config/database');
const app = express();
dotenv.config();
require('./utills/scheduler');
// const fs = require('fs');

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
const dailyAddFundandWithdrawReport = require('./routes/dailyAddFundandWithdrawReport');
const cashKawachWebhook = require('./routes/cashKawachWebhook');
const userProfileImage = require('./routes/userProfileImage');
const EditDetails = require('./routes/editDetails');
const AddRemoveFundCommission = require('./routes/AddRemoveFundCommission');
// Middleware
const authenticateToken = require('./middleware/auth');

// Initialize Express app
app.use(bodyParser.json({ strict: true }));
app.use(cors());
app.use(express.json());

// Connect to the database
connectToDatabase();

// Public routes (no authentication required)
app.use('/api/auth', adminLoginRoute);

// Protected routes (require authentication)
app.use('/api/auth', authRoutes);
app.use('/api/auth', authenticateToken, transactionRoutes);
app.use('/api/auth', authenticateToken, adminQR);
app.use('/api/auth', authenticateToken, userBankKyc);
app.use('/api/auth', authenticateToken, rechargeRoutes);
app.use('/api/forget', forgetPassword);
app.use('/api/auth', authenticateToken, buyMembership);
app.use('/api/auth', authenticateToken, userBalanceTransactionList);
app.use('/api/auth', authenticateToken, userTeamAndDirect);
app.use('/api/auth', authenticateToken, user_delete_requests);
app.use('/api/raiseTicket', userRaiseTicket);
app.use('/api/auth', authenticateToken, userWithdrawAndTransfer);
app.use('/api/auth', authenticateToken, ranking_system);
app.use('/api/auth', authenticateToken, closingRoutes);
app.use('/api/auth', authenticateToken, zoomMeeting);
app.use('/api/auth', authenticateToken, UnoPayGallery);
app.use('/api/auth', authenticateToken, dailyAddFundandWithdrawReport);
app.use('/api/webhook', cashKawachWebhook);
app.use('/api/auth', authenticateToken, userProfileImage);
app.use('/api/auth',EditDetails);
app.use('/api/auth', AddRemoveFundCommission);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server
setupWebSocket(server);

// Start the server
const PORT = process.env.PORT || 3000;
app.post("/send-notification", (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }

  const message = JSON.stringify({ title, body });

  if (global.broadcastMessage) {
    global.broadcastMessage(message);
    res.json({ success: true, message: "Notification sent" });
  } else {
    res.status(500).json({ error: "WebSocket broadcast function not available" });
  }
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is active on ws://localhost:${PORT}`);
});















// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const bodyParser = require('body-parser');
// const http = require("http");
// const { setupWebSocket } = require("./config/websocket");
// const { connectToDatabase } = require('./config/database');
// // Add at the end of your main server file
// require('./utills/scheduler');
// const fs = require('fs');

// // Routes
// const authRoutes = require('./routes/auth');
// const transactionRoutes = require('./routes/userAddFund');
// const adminQR = require('./routes/adminQR');
// const userBankKyc = require('./routes/userBankKyc');
// const rechargeRoutes = require('./routes/rechargeRoutes');
// const forgetPassword = require('./routes/forgetPassword');
// const buyMembership = require('./routes/buyMembership');
// const userBalanceTransactionList = require('./routes/userBalanceTransactionList');
// const userTeamAndDirect = require('./routes/userTeamAndDirect');
// const user_delete_requests = require('./routes/userdeleteRequest');
// const userRaiseTicket = require('./routes/userRaiseTicket');
// const userWithdrawAndTransfer = require('./routes/userWithdrawAndTransfer');
// const adminLoginRoute = require('./routes/adminLoginRoute');
// const ranking_system = require('./routes/ranking_system');
// const closingRoutes = require('./routes/closingRoutes');
// const zoomMeeting = require('./routes/zoomMeeting');
// const UnoPayGallery = require('./routes/unoPayGallery');
// // const newOtp=require("./routes/newOtp")
// const dailyAddFundandWithdrawReport = require('./routes/dailyAddFundandWithdrawReport');
// const cashKawachWebhook = require('./routes/cashKawachWebhook');


// // Middleware
// const authenticateToken = require('./middleware/auth');

// // Load environment variables
// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3000;

// // Middleware
// app.use(bodyParser.json({ strict: true }));
// app.use(cors());
// app.use(express.json());




// // Connect to the database
// connectToDatabase();

// // Public routes (no authentication required)
// app.use('/api/auth', adminLoginRoute);

// // Protected routes (require authentication)
// app.use('/api/auth', authRoutes); // Public routes (e.g., login, register)
// app.use('/api/auth', authenticateToken, transactionRoutes);
// app.use('/api/auth', authenticateToken, adminQR);
// app.use('/api/auth', authenticateToken, userBankKyc);
// app.use('/api/auth', authenticateToken, rechargeRoutes);
// app.use('/api/forget',forgetPassword);
// app.use('/api/auth', authenticateToken, buyMembership);
// app.use('/api/auth', authenticateToken, userBalanceTransactionList);
// app.use('/api/auth', authenticateToken, userTeamAndDirect);
// app.use('/api/auth', authenticateToken, user_delete_requests);
// app.use('/api/raiseTicket', userRaiseTicket);
// app.use('/api/auth', authenticateToken, userWithdrawAndTransfer);
// app.use('/api/auth', authenticateToken, ranking_system);
// app.use('/api/auth', authenticateToken, closingRoutes);
// app.use('/api/auth', authenticateToken, zoomMeeting);
// app.use('/api/auth', authenticateToken, UnoPayGallery);
// app.use('/api/auth', authenticateToken, dailyAddFundandWithdrawReport);
// app.use('/api/webhook', cashKawachWebhook);
// // app.use('/api/aditya',newOtp

// // Admin API for sending notifications
// // app.post("/send-notification", (req, res) => {
// //   const { title, body } = req.body;

// //   if (!title || !body) {
// //     return res.status(400).send({ error: "Title and body are required" });
// //   }

// //   const message = JSON.stringify({ title, body }); // Prepare as JSON string
// //   global.broadcastMessage(message); // Broadcast to all WebSocket clients
// //   res.send({ success: true, message: "Notification sent" });
// // });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Something broke!');
// });

// // Create HTTP server
// // const server = http.createServer(app);

// // Setup WebSocket server
// // setupWebSocket(server);


// // Start the server
// app.listen(port, "0.0.0.0", () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

