// // ProtectedRoute.js
// import { useEffect, useState } from 'react';
// import { Navigate } from 'react-router-dom';
// // Correct the import statement
// import { jwtDecode } from "jwt-decode";


// const ProtectedRoute = ({ children }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(true); // Start with true to render children
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const checkTokenValidity = () => {
//       const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      
//       if (!adminToken) {
//         setIsAuthenticated(false);
//         setLoading(false);
//         return;
//       }

//       try {
//         console.log("fgdgdfgdgggf")
//         const decoded = jwtDecode(adminToken);
//         const currentTime = Date.now() / 1000;
//         console.log("----------------------------------------------------------------")
//         console.log(decoded.exp)
//         console.log(currentTime)

//         // If the token is expired, log out the user
//         if (decoded.exp < currentTime) {
//           localStorage.removeItem('adminToken');
//           sessionStorage.removeItem('adminToken');
//           setIsAuthenticated(false);
//         } else {
//           setIsAuthenticated(true);
//         }
//       } catch (error) {
//         // If the token is invalid or malformed
//         console.error('Invalid or expired token:', error);
        
//         localStorage.removeItem('adminToken');
//         sessionStorage.removeItem('adminToken');
//         setIsAuthenticated(false);
//       }

//       setLoading(false);
//     };

//     checkTokenValidity();
//   }, []);

//   // Show loading state while checking the token
//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   // If not authenticated, redirect to the login page
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   // Otherwise, render the children (protected component)
//   return children;
// };

// export default ProtectedRoute;




// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { notification } from 'antd';
import {jwtDecode} from 'jwt-decode'; // Correct import for jwt-decode
const Src = import.meta.env.VITE_Src;

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Start with null to indicate loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTokenValidity = () => {
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      
      if (!adminToken) {
        // No token found, user is not authenticated
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(adminToken); // Decode token to get expiry info
        const currentTime = Date.now() / 1000; // Get current time in seconds

        // If token has expired, remove it from storage and update state
        if (decoded.exp < currentTime) {
          localStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminToken');
          setIsAuthenticated(false);
          notification.error({
            message: 'Session Expired',
            description: 'Your session has expired. Please log in again.',
          });
        } else {
          // Token is still valid
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Handle invalid or malformed token
        // console.error('Invalid or expired token:', error);
        
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminToken');
        setIsAuthenticated(false);

        notification.error({
          message: 'Error',
          description: 'There was an issue with your authentication token.',
        });
      }

      setLoading(false);
    };

    checkTokenValidity();
  }, []);

  // Show loading state while the token is being validated
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a loading spinner if preferred
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the protected children component
  return children;
};

export default ProtectedRoute;
