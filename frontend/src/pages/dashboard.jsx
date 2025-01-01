

import { useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import UserList from '../components/Users/UserList.jsx';
import BankDetails from '../components/Users/BankDetails.jsx';
import GenerateIds from '../components/Users/GenerateIds';
import QRList from '../components/Admin/QRList.jsx';
import UserAddFundRequest from '../components/Users/UserAddFundRequest';
import PaymentRequests from '../components/Payment/PaymentRequests';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (!adminId) {
      navigate('/login');
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
        <Route path="payment-requests" element={<PaymentRequests />} />
        <Route path="user-add-fund-request" element={<UserAddFundRequest />} />

      </Routes>
    </DashboardLayout>
  );
}

