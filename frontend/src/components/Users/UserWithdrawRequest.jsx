// import { useState, useEffect } from 'react';
// import {
//   Table,
//   Typography,
//   Button,
//   Modal,
//   notification,
//   Tag,
//   Descriptions,
//   Space,
//   Input,
//   Row,
//   Col,
//   Radio,
//   DatePicker,
//   Select,
//   Card,
//   Spin,
//   Result
// } from 'antd';
// import { BankOutlined, SendOutlined, ReloadOutlined } from '@ant-design/icons';
// import axios from 'axios';
// import { formatDate } from '../../utils/dateFormat';
// const Src = import.meta.env.VITE_Src;

// const { Text, Title } = Typography;
// const { TextArea } = Input;
// const { RangePicker } = DatePicker;

// const WithdrawRequests = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [transferModalVisible, setTransferModalVisible] = useState(false);
//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [rejectionMessage, setRejectionMessage] = useState('Withdrawal request not valid');
//   const [transferMode, setTransferMode] = useState('manual');
//   const [transferInProgress, setTransferInProgress] = useState(false);
//   const [transferSuccess, setTransferSuccess] = useState(null);
  
//   // Server-side pagination
//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 10,
//     total: 0,
//   });
  
//   const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));

//   // Filter states
//   const [searchText, setSearchText] = useState('');
//   const [dateRange, setDateRange] = useState(null);
//   const [selectedMembership, setSelectedMembership] = useState('all');
//   const [selectedStatus, setSelectedStatus] = useState('all');

//   // Fetch withdrawal requests from the server with filters
//   const fetchWithdrawRequests = async () => {
//     setLoading(true);
//     try {
//       // Build query parameters for filtering
//       const params = new URLSearchParams();
//       params.append('page', pagination.current);
      
//       if (dateRange) {
//         params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
//         params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
//       }
      
//       if (selectedMembership !== 'all') {
//         params.append('membership', selectedMembership);
//       }
      
//       if (selectedStatus !== 'all') {
//         params.append('status', selectedStatus);
//       }
      
//       if (searchText) {
//         params.append('search', searchText);
//       }
      
//       const response = await axios.get(`${Src}/api/auth/all-withdraw-request?${params.toString()}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
      
