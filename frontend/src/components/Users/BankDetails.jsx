

// import { useState, useEffect } from 'react';
// import { 
//   Table, 
//   Typography, 
//   Button, 
//   Modal, 
//   Image, 
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
// import {formatDate } from '../../utils/dateFormat';
// const Src = import.meta.env.VITE_Src;


// const { Text, Title } = Typography;
// const { TextArea } = Input;


// const BankDetails = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [imageModalVisible, setImageModalVisible] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [imageType, setImageType] = useState(null);
//   const [rejectionMessage, setRejectionMessage] = useState('KYC documents not valid');
//   const token = localStorage.getItem('adminToken')||sessionStorage.removeItem('adminToken');
  
  
//   // New state for filtering
//   const [searchText, setSearchText] = useState('');
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

//   const fetchBankDetails = async () => {
//     setLoading(true);
//     try {
      
//       const response = await axios.get(`${Src}/api/auth/bankkycDetails/All`, {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token for authentication
//         },
//       });
//       if (response.data.status === 'true') {
//         //sort by creation time
//         response.data.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//         setData(response.data.data);
//       } else {
//         notification.error({
//           message: 'Error',
//           description: 'Failed to fetch bank details.',
//         });
//       }
//     } catch (error) {
//       // console.error('Error fetching bank details:', error);
//       notification.error({
//         message: 'Error',
//         description: 'Failed to fetch bank details.',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchImage = async (imageType) => {
//     try {
//       const response = await axios.post(`${Src}/api/auth/get${imageType}Image`, {
//         member_id: selectedRecord.member_id
//       }, { responseType: 'blob' });
//       // console.log(response);

//       if (response.status === 200) {
//         const imageUrl = URL.createObjectURL(response.data);
        
//         setSelectedImage(imageUrl);
//         setImageType(imageType);
//         setImageModalVisible(true);
//       }
//     } catch (error) {
//       // console.error(`Error fetching ${imageType} image:`, error);
//       notification.error({
//         message: 'Error',
//         description: `Failed to fetch ${imageType} image.`,
//       });
//     }
//   };

//   const handleStatusUpdate = async (status) => {
//     try {
//       const response = await axios.post(`${Src}/api/auth/updateUserKycStatus`, {
//         member_id: selectedRecord.member_id,
//         status,
//         message: status === 'rejected' ? rejectionMessage : 'done'
//       });

//       if (response.data.status === 'true') {
//         notification.success({
//           message: 'Success',
//           description: response.data.message,
//         });
        
//         // Update local state
//         setData(prevData => 
//           prevData.map(item => 
//             item.member_id === selectedRecord.member_id 
//               ? { 
//                   ...item, 
//                   Kyc_status: status, 
//                   Kyc_message: status === 'approved' ? 'done' : rejectionMessage 
//                 }
//               : item
//           )
//         );

//         // Update selected record
//         setSelectedRecord(prev => ({ 
//           ...prev, 
//           Kyc_status: status, 
//           Kyc_message: status === 'approved' ? 'done' : rejectionMessage 
//         }));

//         // Close modals
//         setModalVisible(false);
//         setRejectModalVisible(false);
//       } else {
//         notification.error({
//           message: 'Error',
//           description: response.data.error,
//         });
//       }
//     } catch (error) {
//       // console.error('Error updating KYC status:', error);
//       notification.error({
//         message: 'Error',
//         description: 'Failed to update KYC status.',
//       });
//     }
//   };

//   const handleReject = () => {
//     handleStatusUpdate('rejected');
//   };

//   const handleRejectReasonChange = (e) => {
//     setRejectionMessage(e.target.value);  // Update rejection message based on selected radio option
//   };

//   useEffect(() => {
//     fetchBankDetails();
//   }, []);

//   // Filter data based on search text
//   const filteredData = data.filter(record =>
//     Object.values(record).some(value => 
//       value && value.toString().toLowerCase().includes(searchText.toLowerCase())
//     )
//   );

