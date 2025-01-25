import { Table, notification, Row, Col, Input, Collapse, Spin } from 'antd';
import { useState, useEffect } from 'react';
import axios from 'axios';

const { Panel } = Collapse;

const Src = import.meta.env.VITE_Src; // Assuming this is where your API URL is defined

export default function RankList() {
  const [rankData, setRankData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 10, // You can adjust the pageSize here
  });

  useEffect(() => {
    fetchRankData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchText, rankData]);

  const fetchRankData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Src}/api/auth/getAllUsersRank`);
      setRankData(response?.data);
    } catch (error) {
      console.error('Error fetching rank data:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch rank data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    const filtered = rankData.filter((row) =>
      Object.values(row).some((value) =>
        value && value.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    );
    setFilteredData(filtered);
  };

  const handleTableChange = (pagination) => {
    setCurrentPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  // Columns for main Rank Table
  const columns = [
    {
      title: 'Sponsor ID',
      dataIndex: 'sponser_id',
      key: 'sponser_id',
    },
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
    },
    {
      title: 'Directs',
      dataIndex: 'directs',
      key: 'directs',
    },
    {
      title: 'Active Directs',
      dataIndex: 'active_directs',
      key: 'active_directs',
    },
    {
      title: 'Rank No.',
      dataIndex: 'rank_no',
      key: 'rank_no',
    },
    {
      title: 'Active Directs List',
      dataIndex: 'active_directs_list',
      key: 'active_directs_list',
      render: (activeDirectsList) => {
        // Only render accordion if activeDirectsList is not empty
        if (activeDirectsList && activeDirectsList.length > 0) {
          return (
            <Collapse accordion>
              <Panel header={`Active Directs (${activeDirectsList?.length || 0})`} key="active-directs-list">
                <Table
                  columns={[
                    {
                      title: 'Member ID',
                      dataIndex: 'member_id',
                      key: 'member_id',
                    },
                    {
                      title: 'Rank',
                      dataIndex: 'rank',
                      key: 'rank',
                    },
                    {
                      title: 'Membership',
                      dataIndex: 'membership',
                      key: 'membership',
                    },
                  ]}
                  dataSource={activeDirectsList}
                  pagination={false}
                  rowKey="member_id"
                  size="small"
                />
              </Panel>
            </Collapse>
          );
        } else {
          return null; // Don't render anything if the list is empty
        }
      },
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: 'OPAL',
      dataIndex: 'OPAL',
      key: 'OPAL',
    },
    {
      title: 'TOPAZ',
      dataIndex: 'TOPAZ',
      key: 'TOPAZ',
    },
    {
      title: 'JASPER',
      dataIndex: 'JASPER',
      key: 'JASPER',
    },
    {
      title: 'ALEXANDER',
      dataIndex: 'ALEXANDER',
      key: 'ALEXANDER',
    },
    {
      title: 'DIAMOND',
      dataIndex: 'DIAMOND',
      key: 'DIAMOND',
    },
    {
      title: 'BLUE DIAMOND',
      dataIndex: 'BLUE_DIAMOND',
      key: 'BLUE_DIAMOND',
    },
    {
      title: 'CROWN DIAMOND',
      dataIndex: 'CROWN_DIAMOND',
      key: 'CROWN_DIAMOND',
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Search input */}
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

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="member_id"
          pagination={{
            current: currentPagination.current,
            pageSize: currentPagination.pageSize,
            total: filteredData.length,
            onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
          }}
          size="small"
          scroll={{ x: true }}  // Only horizontal scroll
          className="rank-list-table" // Add custom class for row styling
        />
      </Spin>
    </div>
  );
}
