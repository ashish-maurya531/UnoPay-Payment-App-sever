

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
//   Radio,
//   Pagination,
// } from "antd";
// import axios from "axios";

// const { TabPane } = Tabs;
// const { Text, Title } = Typography;
// const { Search } = Input;

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

//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalRecords, setTotalRecords] = useState(0);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filteredData, setFilteredData] = useState([]);

//   const Src = import.meta.env.VITE_Src;
//   const token = localStorage.getItem("adminToken");

//   useEffect(() => {
//     fetchData();
//   }, [currentPage]);

//   // New effect to handle search functionality
//   useEffect(() => {
//     if (searchQuery.trim() === "") {
//       setFilteredData(data); // Show all data when search is empty
//     } else {
//       const query = searchQuery.toLowerCase();
//       const filtered = data.filter(item => 
//         (item.member_id && item.member_id.toLowerCase().includes(query)) || 
//         (item.user_details?.data?.FullName && 
//          item.user_details.data.FullName.toLowerCase().includes(query))
//       );
//       setFilteredData(filtered);
//     }
//   }, [searchQuery, data]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.post(
//         `${Src}/api/auth/getAllKycDetails`,
//         { page: currentPage },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (response.data.status === "success") {
//         setData(response.data.data);
//         setFilteredData(response.data.data); // Initialize filtered data with all data
//         setTotalPages(response.data.pagination.total_pages);
//         setTotalRecords(response.data.pagination.total_records);
//       }
//     } catch (error) {
//       notification.error({ message: "Error", description: "Failed to fetch KYC details" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle search input change
//   const handleSearchChange = (e) => {
//     setSearchQuery(e.target.value);
//     setCurrentPage(1); // Reset to first page on search
//   };


//   const fetchImage = async (part) => {
//     try {
//       const response = await axios.post(
//         `${Src}/api/auth/${part}-image`,
//         { member_id: selectedRecord.member_id },
//         {
//           responseType: "blob",
//           headers: { Authorization: `Bearer ${token}` },
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
//           message: rejectionMessage || `done`,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       notification.success({ message: `${activeTab} ${status} successfully` });
//       setModalVisible(false);
//       setRejectModalVisible(false);
//       setSelectedRecord(null);
//       setImageUrls({});
//       setRejectionMessage("");
//       fetchData(); // Refresh data
//     } catch (error) {
//       notification.error({ message: `Failed to update ${activeTab} status` });
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "approved":
//         return "green";
//       case "rejected":
//         return "red";
//       case "pending":
//         return "orange";
//       case "not done":
//         return "gray";
//       case "not_filled":
//         return "gray";
//       default:
//         return "blue";
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
//       return "--";
//     }
//     return date.toLocaleString();
//   };

//   const columns = [
//     {
//       title: 'S.No',
//       dataIndex: 'sno',
//       key: 'sno',
//       render: (_, __, index) =>
//         (currentPage - 1) * 10 + index + 1,
//     },
//     {
//       title: "Member ID",
//       dataIndex: "member_id",
//       key: "member_id",
//     },
//     {
//       title: "Username",
//       dataIndex:"username" ,
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
//         <Tag color={getStatusColor(status)}>{status?.toUpperCase() || "NOT AVAILABLE"}</Tag>
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
//     setSelectedRecord(record);
//     setModalVisible(true);
//   };

//   const handleCancel = () => {
//     setModalVisible(false);
//     setSelectedRecord(null);
//     setImageUrls({});
//     setRejectionMessage("");
//   };

//   const getPartStatus = (part) => {
//     if (!selectedRecord) return "not_filled";

//     switch (part) {
//       case "user":
//         return selectedRecord.user_details?.status || "not_filled";
//       case "pancard":
//         return selectedRecord.pancard_details?.status || "not_filled";
//       case "aadhar":
//         return selectedRecord.aadhar_details?.status || "not_filled";
//       case "bank":
//         return selectedRecord.bank_details?.status || "not_filled";
//       default:
//         return "not_filled";
//     }
//   };

