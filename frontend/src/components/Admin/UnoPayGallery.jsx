import { useState, useEffect } from 'react';
import { 
  Button, 
  Upload, 
  Modal, 
  Image, 
  message, 
  Popconfirm, 
  Row, 
  Col, 
  Form,
  Typography,
  Space,
  Spin,
  Progress
} from 'antd';
import {
  DeleteOutlined,
  UploadOutlined,
  PlusOutlined,
  PictureOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const Src = import.meta.env.VITE_Src;
const MAX_IMAGES = 10;
const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];

export default function GalleryManagement() {
  const [galleryImages, setGalleryImages] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [form] = Form.useForm();
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Src}/api/auth/get-gallery-images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const imagePromises = response.data.images.map(async (filename) => {
        const imageBlob = await fetchImageByFilename(filename);
        return { filename, url: imageBlob };
      });
      
      const images = await Promise.all(imagePromises);
      const urlMap = {};
      images.forEach(({ filename, url }) => {
        urlMap[filename] = url;
      });
      
      setGalleryImages(response.data.images);
      setImageUrls(urlMap);
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch gallery images');
      setLoading(false);
    }
  };

  const fetchImageByFilename = async (filename) => {
    try {
      const response = await axios.post(
        `${Src}/api/auth/get-gallery-image-file`,
        { filename },
        { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } }
      );
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Fetch image error:', error);
      return '';
    }
  };

  const beforeUpload = (file) => {
    if (!allowedMimeTypes.includes(file.type)) {
      message.error('Only PNG, JPG, and JPEG files are allowed!');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleUploadImages = async () => {
    if (!selectedFiles.length) {
      message.error('Please select images to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('images', file.originFileObj);
    });
    
    try {
      await axios.post(`${Src}/api/auth/post-gallery`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data', 
          Authorization: `Bearer ${token}` 
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      
      message.success('Images uploaded successfully');
      setIsModalOpen(false);
      setSelectedFiles([]);
      form.resetFields();
      fetchGalleryImages();
    } catch (error) {
      message.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (image) => {
    try {
      await axios.delete(`${Src}/api/auth/delete-gallery-image`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { fileName: image },
      });
      message.success('Image deleted successfully');
      
      setGalleryImages(prev => prev.filter(img => img !== image));
      const newUrls = { ...imageUrls };
      delete newUrls[image];
      setImageUrls(newUrls);
    } catch (error) {
      message.error('Failed to delete image');
    }
  };

  const customRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const handleChange = ({ fileList }) => {
    setSelectedFiles(fileList);
  };

  return (
    <div className="p-4">
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <Title level={2} className="m-0">
            <Space>
              <PictureOutlined />
              Gallery Management
            </Space>
          </Title>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setIsModalOpen(true)}
            size="large"
          >
            Upload Images
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[8, 8]}>
           {galleryImages.map((image, index) => (
          <Col key={image} xs={12} sm={8} md={6} lg={4}>
            <div 
              className="relative group"
              style={{ 
                width: '100%',
                paddingTop: '100%',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  overflow: 'hidden'
                }}
              >
                <Image
                  alt={image}
                  src={imageUrls[image]}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  preview={{
                    visible: false,
                    onVisibleChange: (visible) => {
                      if (visible) {
                        setPreviewVisible(true);
                        setPreviewIndex(index);
                      }
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Space>
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setPreviewVisible(true);
                        setPreviewIndex(index);
                      }}
                    />
                    <Popconfirm
                      title="Delete this image?"
                      description="Are you sure you want to delete this image?"
                      onConfirm={() => handleDelete(image)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button type="primary" danger shape="circle" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            </div>
          </Col>
        ))}         
         </Row>
        )}

        <Modal
          title={
            <div className="flex justify-between items-center">
              <span>Upload Images</span>
              <span>Selected: {selectedFiles.length}/{MAX_IMAGES}</span>
            </div>
          }
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedFiles([]);
            form.resetFields();
          }}
          footer={[
            <Button key="cancel" onClick={() => {
              setIsModalOpen(false);
              setSelectedFiles([]);
              form.resetFields();
            }}>
              Cancel
            </Button>,
            <Button 
              key="upload" 
              type="primary" 
              onClick={handleUploadImages}
              loading={uploading}
              disabled={selectedFiles.length === 0}
            >
              {uploading ? 'Uploading...' : 'Upload Images'}
            </Button>
          ]}
          destroyOnClose
        >
          <Upload
            listType="picture-card"
            multiple
            beforeUpload={beforeUpload}
            customRequest={customRequest}
            accept={allowedMimeTypes.join(',')}
            maxCount={MAX_IMAGES}
            fileList={selectedFiles}
            onChange={handleChange}
          >
            {selectedFiles.length >= MAX_IMAGES ? null : (
              <div>
                <PlusOutlined />
                <div className="mt-2">Select</div>
              </div>
            )}
          </Upload>
          {uploading && (
            <Progress percent={uploadProgress} status="active" />
          )}
        </Modal>

        <div style={{ display: 'none' }}>
          <Image.PreviewGroup
            preview={{
              visible: previewVisible,
              onVisibleChange: (vis) => setPreviewVisible(vis),
              current: previewIndex,
              countRender: (current, total) => `${current} of ${total}`
            }}
          >
            {galleryImages.map((image) => (
              <Image key={image} src={imageUrls[image]} />
            ))}
          </Image.PreviewGroup>
        </div>
      </Space>
    </div>
  );
}