import { Table, Switch, Modal, notification, Input, Row, Col, Typography, Button, Tooltip } from 'antd';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDate } from '../../utils/dateFormat';
import { CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;
const Src = import.meta.env.VITE_Src;


export default function LoginIssueRequestList() {
  const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')

  const [loginIssues, setLoginIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 10,
  });


  const handleTableChange = (pagination) => {
    setCurrentPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  useEffect(() => {
    fetchLoginIssueRequests();
  }, []);

  const fetchLoginIssueRequests = async () => {
  console.log("Login token "+token);

    try {
      setLoading(true);
      const response = await axios.post(`${Src}/api/auth/all-login-issues`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      });
      console.log("sdfsfsfdsfdsf->>>>"+response[0])
      
      const formattedRequests = response.data.requests.map((request, index) => ({
        key: request.login_issue_id,
        sno: index + 1,
        request_id: request.login_issue_id,
        email: request.email || '-',
        memberId: request.member_id || '-',
        message: request.message_by_user,
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      }));

      setLoginIssues(formattedRequests);
    } catch (error) {
      console.error('Error fetching login issue requests:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch login issue requests.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (loginIssueId, newStatus) => {
    try {
      const response = await axios.post(
        `${Src}/api/auth/update-login-issue-status`,
        { 
          login_issue_id: loginIssueId,
          status: newStatus,
        }, 
        {
          headers: {
            Authorization: `Bearer ${token}`, // Ensure authentication if required
            "Content-Type": "application/json", // Explicitly define JSON format
          },
        }
      );
      

      if (response.data.message === 'Status updated successfully') {
        notification.success({
          message: 'Login Issue Status Updated',
          description: `The login issue request has been updated to ${newStatus}.`,
        });
        fetchLoginIssueRequests();
      } else {
        notification.error({
          message: 'Error',
          description: response.data.message,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      notification.error({
        message: 'Error',
        description: 'An error occurred while updating the status. Please try again later.',
      });
    }
  };

  const handleDeleteRequest = async (loginIssueId) => {
    console.log(loginIssueId);
    try {
      // Make the API request to delete the login issue
      const response = await axios.post(
        `${Src}/api/auth/delete-login-issue`,
        { 
          login_issue_id: loginIssueId 
        }, 
        {
          headers: {
            Authorization: `Bearer ${token}`, // Ensure authentication if required
            "Content-Type": "application/json", // Explicitly define JSON format
          },
        }
      );
      
  
      // Check the response from the backend
      console.log(response);
      if (response.data.message === 'Login issue deleted successfully') {
        notification.success({
          message: 'Request Deleted',
          description: `Login issue request has been successfully deleted.`,
        });
        // Refresh the login issue list
        fetchLoginIssueRequests();
      } else {
        notification.error({
          message: 'Error',
          description: response.data.message || 'An error occurred while deleting the login issue request.',
        });
      }
    } catch (error) {
      console.error('Error deleting the login issue request:', error);
      notification.error({
        message: 'Error',
        description: 'An error occurred while deleting the request. Please try again later.',
      });
    }
  };
  

  // Filter data based on search text
  const filteredRequests = loginIssues.filter(request =>
    Object.values(request).some(value =>
      value && value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
    },
    {
        title: 'Request Id',
        dataIndex: 'request_id',
        key: 'Request Id',
      },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Member ID',
      dataIndex: 'memberId',
      key: 'memberId',
    },
    {
        title: 'Message',
        dataIndex: 'message',
        key: 'message',
        render: (text) => (
          <div
            style={{
              whiteSpace: 'normal', // Allow text to wrap
              overflow: 'hidden', // Prevent overflow
              maxWidth: 400, // Adjust max width as needed
              display: 'flex', // Ensure the div is a block element
              height: 'auto', // Allow dynamic height based on content
              wordWrap: 'break-word', // Break long words if necessary
            }}
          >
            {text}
          </div>
        ),
      },
      
      
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <span>{status === 'pending' ? 'Pending' : 'Solved'}</span>,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      render: (_, record) => (
        <div>
          <Tooltip title="Mark as Solved">
            <Button
              type="link"
              icon={<CheckCircleOutlined style={{ color: 'green' }} />}
              onClick={() => handleStatusChange(record.key, 'solved')}
            />
          </Tooltip>
          <Tooltip title="Delete Request">
            <Button
              type="link"
              icon={<DeleteOutlined style={{ color: 'red' }} />}
              onClick={() => handleDeleteRequest(record.key)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];
  const PulseComponent = () => {
    return (
      <div style={{ animation: 'pulse 2s infinite' }}>
        <div
          style={{
            width: '100%',
            height: '3rem',
            marginBottom: '1rem',
            backgroundColor: '#e5e7eb',
            borderRadius: '0.375rem',
          }}
        ></div>
        <div
          style={{
            width: '100%',
            height: '24rem',
            backgroundColor: '#e5e7eb',
            borderRadius: '0.375rem',
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '3rem',
              backgroundColor: '#e5e7eb',
              borderRadius: '0.375rem',
              marginBottom: '0.25rem',
            }}
          ></div>
          <div
            style={{
              width: '100%',
              height: '3rem',
              backgroundColor: '#e5e7eb',
              borderRadius: '0.375rem',
              marginBottom: '0.25rem',
            }}
          ></div>
          <div
            style={{
              width: '100%',
              height: '3rem',
              backgroundColor: '#e5e7eb',
              borderRadius: '0.375rem',
              marginBottom: '0.25rem',
            }}
          ></div>
          <div
            style={{
              width: '100%',
              height: '3rem',
              backgroundColor: '#e5e7eb',
              borderRadius: '0.375rem',
              marginBottom: '0.25rem',
            }}
          ></div>
          <div
            style={{
              width: '100%',
              height: '3rem',
              backgroundColor: '#e5e7eb',
              borderRadius: '0.375rem',
            }}
          ></div>
        </div>
  
        <style>
          {`
            @keyframes pulse {
              0% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
              100% {
                opacity: 1;
              }
            }
          `}
        </style>
      </div>
    );
  };
  

  return (
    <>
      <div>
      {/* Show PulseComponent when loading */}
      {loading ? (
        <PulseComponent />
      ) : (
        <>
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

          {/* Table */}
          <Table
            columns={columns}
            dataSource={filteredRequests}
            loading={loading}
            scroll={{ x: true }}
            pagination={{
              current: currentPagination.current,
              pageSize: currentPagination.pageSize,
              total: filteredRequests.length,
            }}
            size="small"
            onChange={handleTableChange}
          />
        </>
      )}
    </div>
    </>
  );
}
