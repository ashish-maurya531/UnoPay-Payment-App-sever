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
//   Radio
// } from 'antd';
// import axios from 'axios';
// import { formatDate } from '../../utils/dateFormat';

// const { Text, Title } = Typography;
// const { TextArea } = Input;

// const WithdrawRequests = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false); // Added missing state
//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [rejectionMessage, setRejectionMessage] = useState('Withdrawal request not valid');
//   const [currentPagination, setCurrentPagination] = useState({
//     current: 1,
//     pageSize: 10,
//   });

//   const handleTableChange = (pagination) => {
//     setCurrentPagination({
//       current: pagination.current,
//       pageSize: pagination.pageSize,
//     });
//   };
//   // New state for filtering
//   const [searchText, setSearchText] = useState('');

//   const fetchWithdrawRequests = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get('http://localhost:3000/api/auth/all-withdraw-request');
//       if (response.data.status === 'true') {
//         // Sort by creation time
//         response.data.data.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
//         setData(response.data.data);
//       } else {
//         notification.error({
//           message: 'Error',
//           description: 'Failed to fetch withdraw requests.',
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching withdraw requests:', error);
//       notification.error({
//         message: 'Error',
//         description: 'Failed to fetch withdraw requests.',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStatusUpdate = async (status) => {
//     try {
//       const response = await axios.put('http://localhost:3000/api/auth/update-status-user-withdraw-request', {
//         transaction_id: selectedRecord.transaction_id,
//         status,
//         message: status === 'done'? 'sent to bank' : rejectionMessage,
        
//       });

//       if (response.data.status === 'true') {
//         notification.success({
//           message: 'Success',
//           description: response.data.message,
//         });
        
//         // Update local state
//         setData(prevData => 
//           prevData.map(item => 
//             item.request_id === selectedRecord.request_id 
//               ? { 
//                   ...item, 
//                   status, 
//                   message: status === 'done' ? 'done' : rejectionMessage 
//                 }
//               : item
//           )
//         );

//         // Update selected record
//         setSelectedRecord(prev => ({ 
//           ...prev, 
//           status, 
//           message: status === 'done' ? 'done' : rejectionMessage 
//         }));

//         // Close modals
//         setModalVisible(false);
//         setRejectModalVisible(false); // Close reject modal
//       } else {
//         notification.error({
//           message: 'Error',
//           description: response.data.error,
//         });
//       }
//     } catch (error) {
//       console.error('Error updating withdrawal request status:', error);
//       notification.error({
//         message: 'Error',
//         description: 'Failed to update withdrawal request status.',
//       });
//     }
//   };

//   const handleReject = () => {
//     handleStatusUpdate('rejected');
//   };

//   const handleRejectReasonChange = (e) => {
//     setRejectionMessage(e.target.value);  // Update rejection message based on selected reason
//   };
  

//   useEffect(() => {
//     fetchWithdrawRequests();
//   }, []);

//   // Filter data based on search text
//   const filteredData = data.filter(record =>
//     Object.values(record).some(value => 
//       value && value.toString().toLowerCase().includes(searchText.toLowerCase())
//     )
//   );

//   const approvedCount = filteredData.filter(record => record.status === 'approved').length;
//   const rejectedCount = filteredData.filter(record => record.status === 'rejected').length;
//   const pendingCount = filteredData.filter(record => record.status === 'pending').length;

