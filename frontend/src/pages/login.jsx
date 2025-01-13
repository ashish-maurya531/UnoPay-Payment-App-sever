// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { 
//   Form, 
//   Input, 
//   Button, 
//   Typography, 
//   Card, 
//   message 
// } from 'antd';
// import { 
//   UserOutlined, 
//   LockOutlined 
// } from '@ant-design/icons';

// const { Title } = Typography;

// export default function LoginPage() {
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (values) => {
//     setLoading(true);
//     try {
//       const response = await axios.post('http://localhost:3000/api/auth/adminLogin', {
//         name: values.username, 
//         password: values.password
//       });

//       if (response.data.message === 'Admin logged in successfully') {
//         // Store admin info in localStorage
//         localStorage.setItem('adminId', response.data.adminId);
        
//         // Show success toast
//         message.success('Login Successful! Redirecting to Dashboard');
        
//         // Short delay to show toast before navigating
//         setTimeout(() => {
//           navigate('/dashboard');
//         }, 1000);
//       }
//     } catch (error) {
//       // Show error toast
//       message.error('Login failed. Please check your credentials.');
//       console.error('Login failed:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div 
//       className="flex items-center justify-center min-h-screen bg-gray-50"
//     >
//       <Card 
//         className="w-full max-w-md p-6 shadow-md"
//       >
//         <div className="text-center mb-6">
//           <Title level={2} className="text-gray-800">
//             UNO PAYMENT
//           </Title>
//           <Title level={4} className="text-gray-500">
//             Admin Panel
//           </Title>
//         </div>
        
//         <Form
//           name="login"
//           initialValues={{ remember: true }}
//           onFinish={handleSubmit}
//         >
//           <Form.Item
//             name="username"
//             rules={[{ 
//               required: true, 
//               message: 'Please input your Username!' 
//             }]}
//           >
//             <Input 
//               prefix={<UserOutlined />} 
//               placeholder="Username" 
//             />
//           </Form.Item>

//           <Form.Item
//             name="password"
//             rules={[{ 
//               required: true, 
//               message: 'Please input your Password!' 
//             }]}
//           >
//             <Input.Password
//               prefix={<LockOutlined />}
//               placeholder="Password"
//             />
//           </Form.Item>

//           <Form.Item>
//             <Button 
//               type="primary" 
//               htmlType="submit" 
//               className="w-full"
//               loading={loading}
//             >
//               Log in
//             </Button>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// }



// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { 
//   Form, 
//   Input, 
//   Button, 
//   Typography, 
//   Card, 
//   message,
//   Checkbox 
// } from 'antd';
// import { 
//   UserOutlined, 
//   LockOutlined 
// } from '@ant-design/icons';

// const { Title } = Typography;

// // Axios interceptor to include the token in every request
// axios.interceptors.request.use((config) => {
//   const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
//   if (token) {
//     config.headers['Authorization'] = `Bearer ${token}`;
//   }
//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

// // Axios interceptor to handle token expiry
// axios.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       // Token expired or invalid
//       localStorage.removeItem('adminToken');
//       sessionStorage.removeItem('adminToken');
//       message.error('Session expired. Please log in again.');
//       window.location.href = '/login'; // Redirect to login page
//     }
//     return Promise.reject(error);
//   }
// );

// export default function LoginPage() {
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (values) => {
//     setLoading(true);
//     try {
//       const response = await axios.post('http://localhost:3000/adminLogin2', {
//         name: values.username, 
//         password: values.password
//       });

//       if (response.data.message === 'Admin logged in successfully') {
//         // Store token based on "Remember Me" selection
//         if (values.remember) {
//           localStorage.setItem('adminToken', response.data.token);
//         } else {
//           sessionStorage.setItem('adminToken', response.data.token);
//         }

//         // Show success toast
//         message.success('Login Successful! Redirecting to Dashboard');
        
//         // Short delay to show toast before navigating
//         setTimeout(() => {
//           navigate('/dashboard');
//         }, 1000);
//       }
//     } catch (error) {
//       if (error.response) {
//         // Server responded with an error status code
//         if (error.response.status === 401) {
//           message.error('Invalid credentials. Please try again.');
//         } else {
//           message.error('Something went wrong. Please try again later.');
//         }
//       } else if (error.request) {
//         // No response received (network error)
//         message.error('Network error. Please check your connection.');
//       } else {
//         // Something else went wrong
//         message.error('An unexpected error occurred. Please try again.');
//       }
//       console.error('Login failed:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div 
//       className="flex items-center justify-center min-h-screen bg-gray-50"
//     >
//       <Card 
//         className="w-full max-w-md p-6 shadow-md"
//       >
//         <div className="text-center mb-6">
//           <Title level={2} className="text-gray-800">
//             UNO PAYMENT
//           </Title>
//           <Title level={4} className="text-gray-500">
//             Admin Panel
//           </Title>
//         </div>
        
//         <Form
//           name="login"
//           initialValues={{ remember: true }}
//           onFinish={handleSubmit}
//         >
//           <Form.Item
//             name="username"
//             rules={[{ 
//               required: true, 
//               message: 'Please input your Username!' 
//             }]}
//           >
//             <Input 
//               prefix={<UserOutlined />} 
//               placeholder="Username" 
//             />
//           </Form.Item>

//           <Form.Item
//             name="password"
//             rules={[{ 
//               required: true, 
//               message: 'Please input your Password!' 
//             }, {
//               min: 4,
//               message: 'Password must be at least 6 characters long!'
//             }]}
//           >
//             <Input.Password
//               prefix={<LockOutlined />}
//               placeholder="Password"
//             />
//           </Form.Item>

//           <Form.Item name="remember" valuePropName="checked">
//             <Checkbox>Remember me</Checkbox>
//           </Form.Item>

//           <Form.Item>
//             <Button 
//               type="primary" 
//               htmlType="submit" 
//               className="w-full"
//               loading={loading}
//             >
//               Log in
//             </Button>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// }




import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Form, 
  Input, 
  Button, 
  Typography, 
  Card, 
  message,
  Checkbox 
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined 
} from '@ant-design/icons';

const { Title } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/adminLogin2', {
        name: values.username,
        password: values.password,
      });
  
      if (response.data.message === 'Admin logged in successfully') {
        const token = response.data.token;
  
        // Store token based on "Remember Me" selection
        if (values.remember) {
          localStorage.setItem('adminToken', token);
        } else {
          sessionStorage.setItem('adminToken', token);
        }
  
        // Show success toast and navigate
        message.success('Login Successful! Redirecting to Dashboard');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        // Handle unexpected success response
        message.error('Unexpected response. Please try again.');
      }
    } catch (error) {
      if (error.response) {
        // Backend returned an error
        if (error.response.status === 401) {
          const errorMessage = error.response.data.error;
          if (errorMessage === 'Invalid credentials1') {
            message.error('Admin not found. Please check the username.');
          } else if (errorMessage === 'Invalid credentials2') {
            message.error('Invalid password. Please try again.');
          } else {
            message.error('Login failed. Please check your credentials.');
          }
        } else if (error.response.status === 500) {
          message.error('Server error. Please try again later.');
        } else {
          message.error('Something went wrong. Please try again later.');
        }
      } else if (error.request) {
        // Network error
        message.error('Network error. Please check your connection.');
      } else {
        // Unexpected error
        message.error('An unexpected error occurred. Please try again.');
      }
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md p-6 shadow-md">
        <div className="text-center mb-6">
          <Title level={2} className="text-gray-800">
            UNO PAYMENT
          </Title>
          <Title level={4} className="text-gray-500">
            Admin Panel
          </Title>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your Password!' },
              { min: 4, message: 'Password must be at least 6 characters long!' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>Remember me</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
