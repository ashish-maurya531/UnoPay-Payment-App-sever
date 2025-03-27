// import { Table, notification, Row, Col, Typography, DatePicker, Radio, Input } from 'antd';
// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import moment from 'moment'; // Add moment for date handling

// const { Text } = Typography;
// const { RangePicker } = DatePicker;
// const Src = import.meta.env.VITE_Src;

// // Custom date format function
// const formatDate = (dateString) => {
//   return moment(dateString).format('D/M/YYYY, h:mm:ss A');
// };

// export default function MembershipActivationTransactions() {
//   const [transactions, setTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedFilter, setSelectedFilter] = useState('all');
//   const [dateRange, setDateRange] = useState(null);
//   const [searchText, setSearchText] = useState('');
//   const [currentPagination, setCurrentPagination] = useState({
//     current: 1,
//     pageSize: 10,
//   });
//   const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));

//   useEffect(() => {
//     fetchTransactions();
//   }, []);

//   const fetchTransactions = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${Src}/api/auth/user-activation-report-transactions`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         }
//       });

//       const formattedData = response.data.transactions.map((tx, index) => ({
//         key: index.toString(),
//         transaction_id: tx.transaction_id,
//         member_id: tx.member_id,
//         username: tx.username,
//         date_of_joining: formatDate(tx.date_of_joining),
//         subType: tx.subType,
//         activation_date: formatDate(tx.activation_date),
//         // Add raw date for filtering
//         raw_activation_date: moment(tx.activation_date),
//       }));

//       setTransactions(formattedData);
//     } catch (error) {
//       console.error('Error fetching transactions:', error);
//       notification.error({
//         message: 'Error',
//         description: 'Failed to fetch transactions.',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Updated filter logic for activation date
//   const getFilteredData = () => {
//     let filteredData = [...transactions];

//     if (selectedFilter === 'today') {
//       const today = moment().startOf('day');
//       filteredData = filteredData.filter(tx => 
//         tx.raw_activation_date.isSame(today, 'day')
//       );
//     } else if (selectedFilter === 'range' && dateRange) {
//       const [start, end] = dateRange;
//       const startDate = start.startOf('day');
//       const endDate = end.endOf('day');
      
//       filteredData = filteredData.filter(tx => 
//         tx.raw_activation_date.isBetween(startDate, endDate, null, '[]')
//       );
//     }

//     // Search filter remains the same
//     return filteredData.filter(tx =>
//       Object.values(tx).some(value =>
//         value && value.toString().toLowerCase().includes(searchText.toLowerCase())
//       )
//     );
//   };

//   const filteredTransactions = getFilteredData();

//   const columns = [
//     {
//       title: 'Transaction ID',
//       dataIndex: 'transaction_id',
//       key: 'transaction_id',
//     },
//     {
//       title: 'Member ID',
//       dataIndex: 'member_id',
//       key: 'member_id',
//     },
//     {
//       title: 'Username',
//       dataIndex: 'username',
//       key: 'username',
//     },
//     {
//       title: 'Date of Joining',
//       dataIndex: 'date_of_joining',
//       key: 'date_of_joining',
//     },
//     {
//       title: 'Membership Type',
//       dataIndex: 'subType',
//       key: 'subType',
//     },
//     {
//       title: 'Activation Date',
//       dataIndex: 'activation_date',
//       key: 'activation_date',
//     },
//   ];

//   return (
//     <>
//       {/* Filter Controls */}
//       <Row gutter={16} style={{ marginBottom: 16 }}>
//         <Col span={24}>
//           <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
//             <Radio.Group 
//               value={selectedFilter} 
//               onChange={e => {
//                 setSelectedFilter(e.target.value);
//                 if (e.target.value !== 'range') setDateRange(null);
//               }}
//             >
//               <Radio.Button value="all">All</Radio.Button>
//               <Radio.Button value="today">Today</Radio.Button>
//               <Radio.Button value="range">Date Range</Radio.Button>
//             </Radio.Group>
            
