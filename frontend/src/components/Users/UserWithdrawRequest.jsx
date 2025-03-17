import { useState, useEffect } from 'react';
import {
  Table,
  Typography,
  Button,
  Modal,
  notification,
  Tag,
  Descriptions,
  Space,
  Input,
  Row,
  Col,
  Radio,
  DatePicker,
  Select,
  Card,
  Spin,
  Result
} from 'antd';
import { BankOutlined, SendOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { formatDate } from '../../utils/dateFormat';
import moment from 'moment';
const Src = import.meta.env.VITE_Src;

const { Text, Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const WithdrawRequests = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [failedModalVisible, setfailedModalVisible] = useState(false);

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState('Withdrawal request not valid');
  const [transferMode, setTransferMode] = useState('api');
  const [transferInProgress, setTransferInProgress] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(null);
  const [apiBalance, setApiBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 500,
    total: 0,
  });
  
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending'); // Changed from 'all' to 'pending'
  const [membershipFilter, setMembershipFilter] = useState('all');

  const rowStyles = `
    .premium-row {
      background-color: #e6f7ff;
    }
    .basic-row {
      background-color: #fff7e6;
    }
  `;

  const fetchApiBalance = async () => {
    setLoadingBalance(true);
    try {
      const response = await axios.get(`${Src}/api/webhook/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        setApiBalance(response.data.balance);
      } else {
        notification.error({
          message: 'Error',
          description: 'Failed to fetch API balance.',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to fetch API balance.',
      });
    } finally {
      setLoadingBalance(false);
    }
  };
  useEffect(() => {
    if (transferModalVisible && transferSuccess === null) {
      fetchApiBalance();
    }
  }, [transferModalVisible]);

  const fetchWithdrawRequests = async () => {
    setLoading(true);
    await fetchApiBalance()
    try {
      const response = await axios.get(`${Src}/api/auth/all-withdraw-request`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.status === 'true') {
        setData(response.data.data);
        setFilteredData(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.length,
        }));
      } else {
        notification.error({
          message: 'Error',
          description: 'Failed to fetch withdraw requests.',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to fetch withdraw requests.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawRequests();
  }, []);

  useEffect(() => {
    let result = [...data];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Apply membership filter
    if (membershipFilter !== 'all') {
      result = result.filter(item => item.membership === membershipFilter);
    }

    // Apply date range filter with proper timezone conversion
    if (dateRange && dateRange[0] && dateRange[1]) {
      // Convert local dates to UTC boundaries
      const startDate = moment.utc(
        dateRange[0].clone().startOf('day').format()
      );
      const endDate = moment.utc(
        dateRange[1].clone().endOf('day').format()
      );
      
      result = result.filter(item => {
        const itemDate = moment.utc(item.date_time);
        return itemDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          val && val.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    setFilteredData(result);
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: result.length,
    }));
  }, [data, statusFilter, membershipFilter, dateRange, searchText]);

  // Update date range handler
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };


  // Handle status updates (Approve or Reject)
  const handleStatusUpdate = async (status, mode = 'manual') => {
    setTransferInProgress(true);
    try {
      const response = await axios.post(
        `${Src}/api/auth/update-status-user-withdraw-request`,
        {
          transaction_id: selectedRecord.transaction_id,
          status,
          message: status === "done" 
            ? "sent to bank" 
            : status === "failed" 
              ? "Withdrawal Failed, money refunded." 
              : rejectionMessage,
          mode:status==="failed"? "failed":mode,
        }
        , 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === 'true') {
        setTransferSuccess(true);
        setTimeout(() => {
          notification.success({
            message: 'Success',
            description: response.data.message,
          });
          
          // Refresh data after successful update
          fetchWithdrawRequests();
          
          // Close modals
          setModalVisible(false);
          setRejectModalVisible(false);
          setfailedModalVisible(false);
          setTransferModalVisible(false);
          setTransferInProgress(false);
        }, 2000);
      } else {
        setTransferSuccess(false);
        notification.error({
          message: 'Error',
          description: response.data.message,
        });
      }
    } catch (error) {
      setTransferSuccess(false);
      notification.error({
        message: 'Error',
        description: 'Failed to update withdrawal status.',
      });
    } finally {
      setTimeout(() => {
        setTransferInProgress(false);
      }, 2000);
    }
  };
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };
    const handleReject = () => {
    handleStatusUpdate('rejected');
  };
  const handleFailed = () => {
    handleStatusUpdate('failed');
  };
    const handleApprove = () => {
    setTransferModalVisible(true);
  };

  const handleTransfer = () => {
    handleStatusUpdate('done', transferMode);
  };

  const handleRetry = () => {
    setTransferSuccess(null);
    handleStatusUpdate('done', 'api');
  };

  const handleRejectReasonChange = (e) => {
    setRejectionMessage(e.target.value);
  };

  //   const handleTableChange = (pagination, filters, sorter) => {
  //   setPagination({
  //     ...pagination,
  //   });
  // }; // Added missing closing bracket here

  const paginatedData = filteredData.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  // Status counts
  const approvedCount = filteredData.filter((record) => record.status === 'done').length;
  const rejectedCount = filteredData.filter((record) => record.status === 'rejected').length;
  const pendingCount = filteredData.filter((record) => record.status === 'pending').length;

  // Membership counts
  const premiumCount = filteredData.filter((record) => record.membership === 'PREMIUM').length;
  const basicCount = filteredData.filter((record) => record.membership === 'BASIC').length;

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
   
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
    },
    {
      title: 'Name',
      dataIndex: 'FullName',
      key: 'Name',
    },
    {
      title: 'Membership',
      dataIndex: 'membership',
      key: 'membership',
      render: (membership) => {
        const color = membership === 'PREMIUM' ? 'blue' : membership === 'BASIC' ? 'orange' : 'default';
        return <Tag color={color}>{membership}</Tag>;
      },
    },
    {
      title: 'Bank Name',
      dataIndex: 'bank_name',
      key: 'bank_name',
    },
    {
      title: 'IFSC',
      dataIndex: 'ifsc_code',
      key: 'ifsc_code',
    },
    {
      title: 'Account No',
      dataIndex: 'account_number',
      key: 'account_number',
    },
    {
      title: 'Amount Requested',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Date Time',
      dataIndex: 'date_time',
      key: 'date_time',
      sorter: (a, b) => moment(a.date_time).valueOf() - moment(b.date_time).valueOf(),
      defaultSortOrder: 'descend',
      render: (text) => formatDate(text),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'done' ? 'green' : status === 'rejected' ? 'red' : 'orange';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          {/* <Button
            type="link"
            onClick={() => {
              setSelectedRecord(record);
              setModalVisible(true);
            }}
          >
            Details
          </Button> */}
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setSelectedRecord(record);
                  setTransferModalVisible(true);
                }}
              >
                A
              </Button>
              <Button
                danger
                size="small"
                onClick={() => {
                  setSelectedRecord(record);
                  setRejectModalVisible(true);
                }}
              >
                R
              </Button>
            </>
          )}
          {record.status === 'failed' && record.message==="Withdrawal Failed,money will be refunded."&&(
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setSelectedRecord(record);
                  setfailedModalVisible(true);
                }}
              >
                Refund
              </Button>
             
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
    <Descriptions >
                <Descriptions.Item label="API Balance">
                  {loadingBalance ? (
                    <Spin size="small" />
                  ) : (
                    <Space>
                      {apiBalance !== null ? `₹${apiBalance}` : 'click on refresh'}
                      <Button 
                        icon={<ReloadOutlined />} 
                        size="small" 
                        onClick={fetchApiBalance}
                        loading={loadingBalance}
                      />
                    </Space>
                  )}
                </Descriptions.Item>
              </Descriptions >
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
                defaultValue="pending" // Added defaultValue
              >
                <Select.Option value="all">All</Select.Option>
                <Select.Option value="done">Done</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
              </Select>
            </Col>
            <Col span={6}>
        <RangePicker
          style={{ width: '100%' }}
          onChange={handleDateRangeChange}
          format="DD/MM/YYYY"
          allowClear={true}
          ranges={{
            'Today': [moment().startOf('day'), moment().endOf('day')],
            'This Week': [moment().startOf('week'), moment().endOf('week')],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
          }}
        />
      </Col>
            <Col span={6}>
              <Select
                placeholder="Filter by Membership"
                value={membershipFilter}
                onChange={setMembershipFilter}
                style={{ width: '100%' }}
              >
                <Select.Option value="all">All</Select.Option>
                <Select.Option value="PREMIUM">Premium</Select.Option>
                <Select.Option value="BASIC">Basic</Select.Option>
              </Select>
            </Col>
          </Row>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
              <div>
                <Text strong>Showing: {filteredData.length} of {data.length} requests</Text>
              </div>
              <div>
                <Tag color="green">Done: {approvedCount}</Tag>
                <Tag color="red">Rejected: {rejectedCount}</Tag>
                <Tag color="orange">Pending: {pendingCount}</Tag>
                <Tag color="blue">Premium: {premiumCount}</Tag>
                <Tag color="orange">Basic: {basicCount}</Tag>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={paginatedData}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10','50','100','200'],
        }}
        onChange={handleTableChange}
        rowKey="transaction_id"
        rowClassName={(record) => {
          return record.membership === 'PREMIUM' ? 'premium-row' : record.membership === 'BASIC' ? 'basic-row' : '';
        }}
      />


<Modal
       title="Failed Withdrawal Request"
       open={failedModalVisible}
       onCancel={() => setfailedModalVisible(false)}
       onOk={handleFailed}
       okText="Confirm Refund"
       okButtonProps={{ danger: true }}
     >
             <div>
         <Text>Api Withdrawal was failed. Send money back to user. </Text>
        

        
          
        
       </div>

     </Modal>

        
    
     <Modal
       title="Reject Withdrawal Request"
       open={rejectModalVisible}
       onCancel={() => setRejectModalVisible(false)}
       onOk={handleReject}
       okText="Confirm Rejection"
       okButtonProps={{ danger: true }}
     >
             <div>
         <Text>Please select a reason for rejection:</Text>
         <Radio.Group
           onChange={(e) => setRejectionMessage(e.target.value)}
           value={rejectionMessage}
           style={{ display: "block", marginTop: 8 }}
         >
           <Radio value="Wrong Bank Details">Wrong Bank Details</Radio>
           <Radio value="Wrong IFSC code">Wrong IFSC code</Radio>
           <Radio value="Wrong Account No">Wrong Account No</Radio>
         
         </Radio.Group>

        
           <TextArea
             rows={4}
             value={rejectionMessage}
             onChange={(e) => setRejectionMessage(e.target.value)}
             placeholder="Enter reason for rejection"
             style={{ marginTop: 8 }}
           />
        
       </div>

     </Modal>

    
      <Modal
        title="Complete Transfer"
        open={transferModalVisible}
        onCancel={() => {
          if (!transferInProgress) {
            setTransferModalVisible(false);
            setTransferSuccess(null);
          }
        }}
        footer={null}
        width={500}
        maskClosable={!transferInProgress}
        closable={!transferInProgress}
      >
        {!transferInProgress && transferSuccess === null && (
          <>
            <div style={{ marginBottom: 24 }}>
              <Text>Please select transfer method:</Text>
              <Radio.Group 
                onChange={(e) => setTransferMode(e.target.value)} 
                value={transferMode}
                style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}
              >
                <Radio value="manual" style={{ padding: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                  <Space>
                    <BankOutlined style={{ fontSize: 18 }} />
                    <div>
                      <div><Text strong>Manual Transfer</Text></div>
                      <div><Text type="secondary">Manually process the transfer outside the system</Text></div>
                    </div>
                  </Space>
                </Radio>
                <Radio value="api" style={{ padding: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                  <Space>
                    <SendOutlined style={{ fontSize: 18 }} />
                    <div>
                      <div><Text strong>API Transfer</Text></div>
                      <div><Text type="secondary">Automatically process via banking API</Text></div>
                    </div>
                  </Space>
                </Radio>
              </Radio.Group>
              <div style={{ marginTop: 24}}></div>
              <Descriptions >
                <Descriptions.Item label="Amount">{selectedRecord?.amount}</Descriptions.Item>

              </Descriptions>
              <Descriptions >
                <Descriptions.Item label="API Balance">
                  {loadingBalance ? (
                    <Spin size="small" />
                  ) : (
                    <Space>
                      {apiBalance !== null ? `₹${apiBalance}` : 'Not available'}
                      <Button 
                        icon={<ReloadOutlined />} 
                        size="small" 
                        onClick={fetchApiBalance}
                        loading={loadingBalance}
                      />
                    </Space>
                  )}
                </Descriptions.Item>
              </Descriptions >
            </div>

            <div style={{ textAlign: 'right', marginTop: 24 }}>
              <Space>
                <Button onClick={() => setTransferModalVisible(false)}>Cancel</Button>
                <Button type="primary" onClick={handleTransfer}>
                  Proceed with Transfer
                </Button>
              </Space>
            </div>
          </>
        )}

        {transferInProgress && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="bank-transfer-animation" style={{ marginBottom: 24 }}>
              <div className="bank-building" style={{ display: 'inline-block', marginRight: 100 }}>
                <BankOutlined style={{ fontSize: 48 }} />
                <div>System</div>
              </div>
              <div className="transfer-line" style={{ 
                position: 'relative', 
                display: 'inline-block',
                width: 100,
                height: 4,
                backgroundColor: '#1890ff',
                animation: 'transferAnimation 2s infinite',
                margin: '0 10px',
                top: -25
              }} />
              <div className="bank-building" style={{ display: 'inline-block' }}>
                <BankOutlined style={{ fontSize: 48 }} />
                <div>Customer Bank</div>
              </div>
            </div>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>{transferMode === 'api' ? 'API Transfer in progress...' : 'Manual Transfer processing...'}</Text>
            </div>
          </div>
        )}
{/* 
        {!transferInProgress && transferSuccess === true && (
          <Result
            status="success"
            title="Transfer Successful!"
            subTitle={`The amount of ${selectedRecord?.amount} has been successfully transferred.`}
            extra={[
              <Button 
                type="primary" 
                key="done" 
                onClick={() => {
                  setTransferModalVisible(false);
                  setTransferSuccess(null);
                }}
              >
                Done
              </Button>
            ]}
          />
        )} */}

        {!transferInProgress && transferSuccess === false && (
          <Result
            status="error"
            title="Transfer Failed"
            subTitle="There was an issue processing your transfer request."
            extra={[
              <Button 
                onClick={() => {
                  setTransferModalVisible(false);
                  setTransferSuccess(null);
                }}
                key="back"
              >
                Cancel
              </Button>,
              <Button 
                type="primary" 
                key="retry" 
                danger
                onClick={handleRetry}
                icon={<ReloadOutlined />}
              >
                Retry API Transfer
              </Button>
            ]}
          />
        )}
      </Modal>

     
      <style jsx global>{`
        @keyframes transferAnimation {
          0% {
            background: linear-gradient(to right, #1890ff 0%, #1890ff 0%, #d9d9d9 0%, #d9d9d9 100%);
          }
          50% {
            background: linear-gradient(to right, #1890ff 0%, #1890ff 100%, #d9d9d9 100%, #d9d9d9 100%);
          }
          100% {
            background: linear-gradient(to right, #1890ff 0%, #1890ff 0%, #d9d9d9 0%, #d9d9d9 100%);
          }
        }
      `}</style>
    </>
  );
};

export default WithdrawRequests;