//   const getPartData = (part) => {
//     if (!selectedRecord) return {};

//     switch (part) {
//       case "user":
//         return selectedRecord.user_details?.data || {};
//       case "pancard":
//         return selectedRecord.pancard_details?.data || {};
//       case "aadhar":
//         return selectedRecord.aadhar_details?.data || {};
//       case "bank":
//         return selectedRecord.bank_details?.data || {};
//       default:
//         return {};
//     }
//   };

//   return (
//     <>
//       <Space direction="vertical" style={{ width: "100%" }}>
//         {/* Search Bar */}
//         <Search
//           placeholder="Search by Member ID or Full Name"
//           value={searchQuery}
//           onChange={handleSearchChange}
//           enterButton
//         />

//         {/* Table with filtered data */}
//         <Table
//           columns={columns}
//           dataSource={filteredData}
//           rowKey="member_id"
//           loading={loading}
//           pagination={false}
//           locale={{ emptyText: searchQuery ? "No matching results found" : "No data available" }}
//         />

//         {/* Pagination - only show when not searching */}
//         {!searchQuery && (
//           <Pagination
//             current={currentPage}
//             total={totalRecords}
//             pageSize={10}
//             onChange={(page) => setCurrentPage(page)}
//             showSizeChanger={false}
//           />
//         )}
//       </Space>


//       {/* Review Modal */}
//       <Modal
//         title={`Review KYC Details - Member ID: ${selectedRecord?.member_id}`}
//         open={modalVisible}
//         onCancel={handleCancel}
//         footer={null}
//         width={1000}
//         // height={1000}
//       >
//         {selectedRecord && (
//           <Tabs activeKey={activeTab} onChange={setActiveTab}>
//             {partConfig.map(({ key, name, fields, imageTypes }) => {
//               const partStatus = getPartStatus(key);
//               const partData = getPartData(key);

//               return (
//                 <TabPane
//                   tab={
//                     <span>
//                       {name} <Tag color={getStatusColor(partStatus)}>{partStatus.toUpperCase()}</Tag>
//                     </span>
//                   }
//                   key={key}
//                 >
//                   <Descriptions column={1}>
//                     {fields.map(({ label, key: fieldKey }) => (
//                       <Descriptions.Item label={label} key={fieldKey}>
//                         {partData[fieldKey] || "N/A"}
//                       </Descriptions.Item>
//                     ))}
//                   </Descriptions>

//                   {imageTypes.map((type) => (
//                     <div key={type}style={{ marginTop: 10 }}>
//                       <Button
//                         onClick={() => fetchImage(type)}
//                         disabled={!!imageUrls[type]}
//                         style={{ marginBottom: 10 }}
//                       >
//                         Load {type.replace(/_/g, " ").toUpperCase()} Image
//                       </Button>
//                       {imageUrls[type] ? (
//                         <Image src={imageUrls[type]} alt={type}  
//                         style={{ marginTop: 10, maxWidth: "70%", maxHeight: 400 }}/>
//                       ) : (
//                         <Text>Click to load image</Text>
//                       )}
//                     </div>
//                   ))}

//                   {/* Approve/Reject Buttons */}
//                   {(partStatus === "pending" || partStatus==="approved")&&  (
//                     <Space>
//                       <Button
//                         type="primary"
//                         onClick={() => handleStatusUpdate("approved")} 
//                       >
//                         Approve
//                       </Button>
//                       <Button
//                         danger
//                         onClick={() => {
//                           setRejectionPart(key);
//                           setRejectModalVisible(true);
//                         }}
//                       >
//                         Reject
//                       </Button>
//                     </Space>
//                   )}
//                 </TabPane>
//               );
//             })}
//           </Tabs>
//         )}
//       </Modal>

