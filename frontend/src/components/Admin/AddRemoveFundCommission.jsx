import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Radio, 
  InputNumber, 
  Row, 
  Col, 
  Statistic, 
  message,
  notification
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
const Src = import.meta.env.VITE_Src;
const ManageFunds = () => {
  const [memberId, setMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberWallets, setMemberWallets] = useState(null);
  const [memberFound, setMemberFound] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Add state to track current operations
  const [flexiOperation, setFlexiOperation] = useState('credit');
  const [commissionOperation, setCommissionOperation] = useState('credit');
  
  const [flexiForm] = Form.useForm();
  const [commissionForm] = Form.useForm();

  const checkMemberId = async () => {
    if (!memberId) {
      message.error('Please enter a member ID');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await axios.post(`${Src}/api/auth/checkSponserId`, { sponser_id: memberId });
      if (data.isValid) {
        setMemberName(data.sponserName);
        setMemberFound(true);
        fetchWalletBalances();
      } else {
        setMemberName('Member not found');
        setMemberFound(false);
        message.error('Invalid member ID');
      }
    } catch (error) {
      message.error('Error checking member ID');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalances = async () => {
    try {
      const { data } = await axios.post(`${Src}/api/auth/user-wallet-wise-balance`, { member_id: memberId });
      if (data.status === "true") {
        setMemberWallets(data);
      } else {
        message.error('Failed to fetch wallet balances');
      }
    } catch (error) {
      message.error('Error fetching wallet balances');
    }
  };

  const handleFlexiFinish = async (values) => {
    if (!memberId || !values.amount || values.amount <= 0) {
      message.error('Please enter a valid amount');
      return;
    }
    
    if (values.operation === 'debit' && values.amount > memberWallets.flexi_wallet) {
      message.error('Insufficient balance in flexi wallet');
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(`${Src}/api/auth/manage-flexi-wallet`, {
        member_id: memberId,
        amount: values.amount,
        operation: values.operation
      });
      
      if (data.status === "true") {
        message.success(data.message);
        fetchWalletBalances();
        flexiForm.resetFields(['amount']);
        // Keep the current operation selected
        flexiForm.setFieldsValue({ operation: values.operation });
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error managing flexi wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionFinish = async (values) => {
    if (!memberId || !values.amount || values.amount <= 0) {
      message.error('Please enter a valid amount');
      return;
    }
    
    if (values.operation === 'debit' && values.amount > memberWallets.commission_wallet) {
      message.error('Insufficient balance in commission wallet');
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(`${Src}/api/auth/manage-commission-wallet`, {
        member_id: memberId,
        amount: values.amount,
        operation: values.operation
      });
      
      if (data.status === "true") {
        message.success(data.message);
        fetchWalletBalances();
        commissionForm.resetFields(['amount']);
        // Keep the current operation selected
        commissionForm.setFieldsValue({ operation: values.operation });
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error managing commission wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage User Funds</h1>
      
      {/* Member Search */}
      <Card size="small" title="Search Member" className="mb-2">
        <Row gutter={16}>
          <Col span={12}>
            <Input
              placeholder="Enter Member ID"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              onPressEnter={checkMemberId}
            />
          </Col>
          <Col span={12}>
            <Button 
              type="primary" 
              onClick={checkMemberId} 
              loading={loading}
              icon={<InfoCircleOutlined />}
            >
              Search Member
            </Button>
          </Col>
        </Row>
        
        {memberName && (
          <Row gutter={240} className="mt-1">
          <Col>
            <Statistic 
              title="Member Name" 
              value={memberName} 
              className={memberFound ? "text-green-600" : "text-red-600"} 
            />
          </Col>
          <Col>
            <Statistic 
              title="Membership" 
              value={memberWallets?.membership} 
            />
          </Col>
        </Row>
        
        )}
      </Card>

      {memberFound && memberWallets && (
        <>
          {/* Wallet Information */}
          <Card size="small" title="Wallet Information" className="mb-2">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic 
                    title="Flexi Wallet" 
                    value={memberWallets.flexi_wallet} 
                    suffix="INR"
                    precision={2}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic 
                    title="Commission Wallet" 
                    value={memberWallets.commission_wallet} 
                    suffix="INR"
                    precision={6}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic 
                    title="Available Commission" 
                    value={memberWallets.commission_minus_hold} 
                    suffix="INR"
                    precision={6}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic 
                    title="Hold Commission" 
                    value={memberWallets.holdTotalCommission} 
                    suffix="INR"
                    precision={6}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic 
                    title="Total Income" 
                    value={memberWallets.total_income} 
                    suffix="INR"
                    precision={6}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic 
                    title="Total Income" 
                    value={memberWallets.today_income}  
                    suffix="INR"
                    precision={6}
                  />
                </Card>
              </Col>
             
            </Row>
          </Card>

          {/* Wallet Management Forms */}
          <Row gutter={16}>
            {/* Flexi Wallet */}
            <Col span={24} md={12}>
              <Card size="small" title="Manage Flexi Wallet">
                <Form 
                  form={flexiForm} 
                  layout="vertical" 
                  onFinish={handleFlexiFinish}
                  initialValues={{ operation: 'credit' }}
                >
                  <Form.Item 
                    label="Operation" 
                    name="operation"
                    rules={[{ required: true }]}
                  >
                    <Radio.Group onChange={(e) => setFlexiOperation(e.target.value)}>
                      <Radio.Button value="credit">Add Fund</Radio.Button>
                      <Radio.Button value="debit">Remove Fund</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item 
                    label="Amount" 
                    name="amount"
                    rules={[
                      { required: true, message: 'Please enter amount' },
                      { type: 'number', min: 0, message: 'Minimum 0 INR' }
                    ]}
                  >
                    <InputNumber 
                      placeholder="Enter amount"
                      style={{ width: '100%' }}
                      step={0.01}
                      precision={2}
                      addonAfter="INR"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type={flexiOperation === 'credit' ? 'primary' : 'primary'}
                      htmlType="submit"
                      loading={loading}
                      block
                    >
                      {flexiOperation === 'credit' ? 'Add Fund' : 'Remove Fund'}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* Commission Wallet */}
            <Col span={24} md={12}>
              <Card size="small" title="Manage Commission Wallet">
                <Form 
                  form={commissionForm} 
                  layout="vertical" 
                  onFinish={handleCommissionFinish}
                  initialValues={{ operation: 'credit' }}
                >
                  <Form.Item 
                    label="Operation" 
                    name="operation"
                    rules={[{ required: true }]}
                  >
                    <Radio.Group onChange={(e) => setCommissionOperation(e.target.value)}>
                      <Radio.Button value="credit">Add Commission</Radio.Button>
                      <Radio.Button value="debit">Remove Commission</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item 
                    label="Amount" 
                    name="amount"
                    rules={[
                      { required: true, message: 'Please enter amount' },
                      { type: 'number', min: 1, message: 'Minimum 1 INR' }
                    ]}
                  >
                    <InputNumber 
                      placeholder="Enter amount"
                      style={{ width: '100%' }}
                      step={0.01}
                      precision={2}
                      addonAfter="INR"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type={commissionOperation === 'credit' ? 'primary' : 'primary'}
                      htmlType="submit"
                      loading={loading}
                      block
                    >
                      {commissionOperation === 'credit' ? 'Add Commission' : 'Remove Commission'}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default ManageFunds;