//   const columns = [
//     {
//       title: 'S.No',
//       dataIndex: 'sno',
//       key: 'sno',
//       render: (_, __, index) =>
//         (currentPagination.current - 1) * currentPagination.pageSize + index + 1,
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
//       title: 'Amount Requested',
//       dataIndex: 'amount',
//       key: 'amount',
//     },
//     {
//       title: 'date time',
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
//       }
//     },
//     {
//         title:"Message",
//         dataIndex: "message",
//         key: "message",
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (record) => (
//         <Button type="link" onClick={() => {
//           setSelectedRecord(record);
//           setModalVisible(true);
//         }}>
//           View Details
//         </Button>
//       ),
//     }
//   ];

//   return (
//     <div>
//       {/* Summary row */}
//       <Row gutter={16} align="stretch" style={{ marginBottom: 16 }}>
//         <Col span={24}>
//           <div style={{
//             display: "flex", 
//             flexDirection: "row", 
//             gap: 20, 
//             justifyContent: "space-between", 
//             alignItems: "center",
//             padding: "10px",
//             borderRadius: "4px"
//           }}>
//             <div>
//               <Text strong>Total Requests: {data.length}</Text>
//               <br />
//             </div>
//             <div style={{ display: "flex", gap: 20 }}>
//               <div>
//                 <Tag color="green">Approved: {approvedCount}</Tag>
//                 <Tag color="red">Rejected: {rejectedCount}</Tag>
//                 <Tag color="orange">Pending: {pendingCount}</Tag>
//               </div>
//             </div>
//           </div>
//         </Col>
//       </Row>

//       {/* Search input */}
//       <Row style={{ marginBottom: 10 }}>
//         <Col span={24}>
//           <Input.Search
//             placeholder="Search across all fields"
//             value={searchText}
//             onChange={(e) => setSearchText(e.target.value)}
//             style={{ width: '100%' }}
//             allowClear
//           />
//         </Col>
//       </Row>

      
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading}
//         rowKey="request_id"
//         scroll={{ x: true }}
//         pagination={{
//           current: currentPagination.current,
//           pageSize: currentPagination.pageSize,
//           total: filteredData.length,
//         }}
//          size="small"
//         onChange={handleTableChange}
//       />

//       {/* Modal for Withdraw Request Details */}
//       <Modal
//         title="Withdraw Request Details"
//         open={modalVisible}
//         onCancel={() => setModalVisible(false)}
//         footer={null}
//         width={1000}
//       >
//         {selectedRecord && (
//           <div>
//             <Descriptions bordered column={1}>
              
//               <Descriptions.Item label="Member ID">{selectedRecord.member_id}</Descriptions.Item>
//               <Descriptions.Item label="Amount Requested">{selectedRecord.amount}</Descriptions.Item>
//               <Descriptions.Item label="Full Name">{selectedRecord.kyc_details[0].FullName}</Descriptions.Item>
//               <Descriptions.Item label="IFSC_Code">{selectedRecord.kyc_details[0].IFSC_Code}</Descriptions.Item>
//               <Descriptions.Item label="Bank_Name">{selectedRecord.kyc_details[0].Bank_Name}</Descriptions.Item>
//               <Descriptions.Item label="Account_number">{selectedRecord.kyc_details[0].Account_number}</Descriptions.Item>
//               <Descriptions.Item label="Aadhar_Number">{selectedRecord.kyc_details[0].Aadhar_Number}</Descriptions.Item>
//               <Descriptions.Item label="PanCard_Number">{selectedRecord.kyc_details[0].PanCard_Number}</Descriptions.Item>
//               <Descriptions.Item label="Kyc_status">{selectedRecord.kyc_details[0].Kyc_status}</Descriptions.Item>
//               <Descriptions.Item label="Message">{selectedRecord.message}</Descriptions.Item>
                



//               <Descriptions.Item label="Status">
//                 <Tag 
//                   color={selectedRecord.status === 'done' ? 'green' : selectedRecord.status === 'rejected' ? 'red' : 'orange'}
//                 >
//                   {selectedRecord.status.toUpperCase()}
//                 </Tag>
//               </Descriptions.Item>
//               <Descriptions.Item label="Requested At">{formatDate(selectedRecord.date_time)}</Descriptions.Item>
//             </Descriptions>

//             {selectedRecord.status === 'pending' && (
//               <Space style={{ marginTop: 20 }}>
//                 <Button 
//                   type="primary" 
//                   style={{ backgroundColor: 'green', borderColor: 'green' }}
//                   onClick={() => handleStatusUpdate('done')}
//                 >
//                   Approve Request
//                 </Button>
//                 <Button 
//                   type="primary" 
//                   danger
//                   onClick={() => setRejectModalVisible(true)} // Open reject modal
//                 >
//                   Reject Request
//                 </Button>
//               </Space>
//             )}
//           </div>
//         )}
//       </Modal>

