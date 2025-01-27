import { Table, notification, Row, Col, Button, Collapse, Spin } from 'antd';
import { useState, useEffect } from 'react';
import axios from 'axios';

const { Panel } = Collapse;

const Src = import.meta.env.VITE_Src; // Assuming this is where your API URL is defined

export default function DistributionAndClosing() {
  const [closingData, setClosingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState(null);  // For controlling open/close accordion
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  useEffect(() => {
    fetchClosingData();
  }, []);

  const fetchClosingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Src}/api/auth/closing-details`);
      setClosingData(response.data.data);
    } catch (error) {
      console.error('Error fetching closing data:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch company closing details.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDistribution = async (type) => {
    try {
      setLoading(true);
      const response = await axios.post(`${Src}/api/auth/distribute/${type}`);
      notification.success({
        message: 'Distribution Successful',
        description: response.data.message,
      });
    } catch (error) {
      console.error('Error distributing income:', error);
      notification.error({
        message: 'Error',
        description: `Failed to distribute ${type} income.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setCurrentPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  // Columns for closing details table
  const columns = [
    {
      title: 'Sno',
      dataIndex: 'sno',
      key: 'sno',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Date & Time of Closing',
      dataIndex: 'date_and_time_of_closing',
      key: 'date_and_time_of_closing',
      render: (date) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: 'Turnover',
      dataIndex: 'turnover',
      key: 'turnover',
    },
    {
      title: 'Distributed Amount',
      dataIndex: 'distributed_amount',
      key: 'distributed_amount',
    },
    {
      title: 'Details',
      dataIndex: 'list_of_members',
      key: 'list_of_members',
      render: (_, record) => (
        <Collapse
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key)}
          accordion
        >
          <Panel header={`Details of Closing ID: ${record.sno}`} key={record.sno}>
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
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                },
              ]}
              dataSource={record.list_of_members}
              pagination={{
                current: currentPagination.current,
                pageSize: currentPagination.pageSize,
                total: record.list_of_members.length,
                onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
              }}
              rowKey="member_id"
              size="small"
              scroll={{ x: true }}  // Allow horizontal scrolling
            />
          </Panel>
        </Collapse>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Buttons for triggering distribution */}
      <Row style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Button type="primary" onClick={() => handleDistribution('daily')} style={{ width: '50%' }}>
            Distribute Daily Income
          </Button>
        </Col>
        <Col span={8}>
          <Button type="primary" onClick={() => handleDistribution('weekly')} style={{ width: '50%' }}>
            Distribute Weekly Income
          </Button>
        </Col>
        <Col span={8}>
          <Button type="primary" onClick={() => handleDistribution('monthly')} style={{ width: '50%' }}>
            Distribute Monthly Income
          </Button>
        </Col>
      </Row>

      {/* Table for closing details */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={closingData}
          rowKey="sno"
          pagination={false}  // No pagination here, will handle pagination in accordion
          size="small"
        />
      </Spin>
    </div>
  );
}