//   // Calculate summary statistics
//   const approvedCount = filteredData.filter(record => record.Kyc_status === 'approved').length;
//   const rejectedCount = filteredData.filter(record => record.Kyc_status === 'rejected').length;
//   const pendingCount = filteredData.filter(record => record.Kyc_status === 'pending').length;

//   const columns = [
//     {
//       title: 'S.No',
//       dataIndex: 'sno',
//       key: 'sno',
//       render: (_, __, index) =>
//         (currentPagination.current - 1) * currentPagination.pageSize + index + 1,
//     },
//     {
//       title: 'Member ID',
//       dataIndex: 'member_id',
//       key: 'member_id',
//     },
//     {
//       title: 'Full Name',
//       dataIndex: 'FullName',
//       key: 'FullName',
//     },
//     {
//       title: 'Created At',
//       dataIndex: 'created_at',
//       key: 'created_at',
//       render: (text) => formatDate(text),
//     },
//     {
//       title: 'KYC Message',
//       dataIndex: 'Kyc_message',
//       key: 'Kyc_message',
//     },
//     {
//       title: 'KYC Status',
//       dataIndex: 'Kyc_status',
//       key: 'Kyc_status',
//       render: (status) => {
//         const color = status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange';
//         return <Tag color={color}>{status.toUpperCase()}</Tag>;
//       }
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
//       <Row style={{ marginBottom: 16 }}>
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

//       {/* <Table 
//         columns={columns} 
//         dataSource={filteredData} 
//         rowKey="member_id"
//         loading={loading}
//       /> */}

//     <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading}
//         rowKey="member_id"
//         scroll={{ x: true }}
//         pagination={{
//           current: currentPagination.current,
//           pageSize: currentPagination.pageSize,
//           total: filteredData.length,
//         }}
//          size="small"
//         onChange={handleTableChange}
//       />

//       {/* Modal for Bank and KYC Details */}
//       <Modal
//   title="Bank and KYC Details"
//   open={modalVisible}
//   onCancel={() => setModalVisible(false)}
//   footer={null}
//   width={1000}
//   style={{ left:20, position: 'absolute' ,top: 100}}
// >
//   {selectedRecord && (
//     <div style={{ display: 'flex' }}>
//       <div style={{ flex: 1, marginRight: 20 }}>
//         <Descriptions bordered column={1}>
//           <Descriptions.Item label="Member ID">{selectedRecord.member_id}</Descriptions.Item>
//           <Descriptions.Item label="Full Name">{selectedRecord.FullName}</Descriptions.Item>
//           <Descriptions.Item label="Bank Name">{selectedRecord.Bank_Name}</Descriptions.Item>
//           <Descriptions.Item label="Account Number">{selectedRecord.Account_number}</Descriptions.Item>
//           <Descriptions.Item label="IFSC Code">{selectedRecord.IFSC_Code}</Descriptions.Item>
//           <Descriptions.Item label="Aadhar Number">{selectedRecord.Aadhar_Number}</Descriptions.Item>
//           <Descriptions.Item label="PAN Card Number">{selectedRecord.PanCard_Number}</Descriptions.Item>
//           <Descriptions.Item label="Nominee Name">{selectedRecord.Nominee_name}</Descriptions.Item>
//           <Descriptions.Item label="Relation with Nominee">{selectedRecord.Nominee_relation}</Descriptions.Item>

//           <Descriptions.Item label="KYC Status">
//             <Tag 
//               color={selectedRecord.Kyc_status === 'approved' ? 'green' : selectedRecord.Kyc_status === 'rejected' ? 'red' : 'orange'}
//             >
//               {selectedRecord.Kyc_status.toUpperCase()}
//             </Tag>
//           </Descriptions.Item>
//           <Descriptions.Item label="KYC Message">{selectedRecord.Kyc_message}</Descriptions.Item>
//           <Descriptions.Item label="Created At">{formatDate(selectedRecord.created_at) }</Descriptions.Item>
//         </Descriptions>

