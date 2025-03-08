import { useState, useEffect, useMemo } from 'react';
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
  Select,
  DatePicker,
  Space,
} from 'antd';
import { formatDate } from '../../utils/dateFormat';
import moment from 'moment';
import axios from 'axios';
const { Title, Text } = Typography;
const Src = import.meta.env.VITE_Src;

const UserAddFundRequest = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectConfirmModal, setRejectConfirmModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [dateRange, setDateRange] = useState(null);
  const [membershipFilter, setMembershipFilter] = useState(null);
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 100,
  });
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
  const { RangePicker } = DatePicker;

  useEffect(() => {
    fetchFundRequests(currentPage);
  }, [currentPage]);

  const fetchFundRequests = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${Src}/api/auth/getAllUserAddFundRequest?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        setData(response.data.data);
        setTotalRecords(response.data.pagination?.totalRecords || response.data.data.length);
        setCurrentPagination({
          current: response.data.pagination?.currentPage || 1,
          pageSize: response.data.pagination?.recordsPerPage || 10,
        });
      }
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to fetch fund requests' });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    let filtered = data;

    // Text search filter
    if (searchText) {
      filtered = filtered.filter(record =>
        Object.values(record).some(value =>
          value?.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Membership filter
    if (membershipFilter) {
      filtered = filtered.filter(record => record.membership === membershipFilter);
    }

    // Date range filter
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange.map(d => d.startOf('day'));
      filtered = filtered.filter(record => {
        const recordDate = moment(record.time_date).startOf('day');
        return recordDate.isBetween(startDate, endDate, null, '[]');
      });
    }

    return filtered;
  }, [data, searchText, statusFilter, membershipFilter, dateRange]);

  const columns = [
    { title: 'S.No', key: 'sno', render: (_, __, index) => 
      (currentPagination.current - 1) * currentPagination.pageSize + index + 1 },
    { title: 'UTR Number', dataIndex: 'utr_number', key: 'utr_number' },
    { title: 'Member ID', dataIndex: 'member_id', key: 'member_id' },
    { 
      title: 'Username', 
      dataIndex: 'username', 
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
      sortDirections: ['ascend', 'descend']
    },
    { 
      title: 'Membership', 
      dataIndex: 'membership', 
      key: 'membership',
      render: (membership) => (
        <Tag
          color={membership === 'PREMIUM' ? 'blue' : membership === 'BASIC' ? 'orange' : 'default'}
          onClick={() => handleMembershipFilter(membership)}
          style={{ cursor: 'pointer' }}
        >
          {membership || 'FREE'}
        </Tag>
      )
    },
    { title: 'To UPI ID', dataIndex: 'to_upi_id', key: 'to_upi_id' },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      key: 'amount',
      sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
      sortDirections: ['ascend', 'descend']
    },
    { 
      title: 'Screenshot',
      key: 'screenshot',
      render: (record) => (
        <Button type="link" onClick={() => handleViewScreenshot(record)}>
          View
        </Button>
      )
    },
    { 
      title: 'Time & Date',
      dataIndex: 'time_date',
      key: 'time_date',
      render: (text) => formatDate(text)
    },
    { 
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
  ];

  const handleMembershipFilter = (membership) => {
    setMembershipFilter(membership === membershipFilter ? null : membership);
  };

  const handleTableChange = (pagination) => {
    setCurrentPagination(pagination);
    setCurrentPage(pagination.current);
  };

  const handleViewScreenshot = async (record) => {
    try {
      if (record.screenshot === 'deleted') {
        setSelectedRecord({ ...record, screenshotUrl: null, isDeleted: true });
        setModalVisible(true);
        return;
      }
      
      const response = await axios.post(
        `${Src}/api/auth/getUserAddFundRequestSS`,
        { utr_number: record.utr_number },
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );
      
      if (response.status === 200) {
        const screenshotUrl = URL.createObjectURL(response.data);
        setSelectedRecord({ ...record, screenshotUrl, isDeleted: false });
        setModalVisible(true);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setSelectedRecord({ ...record, screenshotUrl: null, isDeleted: true });
        setModalVisible(true);
      } else {
        notification.error({ message: 'Error', description: 'Failed to fetch screenshot' });
      }
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      const response = await axios.post(
        `${Src}/api/auth/updateFundRequestStatus`,
        { utr_number: selectedRecord.utr_number, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        notification.success({
          message: status === 'approved' ? 'Fund Approved' : 'Fund Rejected',
          description: status === 'approved'
            ? `Fund of Rs.${selectedRecord.amount} approved for ${selectedRecord.member_id}`
            : `Fund request of Rs.${selectedRecord.amount} rejected`,
          duration: 5,
        });
        setModalVisible(false);
        setRejectConfirmModal(false);
        fetchFundRequests(currentPage);
      }
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to update status' });
    }
  };

  const rowStyles = `
    .premium-row { background-color: #e6f7ff; }
    .basic-row { background-color: #fff7e6; }
  `;

  return (
    <>
      <style>{rowStyles}</style>
      <Row gutter={16} align="stretch" style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Row gutter={16}>
            <Col span={6}>
              <Input.Search
                placeholder="Search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by Status"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
              >
                <Select.Option value="all">All</Select.Option>
                <Select.Option value="approved">Approved</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={setDateRange}
                format="YYYY-MM-DD"
              />
            </Col>
            <Col span={6}>
              <div style={{ padding: '8px', background: '#f0f2f5', borderRadius: '4px' }}>
                <Space>
                  <span>Membership Filter:</span>
                  <Tag
                    color="blue"
                    onClick={() => handleMembershipFilter('PREMIUM')}
                    style={{ cursor: 'pointer', fontWeight: membershipFilter === 'PREMIUM' ? 'bold' : 'normal' }}
                  >
                    PREMIUM {membershipFilter === 'PREMIUM' && '✓'}
                  </Tag>
                  <Tag
                    color="orange"
                    onClick={() => handleMembershipFilter('BASIC')}
                    style={{ cursor: 'pointer', fontWeight: membershipFilter === 'BASIC' ? 'bold' : 'normal' }}
                  >
                    BASIC {membershipFilter === 'BASIC' && '✓'}
                  </Tag>
                  <Tag
                    color="default"
                    onClick={() => handleMembershipFilter('FREE')}
                    style={{ cursor: 'pointer', fontWeight: membershipFilter === 'FREE' ? 'bold' : 'normal' }}
                  >
                    FREE {membershipFilter === 'FREE' && '✓'}
                  </Tag>
                  {membershipFilter && (
                    <Button type="link" onClick={() => setMembershipFilter(null)}>
                      Clear
                    </Button>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="utr_number"
        loading={loading}
        pagination={{
          ...currentPagination,
          total: filteredData.length,
          showTotal: (total) => `Total ${total} items`,
        }}
        onChange={handleTableChange}
        rowClassName={(record) => 
          record.membership === 'PREMIUM' ? 'premium-row' : 
          record.membership === 'BASIC' ? 'basic-row' : ''
        }
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
              <p><strong>S.No:</strong> {(currentPagination.current - 1) * currentPagination.pageSize + filteredData.indexOf(selectedRecord) + 1}</p>
              <p><strong>UTR Number:</strong> {selectedRecord.utr_number}</p>
              <p><strong>Member ID:</strong> {selectedRecord.member_id}</p>
              <p><strong>Username:</strong> {selectedRecord.username}</p>
              <p><strong>Membership:</strong> 
                <Tag
                  color={selectedRecord.membership === 'PREMIUM' ? 'blue' : selectedRecord.membership === 'BASIC' ? 'orange' : 'default'}
                  style={{ marginLeft: '8px' }}
                >
                  {selectedRecord.membership || 'FREE'}
                </Tag>
              </p>
              <p><strong>To UPI ID:</strong> {selectedRecord.to_upi_id}</p>
              <p><strong>Amount:</strong> {selectedRecord.amount}</p>
              <p><strong>Time & Date:</strong> {formatDate(selectedRecord.time_date)}</p>
              <p><strong>Status:</strong> 
                <Tag color={selectedRecord.status === 'approved' ? 'green' : selectedRecord.status === 'rejected' ? 'red' : 'orange'}>
                  {selectedRecord.status.toUpperCase()}
                </Tag>
              </p>
              {selectedRecord.status === 'pending' && (
                <>
                  <Button
                    type="primary"
                    onClick={() => handleStatusUpdate('approved')}
                    style={{ marginRight: 10, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Approve
                  </Button>
                  <Button 
                    type="danger" 
                    onClick={() => setRejectConfirmModal(true)}
                    style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              {selectedRecord.isDeleted ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '400px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <Title level={4} style={{ color: '#999' }}>Image Deleted</Title>
                  <Text type="secondary">The screenshot has been deleted.</Text>
                </div>
              )  : (
                    <Image
                      src={selectedRecord?.screenshotUrl}
                      alt="Screenshot"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                      fallback="data:image/png;base64,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"
                />
              )}
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










////////////////////////////////////
// /v2







