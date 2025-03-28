import { Layout, Menu, Dropdown, Button, Space } from 'antd';
import { UserOutlined, CreditCardOutlined, LogoutOutlined, DashboardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
const Src = import.meta.env.VITE_Src;

const { Header, Content } = Layout;

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();

  // const handleLogout = () => {
  //   localStorage.removeItem('adminId');
  //   navigate('/login');
  // };

  const handleLogout = () => {
    localStorage.removeItem('adminToken'); // Clear the token from localStorage
    sessionStorage.removeItem('adminToken'); // Clear the token from sessionStorage
    navigate('/login'); // Redirect to login page
  };

  const userMenuItems = [
    {
      key: 'userList',
      label: 'User List',
      onClick: () => navigate('/dashboard/users'),
    },
    {
      key: 'activationReport',
      label: 'Activation Report',
      onClick: () => navigate('/dashboard/activation-report'),
    },
    {
      key: 'TeamList',
      label: 'Team List',
      onClick: () => navigate('/dashboard/team-list'),
    },
    {
      key: 'UserTree',
      label: 'User Tree',
      onClick: () => navigate('/dashboard/user-tree'),
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
    {
      key: 'UserDeleteRequest',
      label: 'User Account Delete Request',
      onClick: () => navigate('/dashboard/user-delete-request'),
    },
    {
      key: 'UserWithdrawRequest',
      label: 'User Money Withdraw Request',
      onClick: () => navigate('/dashboard/user-withdraw-request'),
    },
    {
      key: 'UserRanking',
      label: 'User Ranking',
      onClick: () => navigate('/dashboard/user-rank'),
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

    {
      key: 'UserWalletDetails',
      label: 'User wallet Payment List',
      onClick: () => navigate('/dashboard/User-wallet-payment-list'),
    },
    {
      key: 'UserCommissionWalletDetails',
      label: 'User Commission List',
      onClick: () => navigate('/dashboard/User-Commission-list'),
    },
    {
      key: 'UserAllTypeBalance',
      label: 'User Balance',
      onClick: () => navigate('/dashboard/User-all-type-balance'),
    },
  ];
  
  const adminMenuItems = [
    {
      key: 'EditUserDetails',
      label: 'Edit User Details',
      onClick: () => navigate('/dashboard/edit-user-details'),
    },
    {
      key: 'AddRemoveFundCommission',
      label: 'Add/Remove Fund/ Commission',
      onClick: () => navigate('/dashboard/add-remove-fund-commission'),
    },
    {
      key: 'AdminQrList',
      label: 'Admin Payment QR List',
      onClick: () => navigate('/dashboard/qr-list'),
    },
    {
      key: 'Manage Meeting',
      label: 'Manage Meeting',
      onClick: () => navigate('/dashboard/manage-meeting'),
    },
    {
      key: 'generateIds',
      label: 'Generate User IDs',
      onClick: () => navigate('/dashboard/generate-ids'),
    },
    {
      key: 'CompanyClosing',
      label: 'Company Closing',
      onClick: () => navigate('/dashboard/company-closing'),
    },
    {
      key: 'UnoPayGallery',
      label: 'UnoPay Gallery',
      onClick: () => navigate('/dashboard/uno-pay-gallery'),
    },
    {
      key: 'DailyCollectionReport',
      label: 'Daily Collection Report',
      onClick: () => navigate('/dashboard/daily-collection-report'),
    }
  ]


  const useHelpDesk=[
    {
      key: 'UserHelpDesk',
      label: 'User Help Desk',
      onClick: () => navigate('/dashboard/user-help-desk'),

    },
    {
      key: 'UserLoginHelpRequest',
      label: 'User Login Help Request',
      onClick: () => navigate('/dashboard/user-login-help-request'),

    }

  ]


  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between bg-white px-6 shadow-md">
      <div className="flex items-center justify-between space-x-4">
  <h1 className="text-xl font-semibold text-orange-500">UNO PAY Admin Dashboard</h1>

  <Button 
    type="primary" 
    icon={<DashboardOutlined />}
    onClick={() => navigate('/dashboard')}
  >
    Dashboard
  </Button>
</div>

       
        <Space size="middle">
          <Space size="small">
          <Dropdown menu={{ items: adminMenuItems }} placement="bottomLeft">
              <Button type="primary" icon={<UserOutlined />}>
               Admin
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
            <Dropdown menu={{ items: useHelpDesk }} placement="bottomLeft">
            <Button type="primary" icon={<UserOutlined />}>
                User Help
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

