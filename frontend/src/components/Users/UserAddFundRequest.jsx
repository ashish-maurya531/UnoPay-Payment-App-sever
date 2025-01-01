import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Image,
  Typography,
  notification,
  Input,
  Row,
  Col,
  Tag,
} from 'antd';
import {formatDate } from '../../utils/dateFormat';

import axios from 'axios';
const { Title, Text } = Typography;

const UserAddFundRequest = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectConfirmModal, setRejectConfirmModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchFundRequests(currentPage);
  }, [currentPage]);

  const fetchFundRequests = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/auth/getAllUserAddFundRequest?page=${page}`);
      if (response.data.status === 'success') {
        //sort the records decending  acc to time 
        response.data.data.sort((a, b) => new Date(b.time_date) - new Date(a.time_date));
        setData(response.data.data);
        setTotalRecords(response.data.totalRecords);
      } else {
        notification.error({
          message: 'Error',
          description: response.data.message,
        });
      }
    } catch (error) {
      console.error('Error fetching fund requests:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch fund requests.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewScreenshot = async (record) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/getUserAddFundRequestSS', {
        utr_number: record.utr_number,
      }, { responseType: 'blob' });

      if (response.status === 200) {
        const screenshotUrl = URL.createObjectURL(response.data);
        setSelectedRecord({ ...record, screenshotUrl });
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching screenshot:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch screenshot.',
      });
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/updateFundRequestStatus', {
        utr_number: selectedRecord.utr_number,
        status,
      });
      
      if (response.data.status === 'success') {
        // Construct detailed notification message
        const notificationMessage = status === 'approved'
          ? `Fund of Rs.${selectedRecord.amount} has been approved and added to Member ID: ${selectedRecord.member_id}`
          : `Fund request of Rs.${selectedRecord.amount} for Member ID: ${selectedRecord.member_id} has been rejected`;

        notification.success({
          message: status === 'approved' ? 'Fund Approved' : 'Fund Rejected',
          description: notificationMessage,
          duration: 5,
        });

        setModalVisible(false);
        setRejectConfirmModal(false);
        fetchFundRequests(currentPage);
      } else {
        notification.error({
          message: 'Error',
          description: response.data.message,
        });
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update transaction status.',
      });
    }
  };

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, __, index) => (currentPage - 1) * 10 + index + 1,
    },
    {
      title: 'UTR Number',
      dataIndex: 'utr_number',
      key: 'utr_number',
    },
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
    },
    {
      title: 'To UPI ID',
      dataIndex: 'to_upi_id',
      key: 'to_upi_id',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Screenshot',
      key: 'screenshot',
      render: (record) => (
        <Button type="link" onClick={() => handleViewScreenshot(record)}>
          View
        </Button>
      ),
    },
    {
      title: 'Time & Date',
      dataIndex: 'time_date',
      key: 'time_date',
      render: (text) => formatDate(text),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          color={
            status === 'approved'
              ? 'green'
              : status === 'rejected'
                ? 'red'
                : 'orange'
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  const filteredData = data.filter(record =>
    Object.values(record).some(value => value.toString().toLowerCase().includes(searchText.toLowerCase()))
  );

  const totalApprovedFunds = filteredData
    .filter(record => record.status === 'approved')
    .reduce((acc, record) => acc + parseFloat(record.amount), 0);

  const pendingFunds = filteredData
    .filter(record => record.status !== 'approved')
    .reduce((acc, record) => acc + parseFloat(record.amount), 0);

  return (
    <>
      <div>
        <Row gutter={16} align="stretch">
          <Col span={12}>
            <div className="h-full" style={{display:"flex", flexDirection:"row", gap:20, justifyContent:"flex-start"}}>
              <p>Total Users: {data.length}</p>
              <p>Total Transactions: {totalRecords}</p>
              <p>Approved: {filteredData.filter(record => record.status === 'approved').length}</p>
              <p>Rejected: {filteredData.filter(record => record.status === 'rejected').length}</p>
              <p>Pending: {filteredData.filter(record => record.status !== 'approved' && record.status !== 'rejected').length}</p>
            </div>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <div className="h-full" style={{display:"flex", flexDirection:"row", gap:20, justifyContent:"flex-end"}}>
              <p>Total Approved Funds: Rs.{totalApprovedFunds.toFixed(2)}</p>
              <p>Pending Funds: Rs.{pendingFunds.toFixed(2)}</p>
            </div>
          </Col>
        </Row>
        
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Input.Search
              placeholder="Search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey={(record) => record.utr_number}
        loading={loading}
        pagination={{
          current: currentPage,
          total: totalRecords,
          pageSize: 10,
          onChange: (page) => setCurrentPage(page),
        }}
      />

      <Modal
        title="Fund Request Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <Title level={5}>Details</Title>
              <p>
                <strong>S.No:</strong> {(currentPage - 1) * 10 + filteredData.indexOf(selectedRecord) + 1}
              </p>
            
              <p>
                <strong>UTR Number:</strong> {selectedRecord.utr_number}
              </p>
              <p>
                <strong>Member ID:</strong> {selectedRecord.member_id}
              </p>
              <p>
                <strong>To UPI ID:</strong> {selectedRecord.to_upi_id}
              </p>
              <p>
                <strong>Amount:</strong> {selectedRecord.amount}
              </p>
              <p>
                <strong>Time & Date:</strong> {formatDate(selectedRecord.time_date)}
              </p>
              <p>
                <strong>Status:</strong> 
                <Tag
                  color={
                    selectedRecord.status === 'approved'
                      ? 'green'
                      : selectedRecord.status === 'rejected'
                        ? 'red'
                        : 'orange'
                  }
                >
                  {selectedRecord.status.toUpperCase()}
                </Tag>
              </p>
              
              {selectedRecord.status === 'pending' && (
                <>
                  <Button
                    type="primary"
                    onClick={() => handleStatusUpdate('approved')}
                    style={{ 
                      marginRight: 10, 
                      backgroundColor: '#52c41a', 
                      borderColor: '#52c41a' 
                    }}
                  >
                    Approve
                  </Button>
                  <Button 
                    type="danger" 
                    onClick={() => setRejectConfirmModal(true)}
                    style={{ 
                      backgroundColor: '#ff4d4f', 
                      borderColor: '#ff4d4f' 
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Image
                src={selectedRecord?.screenshotUrl}
                alt="Screenshot"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Confirm Rejection"
        open={rejectConfirmModal}
        onOk={() => handleStatusUpdate('rejected')}
        onCancel={() => setRejectConfirmModal(false)}
        okText="Confirm Reject"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to reject this fund request?</p>
        {selectedRecord && (
          <div>
            <p><strong>Member ID:</strong> {selectedRecord.member_id}</p>
            <p><strong>Amount:</strong> Rs.{selectedRecord.amount}</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default UserAddFundRequest;




















