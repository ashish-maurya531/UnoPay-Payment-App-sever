import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Form, 
  Input, 
  Button, 
  Typography, 
  Card, 
  message 
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
      const response = await axios.post('http://localhost:3000/api/auth/adminLogin', {
        name: values.username, 
        password: values.password
      });

      if (response.data.message === 'Admin logged in successfully') {
        // Store admin info in localStorage
        localStorage.setItem('adminId', response.data.adminId);
        
        // Show success toast
        message.success('Login Successful! Redirecting to Dashboard');
        
        // Short delay to show toast before navigating
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error) {
      // Show error toast
      message.error('Login failed. Please check your credentials.');
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-gray-50"
    >
      <Card 
        className="w-full max-w-md p-6 shadow-md"
      >
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
            rules={[{ 
              required: true, 
              message: 'Please input your Username!' 
            }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Username" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ 
              required: true, 
              message: 'Please input your Password!' 
            }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full"
              loading={loading}
            >
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}