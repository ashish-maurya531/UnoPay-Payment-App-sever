import { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Input, Space, notification,Row,Col } from 'antd';

const WalletTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);  // To handle loading state
  const [error, setError] = useState(null);      // To handle errors
  const [searchText, setSearchText] = useState(''); // State to manage search input

  useEffect(() => {
    // Fetch user wallet balance data
    axios
      .post('http://localhost:3000/api/auth/all-user-wallet-wise-balance')
      .then((response) => {
        if (response.data.success === "true") {
          setData(response.data.data); // Set the data into the state
        } else {
          setError('Failed to load data');
        }
        setLoading(false);  // Set loading to false once data is loaded
      })
      .catch((error) => {
        setError('Error fetching data');
        setLoading(false); // Set loading to false if there is an error
      });
  }, []);

  // Filtered data based on search text
  const filteredData = data.filter(
    (item) =>
      item.member_id.toString().toLowerCase().includes(searchText) ||
      item.flexi_wallet.toString().includes(searchText) ||
      item.commission_wallet.toString().includes(searchText)
  );

  // Columns for the table
  const columns = [
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
      width: '30%',
    },
    {
      title: 'Flexi Wallet',
      dataIndex: 'flexi_wallet',
      key: 'flexi_wallet',
      width: '35%',
    },
    {
      title: 'Commission Wallet',
      dataIndex: 'commission_wallet',
      key: 'commission_wallet',
      width: '35%',
    },
  ];

  // Handle pagination change
  const handlePaginationChange = (page, pageSize) => {
    console.log('Page:', page, 'PageSize:', pageSize);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>User Wallet Balances</h2>

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

      {/* Loading and Error Handling */}
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}

      {/* Table with Pagination and Search */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="member_id"
        pagination={{
          pageSize: 10,
          onChange: handlePaginationChange,
          total: filteredData.length,
        }}
        loading={loading}  // Show Ant Design loading spinner
        scroll={{ x: true }} // Ensure it handles large content
        size="middle" // Compact table size
      />
    </div>
  );
};

export default WalletTable;