import { useState, useEffect } from 'react';
import { Table, notification, Row, Col, Button, Statistic, Tabs, DatePicker, Card } from 'antd';
import axios from 'axios';
import { LineChart, Line, PieChart, Pie, Tooltip, ResponsiveContainer, Cell, XAxis, YAxis} from 'recharts';
// import moment from 'moment';
import moment from 'moment-timezone';


const { RangePicker } = DatePicker;

const Src = import.meta.env.VITE_Src;
const RANKS = ['OPAL', 'TOPAZ', 'JASPER', 'ALEXANDER', 'DIAMOND', 'BLUE_DIAMOND', 'CROWN DIAMOND'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const TurnoverTrendCard = ({ data, height }) => {
  // Initial scale factor
  const [scaleFactor, setScaleFactor] = useState(1000);

  // Handle increase/decrease in scale factor
  const handleScaleChange = (increment) => {
    setScaleFactor(prev => {
      const newScale = increment ? prev * 2 : prev / 2;
      return Math.max(100, Math.min(100000, newScale)); // Ensure the scale factor stays within a reasonable range
    });
  };

  // Scale the data based on the scaleFactor
  const scaledData = data.map(item => ({
    ...item,
    turnover: item.turnover / scaleFactor,  // Scale turnover by the current scale factor
  }));

  return (
    <Card
      title="Turnover Trend"
      extra={
        <Button.Group>
          <Button onClick={() => handleScaleChange(false)} disabled={scaleFactor <= 100}>-</Button>
          <Button onClick={() => handleScaleChange(true)} disabled={scaleFactor >= 100000}>+</Button>
        </Button.Group>
      }
      className="h-full flex flex-col"
    >
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height={height.value}>
          <LineChart data={scaledData} margin={{ top: 40, right: 30, left: 20, bottom: 10 }}>
            <XAxis
              dataKey="date_and_time_of_closing"
              tickFormatter={date => moment(date).format('DD/MM')}
              tick={{ fill: '#666', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={value => `Rs.${(value * scaleFactor).toFixed(0)}`} // Multiply by scaleFactor to display in original units
              tick={{ fill: '#666', fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={date => moment(date).format('MMMM D, YYYY')}
              formatter={value => [`Rs.${(value * scaleFactor).toFixed(2)}`, 'Turnover']} // Multiply by scaleFactor for tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.96)',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            />
            <Line
              type="monotone"
              dataKey="turnover"
              stroke="#8884d8"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default function DistributionAndClosing() {
  const [closingData, setClosingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedType, setSelectedType] = useState('all');
  const [chartHeight, setChartHeight] = useState(300);
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));



  useEffect(() => {
    fetchClosingData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [filteredData]);

  const fetchClosingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Src}/api/auth/closing-details`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      });
      setClosingData(response.data.data);
      setFilteredData(response.data.data);
      console.log(response.data.data);
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to fetch closing details.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualClosing = async (type) => {
    try {
      setLoading(true);
      const response = await axios.post(`${Src}/api/auth/check-distribute/${type}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      });
      notification.success({
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} Closing Successful`,
        description: response.data.message,
      });
      await fetchClosingData();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: `Failed to perform ${type} closing.`
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats = filteredData.reduce((acc, curr) => ({
      totalTurnover: acc.totalTurnover + parseFloat(curr.turnover),
      totalDistributed: acc.totalDistributed + parseFloat(curr.distributed_amount),
      totalMembers: acc.totalMembers + Object.keys(curr.list_of_members).length
    }), { totalTurnover: 0, totalDistributed: 0, totalMembers: 0 });
    setStats(stats);
  };

  const calculateYearlyStats = () => 
    filteredData.reduce((acc, curr) => {
      const year = moment(curr.date_and_time_of_closing).year();
      if (!acc[year]) acc[year] = { totalTurnover: 0, totalDistributed: 0 };
      acc[year].totalTurnover += parseFloat(curr.turnover);
      acc[year].totalDistributed += parseFloat(curr.distributed_amount);
      return acc;
    }, {});

    const handleDateFilter = (dates) => {
      if (!dates?.length) {
        setFilteredData(closingData);
        return;
      }
    
      const [start, end] = dates;
    
      // Normalize the dates to 'start of the day' to ensure comparison is done correctly
      const startDate = moment(start).startOf('day');
      const endDate = moment(end).endOf('day');
    
      // Filter data based on the date range, considering the full day range
      const filtered = closingData.filter(item => {
        const itemDate = moment(item.date_and_time_of_closing);
        return itemDate.isBetween(startDate, endDate, 'day', '[]');
      });
    
      setFilteredData(filtered);
    };
    
  const handleTypeFilter = (type) => {
    setSelectedType(type);
    setFilteredData(type === 'all' ? closingData : closingData.filter(item => item.type === type));
  };

  const expandedRowRender = (record) => {
    const members = Object.entries(record.list_of_members).map(([memberId, details]) => ({
      memberId,
      ...(typeof details === 'number' 
        ? { amount: details }
        : Object.entries(details).reduce((acc, [rank, amount]) => {
            const rankIndex = parseInt(rank.replace('rank', '')) - 1;
            acc[RANKS[rankIndex]] = amount;
            return acc;
          }, {}))
    }));

    const columns = record.type === 'weekly' 
      ? [
          { title: 'Member ID', dataIndex: 'memberId' },
          { title: 'Amount', dataIndex: 'amount', render: val => val?.toFixed(2) || '-' }
        ]
      : [
          { title: 'Member ID', dataIndex: 'memberId' },
          ...RANKS.map(rank => ({
            title: rank,
            dataIndex: rank,
            render: val => val?.toFixed(2) || '-'
          }))
        ];

    return <Table columns={columns} dataSource={members} pagination={false} size="small" />;
  };

  const renderCharts = () => {
    const chartData = [
      { name: 'Turnover', value: stats.totalTurnover },
      { name: 'Distributed', value: stats.totalDistributed },
      { name: 'Remaining', value: stats.totalTurnover - stats.totalDistributed }
    ];

    return (
      <Row gutter={16} className="mt-5">
        <Col span={12}>
          <TurnoverTrendCard 
            data={filteredData} 
            height={{ value: chartHeight, set: setChartHeight }}
          />
        </Col>
        <Col span={12}>
          <Card title="Distribution Breakdown">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: Rs.${value.toFixed(2)}`}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={value => `Rs.${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    );
  };

  const items = [
    {
      key: '1',
      label: 'Closing Records',
      children: (
        <Table
          loading={loading}
          columns={[
            { title: 'Type', dataIndex: 'type' },
            { 
              title: 'Date', 
              dataIndex: 'date_and_time_of_closing',
              sorter: (a, b) => moment(a.date_and_time_of_closing).unix() - moment(b.date_and_time_of_closing).unix(),
              render: date => moment(date).format('LLL')
            },
            { 
              title: 'Turnover', 
              dataIndex: 'turnover',
              sorter: (a, b) => a.turnover - b.turnover,
              render: val => `Rs.${parseFloat(val).toFixed(2)}`
            },
            { 
              title: 'Distributed', 
              dataIndex: 'distributed_amount',
              sorter: (a, b) => a.distributed_amount - b.distributed_amount,
              render: val => `Rs.${parseFloat(val).toFixed(2)}`
            },
            { 
              title: 'Members',
              dataIndex: 'list_of_members',
              render: members => Object.keys(members).length
            }
          ]}
          dataSource={filteredData}
          expandable={{ expandedRowRender }}
          rowKey="sno"
          pagination={{ pageSize: 10 }}
        />
      )
    },
    {
      key: '2',
      label: 'Year View',
      children: (
        <Table
          columns={[
            { title: 'Year', dataIndex: 'year' },
            { 
              title: 'Total Turnover', 
              dataIndex: 'totalTurnover',
              render: val => `Rs.${parseFloat(val).toFixed(2)}`
            },
            { 
              title: 'Total Distributed', 
              dataIndex: 'totalDistributed',
              render: val => `Rs.${parseFloat(val).toFixed(2)}`
            },
          ]}
          dataSource={Object.entries(calculateYearlyStats()).map(([year, stats]) => ({
            year,
            ...stats,
          }))}
          rowKey="year"
          pagination={{ pageSize: 8 }}
        />
      )
    }
  ];

  return (
    <div className="p-5">
      <Row gutter={16} className="mb-5">
        {[
          { title: "Total Turnover", value: stats.totalTurnover },
          { title: "Total Distributed", value: stats.totalDistributed },
          { title: "Total Members", value: stats.totalMembers }
        ].map((stat, i) => (
          <Col span={8} key={i}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.title.includes('Member') ? stat.value : stat.value?.toFixed(2)}
                prefix={stat.title.includes('Member') ? null : "Rs."}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} className="mb-5">
        <Col span={12}>
        <RangePicker
  format="YYYY-MM-DD"
  onChange={handleDateFilter}
  className="w-full"
  // Force picker to use India timezone
  getPopupContainer={trigger => trigger.parentNode}
  // Optional: Show timezone in placeholder
  placeholder={['Start date (IST)', 'End date (IST)']}
/>
        </Col>
        <Col span={12}>
          <Button.Group className="float-right">
            {['all', 'daily', 'weekly', 'monthly'].map(type => (
              <Button 
                key={type}
                onClick={() => handleTypeFilter(type)}
                type={selectedType === type ? 'primary' : 'default'}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </Button.Group>
        </Col>
      </Row>

      <Tabs items={items} />

      {renderCharts()}

      <Row gutter={16} className="mt-5">
        <Col span={24}>
          <Card title="Manual Closing Operations">
            <Button.Group>
              {['daily', 'weekly', 'monthly'].map(type => (
                <Button
                  key={type}
                  type="primary"
                  onClick={() => handleManualClosing(type)}
                  className="mr-2"
                >
                  Run {type.charAt(0).toUpperCase() + type.slice(1)} Closing
                </Button>
              ))}
            </Button.Group>
          </Card>
        </Col>
      </Row>
    </div>
  );
}