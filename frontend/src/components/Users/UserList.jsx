import { Table, Switch, Modal, notification, Input, Tag, Row, Col, Typography } from 'antd';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {formatDate } from '../../utils/dateFormat';
const { Text } = Typography;
const Src = import.meta.env.VITE_Src;


export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 12,
  });
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));


  const handleTableChange = (pagination) => {
    setCurrentPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };
  
  // New state for search
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${Src}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      })
      const formattedUsers = response.data.map((user, index) => ({
        key: user.id || index.toString(),
        sno: index + 1,
        memberId: user.memberid,
        username: user.username,
        phoneNo: user.phoneno,
        email: user.email,
        password: user.password,
        tpin: user.tpin,
        createdAt: user.created_at,
        membership: user.membership,
        status: user.status || 'inactive',
      }));

      formattedUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setUsers(formattedUsers);
      setTotalUsers(formattedUsers.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch users.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search text
  const filteredUsers = users.filter(user =>
    Object.values(user).some(value => 
      value && value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  // Calculate summary statistics
  const activeUsers = filteredUsers.filter(user => user.status === 'active').length;
  const inactiveUsers = filteredUsers.filter(user => user.status === 'inactive').length;

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, __, index) =>
        (currentPagination.current - 1) * currentPagination.pageSize + index + 1,
    },
    {
      title: 'Member ID',
      dataIndex: 'memberId',
      key: 'memberId',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Phone No',
      dataIndex: 'phoneNo',
      key: 'phoneNo',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Password',
      dataIndex: 'password',
      key: 'password',
    },
    {
      title: 'TPIN',
      dataIndex: 'tpin',
      key: 'tpin',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => formatDate(text),
    },
    {
      title: 'Membership',
      dataIndex: 'membership',
      key: 'membership',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <>
          <Switch
            checked={status === 'active'}
            onChange={(checked) => showConfirmationModal(
              record.memberId, 
              checked, 
              record.username
            )}
            checkedChildren="active" 
            unCheckedChildren="inactive"
          />
        </>
      ),
    },
  ];

  const showConfirmationModal = (memberId, checked, username) => {
    setCurrentUserId(memberId);
    setCurrentStatus(checked ? 'inactive' : 'active');
    setCurrentUsername(username);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      await axios.post(`${Src}/api/auth/toggleStatus`, {
        memberid: currentUserId,
      });

      setIsModalVisible(false);

      notification.success({
        message: `Status Updated`,
        description: `${currentUsername} (Member ID: ${currentUserId}) has been made ${currentStatus === 'active' ? 'inactive' : 'active'}.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update status. Please try again later.',
      });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      {/* Summary row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div style={{
            display: "flex", 
            flexDirection: "row", 
            gap: 20, 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "10px",
            borderRadius: "4px"
          }}>
            <div>
              <Text strong>Total Users: {totalUsers}</Text>
              <br />
              {/* <Text>Filtered Users: {filteredUsers.length}</Text> */}
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <Tag color="green">Active: {activeUsers}</Tag>
              <Tag color="red">Inactive: {inactiveUsers}</Tag>
            </div>
          </div>
        </Col>
      </Row>

      {/* Search input */}
      <Row style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Input.Search
            placeholder="Search across all fields"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        loading={loading}
        scroll={{ x: true }}
        pagination={{
          current: currentPagination.current,
          pageSize: currentPagination.pageSize,
          total: filteredUsers.length,
        }}
         size="small"
        onChange={handleTableChange}
      />

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Status Change"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>
          Are you sure you want to change the status of {currentUsername} 
          (Member ID: {currentUserId}) to {currentStatus === 'active' ? 'inactive' : 'active'}?
        </p>
      </Modal>
    </>
  );
}