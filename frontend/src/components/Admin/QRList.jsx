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
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));

  // Fetch all QR codes from the backend
  const fetchQRs = async (currentPage = 1, pageSize = 5) => {
    setLoading(true);
    try {
      const response = await axios.get(`${Src}/api/auth/getAllAdminQRS`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      });
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
      await axios.delete(`${Src}/api/auth/deleteAdminQR/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      });
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
          Authorization: `Bearer ${token}`
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
      const response = await axios.post(
        `${Src}/api/auth/getQRimage`,
        { qr }, // Request body
        {
          headers: {
            Authorization: `Bearer ${token}`, // Correctly placed headers
          },
          responseType: 'blob', // Correctly placed responseType
        }
      );

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









// ////////

// import { useState, useEffect } from 'react';
// import { 
//   Button, 
//   Upload, 
//   Modal, 
//   Image, 
//   message, 
//   Popconfirm, 
//   Row, 
//   Col, 
//   Form,
//   Typography,
//   Space,
//   Spin,
//   Progress
// } from 'antd';
// import {
//   DeleteOutlined,
//   UploadOutlined,
//   PlusOutlined,
//   PictureOutlined,
//   EyeOutlined 
// } from '@ant-design/icons';
// import axios from 'axios';

// const { Title } = Typography;
// const Src = import.meta.env.VITE_Src;
// const MAX_IMAGES = 10;
// const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];

// export default function GalleryManagement() {
//   const [galleryImages, setGalleryImages] = useState([]);
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewIndex, setPreviewIndex] = useState(0);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [uploading, setUploading] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [form] = Form.useForm();
//   const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
//   const [imageUrls, setImageUrls] = useState({});

//   useEffect(() => {
//     fetchGalleryImages();
//   }, []);

//   const fetchGalleryImages = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${Src}/api/auth/get-gallery-images`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       const imagePromises = response.data.images.map(async (filename) => {
//         const imageBlob = await fetchImageByFilename(filename);
//         return { filename, url: imageBlob };
//       });
      
//       const images = await Promise.all(imagePromises);
//       const urlMap = {};
//       images.forEach(({ filename, url }) => {
//         urlMap[filename] = url;
//       });
      
//       setGalleryImages(response.data.images);
//       setImageUrls(urlMap);
//       setLoading(false);
//     } catch (error) {
//       message.error('Failed to fetch gallery images');
//       setLoading(false);
//     }
//   };

//   const fetchImageByFilename = async (filename) => {
//     try {
//       const response = await axios.post(
//         `${Src}/api/auth/get-gallery-image-file`,
//         { filename },
//         { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } }
//       );
//       return URL.createObjectURL(response.data);
//     } catch (error) {
//       console.error('Fetch image error:', error);
//       return '';
//     }
//   };

//   const beforeUpload = (file) => {
//     if (!allowedMimeTypes.includes(file.type)) {
//       message.error('Only PNG, JPG, and JPEG files are allowed!');
//       return Upload.LIST_IGNORE;
//     }
//     const isLt2M = file.size / 1024 / 1024 < 2;
//     if (!isLt2M) {
//       message.error('Image must be smaller than 2MB!');
//       return Upload.LIST_IGNORE;
//     }
//     return false;
//   };

//   const handleUploadImages = async () => {
//     if (!selectedFiles.length) {
//       message.error('Please select images to upload');
//       return;
//     }

//     setUploading(true);
//     setUploadProgress(0);
//     const formData = new FormData();
//     selectedFiles.forEach((file) => {
//       formData.append('images', file.originFileObj);
//     });
    
//     try {
//       await axios.post(`${Src}/api/auth/post-gallery`, formData, {
//         headers: { 
//           'Content-Type': 'multipart/form-data', 
//           Authorization: `Bearer ${token}` 
//         },
//         onUploadProgress: (progressEvent) => {
//           const percentCompleted = Math.round(
//             (progressEvent.loaded * 100) / progressEvent.total
//           );
//           setUploadProgress(percentCompleted);
//         },
//       });
      
//       message.success('Images uploaded successfully');
//       setIsModalOpen(false);
//       setSelectedFiles([]);
//       form.resetFields();
//       fetchGalleryImages();
//     } catch (error) {
//       message.error(error.response?.data?.error || 'Upload failed');
//     } finally {
//       setUploading(false);
//       setUploadProgress(0);
//     }
//   };

//   const handleDelete = async (image) => {
//     try {
//       await axios.delete(`${Src}/api/auth/delete-gallery-image`, {
//         headers: { Authorization: `Bearer ${token}` },
//         data: { fileName: image },
//       });
//       message.success('Image deleted successfully');
      
//       setGalleryImages(prev => prev.filter(img => img !== image));
//       const newUrls = { ...imageUrls };
//       delete newUrls[image];
//       setImageUrls(newUrls);
//     } catch (error) {
//       message.error('Failed to delete image');
//     }
//   };

//   const customRequest = ({ file, onSuccess }) => {
//     setTimeout(() => {
//       onSuccess("ok");
//     }, 0);
//   };

//   const handleChange = ({ fileList }) => {
//     setSelectedFiles(fileList);
//   };

//   return (
//     <div className="p-4">
//       <Space direction="vertical" size="large" className="w-full">
//         <div className="flex justify-between items-center mb-4">
//           <Title level={2} className="m-0">
//             <Space>
//               <PictureOutlined />
//               Gallery Management
//             </Space>
//           </Title>
//           <Button
//             type="primary"
//             icon={<UploadOutlined />}
//             onClick={() => setIsModalOpen(true)}
//             size="large"
//           >
//             Upload Images
//           </Button>
//         </div>

//         {loading ? (
//           <div className="flex justify-center items-center h-64">
//             <Spin size="large" />
//           </div>
//         ) : (
//           <Row gutter={[8, 8]}>
//            {galleryImages.map((image, index) => (
//           <Col key={image} xs={12} sm={8} md={6} lg={4}>
//             <div 
//               className="relative group"
//               style={{ 
//                 width: '100%',
//                 paddingTop: '100%',
//                 position: 'relative'
//               }}
//             >
//               <div
//                 style={{
//                   position: 'absolute',
//                   top: 0,
//                   left: 0,
//                   right: 0,
//                   bottom: 0,
//                   overflow: 'hidden'
//                 }}
//               >
//                 <Image
//                   alt={image}
//                   src={imageUrls[image]}
//                   style={{
//                     width: '100%',
//                     height: '100%',
//                     objectFit: 'cover'
//                   }}
//                   preview={{
//                     visible: false,
//                     onVisibleChange: (visible) => {
//                       if (visible) {
//                         setPreviewVisible(true);
//                         setPreviewIndex(index);
//                       }
//                     }
//                   }}
//                 />
//                 <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
//                   <Space>
//                     <Button
//                       type="primary"
//                       shape="circle"
//                       icon={<EyeOutlined />}
//                       onClick={() => {
//                         setPreviewVisible(true);
//                         setPreviewIndex(index);
//                       }}
//                     />
//                     <Popconfirm
//                       title="Delete this image?"
//                       description="Are you sure you want to delete this image?"
//                       onConfirm={() => handleDelete(image)}
//                       okText="Yes"
//                       cancelText="No"
//                     >
//                       <Button type="primary" danger shape="circle" icon={<DeleteOutlined />} />
//                     </Popconfirm>
//                   </Space>
//                 </div>
//               </div>
//             </div>
//           </Col>
//         ))}         
//          </Row>
//         )}

//         <Modal
//           title={
//             <div className="flex justify-between items-center">
//               <span>Upload Images</span>
//               <span>Selected: {selectedFiles.length}/{MAX_IMAGES}</span>
//             </div>
//           }
//           open={isModalOpen}
//           onCancel={() => {
//             setIsModalOpen(false);
//             setSelectedFiles([]);
//             form.resetFields();
//           }}
//           footer={[
//             <Button key="cancel" onClick={() => {
//               setIsModalOpen(false);
//               setSelectedFiles([]);
//               form.resetFields();
//             }}>
//               Cancel
//             </Button>,
//             <Button 
//               key="upload" 
//               type="primary" 
//               onClick={handleUploadImages}
//               loading={uploading}
//               disabled={selectedFiles.length === 0}
//             >
//               {uploading ? 'Uploading...' : 'Upload Images'}
//             </Button>
//           ]}
//           destroyOnClose
//         >
//           <Upload
//             listType="picture-card"
//             multiple
//             beforeUpload={beforeUpload}
//             customRequest={customRequest}
//             accept={allowedMimeTypes.join(',')}
//             maxCount={MAX_IMAGES}
//             fileList={selectedFiles}
//             onChange={handleChange}
//           >
//             {selectedFiles.length >= MAX_IMAGES ? null : (
//               <div>
//                 <PlusOutlined />
//                 <div className="mt-2">Select</div>
//               </div>
//             )}
//           </Upload>
//           {uploading && (
//             <Progress percent={uploadProgress} status="active" />
//           )}
//         </Modal>

//         <div style={{ display: 'block' }}>
//           <Image.PreviewGroup
//             preview={{
//               visible: previewVisible,
//               onVisibleChange: (vis) => setPreviewVisible(vis),
//               current: previewIndex,
//               countRender: (current, total) => `${current} of ${total}`
//             }}
//           >
//             {galleryImages.map((image) => (
//               <Image key={image} src={imageUrls[image]} />
//             ))}
//           </Image.PreviewGroup>
//         </div>
//       </Space>
//     </div>
//   );
// }
// /////////