//       {/* Modal for Reject Withdrawal Request */}
//       <Modal
      
//         title="Reject Withdrawal Request"
//         open={rejectModalVisible}
//         onOk={handleReject}
//         onCancel={() => setRejectModalVisible(false)}
//         okText="Confirm Rejection"
//         okButtonProps={{ danger: true }}
//       >
//         {/* Radio buttons for rejection reasons */}
//         <Radio.Group onChange={handleRejectReasonChange} value={rejectionMessage}>
//           <Radio value="Wrong Account Number">Wrong Account Number</Radio>
//           <Radio value="Wrong IFSC Code">Wrong IFSC Code</Radio>
//           <Radio value="Wrong Document">Wrong Document</Radio>
//           <Radio value="Withdrawal request not valid">Withdrawal request not valid</Radio>

         
//         </Radio.Group>
//         <TextArea
//           rows={4}
//           value={rejectionMessage}
//           onChange={handleRejectReasonChange}
//           placeholder="Enter reason for rejection"
//           style={{ marginTop: 16 }}
//         />
//       </Modal>
//     </div>
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
} from 'antd';
import axios from 'axios';
import { formatDate } from '../../utils/dateFormat';
const Src = import.meta.env.VITE_Src;

const { Text, Title } = Typography;
const { TextArea } = Input;