//       {/* Rejection Modal */}
//       <Modal
//   title="Reject KYC Part"
//   open={rejectModalVisible}
//   onCancel={() => setRejectModalVisible(false)}
//   onOk={() => handleStatusUpdate("rejected")}
// >
//   <Radio.Group
//     value={rejectionMessage}
//     onChange={(e) => setRejectionMessage(e.target.value)} // Keep single state
//   >
//     <Space direction="vertical">
//       <Radio value="Invalid Document">Invalid Document</Radio>
//       <Radio value="Blurry Image">Blurry Image</Radio>
//       <Radio value="Incorrect Information">Incorrect Information</Radio>
//       <Radio value="Other">Other</Radio>
//     </Space>
//   </Radio.Group>

//   {rejectionMessage.startsWith("Other") && ( // Check if it's "Other" or user-typed text
//     <Input.TextArea
//       value={rejectionMessage.replace("Other: ", "")} // Remove prefix while displaying
//       onChange={(e) => setRejectionMessage(`Other: ${e.target.value}`)} // Keep "Other: " prefix
//       rows={4}
//       style={{ marginTop: 10 }}
//       placeholder="Enter rejection reason..."
//     />
//   )}
// </Modal>

//     </>
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
  Card,
  Row,
  Col,
  DatePicker,
  Select
} from "antd";
import axios from "axios";
import moment from "moment";

const { TabPane } = Tabs;
const { Text, Title } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

// Add CSS for row coloring
const rowStyles = `
  .premium-row { background-color: #e6f7ff; }
  .basic-row { background-color: #fff7e6; }
`;

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
  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [activeTab, setActiveTab] = useState("user");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 500,
    total: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  const Src = import.meta.env.VITE_Src;
  const token = localStorage.getItem("adminToken");

  // Derived data
  const statusCounts = filteredData.reduce((acc, item) => {
    acc[item.overall_status] = (acc[item.overall_status] || 0) + 1;
    return acc;
  }, {});

  const membershipCounts = filteredData.reduce((acc, item) => {
    const membership = item.user_details?.data?.membership || "none";
    acc[membership] = (acc[membership] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    filterData();
  }, [searchQuery, data, statusFilter, membershipFilter, dateRange]);


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
        setPagination(prev => ({
          ...prev,
          total: response.data.data.length,
        }));
        setTotalRecords(response.data.pagination?.total_records || 0);
      }
    } catch (error) {
      notification.error({ message: "Error", description: "Failed to fetch KYC details" });
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = [...data];

    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          val && val.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(item => item.overall_status === statusFilter);
    }

    // Membership filter
    if (membershipFilter !== "all") {
      result = result.filter(item => 
        item.membership === membershipFilter
      );
    }

    // Date filter
    // Date filter - corrected timezone handling
    if (dateRange?.length === 2) {
      // Convert local dates to UTC timestamps
      const startUTC = moment(dateRange[0]).startOf('day').utc().valueOf();
      const endUTC = moment(dateRange[1]).endOf('day').utc().valueOf();
  
      result = result.filter(item => {
        const itemDate = moment.utc(item.last_updated, "YYYY-MM-DD HH:mm:ss").valueOf();
        return itemDate >= startUTC && itemDate <= endUTC;
      });
    }

    setFilteredData(result);
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
  useEffect(() => {
    if (selectedRecord) {
      const updatedRecord = data.find(item => item.member_id === selectedRecord.member_id);
      if (updatedRecord) {
        setSelectedRecord(updatedRecord);
      }
    }
  }, [data]);

  const handleStatusUpdate = async (status) => {
    try {
      await axios.post(
        `${Src}/api/auth/admin/update-part-status`,
        {
          member_id: selectedRecord.member_id,
          part: activeTab,
          status,
          message: rejectionMessage || `done`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      notification.success({ message: `${activeTab} ${status} successfully` });
      // setModalVisible(false);
      setRejectModalVisible(false);
      // setSelectedRecord(null);
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

  // const formatDate = (dateString) => {
  //   const date = new Date(dateString);
  //   if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
  //     return "--";
  //   }
  //   return date.toLocaleString();
  // };
  const formatDate = (dateString) => {
    if (!dateString) return "--"; // Check if dateString is empty/null
  
    const date = moment(dateString, "YYYY-MM-DD HH:mm:ss");
  
    if (!date.isValid()) return "--"; // Check if it's a valid date
  
    // Check for Unix epoch default date (common in some databases)
    if (date.year() === 1970 && date.month() === 0 && date.date() === 1) {
      return "--";
    }
  
    return date.format("DD/MM/YYYY hh:mm A"); // Format as "DD/MM/YYYY hh:mm AM/PM"
  };
  
  
  // Update date range handler
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Table columns with sorting
  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (_, __, index) => (currentPage - 1) * 10 + index + 1
    },
    {
      title: "Member ID",
      dataIndex: "member_id",
      sorter: (a, b) => a.member_id.localeCompare(b.member_id)
    },
    {
      title: "Username",
      dataIndex: "username",
      sorter: (a, b) => (a.username || "").localeCompare(b.username || "")
    },
    {
      title: "Membership",
      render: (_, record) => {
        const membership = record?.membership;
        const color = membership === 'PREMIUM' ? 'blue' : membership === 'BASIC' ? 'orange' : 'default';
        return <Tag color={color}>{membership || 'FREE'}</Tag>;
      }
    },
    {
      title: "Last Updated",
      dataIndex: "last_updated",
      sorter: (a, b) => moment(a.last_updated).valueOf() - moment(b.last_updated).valueOf(),
      defaultSortOrder: 'descend',
      render: (text) => formatDate(text),
    },
    {
      title: "Status",
      dataIndex: "overall_status",
      render: status => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase() || "NOT AVAILABLE"}
        </Tag>
      )
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Button type="primary" onClick={() => showModal(record)}>
          Review
        </Button>
      )
    }
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
      <style>{rowStyles}</style>
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* Filters Section */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Search
              placeholder="Search by Member ID/Name"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Select.Option value="all">All Statuses</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
  <RangePicker
    style={{ width: '100%' }}
    onChange={setDateRange}
    format="DD/MM/YYYY"
    allowClear={true}
    ranges={{
      'Today': [moment(), moment()],
      'This Week': [moment().startOf('week'), moment().endOf('week')],
      'This Month': [moment().startOf('month'), moment().endOf('month')]
    }}
  />
