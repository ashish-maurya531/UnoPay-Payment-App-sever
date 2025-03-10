// import { useState } from 'react';
// import axios from 'axios';
// import { Card, Input, Button, Typography, Form, message, Spin } from 'antd';
// import { SearchOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';

// const { Title } = Typography;
// const Src = import.meta.env.VITE_Src;
// const EditUserDetails = () => {
//     const [memberId, setMemberId] = useState('');
//     const [userDetails, setUserDetails] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [form] = Form.useForm();

//     const fetchUserDetails = async () => {
//         if (!memberId.trim()) {
//             message.warning('Please enter a valid member ID');
//             return;
//         }
//         setLoading(true);
//         try {
//             const token = localStorage.getItem('token');
//             const { data } = await axios.post(`${Src}/api/auth/userDetails`, { member_id:memberId }, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             setUserDetails(data.data);
//             form.setFieldsValue(data.data);
//             message.success('User details loaded');
//         } catch (error) {
//             message.error(error.response?.data?.message || 'Error fetching user details');
//             setUserDetails(null);
//             form.resetFields();
//         } finally {
//             setLoading(false);
//         }
//     };

//     const saveChanges = async (values) => {
//         setLoading(true);
//         try {
//             const token = localStorage.getItem('token');
//             const response = await axios.patch(`${Src}/api/auth/update-userdetails`, {
//                 member_id:memberId,
//                 updateData: values
//             }, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             message.success('User details updated successfully');
//             setUserDetails(response.data.data);
//             form.setFieldsValue(response.data.data);
//         } catch (error) {
//             message.error(error.response?.data?.message || 'Error updating details');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
//             <Title level={3}>Edit User Details</Title>
//             <Card>
//                 <Input
//                     placeholder="Enter Member ID"
//                     prefix={<UserOutlined />}
//                     value={memberId}
//                     onChange={(e) => setMemberId(e.target.value)}
//                     onPressEnter={fetchUserDetails}
//                     disabled={loading}
//                 />
//                 <Button 
//                     type="primary" 
//                     icon={<SearchOutlined />} 
//                     onClick={fetchUserDetails} 
//                     loading={loading} 
//                     block
//                     style={{ marginTop: 10 }}
//                 >
//                     Search
//                 </Button>
//             </Card>
//             {userDetails && (
//                 <Card style={{ marginTop: 20 }}>
//                     <Form
//                         form={form}
//                         layout="vertical"
//                         onFinish={saveChanges}
//                         initialValues={userDetails}
//                     >
//                         {Object.entries(userDetails).map(([key, value]) => (
//                             <Form.Item key={key} name={key} label={key.toUpperCase()}>
//                                 <Input disabled={key === 'memberid'} />
//                             </Form.Item>
//                         ))}
//                         <Button 
//                             type="primary" 
//                             icon={<SaveOutlined />} 
//                             htmlType="submit" 
//                             loading={loading} 
//                             block
//                         >
//                             Save Changes
//                         </Button>
//                     </Form>
//                 </Card>
//             )}
//         </div>
//     );
// };

// export default EditUserDetails;



