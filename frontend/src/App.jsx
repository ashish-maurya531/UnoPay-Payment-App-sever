// import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// import LoginPage from './pages/login';
// import Dashboard from './pages/dashboard';
// import ProtectedRoute from './components/ProtectedRoute';
// function App() {
  
//   return (
//     <Router>
//       <Routes>
//         <Route path="/login" element={<LoginPage />} />
//         <Route
//           path="/dashboard/*"
//           element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           }
//         />
//         <Route path="/" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;




// // App.jsx
// import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// import axios from 'axios';
// import { notification } from 'antd';
// import LoginPage from './pages/login';
// import Dashboard from './pages/dashboard';
// import ProtectedRoute from './components/ProtectedRoute';
// import { useEffect } from 'react';
// import {jwtDecode} from 'jwt-decode';

// // Token expiration check function
// const isTokenExpired = () => {
//   const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
 
//   const decoded = jwtDecode(adminToken);
//   const expiryTime = decoded.exp
//   return expiryTime ? Date.now() > expiryTime : true;
// };

// // Axios Interceptors (Request and Response)
// axios.interceptors.request.use(
//   (config) => {
//     // Check token validity before every request
//     if (isTokenExpired()) {
//       notification.error({
//         message: 'Token Expired',
//         description: 'Your session has expired. Please log in again.',
//       });
//       window.location.href = '/login'; // Redirect to login page
//       return Promise.reject('Token expired');
//     }
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// axios.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       notification.error({
//         message: 'Session Expired',
//         description: 'Your session has expired. Please log in again.',
//       });
//       localStorage.removeItem('token');
//       localStorage.removeItem('tokenExpiry');
//       window.location.href = '/login'; // Redirect to login page
//     }
//     return Promise.reject(error);
//   }
// );

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/login" element={<LoginPage />} />
//         <Route
//           path="/dashboard/*"
//           element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           }
//         />
//         <Route path="/" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;




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