</Col>
          <Col span={6}>
            <Select
              placeholder="Membership"
              value={membershipFilter}
              onChange={setMembershipFilter}
              style={{ width: '100%' }}
            >
              <Select.Option value="all">All Memberships</Select.Option>
              <Select.Option value="PREMIUM">Premium</Select.Option>
              <Select.Option value="BASIC">Basic</Select.Option>
              <Select.Option value="FREE">Free</Select.Option>

            </Select>
          </Col>
        </Row>

        {/* Summary Statistics */}
        <Card style={{ marginBottom: 16 }}>
          <Space size={[8, 16]} wrap>
            <Tag color="green">Approved: {statusCounts.approved || 0}</Tag>
            <Tag color="red">Rejected: {statusCounts.rejected || 0}</Tag>
            <Tag color="orange">Pending: {statusCounts.pending || 0}</Tag>
            <Tag color="blue">Premium: {membershipCounts.PREMIUM || 0}</Tag>
            <Tag color="orange">Basic: {membershipCounts.BASIC || 0}</Tag>
            <Tag>Total: {filteredData.length}</Tag>
          </Space>
        </Card>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="member_id"
          loading={loading}
          pagination={{
              ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (page) => setCurrentPage(page)
          }}
          rowClassName={record => {
            const membership = record.user_details?.data?.membership;
            return membership === 'PREMIUM' ? 'premium-row' 
                   : membership === 'BASIC' ? 'basic-row' 
                   : '';
          }}
        />      </Space>


      {/* Review Modal */}
      <Modal
        title={`Review KYC Details - Member ID: ${selectedRecord?.member_id}`}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={1000}
        maskClosable={false}
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
                          setRejectModalVisible(true);
                          setRejectionPart(key);
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