


import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { setupAxiosInterceptors } from './utils/api';
import LoginPage from './pages/login';
import Dashboard from './pages/dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  useEffect(() => {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (token) {
      setupAxiosInterceptors(); // Set up interceptors only after login
    }
  }, []);

  return (
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      );
}

export default App;