//         {selectedRecord.Kyc_status === 'pending' && (
//           <Space style={{ marginTop: 20 }}>
//             <Button 
//               type="primary" 
//               style={{ backgroundColor: 'green', borderColor: 'green' }}
//               onClick={() => handleStatusUpdate('approved')}
//             >
//               Approve KYC
//             </Button>
//             <Button 
//               type="primary" 
//               danger
//               onClick={() => {
//                 setRejectModalVisible(true);
//                 setRejectionMessage('KYC documents not valid');
//               }}
//             >
//               Reject KYC
//             </Button>
//           </Space>
//         )}
//       </div>

//       {/* Conditionally render image view buttons only when KYC status is pending */}
//       {(selectedRecord.Kyc_status === 'pending' || selectedRecord.Kyc_status === 'approved') && (
//         <Space style={{ marginTop: "20%", flexDirection: "column", gap: 50 }}>
//           <Button 
//             type="primary" 
//             onClick={() => fetchImage('Passbook')}
//           >
//             View Passbook
//           </Button>
//           <Button 
//             type="primary" 
//             onClick={() => fetchImage('Pancard')}
//           >
//             View PAN Card
//           </Button>
//           <Button 
//             type="primary" 
//             onClick={() => fetchImage('AadharcardFront')}
//           >
//             View Aadhar Front
//           </Button>
//           <Button 
//             type="primary" 
//             onClick={() => fetchImage('AadharcardBack')}
//           >
//             View Aadhar Back
//           </Button>
//           <Button 
//             type="primary" 
//             onClick={() => fetchImage('User')}
//           >
//             View User Image
//           </Button>
//         </Space>
//       )}
//     </div>
//   )}
// </Modal>
//       {/* Modal for Reject KYC Request */}
//       <Modal
//         title="Reject KYC Request"
//         open={rejectModalVisible}
//         onOk={handleReject}
//         onCancel={() => setRejectModalVisible(false)}
//         okText="Confirm Rejection"
//         okButtonProps={{ danger: true }}
//       >
//         {/* Radio buttons for rejection reasons */}
//         <Radio.Group onChange={handleRejectReasonChange} value={rejectionMessage}>
//           <Radio value="Wrong Aadhar">Wrong Aadhar</Radio>
//           <Radio value="Wrong Pan">Wrong PAN</Radio>
//           <Radio value="Wrong Bank Details">Wrong Bank Details</Radio>
//           <Radio value="Wrong Nominee Details">Wrong Nominee Details</Radio>
//           <Radio value="Wrong IFSC Code">Wrong IFSC Code</Radio>
//           <Radio value="Wrong Document">Wrong Document</Radio>
         
//         </Radio.Group>

//         {/* Text area for custom rejection message */}
//         <TextArea
//           rows={4}
//           value={rejectionMessage}
//           onChange={(e) => setRejectionMessage(e.target.value)}
//           placeholder="Enter reason for rejection"
//           style={{ marginTop: 16 }}
//         />
//       </Modal>

//       {/* Modal for Image Preview */}
//       <Modal
//       title={`${imageType} Image`}
//       open={imageModalVisible}
//       mask={false}
//       onCancel={() => {
//         setImageModalVisible(false);
//       }}
//       footer={null}
//       width={750}
//       style={{
//         position: "fixed",
//         right: 10,
//         top: 100, // Adjust vertical position if needed
//         margin: 0, // Remove default centering margin
//         blur: 0, // Remove default blur
//       }}
//       bodyStyle={{
//         textAlign: "center", // Optional: Center modal content
//       }}
//     >


//         {selectedImage && (
//           <Image
//             src={selectedImage}
//             alt={`${imageType} Image`}
//             preview={false}
           
//             style={{ width: '100%', maxHeight: '600px', objectFit: 'contain',top: 50 }}
//             // preview={{
//             //   maskClassName: 'customize-mask',
//             //   src: selectedImage,
//             // }}
//           />
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default BankDetails;












