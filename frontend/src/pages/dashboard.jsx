

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
import UserLoginHelpRequest from '../components/Users/UserLoginHelpRequest';
import UserRankList from '../components/Users/UserRanking.jsx';
import CompanyClosing from '../components/Admin/companyClosing.jsx';
import * as jwt_decode from 'jwt-decode';
import UnoPayGallery from '../components/Admin/UnoPayGallery.jsx';



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
        <Route path="user-login-help-request" element={<UserLoginHelpRequest />} />
        <Route path="user-rank" element={<UserRankList />} />
        <Route path="company-closing" element={<CompanyClosing />} />
        <Route path="uno-pay-gallery" element={<UnoPayGallery />} />

      

      </Routes>
    </DashboardLayout>
  );
}