//       if (response.data.status === 'true') {
//         setData(response.data.data);
//         setPagination({
//           ...pagination,
//           total: response.data.pagination.totalRecords,
//         });
//       } else {
//         notification.error({
//           message: 'Error',
//           description: 'Failed to fetch withdraw requests.',
//         });
//       }
//     } catch (error) {
//       notification.error({
//         message: 'Error',
//         description: 'Failed to fetch withdraw requests.',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle status updates (Approve or Reject)
//   const handleStatusUpdate = async (status, mode = 'manual') => {
//     setTransferInProgress(true);
//     try {
//       const response = await axios.post(
//         `${Src}/api/auth/update-status-user-withdraw-request`,
//         { 
//           transaction_id: selectedRecord.transaction_id,
//           status,
//           message: status === "done" ? "sent to bank" : rejectionMessage,
//           mode,
//         }, 
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (response.data.status === 'true') {
//         setTransferSuccess(true);
//         setTimeout(() => {
//           notification.success({
//             message: 'Success',
//             description: response.data.message,
//           });
          
//           // Refresh data after successful update
//           fetchWithdrawRequests();
          
//           // Close modals
//           setModalVisible(false);
//           setRejectModalVisible(false);
//           setTransferModalVisible(false);
//           setTransferInProgress(false);
//         }, 2000);
//       } else {
//         setTransferSuccess(false);
//         notification.error({
//           message: 'Error',
//           description: response.data.message,
//         });
//       }
//     } catch (error) {
//       setTransferSuccess(false);
//       notification.error({
//         message: 'Error',
//         description: 'Failed to update withdrawal status.',
//       });
//     } finally {
//       setTimeout(() => {
//         setTransferInProgress(false);
//       }, 2000);
//     }
//   };

//   const handleReject = () => {
//     handleStatusUpdate('rejected');
//   };

//   const handleApprove = () => {
//     setTransferModalVisible(true);
//   };

//   const handleTransfer = () => {
//     handleStatusUpdate('done', transferMode);
//   };

//   const handleRetry = () => {
//     setTransferSuccess(null);
//     handleStatusUpdate('done', 'api');
//   };

//   const handleRejectReasonChange = (e) => {
//     setRejectionMessage(e.target.value);
//   };

//   const handleTableChange = (pagination, filters, sorter) => {
//     setPagination({
//       ...pagination,
//     });
    
//     // If sorting by amount
//     if (sorter && sorter.field === 'amount') {
//       const sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
//       // This will be handled in fetchWithdrawRequests with the updated pagination state
//     }
//   };

//   useEffect(() => {
//     fetchWithdrawRequests();
//   }, [pagination.current, dateRange, selectedMembership, selectedStatus, searchText]);

//   // Get counts for summary
//   const approvedCount = data.filter((record) => record.status === 'done').length;
//   const rejectedCount = data.filter((record) => record.status === 'rejected').length;
//   const pendingCount = data.filter((record) => record.status === 'pending').length;

//   // Membership counts
//   const premiumCount = data.filter((record) => record.membership === 'PREMIUM').length;
//   const basicCount = data.filter((record) => record.membership === 'BASIC').length;
//   const freeCount = data.filter((record) => record.membership === 'FREE').length;

//   const getMembershipColor = (membership) => {
//     switch (membership?.toUpperCase()) {
//       case 'PREMIUM':
//         return '#e6f7ff';
//       case 'BASIC':
//         return '#fff7e6';
//       default:
//         return '';
//     }
//   };

//   const columns = [
//     {
//       title: 'S.No',
//       dataIndex: 'sno',
//       key: 'sno',
//       render: (_, __, index) =>
//         (pagination.current - 1) * pagination.pageSize + index + 1,
//     },
//     {
//       title: 'Transaction Id',
//       dataIndex: 'transaction_id',
//       key: 'transaction_id',
//     },
//     {
//       title: 'Member ID',
//       dataIndex: 'member_id',
//       key: 'member_id',
//     },
//     {
//       title: 'Membership',
//       dataIndex: 'membership',
//       key: 'membership',
//       render: (membership) => {
//         const color = membership === 'PREMIUM' ? 'blue' : membership === 'BASIC' ? 'orange' : 'default';
//         return <Tag color={color}>{membership}</Tag>;
//       },
//     },
//     {
//       title: 'Amount Requested',
//       dataIndex: 'amount',
//       key: 'amount',
//       sorter: true,
//     },
//     {
//       title: 'Date Time',
//       dataIndex: 'date_time',
//       key: 'date_time',
//       render: (text) => formatDate(text),
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => {
//         const color = status === 'done' ? 'green' : status === 'rejected' ? 'red' : 'orange';
//         return <Tag color={color}>{status.toUpperCase()}</Tag>;
//       },
//     },
//     {
//       title: 'Message',
//       dataIndex: 'message',
//       key: 'message',
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (record) => (
//         <Button
//           type="link"
//           onClick={() => {
//             setSelectedRecord(record);
//             setModalVisible(true);
//           }}
//         >
//           View Details
//         </Button>
//       ),
//     },
//   ];

//   return (
//     <div>
//       {/* Filters Row */}
//       <Card style={{ marginBottom: 16 }}>
//         <Row gutter={[16, 16]}>
//           <Col xs={24} md={12} lg={8}>
//             <Text strong>Date Range:</Text>
//             <RangePicker 
//               style={{ width: '100%', marginTop: 8 }}
//               onChange={(dates) => setDateRange(dates)}
//             />
//           </Col>
          
//           <Col xs={24} md={12} lg={8}>
//             <Text strong>Status:</Text>
//             <Select
//               style={{ width: '100%', marginTop: 8 }}
//               value={selectedStatus}
//               onChange={(value) => {
//                 setSelectedStatus(value);
//                 setPagination({ ...pagination, current: 1 }); // Reset to first page
//               }}
//               options={[
//                 { value: 'all', label: 'All Status' },
//                 { value: 'pending', label: 'Pending' },
//                 { value: 'done', label: 'Done' },
//                 { value: 'rejected', label: 'Rejected' },
//               ]}
//             />
//           </Col>
          
//           <Col xs={24} md={12} lg={8}>
//             <Text strong>Search:</Text>
//             <Input.Search
//               placeholder="Search across all fields"
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               style={{ width: '100%', marginTop: 8 }}
//               allowClear
//               onSearch={() => {
//                 setPagination({ ...pagination, current: 1 }); // Reset to first page
//               }}
//             />
//           </Col>
//         </Row>
//       </Card>

//       {/* Summary Row */}
//       <Card style={{ marginBottom: 16 }}>
//         <Row gutter={16}>
//           <Col span={24}>
//             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
//               <div>
//                 <Text strong>Total Requests: {pagination.total}</Text>
//               </div>
//               <div>
//                 <Tag color="green" onClick={() => setSelectedStatus('done')} style={{ cursor: 'pointer' }}>
//                   Done: {approvedCount}
//                 </Tag>
//                 <Tag color="red" onClick={() => setSelectedStatus('rejected')} style={{ cursor: 'pointer' }}>
//                   Rejected: {rejectedCount}
//                 </Tag>
//                 <Tag color="orange" onClick={() => setSelectedStatus('pending')} style={{ cursor: 'pointer' }}>
//                   Pending: {pendingCount}
//                 </Tag>
//               </div>
//             </div>
//           </Col>
//         </Row>
//       </Card>

//       {/* Membership Filter Row */}
//       <Card style={{ marginBottom: 16 }}>
//         <Row gutter={16}>
//           <Col span={24}>
//             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
//               <Tag 
//                 color={selectedMembership === 'all' ? 'blue' : 'default'}
//                 onClick={() => {
//                   setSelectedMembership('all');
//                   setPagination({ ...pagination, current: 1 });
//                 }}
//                 style={{ cursor: 'pointer', padding: '5px 15px' }}
//               >
//                 All
//               </Tag>
//               <Tag 
//                 color={selectedMembership === 'PREMIUM' ? 'blue' : 'default'}
//                 onClick={() => {
//                   setSelectedMembership('PREMIUM');
//                   setPagination({ ...pagination, current: 1 });
//                 }}
//                 style={{ cursor: 'pointer', padding: '5px 15px' }}
//               >
//                 Premium ({premiumCount})
//               </Tag>
//               <Tag 
//                 color={selectedMembership === 'BASIC' ? 'orange' : 'default'}
//                 onClick={() => {
//                   setSelectedMembership('BASIC');
//                   setPagination({ ...pagination, current: 1 });
//                 }}
//                 style={{ cursor: 'pointer', padding: '5px 15px' }}
//               >
//                 Basic ({basicCount})
//               </Tag>
//               <Tag 
//                 color={selectedMembership === 'FREE' ? 'default' : 'default'}
//                 onClick={() => {
//                   setSelectedMembership('FREE');
//                   setPagination({ ...pagination, current: 1 });
//                 }}
//                 style={{ cursor: 'pointer', padding: '5px 15px' }}
//               >
//                 Free ({freeCount})
//               </Tag>
//             </div>
//           </Col>
//         </Row>
//       </Card>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={data}
//         loading={loading}
//         rowKey="transaction_id"
//         pagination={{
//           ...pagination,
//           showSizeChanger: false,
//         }}
//         size="small"
//         onChange={handleTableChange}
//         rowClassName={(record) => {
//           return record.membership ? 'membership-row-' + record.membership.toLowerCase() : '';
//         }}
//         onRow={(record) => ({
//           style: { backgroundColor: getMembershipColor(record.membership) },
//         })}
//       />

//       {/* Custom global styles for table row colors */}
//       <style jsx global>{`
//         .membership-row-premium {
//           background-color: #e6f7ff;
//         }
//         .membership-row-basic {
//           background-color: #fff7e6; 
//         }
//       `}</style>

//       {/* Modal for Details */}
//       <Modal
//         title="Withdraw Request Details"
//         open={modalVisible}
//         onCancel={() => setModalVisible(false)}
//         footer={null}
//         width={800}
//       >
//         {selectedRecord && (
//           <Descriptions bordered column={1}>
//             <Descriptions.Item label="Member ID">{selectedRecord.member_id}</Descriptions.Item>
//             <Descriptions.Item label="Amount Requested">{selectedRecord.amount}</Descriptions.Item>
//             <Descriptions.Item label="Membership">
//               <Tag 
//                 color={
//                   selectedRecord.membership === 'PREMIUM' 
//                     ? 'blue' 
//                     : selectedRecord.membership === 'BASIC' ? 'orange' : 'default'
//                 }
//               >
//                 {selectedRecord.membership}
//               </Tag>
//               </Descriptions.Item>
//             <Descriptions.Item label="Full Name">{selectedRecord.kyc_details?.FullName || selectedRecord.kyc_details?.[0]?.FullName || 'N/A'}</Descriptions.Item>
//             <Descriptions.Item label="IFSC Code">{selectedRecord.kyc_details?.IFSC_Code || selectedRecord.kyc_details?.[0]?.IFSC_Code || selectedRecord.ifsc_code || 'N/A'}</Descriptions.Item>
//             <Descriptions.Item label="Bank Name">{selectedRecord.kyc_details?.Bank_Name || selectedRecord.kyc_details?.[0]?.Bank_Name || selectedRecord.bank_name || 'N/A'}</Descriptions.Item>
//             <Descriptions.Item label="Account Number">{selectedRecord.kyc_details?.Account_number || selectedRecord.kyc_details?.[0]?.Account_number || selectedRecord.account_number || 'N/A'}</Descriptions.Item>
//             <Descriptions.Item label="Aadhar Number">{selectedRecord.kyc_details?.Aadhar_Number || selectedRecord.kyc_details?.[0]?.Aadhar_Number || 'N/A'}</Descriptions.Item>
//             <Descriptions.Item label="PanCard Number">{selectedRecord.kyc_details?.PanCard_Number || selectedRecord.kyc_details?.[0]?.PanCard_Number || 'N/A'}</Descriptions.Item>
//             <Descriptions.Item label="KYC Status">{selectedRecord.kyc_details?.Kyc_status || selectedRecord.kyc_details?.[0]?.Kyc_status || 'N/A'}</Descriptions.Item>
//             <Descriptions.Item label="Message">{selectedRecord.message}</Descriptions.Item>
//             <Descriptions.Item label="Status">
//               <Tag 
//                 color={selectedRecord.status === 'done' ? 'green' : selectedRecord.status === 'rejected' ? 'red' : 'orange'}
//               >
//                 {selectedRecord.status.toUpperCase()}
//               </Tag>
//             </Descriptions.Item>
//             <Descriptions.Item label="Requested At">{formatDate(selectedRecord.date_time)}</Descriptions.Item>
//           </Descriptions>
//         )}
//         {selectedRecord && selectedRecord.status === 'pending' && (
//           <Space style={{ marginTop: 20 }}>
//             <Button
//               type="primary"
//               style={{ backgroundColor: 'green', borderColor: 'green' }}
//               onClick={handleApprove}
//             >
//               Approve
//             </Button>
//             <Button 
//               danger 
//               style={{ backgroundColor: 'red', borderColor: 'red', color: 'white' }}
//               onClick={() => setRejectModalVisible(true)}
//             >
//               Reject
//             </Button>
//           </Space>
//         )}
//       </Modal>

//       {/* Modal for Rejection */}
//       <Modal
//         title="Reject Withdrawal Request"
//         open={rejectModalVisible}
//         onOk={handleReject}
//         onCancel={() => setRejectModalVisible(false)}
//         okText="Confirm Rejection"
//         okButtonProps={{ danger: true }}
//       >
//         <Radio.Group onChange={handleRejectReasonChange} value={rejectionMessage}>
//           <Radio value="Wrong Account Number">Wrong Account Number</Radio>
//           <Radio value="Wrong IFSC Code">Wrong IFSC Code</Radio>
//           <Radio value="Wrong Document">Wrong Document</Radio>
//           <Radio value="Withdrawal request not valid">Withdrawal request not valid</Radio>
//         </Radio.Group>
//         <TextArea
//           rows={4}
//           value={rejectionMessage}
//           onChange={(e) => setRejectionMessage(e.target.value)}
//           style={{ marginTop: 16 }}
//         />
//       </Modal>

//       {/* Transfer Modal with Animation */}
//       <Modal
//         title="Complete Transfer"
//         open={transferModalVisible}
//         onCancel={() => {
//           if (!transferInProgress) {
//             setTransferModalVisible(false);
//             setTransferSuccess(null);
//           }
//         }}
//         footer={null}
//         width={500}
//         maskClosable={!transferInProgress}
//         closable={!transferInProgress}
//       >
//         {!transferInProgress && transferSuccess === null && (
//           <>
//             <div style={{ marginBottom: 24 }}>
//               <Text>Please select transfer method:</Text>
//               <Radio.Group 
//                 onChange={(e) => setTransferMode(e.target.value)} 
//                 value={transferMode}
//                 style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}
//               >
//                 <Radio value="manual" style={{ padding: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}>
//                   <Space>
//                     <BankOutlined style={{ fontSize: 18 }} />
//                     <div>
//                       <div><Text strong>Manual Transfer</Text></div>
//                       <div><Text type="secondary">Manually process the transfer outside the system</Text></div>
//                     </div>
//                   </Space>
//                 </Radio>
//                 <Radio value="api" style={{ padding: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}>
//                   <Space>
//                     <SendOutlined style={{ fontSize: 18 }} />
//                     <div>
//                       <div><Text strong>API Transfer</Text></div>
//                       <div><Text type="secondary">Automatically process via banking API</Text></div>
//                     </div>
//                   </Space>
//                 </Radio>
//               </Radio.Group>
//             </div>

//             <div style={{ textAlign: 'right', marginTop: 24 }}>
//               <Space>
//                 <Button onClick={() => setTransferModalVisible(false)}>Cancel</Button>
//                 <Button type="primary" onClick={handleTransfer}>
//                   Proceed with Transfer
//                 </Button>
//               </Space>
//             </div>
//           </>
//         )}

//         {transferInProgress && (
//           <div style={{ textAlign: 'center', padding: 40 }}>
//             <div className="bank-transfer-animation" style={{ marginBottom: 24 }}>
//               <div className="bank-building" style={{ display: 'inline-block', marginRight: 100 }}>
//                 <BankOutlined style={{ fontSize: 48 }} />
//                 <div>System</div>
//               </div>
//               <div className="transfer-line" style={{ 
//                 position: 'relative', 
//                 display: 'inline-block',
//                 width: 100,
//                 height: 4,
//                 backgroundColor: '#1890ff',
//                 animation: 'transferAnimation 2s infinite',
//                 margin: '0 10px',
//                 top: -25
//               }} />
//               <div className="bank-building" style={{ display: 'inline-block' }}>
//                 <BankOutlined style={{ fontSize: 48 }} />
//                 <div>Customer Bank</div>
//               </div>
//             </div>
//             <Spin size="large" />
//             <div style={{ marginTop: 16 }}>
//               <Text>{transferMode === 'api' ? 'API Transfer in progress...' : 'Manual Transfer processing...'}</Text>
//             </div>
//           </div>
//         )}

//         {!transferInProgress && transferSuccess === true && (
//           <Result
//             status="success"
//             title="Transfer Successful!"
//             subTitle={`The amount of ${selectedRecord?.amount} has been successfully transferred.`}
//             extra={[
//               <Button 
//                 type="primary" 
//                 key="done" 
//                 onClick={() => {
//                   setTransferModalVisible(false);
//                   setTransferSuccess(null);
//                 }}
//               >
//                 Done
//               </Button>
//             ]}
//           />
//         )}

//         {!transferInProgress && transferSuccess === false && (
//           <Result
//             status="error"
//             title="Transfer Failed"
//             subTitle="There was an issue processing your transfer request."
//             extra={[
//               <Button 
//                 onClick={() => {
//                   setTransferModalVisible(false);
//                   setTransferSuccess(null);
//                 }}
//                 key="back"
//               >
//                 Cancel
//               </Button>,
//               <Button 
//                 type="primary" 
//                 key="retry" 
//                 danger
//                 onClick={handleRetry}
//                 icon={<ReloadOutlined />}
//               >
//                 Retry API Transfer
//               </Button>
//             ]}
//           />
//         )}
//       </Modal>

//       {/* CSS for animation */}
//       <style jsx global>{`
//         @keyframes transferAnimation {
//           0% {
//             background: linear-gradient(to right, #1890ff 0%, #1890ff 0%, #d9d9d9 0%, #d9d9d9 100%);
//           }
//           50% {
//             background: linear-gradient(to right, #1890ff 0%, #1890ff 100%, #d9d9d9 100%, #d9d9d9 100%);
//           }
//           100% {
//             background: linear-gradient(to right, #1890ff 0%, #1890ff 0%, #d9d9d9 0%, #d9d9d9 100%);
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default WithdrawRequests;








// import { useState, useEffect } from 'react';
// import {
//   Table,
//   Typography,
//   Button,
//   Modal,
//   notification,
//   Tag,
//   Descriptions,
//   Space,
//   Input,
//   Row,
//   Col,
//   Radio,
//   DatePicker,
//   Select,
//   Card,
//   Spin,
//   Result
// } from 'antd';
// import { BankOutlined, SendOutlined, ReloadOutlined } from '@ant-design/icons';
// import axios from 'axios';
// import { formatDate } from '../../utils/dateFormat';
// import moment from 'moment';
// const Src = import.meta.env.VITE_Src;

// const { Text, Title } = Typography;
// const { TextArea } = Input;
// const { RangePicker } = DatePicker;

// const WithdrawRequests = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [transferModalVisible, setTransferModalVisible] = useState(false);
//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [rejectionMessage, setRejectionMessage] = useState('Withdrawal request not valid');
//   const [transferMode, setTransferMode] = useState('manual');
//   const [transferInProgress, setTransferInProgress] = useState(false);
//   const [transferSuccess, setTransferSuccess] = useState(null);
  
//   // Server-side pagination
//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 10,
//     total: 0,
//   });
  
//   const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));

//   // Filter states
//   const [searchText, setSearchText] = useState('');
//   const [dateRange, setDateRange] = useState(null);
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [membershipFilter, setMembershipFilter] = useState(null);
//   const [selectedMembership, setSelectedMembership] = useState('all');
//   const [selectedStatus, setSelectedStatus] = useState('all');
//   const [sortOrder, setSortOrder] = useState({ field: 'date_time', order: 'desc' });

//   // CSS for row styling
//   const rowStyles = `
//     .premium-row {
//       background-color: #e6f7ff;
//     }
//     .basic-row {
//       background-color: #fff7e6;
//     }
//   `;

//   const handleMembershipFilter = (membership) => {
//     setMembershipFilter(membership === membershipFilter ? null : membership);
//   };

//   // Fetch withdrawal requests from the server with filters
//   const fetchWithdrawRequests = async () => {
//     setLoading(true);
//     try {
//       // Build query parameters for filtering
//       const params = new URLSearchParams();
//       params.append('page', pagination.current);
      
//       if (dateRange) {
//         params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
//         params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
//       }
      
//       if (selectedMembership !== 'all') {
//         params.append('membership', selectedMembership);
//       }
      
//       if (selectedStatus !== 'all') {
//         params.append('status', selectedStatus);
//       }
      
//       if (searchText) {
//         params.append('search', searchText);
//       }
      
//       // Add sorting parameters
//       if (sortOrder) {
//         params.append('sortField', sortOrder.field);
//         params.append('sortOrder', sortOrder.order);
        
//         // Add membership priority sorting if date is the primary sort
//         if (sortOrder.field === 'date_time') {
//           params.append('membershipPriority', 'true');
//         }
//       }
      
//       const response = await axios.get(`${Src}/api/auth/all-withdraw-request?${params.toString()}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
      
//       if (response.data.status === 'true') {
//         // Apply frontend filters
//         let filteredData = response.data.data;
        
//         // Apply membership filter
//         if (membershipFilter) {
//           filteredData = filteredData.filter(item => item.membership === membershipFilter);
//         }
        
//         // Apply status filter
//         if (statusFilter !== 'all') {
//           filteredData = filteredData.filter(item => item.status === statusFilter);
//         }
        
//         // Apply search text filter
//         if (searchText) {
//           const searchLower = searchText.toLowerCase();
//           filteredData = filteredData.filter(item => 
//             Object.values(item).some(val => 
//               val && val.toString().toLowerCase().includes(searchLower)
//             )
//           );
//         }
        
//         setData(filteredData);
//         setPagination({
//           ...pagination,
//           total: response.data.pagination.totalRecords,
//         });
//       } else {
//         notification.error({
//           message: 'Error',
//           description: 'Failed to fetch withdraw requests.',
//         });
//       }
//     } catch (error) {
//       notification.error({
//         message: 'Error',
//         description: 'Failed to fetch withdraw requests.',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle status updates (Approve or Reject)
//   const handleStatusUpdate = async (status, mode = 'manual') => {
//     setTransferInProgress(true);
//     try {
//       const response = await axios.post(
//         `${Src}/api/auth/update-status-user-withdraw-request`,
//         { 
//           transaction_id: selectedRecord.transaction_id,
//           status,
//           message: status === "done" ? "sent to bank" : rejectionMessage,
//           mode,
//         }, 
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (response.data.status === 'true') {
//         setTransferSuccess(true);
//         setTimeout(() => {
//           notification.success({
//             message: 'Success',
//             description: response.data.message,
//           });
          
//           // Refresh data after successful update
//           fetchWithdrawRequests();
          
//           // Close modals
//           setModalVisible(false);
//           setRejectModalVisible(false);
//           setTransferModalVisible(false);
//           setTransferInProgress(false);
//         }, 2000);
//       } else {
//         setTransferSuccess(false);
//         notification.error({
//           message: 'Error',
//           description: response.data.message,
//         });
//       }
//     } catch (error) {
//       setTransferSuccess(false);
//       notification.error({
//         message: 'Error',
//         description: 'Failed to update withdrawal status.',
//       });
//     } finally {
//       setTimeout(() => {
//         setTransferInProgress(false);
//       }, 2000);
//     }
//   };

//   const handleReject = () => {
//     handleStatusUpdate('rejected');
//   };

//   const handleApprove = () => {
//     setTransferModalVisible(true);
//   };

//   const handleTransfer = () => {
//     handleStatusUpdate('done', transferMode);
//   };

//   const handleRetry = () => {
//     setTransferSuccess(null);
//     handleStatusUpdate('done', 'api');
//   };

//   const handleRejectReasonChange = (e) => {
//     setRejectionMessage(e.target.value);
//   };

//     const handleTableChange = (pagination, filters, sorter) => {
//     setPagination({
//       ...pagination,
//     });
//   }; // Added missing closing bracket here

//   useEffect(() => {
//     fetchWithdrawRequests();
//   }, [pagination.current, dateRange, selectedMembership, selectedStatus, searchText]);

//   // Apply frontend filters when they change
//   useEffect(() => {
//     // Perform local filtering without API call
//     if (data.length > 0) {
//       fetchWithdrawRequests();
//     }
//   }, [statusFilter, membershipFilter]);

//   // Get counts for summary
//   const approvedCount = data.filter((record) => record.status === 'done').length;
//   const rejectedCount = data.filter((record) => record.status === 'rejected').length;
//   const pendingCount = data.filter((record) => record.status === 'pending').length;

//   // Membership counts
//   const premiumCount = data.filter((record) => record.membership === 'PREMIUM').length;
//   const basicCount = data.filter((record) => record.membership === 'BASIC').length;
//   const freeCount = data.filter((record) => record.membership === 'FREE').length;

//   const columns = [
//     {
//       title: 'S.No',
//       dataIndex: 'sno',
//       key: 'sno',
//       render: (_, __, index) =>
//         (pagination.current - 1) * pagination.pageSize + index + 1,
//     },
//     {
//       title: 'Transaction Id',
//       dataIndex: 'transaction_id',
//       key: 'transaction_id',
//     },
//     {
//       title: 'Member ID',
//       dataIndex: 'member_id',
//       key: 'member_id',
//     },
//     {
//       title: 'Membership',
//       dataIndex: 'membership',
//       key: 'membership',
//       render: (membership) => {
//         const color = membership === 'PREMIUM' ? 'blue' : membership === 'BASIC' ? 'orange' : 'default';
//         return <Tag color={color}>{membership}</Tag>;
//       },
//     },
//     {
//       title: 'Amount Requested',
//       dataIndex: 'amount',
//       key: 'amount',
//       sorter: (a, b) => a.amount - b.amount, // Client-side sort
//     },
//     {
//       title: 'Date Time',
//       dataIndex: 'date_time',
//       key: 'date_time',
//       sorter: (a, b) => moment(a.date_time).valueOf() - moment(b.date_time).valueOf(),
//       defaultSortOrder: 'descend',
//       render: (text) => formatDate(text),
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => {
//         const color = status === 'done' ? 'green' : status === 'rejected' ? 'red' : 'orange';
//         return <Tag color={color}>{status.toUpperCase()}</Tag>;
//       },
//     },
//     {
//       title: 'Message',
//       dataIndex: 'message',
//       key: 'message',
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (record) => (
//         <Button
//           type="link"
//           onClick={() => {
//             setSelectedRecord(record);
//             setModalVisible(true);
//           }}
//         >
//           View Details
//         </Button>
//       ),
//     },
//   ];

//   return (
//     <>
//       <style>{rowStyles}</style>
//       <Row gutter={16} align="stretch" style={{ marginBottom: 16 }}>
//         <Col span={24}>
//           <Row gutter={16}>
//             <Col span={6}>
//               <Input.Search
//                 placeholder="Search"
//                 value={searchText}
//                 onChange={(e) => setSearchText(e.target.value)}
//               />
//             </Col>
//             <Col span={6}>
//               <Select
//                 placeholder="Filter by Status"
//                 value={statusFilter}
//                 onChange={setStatusFilter}
//                 style={{ width: '100%' }}
//               >
//                 <Select.Option value="all">All</Select.Option>
//                 <Select.Option value="done">Done</Select.Option>
//                 <Select.Option value="rejected">Rejected</Select.Option>
//                 <Select.Option value="pending">Pending</Select.Option>
//               </Select>
//             </Col>
//             <Col span={6}>
//             <RangePicker
//                 style={{ width: '100%' }}
//                 onChange={setDateRange}
//                 format="YYYY-MM-DD"
//               />
//             </Col>
//             <Col span={6}>
//               <div style={{ padding: '8px', background: '#f0f2f5', borderRadius: '4px' }}>
//                 <Space>
//                   <span>Membership Filter:</span>
//                   <Tag
//                     color="blue"
//                     onClick={() => handleMembershipFilter('PREMIUM')}
//                     style={{ cursor: 'pointer', fontWeight: membershipFilter === 'PREMIUM' ? 'bold' : 'normal' }}
//                   >
//                     PREMIUM {membershipFilter === 'PREMIUM' && '✓'}
//                   </Tag>
//                   <Tag
//                     color="orange"
//                     onClick={() => handleMembershipFilter('BASIC')}
//                     style={{ cursor: 'pointer', fontWeight: membershipFilter === 'BASIC' ? 'bold' : 'normal' }}
//                   >
//                     BASIC {membershipFilter === 'BASIC' && '✓'}
//                   </Tag>
//                   <Tag
//                     color="default"
//                     onClick={() => handleMembershipFilter('FREE')}
//                     style={{ cursor: 'pointer', fontWeight: membershipFilter === 'FREE' ? 'bold' : 'normal' }}
//                   >
//                     FREE {membershipFilter === 'FREE' && '✓'}
//                   </Tag>
//                   {membershipFilter && (
//                     <Button type="link" onClick={() => setMembershipFilter(null)}>
//                       Clear
//                     </Button>
//                   )}
//                 </Space>
//               </div>
//             </Col>
//           </Row>
//         </Col>
//       </Row>

//       {/* Summary Row */}
//       <Card style={{ marginBottom: 16 }}>
//         <Row gutter={16}>
//           <Col span={24}>
//             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
//               <div>
//                 <Text strong>Total Requests: {pagination.total}</Text>
//               </div>
//               <div>
//                 <Tag color="green" onClick={() => setStatusFilter('done')} style={{ cursor: 'pointer' }}>
//                   Done: {approvedCount}
//                 </Tag>
//                 <Tag color="red" onClick={() => setStatusFilter('rejected')} style={{ cursor: 'pointer' }}>
//                   Rejected: {rejectedCount}
//                 </Tag>
//                 <Tag color="orange" onClick={() => setStatusFilter('pending')} style={{ cursor: 'pointer' }}>
//                   Pending: {pendingCount}
//                 </Tag>
//               </div>
//             </div>
//           </Col>
//         </Row>
//       </Card>

      
//       <Table
//         columns={columns}
//         dataSource={data}
//         loading={loading}
//         pagination={pagination}
//         onChange={handleTableChange}
//         rowKey="transaction_id"
//         rowClassName={(record) => {
//           return record.membership === 'PREMIUM' ? 'premium-row' : record.membership === 'BASIC' ? 'basic-row' : '';
//         }}
//       />

//       {/* View Details Modal */}
//       <Modal
//         title="Withdrawal Request Details"
//         open={modalVisible}
//         onCancel={() => setModalVisible(false)}
//         footer={
//           selectedRecord?.status === 'pending' ? [
//             <Button key="reject" danger onClick={() => {
//               setModalVisible(false);
//               setRejectModalVisible(true);
//             }}>
//               Reject
//             </Button>,
//             <Button key="approve" type="primary" onClick={handleApprove}>
//               Approve
//             </Button>,
//           ] : [
//             <Button key="close" onClick={() => setModalVisible(false)}>
//               Close
//             </Button>,
//           ]
//         }
//         width={700}
//       >
//         {selectedRecord && (
//           <Descriptions bordered column={1}>
//             <Descriptions.Item label="Transaction ID">{selectedRecord.transaction_id}</Descriptions.Item>
//             <Descriptions.Item label="Member ID">{selectedRecord.member_id}</Descriptions.Item>
//             <Descriptions.Item label="Member Name">{selectedRecord.member_name}</Descriptions.Item>
//             <Descriptions.Item label="Membership">
//             <Tag color={selectedRecord.membership === 'PREMIUM' ? 'blue' : selectedRecord.membership === 'BASIC' ? 'orange' : 'default'}>
//                {selectedRecord.membership}
//              </Tag>
//            </Descriptions.Item>
//            <Descriptions.Item label="Amount Requested">{selectedRecord.amount}</Descriptions.Item>
//            <Descriptions.Item label="Date Time">{formatDate(selectedRecord.date_time)}</Descriptions.Item>
//            <Descriptions.Item label="Status">
//              <Tag color={selectedRecord.status === 'done' ? 'green' : selectedRecord.status === 'rejected' ? 'red' : 'orange'}>
//                {selectedRecord.status.toUpperCase()}
//              </Tag>
//            </Descriptions.Item>
//            <Descriptions.Item label="Message">{selectedRecord.message}</Descriptions.Item>
//            <Descriptions.Item label="Bank Name">{selectedRecord.bank_name}</Descriptions.Item>
//            <Descriptions.Item label="Account Number">{selectedRecord.account_number}</Descriptions.Item>
//            <Descriptions.Item label="IFSC Code">{selectedRecord.ifsc_code}</Descriptions.Item>
//            <Descriptions.Item label="UPI ID">{selectedRecord.upi_id}</Descriptions.Item>
//          </Descriptions>
//        )}
//      </Modal>

//      {/* Reject Modal */}
//      <Modal
//        title="Reject Withdrawal Request"
//        open={rejectModalVisible}
//        onCancel={() => setRejectModalVisible(false)}
//        onOk={handleReject}
//        okText="Confirm Rejection"
//        okButtonProps={{ danger: true }}
//      >
//        <div>
//          <Text>Please provide a reason for rejection:</Text>
//          <TextArea
//            rows={4}
//            value={rejectionMessage}
//            onChange={handleRejectReasonChange}
//            placeholder="Enter reason for rejection"
//            style={{ marginTop: 8 }}
//          />
//        </div>
//      </Modal>

    
//       <Modal
//         title="Complete Transfer"
//         open={transferModalVisible}
//         onCancel={() => {
//           if (!transferInProgress) {
//             setTransferModalVisible(false);
//             setTransferSuccess(null);
//           }
//         }}
//         footer={null}
//         width={500}
//         maskClosable={!transferInProgress}
//         closable={!transferInProgress}
//       >
//         {!transferInProgress && transferSuccess === null && (
//           <>
//             <div style={{ marginBottom: 24 }}>
//               <Text>Please select transfer method:</Text>
//               <Radio.Group 
//                 onChange={(e) => setTransferMode(e.target.value)} 
//                 value={transferMode}
//                 style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}
//               >
//                 <Radio value="manual" style={{ padding: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}>
//                   <Space>
//                     <BankOutlined style={{ fontSize: 18 }} />
//                     <div>
//                       <div><Text strong>Manual Transfer</Text></div>
//                       <div><Text type="secondary">Manually process the transfer outside the system</Text></div>
//                     </div>
//                   </Space>
//                 </Radio>
//                 <Radio value="api" style={{ padding: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}>
//                   <Space>
//                     <SendOutlined style={{ fontSize: 18 }} />
//                     <div>
//                       <div><Text strong>API Transfer</Text></div>
//                       <div><Text type="secondary">Automatically process via banking API</Text></div>
//                     </div>
//                   </Space>
//                 </Radio>
//               </Radio.Group>
//             </div>

//             <div style={{ textAlign: 'right', marginTop: 24 }}>
//               <Space>
//                 <Button onClick={() => setTransferModalVisible(false)}>Cancel</Button>
//                 <Button type="primary" onClick={handleTransfer}>
//                   Proceed with Transfer
//                 </Button>
//               </Space>
//             </div>
//           </>
//         )}

//         {transferInProgress && (
//           <div style={{ textAlign: 'center', padding: 40 }}>
//             <div className="bank-transfer-animation" style={{ marginBottom: 24 }}>
//               <div className="bank-building" style={{ display: 'inline-block', marginRight: 100 }}>
//                 <BankOutlined style={{ fontSize: 48 }} />
//                 <div>System</div>
//               </div>
//               <div className="transfer-line" style={{ 
//                 position: 'relative', 
//                 display: 'inline-block',
//                 width: 100,
//                 height: 4,
//                 backgroundColor: '#1890ff',
//                 animation: 'transferAnimation 2s infinite',
//                 margin: '0 10px',
//                 top: -25
//               }} />
//               <div className="bank-building" style={{ display: 'inline-block' }}>
//                 <BankOutlined style={{ fontSize: 48 }} />
//                 <div>Customer Bank</div>
//               </div>
//             </div>
//             <Spin size="large" />
//             <div style={{ marginTop: 16 }}>
//               <Text>{transferMode === 'api' ? 'API Transfer in progress...' : 'Manual Transfer processing...'}</Text>
//             </div>
//           </div>
//         )}

//         {!transferInProgress && transferSuccess === true && (
//           <Result
//             status="success"
//             title="Transfer Successful!"
//             subTitle={`The amount of ${selectedRecord?.amount} has been successfully transferred.`}
//             extra={[
//               <Button 
//                 type="primary" 
//                 key="done" 
//                 onClick={() => {
//                   setTransferModalVisible(false);
//                   setTransferSuccess(null);
//                 }}
//               >
//                 Done
//               </Button>
//             ]}
//           />
//         )}

//         {!transferInProgress && transferSuccess === false && (
//           <Result
//             status="error"
//             title="Transfer Failed"
//             subTitle="There was an issue processing your transfer request."
//             extra={[
//               <Button 
//                 onClick={() => {
//                   setTransferModalVisible(false);
//                   setTransferSuccess(null);
//                 }}
//                 key="back"
//               >
//                 Cancel
//               </Button>,
//               <Button 
//                 type="primary" 
//                 key="retry" 
//                 danger
//                 onClick={handleRetry}
//                 icon={<ReloadOutlined />}
//               >
//                 Retry API Transfer
//               </Button>
//             ]}
//           />
//         )}
//       </Modal>

     
//       <style jsx global>{`
//         @keyframes transferAnimation {
//           0% {
//             background: linear-gradient(to right, #1890ff 0%, #1890ff 0%, #d9d9d9 0%, #d9d9d9 100%);
//           }
//           50% {
//             background: linear-gradient(to right, #1890ff 0%, #1890ff 100%, #d9d9d9 100%, #d9d9d9 100%);
//           }
//           100% {
//             background: linear-gradient(to right, #1890ff 0%, #1890ff 0%, #d9d9d9 0%, #d9d9d9 100%);
//           }
//         }
//       `}</style>
//     </>
//   );
// };

// export default WithdrawRequests;

  
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
    pageSize: 100,
    total: 0,
  });
  
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
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

    // Apply date range filter
    if (dateRange) {
      const start = moment(dateRange[0]).startOf('day');
      const end = moment(dateRange[1]).endOf('day');
      result = result.filter(item => {
        const itemDate = moment(item.date_time);
        return itemDate.isBetween(start, end, null, '[]');
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
  }, [statusFilter, membershipFilter, dateRange, searchText]);
  // Handle status updates (Approve or Reject)
  const handleStatusUpdate = async (status, mode = 'manual') => {
    setTransferInProgress(true);
    try {
      const response = await axios.post(
        `${Src}/api/auth/update-status-user-withdraw-request`,
        { 
          transaction_id: selectedRecord.transaction_id,
          status,
          message: status === "done" ? "sent to bank" : rejectionMessage,
          mode,
        }, 
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
                onChange={setDateRange}
                format="YYYY-MM-DD"
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
          pageSizeOptions: ['10', '20', '50'],
        }}
        onChange={handleTableChange}
        rowKey="transaction_id"
        rowClassName={(record) => {
          return record.membership === 'PREMIUM' ? 'premium-row' : record.membership === 'BASIC' ? 'basic-row' : '';
        }}
      />


    
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
