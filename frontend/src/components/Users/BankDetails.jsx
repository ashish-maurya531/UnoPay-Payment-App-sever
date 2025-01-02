import { useState, useEffect } from 'react';
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
  Row,
  Col,
  Radio
} from 'antd';
import axios from 'axios';
import {formatDate } from '../../utils/dateFormat';


const { Text, Title } = Typography;
const { TextArea } = Input;

const BankDetails = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageType, setImageType] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState('KYC documents not valid');
  
  // New state for filtering
  const [searchText, setSearchText] = useState('');


  const fetchBankDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/auth/bankkycDetails/All');
      if (response.data.status === 'true') {
        //sort by creation time
        response.data.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setData(response.data.data);
      } else {
        notification.error({
          message: 'Error',
          description: 'Failed to fetch bank details.',
        });
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch bank details.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchImage = async (imageType) => {
    try {
      const response = await axios.post(`http://localhost:3000/api/auth/get${imageType}Image`, {
        member_id: selectedRecord.member_id
      }, { responseType: 'blob' });
      console.log(response);

      if (response.status === 200) {
        const imageUrl = URL.createObjectURL(response.data);
        
        setSelectedImage(imageUrl);
        setImageType(imageType);
        setImageModalVisible(true);
      }
    } catch (error) {
      console.error(`Error fetching ${imageType} image:`, error);
      notification.error({
        message: 'Error',
        description: `Failed to fetch ${imageType} image.`,
      });
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/updateUserKycStatus', {
        member_id: selectedRecord.member_id,
        status,
        message: status === 'rejected' ? rejectionMessage : 'done'
      });

      if (response.data.status === 'true') {
        notification.success({
          message: 'Success',
          description: response.data.message,
        });
        
        // Update local state
        setData(prevData => 
          prevData.map(item => 
            item.member_id === selectedRecord.member_id 
              ? { 
                  ...item, 
                  Kyc_status: status, 
                  Kyc_message: status === 'approved' ? 'done' : rejectionMessage 
                }
              : item
          )
        );

        // Update selected record
        setSelectedRecord(prev => ({ 
          ...prev, 
          Kyc_status: status, 
          Kyc_message: status === 'approved' ? 'done' : rejectionMessage 
        }));

        // Close modals
        setModalVisible(false);
        setRejectModalVisible(false);
      } else {
        notification.error({
          message: 'Error',
          description: response.data.error,
        });
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update KYC status.',
      });
    }
  };

  const handleReject = () => {
    handleStatusUpdate('rejected');
  };

  const handleRejectReasonChange = (e) => {
    setRejectionMessage(e.target.value);  // Update rejection message based on selected radio option
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  // Filter data based on search text
  const filteredData = data.filter(record =>
    Object.values(record).some(value => 
      value && value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  // Calculate summary statistics
  const approvedCount = filteredData.filter(record => record.Kyc_status === 'approved').length;
  const rejectedCount = filteredData.filter(record => record.Kyc_status === 'rejected').length;
  const pendingCount = filteredData.filter(record => record.Kyc_status === 'pending').length;

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
    },
    {
      title: 'Full Name',
      dataIndex: 'FullName',
      key: 'FullName',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => formatDate(text),
    },
    {
      title: 'KYC Message',
      dataIndex: 'Kyc_message',
      key: 'Kyc_message',
    },
    {
      title: 'KYC Status',
      dataIndex: 'Kyc_status',
      key: 'Kyc_status',
      render: (status) => {
        const color = status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'orange';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Button type="link" onClick={() => {
          setSelectedRecord(record);
          setModalVisible(true);
        }}>
          View Details
        </Button>
      ),
    }
  ];

  return (
    <div>
      {/* Summary row */}
      <Row gutter={16} align="stretch" style={{ marginBottom: 16 }}>
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
              <Text strong>Total Requests: {data.length}</Text>
              <br />
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <Tag color="green">Approved: {approvedCount}</Tag>
                <Tag color="red">Rejected: {rejectedCount}</Tag>
                <Tag color="orange">Pending: {pendingCount}</Tag>
              </div>
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
        dataSource={filteredData} 
        rowKey="member_id"
        loading={loading}
      />

      {/* Modal for Bank and KYC Details */}
      <Modal
  title="Bank and KYC Details"
  open={modalVisible}
  onCancel={() => setModalVisible(false)}
  footer={null}
  width={1000}
>
  {selectedRecord && (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1, marginRight: 20 }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Member ID">{selectedRecord.member_id}</Descriptions.Item>
          <Descriptions.Item label="Full Name">{selectedRecord.FullName}</Descriptions.Item>
          <Descriptions.Item label="Bank Name">{selectedRecord.Bank_Name}</Descriptions.Item>
          <Descriptions.Item label="Account Number">{selectedRecord.Account_number}</Descriptions.Item>
          <Descriptions.Item label="IFSC Code">{selectedRecord.IFSC_Code}</Descriptions.Item>
          <Descriptions.Item label="Aadhar Number">{selectedRecord.Aadhar_Number}</Descriptions.Item>
          <Descriptions.Item label="PAN Card Number">{selectedRecord.PanCard_Number}</Descriptions.Item>
          <Descriptions.Item label="Nominee Name">{selectedRecord.Nominee_name}</Descriptions.Item>
          <Descriptions.Item label="Relation with Nominee">{selectedRecord.Nominee_relation}</Descriptions.Item>

          <Descriptions.Item label="KYC Status">
            <Tag 
              color={selectedRecord.Kyc_status === 'approved' ? 'green' : selectedRecord.Kyc_status === 'rejected' ? 'red' : 'orange'}
            >
              {selectedRecord.Kyc_status.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="KYC Message">{selectedRecord.Kyc_message}</Descriptions.Item>
          <Descriptions.Item label="Created At">{formatDate(selectedRecord.created_at) }</Descriptions.Item>
        </Descriptions>

        {selectedRecord.Kyc_status === 'pending' && (
          <Space style={{ marginTop: 20 }}>
            <Button 
              type="primary" 
              style={{ backgroundColor: 'green', borderColor: 'green' }}
              onClick={() => handleStatusUpdate('approved')}
            >
              Approve KYC
            </Button>
            <Button 
              type="primary" 
              danger
              onClick={() => {
                setRejectModalVisible(true);
                setRejectionMessage('KYC documents not valid');
              }}
            >
              Reject KYC
            </Button>
          </Space>
        )}
      </div>

      {/* Conditionally render image view buttons only when KYC status is pending */}
      {(selectedRecord.Kyc_status === 'pending' || selectedRecord.Kyc_status === 'approved') && (
        <Space style={{ marginTop: "20%", flexDirection: "column", gap: 50 }}>
          <Button 
            type="primary" 
            onClick={() => fetchImage('Passbook')}
          >
            View Passbook
          </Button>
          <Button 
            type="primary" 
            onClick={() => fetchImage('Pancard')}
          >
            View PAN Card
          </Button>
          <Button 
            type="primary" 
            onClick={() => fetchImage('AadharcardFront')}
          >
            View Aadhar Front
          </Button>
          <Button 
            type="primary" 
            onClick={() => fetchImage('AadharcardBack')}
          >
            View Aadhar Back
          </Button>
          <Button 
            type="primary" 
            onClick={() => fetchImage('User')}
          >
            View User Image
          </Button>
        </Space>
      )}
    </div>
  )}
</Modal>
      {/* Modal for Reject KYC Request */}
      <Modal
        title="Reject KYC Request"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        {/* Radio buttons for rejection reasons */}
        <Radio.Group onChange={handleRejectReasonChange} value={rejectionMessage}>
          <Radio value="Wrong Aadhar">Wrong Aadhar</Radio>
          <Radio value="Wrong Pan">Wrong PAN</Radio>
          <Radio value="Wrong Bank Details">Wrong Bank Details</Radio>
          <Radio value="Wrong Nominee Details">Wrong Nominee Details</Radio>
          <Radio value="Wrong IFSC Code">Wrong IFSC Code</Radio>
          <Radio value="Wrong Document">Wrong Document</Radio>
         
        </Radio.Group>

        {/* Text area for custom rejection message */}
        <TextArea
          rows={4}
          value={rejectionMessage}
          onChange={(e) => setRejectionMessage(e.target.value)}
          placeholder="Enter reason for rejection"
          style={{ marginTop: 16 }}
        />
      </Modal>

      {/* Modal for Image Preview */}
      <Modal
        title={`${imageType} Image`}
        open={imageModalVisible}
        onCancel={() => {
          setImageModalVisible(false);
          setSelectedImage(null);
        }}
        footer={null}
        width={800}
      >
        {selectedImage && (
          <Image
            src={selectedImage}
            alt={`${imageType} Image`}
            style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }}
            preview={{
              maskClassName: 'customize-mask',
              src: selectedImage,
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default BankDetails;
