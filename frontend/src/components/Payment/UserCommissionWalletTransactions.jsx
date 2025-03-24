

// import { Table, Input, notification, Row, Col, Tag, Typography, Spin } from 'antd';
// import { useState, useEffect } from 'react';
// import axios from 'axios';
// const Src = import.meta.env.VITE_Src;

// const { Text } = Typography;



// export default function UserTransactions() {
//   const [transactions, setTransactions] = useState([]);
//   const [filteredTransactions, setFilteredTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchText, setSearchText] = useState('');
//   const [totalTransactions, setTotalTransactions] = useState(0);
//   const [successfulTransactions, setSuccessfulTransactions] = useState(0);
//   const [failedTransactions, setFailedTransactions] = useState(0);
//   const [currentPagination, setCurrentPagination] = useState({
//     current: 1,
//     pageSize: 400,
//   });
//   const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));


//   const handleTableChange = (pagination) => {
//     setCurrentPagination({
//       current: pagination.current,
//       pageSize: pagination.pageSize,
//     });
//   };

//   useEffect(() => {
//     fetchTransactions();
//   }, []);

//   useEffect(() => {
//     filterTransactions();
//   }, [searchText, transactions]);

//   const fetchTransactions = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${Src}/api/auth/user-commission-wallet-all-transactions`, {
//         headers: {
//           Authorization: `Bearer ${token}`, // Include the token for authentication
//         },
//       });
//       const data = response.data.transactions;
//       //sort by time 
      
//       data.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
     
      

//       setTransactions(data);
//       setFilteredTransactions(data);
//       setTotalTransactions(data.length);
//       setSuccessfulTransactions(data.filter(transaction => transaction.message === 'Credited Successfully').length);
//       setFailedTransactions(data.filter(transaction => transaction.message === 'Debited Successfully').length);
//     } catch (error) {
//       // console.error('Error fetching transactions:', error);
//       notification.error({
//         message: 'Error',
//         description: 'Failed to fetch transactions.',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterTransactions = () => {
//     const filteredData = transactions.filter((transaction) => {
//       return (
//         transaction.sno?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.username?.toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.member_id?.toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.commissionBy?.toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.transaction_id_for_member_id?.toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.transaction_id_of_commissionBy?.toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.credit?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.debit?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.total_balance?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.message?.toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.date_time?.toLowerCase().includes(searchText.toLowerCase()) ||
//         transaction.level?.toString().toLowerCase().includes(searchText.toLowerCase())

     
//       );
//     });

//     setFilteredTransactions(filteredData);
//     setTotalTransactions(filteredData.length);
//     setSuccessfulTransactions(filteredData.filter(transaction => transaction.message === 'Credited Successfully').length);
//     setFailedTransactions(filteredData.filter(transaction => transaction.message === 'Debited Successfully').length);
//   };

//   const renderEmptyValue = (value) => {
//     return value ? value : '-'; // Returns '-' if the value is empty or undefined
//   };

//   const columns = [
  
//     {
//       title: 'S.No',
//       dataIndex: 'sno',
//       key: 'sno',
//       render: (_, __, index) =>
//         (currentPagination.current - 1) * currentPagination.pageSize + index + 1,
//     },
//     {
//         title: 'Transaction ID for Member',
//         dataIndex: 'transaction_id_for_member_id',
//         key: 'transaction_id_for_member_id',
//         render: renderEmptyValue,
//       },
//       {
//         title: 'Username',
//         dataIndex: 'username',
//         key: 'username',
//         render: renderEmptyValue,
//       },
//     {
//       title: 'Member ID',
//       dataIndex: 'member_id',
//       key: 'member_id',
//       render: renderEmptyValue,
//     },
//     {
//       title: 'Commission By',
//       dataIndex: 'commissionBy',
//       key: 'commissionBy',
//       render: renderEmptyValue,
//     },
   
//     {
//       title: 'Transaction ID of Commission By',
//       dataIndex: 'transaction_id_of_commissionBy',
//       key: 'transaction_id_of_commissionBy',
//       render: renderEmptyValue,
//     },
//     {
//       title: 'Credit',
//       dataIndex: 'credit',
//       key: 'credit',
//       render: renderEmptyValue,
//     },
//     {
//       title: 'Debit',
//       dataIndex: 'debit',
//       key: 'debit',
//       render: renderEmptyValue,
//     },
//     {
//       title: 'Total Balance',
//       dataIndex: 'total_balance',
//       key: 'total_balance',
//       render: renderEmptyValue,
//     },
//     {
//       title: 'Message',
//       dataIndex: 'message',
//       key: 'message',
//       render: (message) => (
//         <Tag color={message === 'Credited Successfully' ? 'green' : 'red'}>
//           {message ? message : '-'}
//         </Tag>
//       ),
//     },
//     {
//       title: 'Transaction Date',
//       dataIndex: 'date_time',
//       key: 'date_time',
//       render: (date) => {
//         if (!date) return '-';
//         const d = new Date(date);
//         return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}, ${d.toLocaleTimeString()}`;
//       },
//     },
//     {
//       title: 'Level',
//       dataIndex: 'level',
//       key: 'level',
//       render: renderEmptyValue,
//     },
   
//   ];
  

//   return (
//     <div style={{ padding: '20px' }}>
//       {/* Summary statistics */}
//       <Row gutter={16} style={{ marginBottom: 16 }}>
//         <Col span={24}>
//           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//             <Text strong>Total Transactions: {totalTransactions}</Text>
//             <div style={{ display: 'flex', gap: 20 }}>
//             <Tag color="green">Credited: {successfulTransactions}</Tag>
//             <Tag color="red">Debited: {failedTransactions}</Tag>
//             </div>
//           </div>
//         </Col>
//       </Row>

