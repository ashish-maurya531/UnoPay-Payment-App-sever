

import { Table, Input, notification, Row, Col, Tag, Typography, Spin } from 'antd';
import { useState, useEffect } from 'react';
import axios from 'axios';
const Src = import.meta.env.VITE_Src;

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
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));


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
      const response = await axios.get(`${Src}/api/auth/user-flexi-wallet-all-transactions`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      });
      const data = response.data.transactions;
        data.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
      setTransactions(data);
      setFilteredTransactions(data);
      setTotalTransactions(data.length);
      setSuccessfulTransactions(data.filter(transaction => transaction.message === 'Credited Successfully').length);
      setFailedTransactions(data.filter(transaction => transaction.message === 'Debited Successfully').length);
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
        transaction.credit?.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.debit?.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.total_balance?.toLowerCase().includes(searchText.toLowerCase())||
        transaction.message?.toLowerCase().includes(searchText.toLowerCase())||
        transaction.date_time?.toLowerCase().includes(searchText.toLowerCase())
     
      );
    });

    setFilteredTransactions(filteredData);
    setTotalTransactions(filteredData.length);
    setSuccessfulTransactions(filteredData.filter(transaction => transaction.message === 'Credited Successfully').length);
    setFailedTransactions(filteredData.filter(transaction => transaction.message === 'Debited Successfully').length);
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
      title: 'credit',
      dataIndex: 'credit',
      key: 'credit',
      render: renderEmptyValue,
    },
    {
      title: 'debit',
      dataIndex: 'debit',
      key: 'debit',
      render: renderEmptyValue,
    },
    {
      title: 'total_balance',
      dataIndex: 'total_balance',
      key: 'total_balance',
      render: renderEmptyValue,
    },
    {
      title: 'message',
      dataIndex: 'message',
      key: 'message',
      render: (message) => (
        <Tag color={message === 'Credited Successfully' ? 'green' : 'red'}>
          {message ? message : '-'}
        </Tag>
      ),
    },
    {
      title: 'Transaction Date',
      dataIndex: 'date_time',
      key: 'date_time',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
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
              <Tag color="green">Credited: {successfulTransactions}</Tag>
              <Tag color="red">Debited: {failedTransactions}</Tag>
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