import { useState,useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, Input, Button, Typography, Form, message, Alert } from 'antd';
import { SearchOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;
const Src = import.meta.env.VITE_Src;

const tableConfigs = [
  {
    name: 'usersdetails',
    title: 'User Details',
    idField: 'memberid',
    fields: [
      { name: 'memberid', label: 'Member ID', disabled: true },
      { name: 'username', label: 'Username' },
      { name: 'phoneno', label: 'Phone Number' },
      { name: 'email', label: 'Email' },
      { name: 'membership', label: 'Membership' },
      { name: 'status', label: 'Status' }
    ]
  },
  {
    name: 'user_details',
    title: 'Additional Details',
    fields: [
      { name: 'FullName', label: 'Full Name' },
      { name: 'Nominee_name', label: 'Nominee Name' },
      { name: 'Nominee_relation', label: 'Nominee Relation' }
    ]
  },
  {
    name: 'pancard_details',
    title: 'PAN Details',
    fields: [
      { name: 'PanCard_Number', label: 'PAN Number' },
      { name: 'status', label: 'Status', disabled: true }
    ]
  },
  {
    name: 'aadhar_details',
    title: 'Aadhar Details',
    fields: [
      { name: 'Aadhar_Number', label: 'Aadhar Number' },
      { name: 'status', label: 'Status', disabled: true }
    ]
  },
  {
    name: 'bank_details',
    title: 'Bank Details',
    fields: [
      { name: 'Bank_Name', label: 'Bank Name' },
      { name: 'IFSC_Code', label: 'IFSC Code' },
      { name: 'Account_number', label: 'Account Number' },
      { name: 'status', label: 'Status', disabled: true }
    ]
  },
  {
    name: 'user_bank_kyc_details',
    title: 'KYC Details',
    fields: [
      { name: 'FullName', label: 'Full Name' },
      { name: 'IFSC_Code', label: 'IFSC Code' },
      { name: 'Bank_Name', label: 'Bank Name' },
      { name: 'Account_number', label: 'Account Number' },
      { name: 'Aadhar_Number', label: 'Aadhar Number' },
      { name: 'PanCard_Number', label: 'PAN Number' },
      { name: 'Nominee_name', label: 'Nominee Name' },
      { name: 'Nominee_relation', label: 'Nominee Relation' }
    ]
  }
];

const DetailsSection = ({ 
    title, 
    data, 
    onSave, 
    loading, 
    fields,
    error 
  }) => {
    const [form] = Form.useForm();
  
    // Reset form when data changes
    useEffect(() => {
      form.resetFields();
      if (data) {
        form.setFieldsValue(data);
      }
    }, [data, form]);
  
    return (
      <Col span={6}>
        <Card 
          title={title} 
          style={{ margin: '8px' }}
          extra={error && <Alert message="Error" type="error" showIcon />}
        >
          {!error ? (
            <Form
              form={form}
              onFinish={onSave}
              layout="vertical"
              initialValues={data || {}}
              key={JSON.stringify(data)} // Force re-render on data change
            >
              {fields.map(field => (
                <Form.Item
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  normalize={value => value || ''} // Handle null values
                >
                  <Input 
                    disabled={field.disabled || loading} 
                    placeholder={data?.[field.name] ? '' : 'N/A'}
                  />
                </Form.Item>
              ))}
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                icon={<SaveOutlined />}
              >
                Save
              </Button>
            </Form>
          ) : (
            <Alert
              message={`Failed to load ${title}`}
              description={error}
              type="error"
              showIcon
            />
          )}
        </Card>
      </Col>
    );
  };

const EditUserDetails = () => {
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState({});
  const [errors, setErrors] = useState({});

  const fetchDetails = async () => {
    if (!memberId.trim()) {
      message.warning('Please enter a valid Member ID');
      return;
    }
    
    setLoading(true);
    setErrors({});
    setTableData({}); // Clear previous data
    
    try {
      const token = localStorage.getItem('token');
      const requests = tableConfigs.map(config => 
        axios.post(
          `${Src}/api/auth/${config.name}`, 
          { member_id: memberId },
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(response => ({
          config: config.name,
          data: response.data.data
        })).catch(error => ({ 
          config: config.name, 
          error: error.response?.data?.message || error.message 
        }))
      );
  
      const responses = await Promise.all(requests);
      
      const newData = {};
      const newErrors = {};
      
      responses.forEach(response => {
        if (response.error) {
          newErrors[response.config] = response.error;
        } else {
          newData[response.config] = response.data;
        }
      });
      
      setTableData(newData);
      setErrors(newErrors);
      
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (tableName, values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.patch(
        `${Src}/api/auth/update-${tableName}`,
        { 
          member_id: memberId,
          updateData: values 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTableData(prev => ({ ...prev, [tableName]: data.data }));
      message.success(`${tableConfigs.find(t => t.name === tableName).title} updated successfully`);
    } catch (error) {
      message.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '100%', padding: 20 }}>
      <Title level={3}>User Management Dashboard</Title>
      <Card style={{ marginBottom: 20 }}>
        <Input
          placeholder="Enter Member ID"
          prefix={<UserOutlined />}
          value={memberId}
          onChange={e => setMemberId(e.target.value)}
          onPressEnter={fetchDetails}
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={fetchDetails}
          loading={loading}
          block
          style={{ marginTop: 10 }}
        >
          Search Member
        </Button>
      </Card>

      <Row gutter={16}>
        {tableConfigs.map(config => {
          const data = tableData[config.name];
          const error = errors[config.name];
          
          return (
            <DetailsSection
              key={config.name}
              title={config.title}
              data={data}
              error={error}
              loading={loading}
              fields={config.fields}
              onSave={values => handleSave(config.name, values)}
            />
          );
        })}
      </Row>
    </div>
  );
};

export default EditUserDetails;