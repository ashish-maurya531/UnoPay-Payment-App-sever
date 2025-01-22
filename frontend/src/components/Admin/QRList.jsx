import { Table, Button, Modal, Form, Input, Upload, Image, message, Space, notification } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import axios from 'axios';
const Src = import.meta.env.VITE_Src;


export default function QRList() {
  const [data, setData] = useState([]); // Table data
  const [loading, setLoading] = useState(false); // Table loading state
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 }); // Pagination state
  const [isModalOpen, setIsModalOpen] = useState(false); // Add QR modal visibility
  const [form] = Form.useForm(); // Form instance for Add QR
  const [qrUrls, setQrUrls] = useState({}); // State to store QR image URLs by ID

  // Fetch all QR codes from the backend
  const fetchQRs = async (currentPage = 1, pageSize = 5) => {
    setLoading(true);
    try {
      const response = await axios.get(`${Src}/api/auth/getAllAdminQRS`);
      const fetchedData = response.data.data || [];
      setData(fetchedData);
      setPagination({
        current: currentPage,
        pageSize,
        total: fetchedData.length,
      });

      // Fetch QR URLs for each record
      const qrUrlsMap = {};
      for (const record of fetchedData) {
        qrUrlsMap[record.id] = await handleViewQR(record.qr);
      }
      setQrUrls(qrUrlsMap);
    } catch (error) {
      message.error('Failed to fetch QR data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRs();
  }, []);

  // Delete a QR by ID
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${Src}/api/auth/deleteAdminQR/${id}`);
      message.success('QR deleted successfully!');
      fetchQRs();
    } catch (error) {
      message.error('Failed to delete QR.');
    }
  };

  // Add a new QR
  const handleAddQR = async (values) => {
    const formData = new FormData();
    formData.append('upi_id', values.upi_id);
    formData.append('qr', values.qr.file);

    try {
      await axios.post(`${Src}/api/auth/postAdminQRS`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      message.success('QR added successfully!');
      form.resetFields();
      setIsModalOpen(false);
      fetchQRs();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to add QR.');
    }
  };

  // Fetch QR image URL by ID
  const handleViewQR = async (qr) => {
    try {
      const response = await axios.post(`${Src}/api/auth/getQRimage`, {
        qr: qr,
      }, { responseType: 'blob' });

      if (response.status === 200) {
        // console.log(URL.createObjectURL(response.data));
        // notification.success({
        //   message: 'Fetched',
        //   description: 'fetched QR image.',
        // });
        return URL.createObjectURL(response.data);
      }
    } catch (error) {
      console.error('Error fetching QR image:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch QR image.',
      });
    }
  };

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'id',
      key: 'id',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'UPI ID',
      dataIndex: 'upi_id',
      key: 'upi_id',
    },
    {
      title: 'QR Code',
      dataIndex: 'qr',
      key: 'qr',
      render: (text, record) => {
        const qrUrl = qrUrls[record.id]; // Get QR URL from state by record ID
        return (
          <>
            {qrUrl ? (
              <Image
                src={qrUrl} // Use the QR URL from state
                alt="QR Code"
                style={{ width: 100, height: 100, objectFit: 'contain' }}
              />
            ) : (
              <p>Loading...</p> // Show loading until the QR is fetched
            )}
            <h1>{text}</h1>
          </>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2>Admin Payment QR List</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => setIsModalOpen(true)}>
          Add New QR
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={(pagination) => fetchQRs(pagination.current, pagination.pageSize)}
        rowKey="id"
        size="small"

      />

      {/* Add QR Modal */}
      <Modal
        title="Add New QR"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddQR} layout="vertical">
          <Form.Item
            name="upi_id"
            label="UPI ID"
            rules={[{ required: true, message: 'Please enter the UPI ID' }]}
          >
            <Input placeholder="Enter UPI ID" />
          </Form.Item>
          <Form.Item
            name="qr"
            label="QR Code"
            valuePropName="file"
            rules={[{ required: true, message: 'Please upload the QR code' }]}
          >
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Upload QR</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
