import { Table, Button, Modal, Form, Upload, Image, message, Space, Popconfirm } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import axios from 'axios';

const Src = import.meta.env.VITE_Src;
const MAX_IMAGES = 10;
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

export default function UnoPayGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));

  const fetchGalleryImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${Src}/api/auth/get-gallery-images`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setImages(response.data.images || []);
    } catch (error) {
      message.error('Failed to fetch gallery images.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const handleDeleteImage = async (imageUrl) => {
    try {
      await axios.delete(`${Src}/api/auth/delete-gallery-image`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { imageUrl },
      });
      message.success('Image deleted successfully!');
      fetchGalleryImages();
    } catch (error) {
      message.error('Failed to delete image.');
    }
  };

  const handleUploadImages = async (values) => {
    const formData = new FormData();
    values.images.forEach((file) => {
      formData.append('images', file.originFileObj);
    });

    try {
      await axios.post(`${Src}/api/auth/post-gallery`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      message.success('Images uploaded successfully!');
      form.resetFields();
      setIsModalOpen(false);
      fetchGalleryImages();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to upload images.');
    }
  };

  const beforeUpload = (file) => {
    if (!allowedMimeTypes.includes(file.type)) {
      message.error(`Invalid file type. Please upload only JPEG, JPG or PNG files.`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'index',
      key: 'index',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Image',
      dataIndex: 'url',
      key: 'url',
      render: (url) => (
        <Image
          src={url}
          alt="Gallery Image"
          style={{ width: 100, height: 100, objectFit: 'cover' }}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <Popconfirm
          title="Delete Image"
          description="Are you sure you want to delete this image?"
          onConfirm={() => handleDeleteImage(record.url)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="primary" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <h2>Gallery Management</h2>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => setIsModalOpen(true)}>
          Upload Images
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={images.map((url, index) => ({ key: index, url }))}
        loading={loading}
        pagination={{ pageSize: 5 }}
        rowKey="key"
      />

      <Modal
        title="Upload Images"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleUploadImages} layout="vertical">
          <Form.Item
            name="images"
            label="Select Images"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList.slice(0, MAX_IMAGES); // Limit to 10 images
            }}
            rules={[{ required: true, message: 'Please upload at least one image' }]}
          >
            <Upload
              beforeUpload={beforeUpload}
              multiple
              listType="picture-card"
              accept={allowedMimeTypes.join(',')}
              onChange={({ fileList }) => {
                if (fileList.length > MAX_IMAGES) {
                  message.warning(`You can only upload up to ${MAX_IMAGES} images.`);
                }
              }}
            >
              {form.getFieldValue('images')?.length >= MAX_IMAGES ? null : (
                <Button icon={<UploadOutlined />}>
                  Upload Images ({form.getFieldValue('images')?.length || 0}/{MAX_IMAGES})
                </Button>
              )}
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