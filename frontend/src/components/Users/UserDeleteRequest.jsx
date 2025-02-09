import { Table, Switch, Modal, notification, Input, Row, Col, Typography } from 'antd';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDate } from '../../utils/dateFormat';

const { Text } = Typography;
const Src = import.meta.env.VITE_Src;



export default function UserDeleteRequestList() {
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [currentMemberId, setCurrentMemberId] = useState('');
  const [totalRequests, setTotalRequests] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));

  const handleTableChange = (pagination) => {
    setCurrentPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  useEffect(() => {
    fetchDeleteRequests();
  }, []);

  const fetchDeleteRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Src}/api/auth/deleteRequests`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      });

      const formattedRequests = response.data.data.map((request, index) => ({
        key: request.id || index.toString(),
        sno: index + 1,
        memberId: request.member_id,
        name: request.username, // Assuming the name is returned from the API
        deleteRequestStatus: request.delete_request_status,
        currentStatus: request.status, // Fetching the user's current status from usersdetails
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      }));

      setDeleteRequests(formattedRequests);
      setTotalRequests(formattedRequests.length);
    } catch (error) {
      console.error('Error fetching delete requests:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch delete requests.',
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteRequest = async (memberId) => {
    try {
      const response = await axios.delete(
        `${Src}/api/auth/deleteRequest`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Ensure authentication
            "Content-Type": "application/json", // Specify JSON format
          },
          data: { member_id: memberId }, // Correct placement of request body
        }
      );
      
  
      if (response.data.success) {
        notification.success({
          message: 'Request Deleted',
          description: `Delete request for Member ID: ${memberId} has been successfully deleted.`,
        });
  
        // Refresh the table data
        fetchDeleteRequests();
      } else {
        notification.error({
          message: 'Error',
          description: response.data.message || 'Failed to delete the request.',
        });
      }
    } catch (error) {
      console.error('Error deleting the delete request:', error);
      notification.error({
        message: 'Error',
        description: 'An error occurred while deleting the request. Please try again later.',
      });
    }
  };
  

  // Filter data based on search text
  const filteredRequests = deleteRequests.filter(request =>
    Object.values(request).some(value =>
      value && value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

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
      title: 'User Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Delete Request Status',
      dataIndex: 'deleteRequestStatus',
      key: 'deleteRequestStatus',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => formatDate(text),
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text) => formatDate(text),
    },
    {
      title: 'Status Toggle',
      dataIndex: 'statusToggle',
      key: 'statusToggle',
      render: (status, record) => (
        <Switch
          checked={record.currentStatus === 'active'}
          onChange={(checked) => showConfirmationModal(
            record.memberId, 
            checked ? 'inactive' : 'active', 
            record.sno
          )}
          checkedChildren="Active" 
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      render: (_, record) => (
        <button
          style={{
            color: 'white',
            backgroundColor: 'red',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            cursor: 'pointer',
          }}
          onClick={() => handleDeleteRequest(record.memberId)}
        >
          Delete
        </button>
      ),
    },
  ];
  

  const showConfirmationModal = (memberId, newStatus, sno) => {
    setCurrentMemberId(memberId);
    setCurrentStatus(newStatus);
    setCurrentRequestId(sno);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      await axios.post(
        `${Src}/api/auth/toggleStatus`,
        { 
          memberid: currentMemberId 
        }, 
        {
          headers: {
            Authorization: `Bearer ${token}`, // Ensure authentication
            "Content-Type": "application/json", // Specify JSON format
          },
        }
      );
      

      setIsModalVisible(false);

      notification.success({
        message: `Delete Request Updated`,
        description: `Delete request for Member ID: ${currentMemberId} has been updated to ${currentStatus}.`,
      });

      fetchDeleteRequests();
    } catch (error) {
      console.error('Error updating delete request status:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update delete request status. Please try again later.',
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
              <Text strong>Total Delete Requests: {totalRequests}</Text>
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
        dataSource={filteredRequests}
        loading={loading}
        scroll={{ x: true }}
        pagination={{
          current:currentPagination.current,
          pageSize: currentPagination.pageSize,
          total: filteredRequests.length,
        }}
         size="small"
        onChange={handleTableChange}

      />

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Delete Request Status Change"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>
          Are you sure you want to change the status of the delete request for 
          Member ID: {currentMemberId} to {currentStatus === 'active' ? 'Inactive' : 'Active'}?
        </p>
      </Modal>
    </>
  );
}
