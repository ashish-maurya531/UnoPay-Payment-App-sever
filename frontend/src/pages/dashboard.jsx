

import { useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import UserList from '../components/Users/UserList.jsx';
import BankDetails from '../components/Users/BankDetails.jsx';
import GenerateIds from '../components/Users/GenerateIds';
import QRList from '../components/Admin/QRList.jsx';
import UserAddFundRequest from '../components/Users/UserAddFundRequest';
import PaymentAll from '../components/Payment/PaymentAll.jsx';
import UserHelpDesk from '../components/Users/UserHelpDesk';

import UserWalletPaymentList from '../components/Payment/UserWalletTransactions.jsx';
import UserCommissionWalletPaymentList from '../components/Payment/UserCommissionWalletTransactions.jsx';
import UserWithdrawRequest from '../components/Users/UserWithdrawRequest.jsx';

import UserAllTypeBalance from '../components/Payment/UserAllTypeBalance';

import UserDeleteRequest from '../components/Users/UserDeleteRequest';
import * as jwt_decode from 'jwt-decode';


export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // const adminId = localStorage.getItem('adminId');
    var adminToken =null
   
      adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        adminToken=sessionStorage.getItem('adminToken');
        if (!adminToken) {
          navigate('/login');
  
      }
    }

  }, [navigate]);


  

  return (
    <DashboardLayout>
      <Routes>
      <Route path="/" element={<UserList />} />
        <Route path="users" element={<UserList />} />
        <Route path="bank-details" element={<BankDetails />} />
        <Route path="generate-ids" element={<GenerateIds />} />
        <Route path="qr-list" element={<QRList />} />
        <Route path="payment-requests" element={<PaymentAll />} />
        <Route path="user-add-fund-request" element={<UserAddFundRequest />} />
        <Route path="user-delete-request" element={<UserDeleteRequest />} />
        <Route path="user-help-desk" element={<UserHelpDesk />} />
        <Route path="User-wallet-payment-list" element={<UserWalletPaymentList />} />
        <Route path="User-Commission-list" element={<UserCommissionWalletPaymentList />} />
        <Route path="user-withdraw-request" element={<UserWithdrawRequest />} />
        <Route path="User-all-type-balance" element={<UserAllTypeBalance/>} />

      </Routes>
    </DashboardLayout>
  );
}

