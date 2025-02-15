import { useState, useEffect } from 'react';
import { Table, notification, Row, Col, Statistic, DatePicker, Card } from 'antd';
import axios from 'axios';
import { LineChart, Line, PieChart, Pie, Tooltip, ResponsiveContainer, Cell, XAxis, YAxis } from 'recharts';
import moment from 'moment-timezone';

const { RangePicker } = DatePicker;

const Src = import.meta.env.VITE_Src;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const parseNumber = (value) => parseFloat(value) || 0;

const TrendCard = ({ data, height }) => {
  return (
    <Card title="Financial Trend" className="h-full flex flex-col">
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height={height.value}>
          <LineChart data={data} margin={{ top: 40, right: 30, left: 20, bottom: 10 }}>
            <XAxis dataKey="date" tickFormatter={(date) => moment(date).format('DD/MM')} tick={{ fill: '#666', fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `Rs.${parseNumber(value).toFixed(2)}`} tick={{ fill: '#666', fontSize: 12 }} />
            <Tooltip formatter={(value) => [`Rs.${parseNumber(value).toFixed(2)}`, 'Amount']} />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default function FinancialDashboard() {
  const [todayData, setTodayData] = useState(null);
  const [otherData, setOtherData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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
      setFilteredData(otherResponse.data);
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to fetch data.' });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = filteredData.reduce(
      (acc, curr) => ({
        totalAddFund: acc.totalAddFund + parseNumber(curr.Total_Add_Fund),
        totalWithdraw: acc.totalWithdraw + parseNumber(curr.Total_Bank_Withdraw),
        companyMoney: acc.companyMoney + parseNumber(curr.Company_Money),
      }),
      { totalAddFund: 0, totalWithdraw: 0, companyMoney: 0 }
    );
    setStats(total);
  };

  useEffect(() => {
    calculateStats();
  }, [filteredData]);

  const renderChart = () => {
    const chartData = otherData.map((item) => ({
      date: item.date,
      amount: parseNumber(item.Total_Add_Fund) + parseNumber(item.Total_Bank_Withdraw),
    }));

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
      <Table loading={loading} dataSource={filteredData} rowKey="date" pagination={{ pageSize: 10 }} />
      {renderChart()}
    </div>
  );
}