// import { useState, useEffect } from "react";
// import {
//   Table,
//   Typography,
//   Button,
//   Modal,
//   Image,
//   notification,
//   Tag,
//   Descriptions,
//   Space,
//   Input,
//   Tabs,
//   Spin,
//   Radio
// } from "antd";
// import axios from "axios";

// const { TabPane } = Tabs;
// const { Text, Title } = Typography;
// const { TextArea } = Input;

// const partConfig = [
//   {
//     key: "user",
//     name: "User Details",
//     imageTypes: ["user"],
//     fields: [
//       { label: "Full Name", key: "FullName" },
//       { label: "Nominee Name", key: "Nominee_name" },
//       { label: "Nominee Relation", key: "Nominee_relation" },
//     ],
//   },
//   {
//     key: "pancard",
//     name: "PAN Card",
//     imageTypes: ["pancard"],
//     fields: [{ label: "PAN Number", key: "PanCard_Number" }],
//   },
//   {
//     key: "aadhar",
//     name: "Aadhar Card",
//     imageTypes: ["aadhar-front", "aadhar-back"],
//     fields: [{ label: "Aadhar Number", key: "Aadhar_Number" }],
//   },
//   {
//     key: "bank",
//     name: "Bank Details",
//     imageTypes: ["bank"],
//     fields: [
//       { label: "Bank Name", key: "Bank_Name" },
//       { label: "Account Number", key: "Account_number" },
//       { label: "IFSC Code", key: "IFSC_Code" },
//     ],
//   },
// ];

// const KycManagement = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [imageUrls, setImageUrls] = useState({});
//   const [activeTab, setActiveTab] = useState("user");
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [rejectionMessage, setRejectionMessage] = useState("");
//   const [rejectionPart, setRejectionPart] = useState(null);

//   const Src = import.meta.env.VITE_Src;
//   const token = localStorage.getItem("adminToken");

//   useEffect(() => {
//     fetchAllKycDetails();
//   }, []);

//   const fetchAllKycDetails = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.post(
//         `${Src}/api/auth/getAllKycDetails`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (response.data.status === "success") {
//         const sortedData = response.data.data.sort(
//           (a, b) =>
//             new Date(b.last_updated || "1970-01-01") - new Date(a.last_updated || "1970-01-01")
//         );
        
//         // Process the data to add overall_status
//         const processedData = await Promise.all(sortedData.map(async (item) => {
//           try {
//             const statusResponse = await axios.post(
//               `${Src}/api/auth/kyc-status`,
//               { member_id: item.member_id },
//               { headers: { Authorization: `Bearer ${token}` } }
//             );
            
//             return {
//               ...item,
//               overall_status: statusResponse.data.kyc_status
//             };
//           } catch (error) {
//             return {
//               ...item,
//               overall_status: 'unknown'
//             };
//           }
//         }));
        
//         setData(processedData);
//         console.log(processedData);
//       }
//     } catch (error) {
//       notification.error({ message: "Error", description: "Failed to fetch KYC details" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchImage = async (part) => {
//     try {
//       const response = await axios.post(
//         `${Src}/api/auth/${part}-image`,
//         { member_id: selectedRecord.member_id },
//         { 
//           responseType: "blob",
//           headers: { Authorization: `Bearer ${token}` }
//         }
//       );

//       if (response.status === 200) {
//         const imageUrl = URL.createObjectURL(response.data);
//         setImageUrls((prev) => ({ ...prev, [part]: imageUrl }));
//       } else if (response.data?.error === "Image not found") {
//         notification.warning({ message: "No Image Uploaded", description: `No image found for ${part}` });
//       }
//     } catch (error) {
//       notification.error({ message: "Error", description: `Failed to load ${part} image` });
//     }
//   };

