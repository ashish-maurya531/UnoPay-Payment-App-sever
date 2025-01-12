
import { Table, Input, notification, Row, Col, Tag, Typography, Spin } from 'antd';
import { useState, useEffect } from 'react';
import axios from 'axios';

const { Text } = Typography;

export default function UserTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [successfulTransactions, setSuccessfulTransactions] = useState(0);
  const [failedTransactions, setFailedTransactions] = useState(0);
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 12,
  });

  const handleTableChange = (pagination) => {
    setCurrentPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };
  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchText, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/auth/user-all-transactions');
      const data = response.data.transactions;
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTransactions(data);
      setFilteredTransactions(data);
      setTotalTransactions(data.length);
      setSuccessfulTransactions(data.filter(transaction => transaction.status === 'successful').length);
      setFailedTransactions(data.filter(transaction => transaction.status === 'failed').length);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch transactions.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    const filteredData = transactions.filter((transaction) => {
      return (
        transaction.transaction_id.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.member_id?.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.type?.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.subType?.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.recharge_to?.toLowerCase().includes(searchText.toLowerCase())||
        transaction.status?.toLowerCase().includes(searchText.toLowerCase())||
        transaction.created_at?.toLowerCase().includes(searchText.toLowerCase())
        || transaction.amount?.toString().includes(searchText.toLowerCase())
      );
    });

    setFilteredTransactions(filteredData);
    setTotalTransactions(filteredData.length);
    setSuccessfulTransactions(filteredData.filter(transaction => transaction.status === 'success').length);
    setFailedTransactions(filteredData.filter(transaction => transaction.status === 'failed').length);
  };

  const renderEmptyValue = (value) => {
    return value ? value : '-'; // Returns '-' if the value is empty or undefined
  };

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, __, index) =>
        (currentPagination.current - 1) * currentPagination.pageSize + index + 1,
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      render: renderEmptyValue, // Using renderEmptyValue function to handle empty values
    },
    {
      title: 'Member Id',
      dataIndex: 'member_id',
      key: 'member_id',
      render: renderEmptyValue,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: renderEmptyValue,
    },
    {
      title: 'Sub Type',
      dataIndex: 'subType',
      key: 'subType',
      render: renderEmptyValue,
    },
    {
      title: 'Recharge To',
      dataIndex: 'recharge_to',
      key: 'recharge_to',
      render: renderEmptyValue,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => amount ? `Rs ${amount}` : '-', // Handle empty amount values
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status ? status : '-'}
        </Tag>
      ),
    },
    {
      title: 'Transaction Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: renderEmptyValue,
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Summary statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text strong>Total Transactions: {totalTransactions}</Text>
            <div style={{ display: 'flex', gap: 20 }}>
              <Tag color="green">Successful: {successfulTransactions}</Tag>
              <Tag color="red">Failed: {failedTransactions}</Tag>
            </div>
          </div>
        </Col>
      </Row>

      {/* Search input */}
      <Row style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Input.Search
            placeholder="Search transactions"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredTransactions}
          rowKey="transaction_id"
          pagination={{
            current: currentPagination.current,
            pageSize: currentPagination.pageSize,
            total: filteredTransactions.length,
         
          }}
          scroll={{ x: true }}
          size="small"
          onChange={handleTableChange}
        />
      </Spin>
    </div>
  );
}