//       {/* Search input */}
//       <Row style={{ marginBottom: 16 }}>
//         <Col span={24}>
//           <Input.Search
//             placeholder="Search transactions"
//             value={searchText}
//             onChange={(e) => setSearchText(e.target.value)}
//             style={{ width: '100%' }}
//             allowClear
//           />
//         </Col>
//       </Row>

//       <Spin spinning={loading}>
//         <Table
//           columns={columns}
//           dataSource={filteredTransactions}
//           rowKey="transaction_id"
//           pagination={{
//             current: currentPagination.current,
//             pageSize: currentPagination.pageSize,
//             total: filteredTransactions.length,
            
//           }}
//           scroll={{ x: true }}
//          size="small"

//           onChange={handleTableChange}
//         />
//       </Spin>
//     </div>
//   );
// }




import { Table, Input, notification, Row, Col, Tag, Typography, Spin, Radio, DatePicker } from 'antd';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
const Src = import.meta.env.VITE_Src;

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function UserTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 400,
  });
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
  const [selectedFilter, setSelectedFilter] = useState('today');
  const [dateRange, setDateRange] = useState(null);

  const handleTableChange = (pagination) => {
    setCurrentPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Src}/api/auth/user-commission-wallet-all-transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data.transactions;
      data.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
      setTransactions(data);
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to fetch transactions.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    let dateFiltered = transactions;

    // Apply date filtering
    if (selectedFilter === 'today') {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      dateFiltered = transactions.filter(t => {
        const transactionDate = new Date(t.date_time);
        return transactionDate >= startOfDay && transactionDate <= endOfDay;
      });
    } else if (selectedFilter === 'range' && dateRange) {
      const [start, end] = dateRange;
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      
      dateFiltered = transactions.filter(t => {
        const transactionDate = new Date(t.date_time);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    // Apply search filtering
    return dateFiltered.filter(t => {
      const searchLower = searchText.toLowerCase();
      return Object.entries(t).some(([key, value]) => {
        if (['credit', 'debit', 'total_balance', 'level'].includes(key)) {
          return value?.toString().includes(searchLower);
        }
        return typeof value === 'string' && value.toLowerCase().includes(searchLower);
      });
    });
  }, [transactions, searchText, selectedFilter, dateRange]);

  const summaryStats = useMemo(() => ({
    total: filteredTransactions.length,
    credited: filteredTransactions.filter(t => t.message === 'Credited Successfully').length,
    debited: filteredTransactions.filter(t => t.message === 'Debited Successfully').length,
  }), [filteredTransactions]);

  const renderEmptyValue = (value) => value || '-';

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, __, index) =>
        (currentPagination.current - 1) * currentPagination.pageSize + index + 1,
    },
    {
      title: 'Transaction ID for Member',
      dataIndex: 'transaction_id_for_member_id',
      key: 'transaction_id_for_member_id',
      render: renderEmptyValue,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: renderEmptyValue,
    },
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
      render: renderEmptyValue,
    },
    {
      title: 'Commission By',
      dataIndex: 'commissionBy',
      key: 'commissionBy',
      render: renderEmptyValue,
    },
    {
      title: 'Transaction ID of Commission By',
      dataIndex: 'transaction_id_of_commissionBy',
      key: 'transaction_id_of_commissionBy',
      render: renderEmptyValue,
    },
    {
      title: 'Credit',
      dataIndex: 'credit',
      key: 'credit',
      render: renderEmptyValue,
      sorter: (a, b) => (parseFloat(a.credit) || 0) - (parseFloat(b.credit) || 0),
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: 'Debit',
      dataIndex: 'debit',
      key: 'debit',
      render: renderEmptyValue,
      sorter: (a, b) => (parseFloat(a.debit) || 0) - (parseFloat(b.debit) || 0),
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: 'Total Balance',
      dataIndex: 'total_balance',
      key: 'total_balance',
      render: renderEmptyValue,
      sorter: (a, b) => (parseFloat(a.total_balance) || 0) - (parseFloat(b.total_balance) || 0),
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (message) => (
        <Tag color={message === 'Credited Successfully' ? 'green' : 'red'}>
          {message || '-'}
        </Tag>
      ),
    },
    {
      title: 'Transaction Date',
      dataIndex: 'date_time',
      key: 'date_time',
      render: (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}, ${d.toLocaleTimeString()}`;
      },
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: renderEmptyValue,
      sorter: (a, b) => (a.level || 0) - (b.level || 0),
      sortDirections: ['descend', 'ascend'],
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Filter Controls */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Radio.Group 
              value={selectedFilter} 
              onChange={e => {
                setSelectedFilter(e.target.value);
                if (e.target.value !== 'range') setDateRange(null);
              }}
            >
              <Radio.Button value="all">All</Radio.Button>
              <Radio.Button value="today">Today</Radio.Button>
              <Radio.Button value="range">Date Range</Radio.Button>
            </Radio.Group>
            
            {selectedFilter === 'range' && (
              <RangePicker 
                value={dateRange}
                onChange={dates => setDateRange(dates)}
                style={{ width: '300px' }}
              />
            )}
          </div>
        </Col>
      </Row>

      {/* Summary statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text strong>Showing: {summaryStats.total}</Text>
            <div style={{ display: 'flex', gap: 20 }}>
              <Tag color="green">Credited: {summaryStats.credited}</Tag>
              <Tag color="red">Debited: {summaryStats.debited}</Tag>
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