//   const handleStatusUpdate = async (status) => {
//     try {
//       await axios.post(
//         `${Src}/api/auth/admin/update-part-status`,
//         {
//           member_id: selectedRecord.member_id,
//           part: activeTab,
//           status,
//           message: rejectionMessage || `${activeTab} ${status}`,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       notification.success({ message: `${activeTab} ${status} successfully` });
//       setModalVisible(false);
//       setRejectModalVisible(false);
//       setSelectedRecord(null);
//       setImageUrls({});
//       setRejectionMessage("");
//       fetchAllKycDetails(); // Refresh data
//     } catch (error) {
//       notification.error({ message: `Failed to update ${activeTab} status` });
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'approved': return 'green';
//       case 'rejected': return 'red';
//       case 'pending': return 'orange';
//       case 'not done': return 'gray';
//       case 'not_filled': return 'gray';
//       default: return 'blue';
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     // Check if date is Jan 1, 1970 at 5:30 AM (IST)
//     if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
//       return "--";
//     }
//     return date.toLocaleString();
//   };

//   const columns = [
//     {
//       title: "Member ID",
//       dataIndex: "member_id",
//       key: "member_id",
//     },
//     {
//       title: "Full Name",
//       dataIndex: ["user_details", "data", "FullName"],
//       key: "full_name",
//       render: (text) => text || "--",
//     },
//     {
//       title: "Last Updated",
//       dataIndex: "last_updated",
//       key: "last_updated",
//       render: (dateString) => formatDate(dateString),
//     },
//     {
//       title: "Overall Status",
//       dataIndex: "overall_status",
//       key: "overall_status",
//       render: (status) => (
//         <Tag color={getStatusColor(status)}>
//           {status?.toUpperCase() || "NOT AVAILABLE"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_, record) => (
//         <Button type="primary" onClick={() => showModal(record)}>
//           Review
//         </Button>
//       ),
//     },
//   ];

//   const showModal = async (record) => {
//     try {
//       // Get detailed status for the record
//       const statusResponse = await axios.post(
//         `${Src}/api/auth/kyc-status`,
//         { member_id: record.member_id },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       const detailedRecord = {
//         ...record,
//         userdata: statusResponse.data.userdata
//       };
      
//       setSelectedRecord(detailedRecord);
//       setModalVisible(true);
//     } catch (error) {
//       notification.error({ message: "Error", description: "Failed to fetch KYC status details" });
//     }
//   };

//   const handleCancel = () => {
//     setModalVisible(false);
//     setSelectedRecord(null);
//     setImageUrls({});
//     setRejectionMessage("");
//   };
  
//   const getPartStatus = (part) => {
//     if (!selectedRecord?.userdata) return "not_filled";
    
//     switch (part) {
//       case "user":
//         return selectedRecord.userdata.user_details?.status || "not_filled";
//       case "pancard":
//         return selectedRecord.userdata.pancard_details?.status || "not_filled";
//       case "aadhar":
//         return selectedRecord.userdata.aadhar_details?.status || "not_filled";
//       case "bank":
//         return selectedRecord.userdata.bank_details?.status || "not_filled";
//       default:
//         return "not_filled";
//     }
//   };
  
//   const getPartData = (part) => {
//     if (!selectedRecord?.userdata) return {};
    
//     switch (part) {
//       case "user":
//         return selectedRecord.userdata.user_details || {};
//       case "pancard":
//         return selectedRecord.userdata.pancard_details || {};
//       case "aadhar":
//         return selectedRecord.userdata.aadhar_details || {};
//       case "bank":
//         return selectedRecord.userdata.bank_details || {};
//       default:
//         return {};
//     }
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <Title level={3}>KYC Management</Title>
//       <Spin spinning={loading}>
//         <Table
//           dataSource={data}
//           columns={columns}
//           rowKey="member_id"
//           pagination={{ pageSize: 10 }}
//         />
//       </Spin>

//       {/* Review Modal */}
//       <Modal
//         title={`Review KYC Details - Member ID: ${selectedRecord?.member_id}`}
//         visible={modalVisible}
//         onCancel={handleCancel}
//         footer={null}
//         width={800}
//       >
//         {selectedRecord && (
//           <>
//             <Tabs activeKey={activeTab} onChange={setActiveTab}>
//               {partConfig.map(({ key, name, fields, imageTypes }) => {
//                 const partStatus = getPartStatus(key);
//                 const partData = getPartData(key);
                
