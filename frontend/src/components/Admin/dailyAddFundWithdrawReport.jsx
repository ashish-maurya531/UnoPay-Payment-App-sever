import { useState, useEffect } from 'react';
import { Table, notification, Row, Col, Statistic, DatePicker, Card } from 'antd';
import axios from 'axios';
import { LineChart, Line, PieChart, Pie, Tooltip, ResponsiveContainer, Cell, XAxis, YAxis,Legend  } from 'recharts';
import moment from 'moment-timezone';

const { RangePicker } = DatePicker;

const Src = import.meta.env.VITE_Src;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const parseNumber = (value) => parseFloat(value) || 0;

const TrendCard = ({ data, height }) => {
  // Log data properly to inspect structure
  // console.log("data:", data);

  // Process data based on its structure (assumes 1D array here)
  const processedData = data
    .map((item) => ({
      date: moment(item.date).format('YYYY-MM-DD'),
      Total_Add_Fund: (parseFloat(item.Total_Add_Fund) || 0),
      Total_Bank_Withdraw:(parseFloat(item.Total_Bank_Withdraw) || 0),
      Company_Money: (parseFloat(item.Company_Money) || 0),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort ASC

  // console.log("processedData:", processedData);

  return (
    <Card title="Financial Trend" className="h-full flex flex-col">
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height={height.value}>
          <LineChart
            data={processedData} // Use processedData instead of testData
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            {/* X-Axis */}
            <XAxis
              dataKey="date"
              tickFormatter={(date) => moment(date).format('DD/MM')}
              tick={{ fill: '#666', fontSize: 12 }}
            />

            {/* Y-Axis */}
            <YAxis
              tickFormatter={(value) => `Rs.${value.toLocaleString()}`}
              domain={['auto', 'auto']}
              tick={{ fill: '#666', fontSize: 12 }}
            />

            {/* Tooltip */}
            <Tooltip
              formatter={(value, name) => [
                `Rs.${value.toLocaleString()}`,
                name,
              ]}
            />

            {/* Legend */}
            <Legend />

            {/* Lines */}
            <Line
              type="monotone"
              dataKey="Total_Add_Fund"
              stroke="#007bff"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Add Fund"
            />
            <Line
              type="monotone"
              dataKey="Total_Bank_Withdraw"
              stroke="#dc3545"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Withdraw"
            />
            <Line
              type="monotone"
              dataKey="Company_Money"
              stroke="#28a745"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Company Money"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};


export default function FinancialDashboard() {
  const [todayData, setTodayData] = useState(null);
  const [otherData, setOtherData] = useState([]);
  const [stats, setStats] = useState({ totalAddFund: 0, totalWithdraw: 0, companyMoney: 0 });
  const [loading, setLoading] = useState(true);
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
  const [chartHeight, setChartHeight] = useState(300);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const todayResponse = await axios.get(`${Src}/api/auth/getDataForToday`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodayData(todayResponse.data[0]);

      const otherResponse = await axios.get(`${Src}/api/auth/getDataExceptToday`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOtherData(otherResponse.data);
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to fetch data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const total = otherData.reduce(
      (acc, curr) => ({
        totalAddFund: acc.totalAddFund + parseNumber(curr.Total_Add_Fund),
        totalWithdraw: acc.totalWithdraw + parseNumber(curr.Total_Bank_Withdraw),
        companyMoney: acc.companyMoney + parseNumber(curr.Company_Money),
      }),
      { totalAddFund: 0, totalWithdraw: 0, companyMoney: 0 }
    );
    setStats(total);
  }, [otherData]);

  const renderChart = () => {
    const chartData = [...otherData, todayData].filter(Boolean).map((item) => ({
      date: item.date,
      amount: parseNumber(item.Total_Add_Fund) ,
      Total_Add_Fund:item.Total_Add_Fund,
      Total_Bank_Withdraw:item.Total_Bank_Withdraw,
      Company_Money: item.Company_Money
    }));
    // console.log("chart data"+chartData);

    return (
      <Row gutter={16} className="mt-5">
        <Col span={12}>
          <TrendCard data={chartData} height={{ value: chartHeight, set: setChartHeight }} />
        </Col>
        <Col span={12}>
          <Card title="Distribution Breakdown">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Total Add Fund', value: stats.totalAddFund },
                    { name: 'Total Withdraw', value: stats.totalWithdraw },
                    { name: 'Company Money', value: stats.companyMoney },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: Rs.${parseNumber(value).toFixed(2)}`}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `Rs.${parseNumber(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="p-5">
      {todayData && (
        <Card title="Today's Data" className="mb-5">
          <Row gutter={16}>
            <Col span={8}><Statistic title="Total Add Fund" value={`Rs.${parseNumber(todayData.Total_Add_Fund).toFixed(2)}`} /></Col>
            <Col span={8}><Statistic title="Total Withdraw" value={`Rs.${parseNumber(todayData.Total_Bank_Withdraw).toFixed(2)}`} /></Col>
            <Col span={8}><Statistic title="Company Money" value={`Rs.${parseNumber(todayData.Company_Money).toFixed(2)}`} /></Col>
          </Row>
        </Card>
      )}
      <Card title="Previous Days Data" className="mb-5">
        <Table loading={loading} dataSource={otherData} rowKey="date" pagination={{ pageSize: 50 }}
          columns={[
            { title: 'Date', dataIndex: 'date', render: (date) => moment(date).format('YYYY-MM-DD') },
            { title: 'Add Fund', dataIndex: 'Total_Add_Fund', render: (val) => `Rs.${parseNumber(val).toFixed(2)}` },
            { title: 'Withdraw', dataIndex: 'Total_Bank_Withdraw', render: (val) => `Rs.${parseNumber(val).toFixed(2)}` },
            { title: 'Company Money', dataIndex: 'Company_Money', render: (val) => `Rs.${parseNumber(val).toFixed(2)}` },
          ]}
        />
      </Card>
      {renderChart()}
    </div>
  );
}
