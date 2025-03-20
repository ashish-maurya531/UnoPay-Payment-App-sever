



import { useState, useEffect } from 'react';
import { Table, Input, Card, Collapse, Spin, notification, Row, Col } from 'antd';
import axios from 'axios';

const { Panel } = Collapse;
const Src = import.meta.env.VITE_Src;

const RankList = () => {
  const [rankData, setRankData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 100,
  });
  const rankLabels = [
    '',                 // Index 0 (empty, as ranks start from 1)
    'OPAL',             // 1 → OPAL
    'TOPAZ',            // 2 → TOPAZ
    'JASPER',           // 3 → JASPER
    'ALEXANDER',        // 4 → ALEXANDER
    'DIAMOND',          // 5 → DIAMOND
    'BLUE_DIAMOND',     // 6 → BLUE_DIAMOND
    'CROWN_DIAMOND'     // 7 → CROWN_DIAMOND
  ];
  const [token] = useState(
    localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
  );

  useEffect(() => {
    fetchRankData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchText, rankData]);

  const fetchRankData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Src}/api/auth/getAllUsersRank`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRankData(response?.data || []);
    } catch (error) {
      // console.error('Error fetching rank data:', error);
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
      Object.values(row).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchText.toLowerCase())
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

  const nestedTableColumns = [
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
    },
    {
      title: 'username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'level',
      dataIndex: 'level',
      key: 'level',
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
  ];

  const renderNestedTable = (list, title) => {
    if (!list || list.length === 0) return null;
    
    const parsedList = typeof list === 'string' ? JSON.parse(list) : list;
    
    return (
      <Collapse>
        <Panel header={`${title} (${parsedList.length})`} key="1">
          <Table
            columns={nestedTableColumns}
            dataSource={parsedList}
            pagination={false}
            rowKey="member_id"
            size="small"
          />
        </Panel>
      </Collapse>
    );
  };

  const columns = [
    // {
    //   title: 'Sponsor ID',
    //   dataIndex: 'sponser_id',
    //   key: 'sponser_id',
    //   width: 120,
    //   fixed: 'left',
    // },
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
      width: 120,
      fixed: 'left',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Directs',
      dataIndex: 'directs',
      key: 'directs',
      width: 100,
      sorter: (a, b) => a.directs - b.directs,
    },
    {
      title: 'Active Directs',
      dataIndex: 'active_directs',
      key: 'active_directs',
      width: 120,
      sorter: (a, b) => a.active_directs - b.active_directs,
    },
    {
      title: 'Team',
      dataIndex: 'team',
      key: 'team',
      width: 100,
      sorter: (a, b) => a.team - b.team,
    },
    {
      title: 'Active Team',
      dataIndex: 'active_team',
      key: 'active_team',
      width: 120,
      sorter: (a, b) => a.active_team - b.active_team,
    },
    {
      title: 'Rank No.',
      dataIndex: 'rank_no',
      key: 'rank_no',
      width: 100,
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.rank_no - b.rank_no,
    },
    {
      title: 'Rank Array',
      dataIndex: 'rank_array',
      key: 'rank_array',
      width: 150,
      sorter: (a, b) => {
        const aValue = Array.isArray(a.rank_array) ? a.rank_array[0] || 0 : 0;
        const bValue = Array.isArray(b.rank_array) ? b.rank_array[0] || 0 : 0;
        return aValue - bValue;
      },
      render: (array) => {
        if (!Array.isArray(array) || array.length === 0) return '--';
    
        // Map rank numbers to their corresponding names
        const ranks = array
          .map(rank => rankLabels[rank] || `Unknown (${rank})`) 
          .join(', ');
    
        return (
          <span style={{ fontSize: '12px', color: '#555' }}>
            {ranks}
          </span>
        );
      }
    },
    
    {
      title: 'Active Directs List',
      dataIndex: 'active_directs_list',
      key: 'active_directs_list',
      width: 300,
      render: (list) => renderNestedTable(list, 'Active Directs'),
    },
    {
      title: 'Active Team List',
      dataIndex: 'active_team_list',
      key: 'active_team_list',
      width: 300,
      render: (list) => renderNestedTable(list, 'Active Team'),
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date) => (date ? new Date(date).toLocaleString() : '-'),
      sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
    },
    // {
    //   title: 'OPAL',
    //   dataIndex: 'OPAL',
    //   key: 'OPAL',
    //   width: 100,
    //   sorter: (a, b) => a.OPAL - b.OPAL,
    // },
    // {
    //   title: 'TOPAZ',
    //   dataIndex: 'TOPAZ',
    //   key: 'TOPAZ',
    //   width: 100,
    //   sorter: (a, b) => a.TOPAZ - b.TOPAZ,
    // },
    // {
    //   title: 'JASPER',
    //   dataIndex: 'JASPER',
    //   key: 'JASPER',
    //   width: 100,
    //   sorter: (a, b) => a.JASPER - b.JASPER,
    // },
    // {
    //   title: 'ALEXANDER',
    //   dataIndex: 'ALEXANDER',
    //   key: 'ALEXANDER',
    //   width: 120,
    //   sorter: (a, b) => a.ALEXANDER - b.ALEXANDER,
    // },
    // {
    //   title: 'DIAMOND',
    //   dataIndex: 'DIAMOND',
    //   key: 'DIAMOND',
    //   width: 120,
    //   sorter: (a, b) => a.DIAMOND - b.DIAMOND,
    // },
    // {
    //   title: 'BLUE DIAMOND',
    //   dataIndex: 'BLUE_DIAMOND',
    //   key: 'BLUE_DIAMOND',
    //   width: 140,
    //   sorter: (a, b) => a.BLUE_DIAMOND - b.BLUE_DIAMOND,
    // },
    // {
    //   title: 'CROWN DIAMOND',
    //   dataIndex: 'CROWN_DIAMOND',
    //   key: 'CROWN_DIAMOND',
    //   width: 160,
    //   sorter: (a, b) => a.CROWN_DIAMOND - b.CROWN_DIAMOND,
    // },
  ];

  return (
    <Card>
      <Row style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Input.Search
            placeholder="Search across all fields"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '100%', maxWidth: 400 }}
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
            ...currentPagination,
            total: filteredData.length,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={handleTableChange}
          size="middle"
          // scroll={{ x: 2500 }}
          bordered
        />
      </Spin>
    </Card>
  );
};

export default RankList;