//                 return (
//                   <TabPane 
//                     tab={
//                       <span>
//                         {name} <Tag color={getStatusColor(partStatus)}>{partStatus.toUpperCase()}</Tag>
//                       </span>
//                     } 
//                     key={key}
//                   >
//                     <Descriptions column={1}>
//                       {fields.map(({ label, key: fieldKey }) => (
//                         <Descriptions.Item key={fieldKey} label={label}>
//                           {partData[fieldKey] || "N/A"}
//                         </Descriptions.Item>
//                       ))}
//                     </Descriptions>
                    
//                     {imageTypes.map((type) => (
//                       <div key={type} style={{ marginTop: 10 }}>
//                         <Button
//                           type="default"
//                           onClick={() => fetchImage(type)}
//                           disabled={!!imageUrls[type]}
//                         >
//                           Load {type.replace(/_/g, " ").toUpperCase()} Image
//                         </Button>
//                         {imageUrls[type] ? (
//                           <Image
//                             src={imageUrls[type]}
//                             alt={`${type} image`}
//                             style={{ marginTop: 10, maxWidth: "100%", maxHeight: 400 }}
//                           />
//                         ) : (
//                           <Text type="secondary" style={{ display: 'block', marginTop: 5 }}>Click to load image</Text>
//                         )}
//                       </div>
//                     ))}

//                     {/* Approve/Reject Buttons */}
//                     {partStatus === "pending" && (
//                       <div style={{ marginTop: 20 }}>
//                         <Button
//                           type="primary"
//                           onClick={() => handleStatusUpdate("approved")}
//                           style={{ marginRight: 10 }}
//                         >
//                           Approve
//                         </Button>
//                         <Button
//                           danger
//                           onClick={() => {
//                             setRejectionPart(key);
//                             setRejectModalVisible(true);
//                           }}
//                         >
//                           Reject
//                         </Button>
//                       </div>
//                     )}
//                   </TabPane>
//                 );
//               })}
//             </Tabs>
//           </>
//         )}
//       </Modal>

//       {/* Rejection Modal */}
//       <Modal
//         title="Rejection Reason"
//         open={rejectModalVisible}
//         onCancel={() => setRejectModalVisible(false)}
//         onOk={() => {
//           handleStatusUpdate("rejected");
//         }}
//       >
//         <Space direction="vertical" style={{ width: "100%" }}>
//           <Text strong>Select a reason:</Text>
//           <Radio.Group
//             value={rejectionMessage}
//             onChange={(e) => setRejectionMessage(e.target.value)}
//           >
//             <Space direction="vertical">
//               <Radio value="Invalid Document">Invalid Document</Radio>
//               <Radio value="Blurry Image">Blurry Image</Radio>
//               <Radio value="Incorrect Information">Incorrect Information</Radio>
//               <Radio value="Other">Other</Radio>
//             </Space>
//           </Radio.Group>
//           {rejectionMessage === "Other" && (
//             <TextArea
//               placeholder="Enter custom reason"
//               onChange={(e) => setRejectionMessage(e.target.value)}
//               rows={4}
//               style={{ marginTop: 10 }}
//             />
//           )}
//         </Space>
//       </Modal>
//     </div>
//   );
// };

// export default KycManagement;


import { useState, useEffect } from "react";
import {
  Table,
  Typography,
  Button,
  Modal,
  Image,
  notification,
  Tag,
  Descriptions,
  Space,
  Input,
  Tabs,
  Spin,
  Radio,
  Pagination,
} from "antd";
import axios from "axios";

const { TabPane } = Tabs;
const { Text, Title } = Typography;
const { Search } = Input;

