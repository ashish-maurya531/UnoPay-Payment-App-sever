
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/userAddFund');
const adminQR= require('./routes/adminQR');
const userBankKyc= require('./routes/userBankKyc');
const rechargeRoutes = require('./routes/rechargeRoutes'); //
const forgetPassword = require('./routes/forgetPassword');//
const { connectToDatabase } = require('./config/database');
const buyMembership = require('./routes/buyMembership');
const userBalanceTransactionList = require('./routes/userBalanceTransactionList');
const userTeamAndDirect = require('./routes/userTeamAndDirect');
const user_delete_requests = require('./routes/userdeleteRequest');
const userRaiseTicket=require('./routes/userRaiseTicket');
// const {authenticateToken}=require('./middleware/auth');

// const bodyParser = require('body-parser');
// const rawBody = require('raw-body');


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connect to the database
connectToDatabase();

// app.use(express.json({ limit: '50mb' })); // Adjust the limit as needed
// app.use(express.urlencoded({ limit: '50mb', extended: true }));


// app.use((req, res, next) => {
//   console.log('Request received:', req.method, req.url);
//     rawBody(req, {
//         length: req.headers['content-length'],
//         limit: '50mb', // Increase the limit
//     }, (err, string) => {
//         if (err) return next(err);
//         req.body = string;
//         next();
//     });
//     console.log(req.body);
//     res.json(req.body);
// });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', transactionRoutes);
app.use('/api/auth',  adminQR);
app.use('/api/auth',userBankKyc);
app.use('/api/auth',rechargeRoutes);
app.use('/api/auth',forgetPassword);
app.use('/api/auth',buyMembership);
app.use('/api/auth',userBalanceTransactionList);
app.use('/api/auth',userTeamAndDirect);
app.use('/api/auth',user_delete_requests);
app.use('/api/auth',userRaiseTicket);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