//             {selectedFilter === 'range' && (
//               <RangePicker 
//                 value={dateRange}
//                 onChange={dates => setDateRange(dates)}
//                 style={{ width: '300px' }}
//               />
//             )}
//           </div>
//         </Col>
//       </Row>

//       {/* Search Input */}
//       <Row style={{ marginBottom: 16 }}>
//         <Col span={24}>
//           <Input.Search
//             placeholder="Search across all fields"
//             value={searchText}
//             onChange={(e) => setSearchText(e.target.value)}
//             style={{ width: '100%' }}
//             allowClear
//           />
//         </Col>
//       </Row>

//       {/* Transactions Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredTransactions}
//         loading={loading}
//         pagination={{
//           current: currentPagination.current,
//           pageSize: currentPagination.pageSize,
//           total: filteredTransactions.length,
//         }}
//         size="small"
//         onChange={(pagination) => setCurrentPagination(pagination)}
//       />
//     </>
//   );
// }


import { Table, notification, Row, Col, Typography, DatePicker, Radio, Input, Statistic } from 'antd';
import { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const Src = import.meta.env.VITE_Src;

// Custom date format function
const formatDate = (dateString) => {
  return moment(dateString).format('D/M/YYYY, h:mm:ss A');
};

export default function MembershipActivationTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('today');
  const [dateRange, setDateRange] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 500,
  });
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Src}/api/auth/user-activation-report-transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const formattedData = response.data.transactions.map((tx, index) => ({
        key: index.toString(),
        transaction_id: tx.transaction_id,
        member_id: tx.member_id,
        username: tx.username,
        date_of_joining: formatDate(tx.date_of_joining),
        subType: tx.subType,
        activation_date: formatDate(tx.activation_date),
        // Store activation date as a moment object
        raw_activation_date: moment.utc(tx.activation_date)
      }));

      setTransactions(formattedData);
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

  // Updated filter logic for activation date
  const getFilteredData = () => {
    let filteredData = [...transactions];

    // Apply date filtering
    if (selectedFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredData = filteredData.filter(tx => {
        const txDate = new Date(tx.raw_activation_date);
        txDate.setHours(0, 0, 0, 0);
        return txDate.getTime() === today.getTime();
      });
    } else if (selectedFilter === 'range' && dateRange) {
      const [start, end] = dateRange;
      const startDate = new Date(start);
      const endDate = new Date(end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      filteredData = filteredData.filter(tx => {
        const txDate = new Date(tx.raw_activation_date);
        return txDate >= startDate && txDate <= endDate;
      });
    }

    // Apply search filter
    return filteredData.filter(tx =>
      Object.values(tx).some(value =>
        value && value.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    );
  };

  const filteredTransactions = getFilteredData();

  // Add membership count calculation
  const basicCount = filteredTransactions.filter(tx => tx.subType === 'BASIC').length;
  const premiumCount = filteredTransactions.filter(tx => tx.subType === 'PREMIUM').length;

  // Add columns definition here
  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
    },
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Date of Joining',
      dataIndex: 'date_of_joining',
      key: 'date_of_joining',
    },
    {
      title: 'Membership Type',
      dataIndex: 'subType',
      key: 'subType',
    },
    {
      title: 'Activation Date',
      dataIndex: 'activation_date',
      key: 'activation_date',
    },
  ];

  return (
    <>
      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic 
            title="Total Members" 
            value={transactions.length} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Filtered Members" 
            value={filteredTransactions.length} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Basic Members" 
            value={basicCount} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Premium Members" 
            value={premiumCount} 
          />
        </Col>
      </Row>

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
                onChange={dates => {
                  console.log('Date Range Changed:', dates);
                  setDateRange(dates);
                }}
                style={{ width: '300px' }}
              />
            )}
          </div>
        </Col>
      </Row>

      {/* Search Input */}
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

      {/* Transactions Table */}
      <Table
        columns={columns}
        dataSource={filteredTransactions}
        loading={loading}
        pagination={{
          current: currentPagination.current,
          pageSize: currentPagination.pageSize,
          total: filteredTransactions.length,
        }}
        size="small"
        onChange={(pagination) => setCurrentPagination(pagination)}
      />
    </>
  );
}