const partConfig = [
  {
    key: "user",
    name: "User Details",
    imageTypes: ["user"],
    fields: [
      { label: "Full Name", key: "FullName" },
      { label: "Nominee Name", key: "Nominee_name" },
      { label: "Nominee Relation", key: "Nominee_relation" },
    ],
  },
  {
    key: "pancard",
    name: "PAN Card",
    imageTypes: ["pancard"],
    fields: [{ label: "PAN Number", key: "PanCard_Number" }],
  },
  {
    key: "aadhar",
    name: "Aadhar Card",
    imageTypes: ["aadhar-front", "aadhar-back"],
    fields: [{ label: "Aadhar Number", key: "Aadhar_Number" }],
  },
  {
    key: "bank",
    name: "Bank Details",
    imageTypes: ["bank"],
    fields: [
      { label: "Bank Name", key: "Bank_Name" },
      { label: "Account Number", key: "Account_number" },
      { label: "IFSC Code", key: "IFSC_Code" },
    ],
  },
];

const KycManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [activeTab, setActiveTab] = useState("user");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [rejectionPart, setRejectionPart] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const Src = import.meta.env.VITE_Src;
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // New effect to handle search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredData(data); // Show all data when search is empty
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = data.filter(item => 
        (item.member_id && item.member_id.toLowerCase().includes(query)) || 
        (item.user_details?.data?.FullName && 
         item.user_details.data.FullName.toLowerCase().includes(query))
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${Src}/api/auth/getAllKycDetails`,
        { page: currentPage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === "success") {
        setData(response.data.data);
        setFilteredData(response.data.data); // Initialize filtered data with all data
        setTotalPages(response.data.pagination.total_pages);
        setTotalRecords(response.data.pagination.total_records);
      }
    } catch (error) {
      notification.error({ message: "Error", description: "Failed to fetch KYC details" });
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };


  const fetchImage = async (part) => {
    try {
      const response = await axios.post(
        `${Src}/api/auth/${part}-image`,
        { member_id: selectedRecord.member_id },
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        const imageUrl = URL.createObjectURL(response.data);
        setImageUrls((prev) => ({ ...prev, [part]: imageUrl }));
      } else if (response.data?.error === "Image not found") {
        notification.warning({ message: "No Image Uploaded", description: `No image found for ${part}` });
      }
    } catch (error) {
      notification.error({ message: "Error", description: `Failed to load ${part} image` });
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await axios.post(
        `${Src}/api/auth/admin/update-part-status`,
        {
          member_id: selectedRecord.member_id,
          part: activeTab,
          status,
          message: rejectionMessage || `${activeTab} ${status}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      notification.success({ message: `${activeTab} ${status} successfully` });
      setModalVisible(false);
      setRejectModalVisible(false);
      setSelectedRecord(null);
      setImageUrls({});
      setRejectionMessage("");
      fetchData(); // Refresh data
    } catch (error) {
      notification.error({ message: `Failed to update ${activeTab} status` });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "pending":
        return "orange";
      case "not done":
        return "gray";
      case "not_filled":
        return "gray";
      default:
        return "blue";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
      return "--";
    }
    return date.toLocaleString();
  };

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, __, index) =>
        (currentPage - 1) * 10 + index + 1,
    },
    {
      title: "Member ID",
      dataIndex: "member_id",
      key: "member_id",
    },
    {
      title: "Full Name",
      dataIndex: ["user_details", "data", "FullName"],
      key: "full_name",
      render: (text) => text || "--",
    },
    {
      title: "Last Updated",
      dataIndex: "last_updated",
      key: "last_updated",
      render: (dateString) => formatDate(dateString),
    },
    {
      title: "Overall Status",
      dataIndex: "overall_status",
      key: "overall_status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status?.toUpperCase() || "NOT AVAILABLE"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button type="primary" onClick={() => showModal(record)}>
          Review
        </Button>
      ),
    },
  ];

  const showModal = async (record) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedRecord(null);
    setImageUrls({});
    setRejectionMessage("");
  };

  const getPartStatus = (part) => {
    if (!selectedRecord) return "not_filled";

    switch (part) {
      case "user":
        return selectedRecord.user_details?.status || "not_filled";
      case "pancard":
        return selectedRecord.pancard_details?.status || "not_filled";
      case "aadhar":
        return selectedRecord.aadhar_details?.status || "not_filled";
      case "bank":
        return selectedRecord.bank_details?.status || "not_filled";
      default:
        return "not_filled";
    }
  };

  const getPartData = (part) => {
    if (!selectedRecord) return {};

    switch (part) {
      case "user":
        return selectedRecord.user_details?.data || {};
      case "pancard":
        return selectedRecord.pancard_details?.data || {};
      case "aadhar":
        return selectedRecord.aadhar_details?.data || {};
      case "bank":
        return selectedRecord.bank_details?.data || {};
      default:
        return {};
    }
  };

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* Search Bar */}
        <Search
          placeholder="Search by Member ID or Full Name"
          value={searchQuery}
          onChange={handleSearchChange}
          enterButton
        />

        {/* Table with filtered data */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="member_id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: searchQuery ? "No matching results found" : "No data available" }}
        />

        {/* Pagination - only show when not searching */}
        {!searchQuery && (
          <Pagination
            current={currentPage}
            total={totalRecords}
            pageSize={10}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        )}
      </Space>


      {/* Review Modal */}
      <Modal
        title={`Review KYC Details - Member ID: ${selectedRecord?.member_id}`}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={1000}
        // height={1000}
      >
        {selectedRecord && (
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {partConfig.map(({ key, name, fields, imageTypes }) => {
              const partStatus = getPartStatus(key);
              const partData = getPartData(key);

              return (
                <TabPane
                  tab={
                    <span>
                      {name} <Tag color={getStatusColor(partStatus)}>{partStatus.toUpperCase()}</Tag>
                    </span>
                  }
                  key={key}
                >
                  <Descriptions column={1}>
                    {fields.map(({ label, key: fieldKey }) => (
                      <Descriptions.Item label={label} key={fieldKey}>
                        {partData[fieldKey] || "N/A"}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>

                  {imageTypes.map((type) => (
                    <div key={type}style={{ marginTop: 10 }}>
                      <Button
                        onClick={() => fetchImage(type)}
                        disabled={!!imageUrls[type]}
                        style={{ marginBottom: 10 }}
                      >
                        Load {type.replace(/_/g, " ").toUpperCase()} Image
                      </Button>
                      {imageUrls[type] ? (
                        <Image src={imageUrls[type]} alt={type}  
                        style={{ marginTop: 10, maxWidth: "70%", maxHeight: 400 }}/>
                      ) : (
                        <Text>Click to load image</Text>
                      )}
                    </div>
                  ))}

                  {/* Approve/Reject Buttons */}
                  {(partStatus === "pending" || partStatus==="approved")&&  (
                    <Space>
                      <Button
                        type="primary"
                        onClick={() => handleStatusUpdate("approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        danger
                        onClick={() => {
                          setRejectionPart(key);
                          setRejectModalVisible(true);
                        }}
                      >
                        Reject
                      </Button>
                    </Space>
                  )}
                </TabPane>
              );
            })}
          </Tabs>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
  title="Reject KYC Part"
  open={rejectModalVisible}
  onCancel={() => setRejectModalVisible(false)}
  onOk={() => handleStatusUpdate("rejected")}
>
  <Radio.Group
    value={rejectionMessage}
    onChange={(e) => setRejectionMessage(e.target.value)} // Keep single state
  >
    <Space direction="vertical">
      <Radio value="Invalid Document">Invalid Document</Radio>
      <Radio value="Blurry Image">Blurry Image</Radio>
      <Radio value="Incorrect Information">Incorrect Information</Radio>
      <Radio value="Other">Other</Radio>
    </Space>
  </Radio.Group>

  {rejectionMessage.startsWith("Other") && ( // Check if it's "Other" or user-typed text
    <Input.TextArea
      value={rejectionMessage.replace("Other: ", "")} // Remove prefix while displaying
      onChange={(e) => setRejectionMessage(`Other: ${e.target.value}`)} // Keep "Other: " prefix
      rows={4}
      style={{ marginTop: 10 }}
      placeholder="Enter rejection reason..."
    />
  )}
</Modal>

    </>
  );
};

export default KycManagement;