const WithdrawRequests = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState('Withdrawal request not valid');
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));

  const [searchText, setSearchText] = useState('');

  // Fetch withdrawal requests from the server
  const fetchWithdrawRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${Src}/api/auth/all-withdraw-request`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      });
      if (response.data.status === 'true') {
        response.data.data.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
        setData(response.data.data);
      } else {
        notification.error({
          message: 'Error',
          description: 'Failed to fetch withdraw requests.',
        });
      }
    } catch (error) {
      // console.error('Error fetching withdraw requests:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch withdraw requests.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle status updates (Approve or Reject)
  const handleStatusUpdate = async (status) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${Src}/api/auth/update-status-user-withdraw-request`,
        { 
          transaction_id: selectedRecord.transaction_id,
          status,
          message: status === "done" ? "sent to bank" : rejectionMessage,
        }, 
        {
          headers: {
            Authorization: `Bearer ${token}`, // Ensure authentication if required
            "Content-Type": "application/json", // Explicitly define JSON format
          },
        }
      );
      

        if (response.data.status === 'true') {
            notification.success({
                message: 'Success',
                description: response.data.message,
            });

            // Update local data to reflect the new status
            setData(prevData =>
                prevData.map(item =>
                    item.transaction_id === selectedRecord.transaction_id
                        ? { ...item, status, message: status === 'done' ? 'sent to bank' : rejectionMessage }
                        : item
                )
            );

            // Close modals
            setModalVisible(false);
            setRejectModalVisible(false);
        } else {
            notification.error({
                message: 'Error',
                description: response.data.message,
            });
        }
    } catch (error) {
        // console.error('Error updating withdrawal status:', error);
        notification.error({
            message: 'Error',
            description: 'Failed to update withdrawal status.',
        });
    } finally {
        setLoading(false);
    }
};


  const handleReject = () => {
    handleStatusUpdate('rejected');
  };

  const handleRejectReasonChange = (e) => {
    setRejectionMessage(e.target.value);
  };

  useEffect(() => {
    fetchWithdrawRequests();
  }, []);

  // Filter data based on search text
  const filteredData = data.filter((record) =>
    Object.values(record).some((value) =>
      value && value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const approvedCount = filteredData.filter((record) => record.status === 'done').length;
  const rejectedCount = filteredData.filter((record) => record.status === 'rejected').length;
  const pendingCount = filteredData.filter((record) => record.status === 'pending').length;

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, __, index) =>
        (currentPagination.current - 1) * currentPagination.pageSize + index + 1,
    },
    {
      title: 'Transaction Id',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
    },
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
    },
    {
      title: 'Amount Requested',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Date Time',
      dataIndex: 'date_time',
      key: 'date_time',
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
        <Button
          type="link"
          onClick={() => {
            setSelectedRecord(record);
            setModalVisible(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Summary Row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Total Requests: {data.length}</Text>
            </div>
            <div>
              <Tag color="green">Done: {approvedCount}</Tag>
              <Tag color="red">Rejected: {rejectedCount}</Tag>
              <Tag color="orange">Pending: {pendingCount}</Tag>
            </div>
          </div>
        </Col>
      </Row>

      {/* Search Input */}
      <Row style={{ marginBottom: 10 }}>
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
        dataSource={filteredData}
        loading={loading}
        rowKey="request_id"
        pagination={{
          current: currentPagination.current,
          pageSize: currentPagination.pageSize,
          total: filteredData.length,
        }}
        size="small"
        onChange={(pagination) => {
          setCurrentPagination({
            current: pagination.current,
            pageSize: pagination.pageSize,
          });
        }}
      />

      {/* Modal for Details */}
      <Modal
        title="Withdraw Request Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedRecord && (
                     <Descriptions bordered column={1}>
              
              <Descriptions.Item label="Member ID">{selectedRecord.member_id}</Descriptions.Item>
              <Descriptions.Item label="Amount Requested">{selectedRecord.amount}</Descriptions.Item>
              <Descriptions.Item label="Full Name">{selectedRecord.kyc_details[0].FullName}</Descriptions.Item>
              <Descriptions.Item label="IFSC_Code">{selectedRecord.kyc_details[0].IFSC_Code}</Descriptions.Item>
              <Descriptions.Item label="Bank_Name">{selectedRecord.kyc_details[0].Bank_Name}</Descriptions.Item>
              <Descriptions.Item label="Account_number">{selectedRecord.kyc_details[0].Account_number}</Descriptions.Item>
              <Descriptions.Item label="Aadhar_Number">{selectedRecord.kyc_details[0].Aadhar_Number}</Descriptions.Item>
              <Descriptions.Item label="PanCard_Number">{selectedRecord.kyc_details[0].PanCard_Number}</Descriptions.Item>
              <Descriptions.Item label="Kyc_status">{selectedRecord.kyc_details[0].Kyc_status}</Descriptions.Item>
              <Descriptions.Item label="Message">{selectedRecord.message}</Descriptions.Item>
                



              <Descriptions.Item label="Status">
                <Tag 
                  color={selectedRecord.status === 'done' ? 'green' : selectedRecord.status === 'rejected' ? 'red' : 'orange'}
                >
                  {selectedRecord.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Requested At">{formatDate(selectedRecord.date_time)}</Descriptions.Item>
            </Descriptions>
        )}
        {selectedRecord && selectedRecord.status === 'pending' && (
          <Space style={{ marginTop: 20 }}>
            <Button
              type="primary"
              style={{ backgroundColor: 'green', borderColor: 'green' }}
              onClick={() => handleStatusUpdate('done')}
            >
              Approve
            </Button>
            <Button danger 
             style={{ backgroundColor: 'red', borderColor: 'red',color: 'white' }}
            onClick={() => setRejectModalVisible(true)}>
              Reject
            </Button>
          </Space>
        )}
      </Modal>

      {/* Modal for Rejection */}
      <Modal
        title="Reject Withdrawal Request"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <Radio.Group onChange={handleRejectReasonChange} value={rejectionMessage}>
          <Radio value="Wrong Account Number">Wrong Account Number</Radio>
          <Radio value="Wrong IFSC Code">Wrong IFSC Code</Radio>
          <Radio value="Wrong Document">Wrong Document</Radio>
          <Radio value="Withdrawal request not valid">Withdrawal request not valid</Radio>
        </Radio.Group>
        <TextArea
          rows={4}
          value={rejectionMessage}
          onChange={(e) => setRejectionMessage(e.target.value)}
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  );
};

export default WithdrawRequests;
