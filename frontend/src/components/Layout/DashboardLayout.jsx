import { Layout, Menu, Dropdown, Button, Space } from 'antd';
import { UserOutlined, CreditCardOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminId');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'userList',
      label: 'User List',
      onClick: () => navigate('/dashboard/users'),
    },
    {
      key: 'bankDetails',
      label: 'Bank and Kyc Details',
      onClick: () => navigate('/dashboard/bank-details'),
    },
    
    {
      key: 'UserAddFundRequest',
      label: 'User Add Fund Request',
      onClick: () => navigate('/dashboard/user-add-fund-request'),
    },
  ];
  
  const paymentMenuItems = [
    // {
    //   key: 'qrList',
    //   label: 'Admin Payment QR List',
    //   onClick: () => navigate('/dashboard/qr-list'),
    // },
    {
      key: 'paymentRequests',
      label: 'All Payment Details',
      onClick: () => navigate('/dashboard/payment-requests'),
    },
  ];
  
  const adminMenuItems = [
    {
      key: 'AdminQrList',
      label: 'Admin Payment QR List',
      onClick: () => navigate('/dashboard/qr-list'),
    },
    {
      key: 'generateIds',
      label: 'Generate User IDs',
      onClick: () => navigate('/dashboard/generate-ids'),
    }
  ]


  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between bg-white px-6 shadow-md">
        <div className="text-xl font-semibold text-orange-500">
          UNO PAY Admin Dashboard
        </div>
        <Space size="middle">
          <Space size="small">
          <Dropdown menu={{ items: adminMenuItems }} placement="bottomLeft">
              <Button type="primary" icon={<UserOutlined />}>
               Admin Qr
              </Button>
            </Dropdown>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomLeft">
              <Button type="primary" icon={<UserOutlined />}>
                Users
              </Button>
            </Dropdown>
            <Dropdown menu={{ items: paymentMenuItems }} placement="bottomLeft">
              <Button type="primary" icon={<CreditCardOutlined />}>
                Payment
              </Button>
            </Dropdown>
          </Space>
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </Space>
      </Header>
      <Content className="p-6">
        <div className="min-h-full rounded-lg bg-white p-6 shadow-md">
          {children}
        </div>
      </Content>
    </Layout>
  );
}

