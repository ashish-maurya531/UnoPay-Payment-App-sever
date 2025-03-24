
import { useState, useEffect } from 'react';
import { Table, notification, Row, Col, Button, Statistic, Tabs, DatePicker, Card, Input, Typography } from 'antd';
import axios from 'axios';
import { LineChart, Line, PieChart, Pie, Tooltip, ResponsiveContainer, Cell, XAxis, YAxis } from 'recharts';
import moment from 'moment-timezone';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const Src = import.meta.env.VITE_Src;
const RANKS = ['OPAL', 'TOPAZ', 'JASPER', 'ALEXANDER', 'DIAMOND', 'BLUE_DIAMOND', 'CROWN DIAMOND'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const TurnoverTrendCard = ({ data, height }) => {
  const [scaleFactor, setScaleFactor] = useState(1000);

  const handleScaleChange = (increment) => {
    setScaleFactor(prev => Math.max(100, Math.min(100000, increment ? prev * 2 : prev / 2)));
  };

  const scaledData = data.map(item => ({
    ...item,
    turnover: item.turnover / scaleFactor,
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
          <LineChart data={scaledData.reverse()} margin={{ top: 40, right: 30, left: 20, bottom: 10 }}>
            <XAxis
              dataKey="date_and_time_of_closing"
              tickFormatter={date => moment(date).format('DD/MM')}
              tick={{ fill: '#666', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={value => `Rs.${(value * scaleFactor).toFixed(0)}`}
              tick={{ fill: '#666', fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={date => moment(date).format('MMMM D, YYYY')}
              formatter={value => [`Rs.${(value * scaleFactor).toFixed(2)}`, 'Turnover']}
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
  const [eligibleUsersDataSource, setEligibleUsersDataSource] = useState([]);
  const [summaryRow, setSummaryRow] = useState(null);
  const [dailySummaryRow, setdailySummaryRow] = useState(null);
  const [monthlySummaryRow, setmonthlySummaryRow] = useState(null);
  const [dynamicMonthly, setDynamicMonthly] = useState(null)



  const [weeklyTurnover, setWeeklyTurnover] = useState(null);
  const [weekTotalDistribute, setWeekTotalDistribute] = useState(null);
  const [weekPerDistribute, setWeekPerDistribute] = useState(null);

  const [eligible50DirectsDataSource, setEligible50DirectsDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedType, setSelectedType] = useState('all');
  const [chartHeight, setChartHeight] = useState(300);
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
  const [customMonthlyAmount, setCustomMonthlyAmount] = useState('');
  const [monthlyData, setMonthlyData] = useState({});
  const [currentPagination, setCurrentPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const DAILY_COMMISSION_RATES = {
    1: 0.015,
    2: 0.016,
    3: 0.0165,
    4: 0.0175,
    5: 0.02,
    6: 0.01,
    7: 0.01
  };
  const MONTHLY_COMMISSION_RATES = {
    1: 0.015,
    2: 0.016,
    3: 0.0165,
    4: 0.0175,
    5: 0.02,
    6: 0.01
};

// 2. Define rank to index mapping for monthly (similar to daily)
const monthlyRankToIndex = {
    'OPAL': '1',
    'TOPAZ': '2',
    'JASPER': '3',
    'ALEXANDER': '4',
    'DIAMOND': '5',
    'BLUE_DIAMOND': '6'
};

  //  const MONTHLY_COMMISSION_RATES = {
  //     1: 0.015,
  //     2: 0.016,
  //     3: 0.0165,
  //     4: 0.0175,
  //     5: 0.02,
  //     6: 0.01
  // };

  useEffect(() => {
    // In fetchData function
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchClosingData();
        
        // Get eligible users data directly from function
        const eligibleUsers = await fetchEligibleUsersData();
        await fetchMonthlyData(eligibleUsers);

        // Pass fresh data to dependent functions
        await fetchDailyTurnover(eligibleUsers);

        const eligible50=await fetchEligible50DirectsData();
        await fetchWeeklyTurnover(eligible50);
      } catch (error) {
        // console.error("Error during data fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]); // Add token as dependency to refetch when token changes // Empty dependency array ensures it runs once on component mount


  useEffect(() => {
    calculateStats();
  }, [filteredData]);

  const fetchClosingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Src}/api/auth/closing-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClosingData(response.data.data);
      setFilteredData(response.data.data);
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to fetch closing details.' });
    } finally {
      setLoading(false);
    }
  };
  const transformAchieversData = (data) => {
    const membersMap = {};
    const rankCounts = {
      OPAL: 0,
      TOPAZ: 0,
      JASPER: 0,
      ALEXANDER: 0,
      DIAMOND: 0,
      BLUE_DIAMOND: 0,
      CROWN_DIAMOND: 0
    };

    // Loop through each rank category (OPAL, TOPAZ, etc.)
    Object.entries(data).forEach(([rank, users]) => {
      users.forEach(user => {
        const memberId = user.member_id;

        // If memberId doesn't exist in map, initialize it
        if (!membersMap[memberId]) {
          membersMap[memberId] = {
            sno: Object.keys(membersMap).length + 1, // Serial Number
            member_id: memberId,
            OPAL: '--',
            TOPAZ: '--',
            JASPER: '--',
            ALEXANDER: '--',
            DIAMOND: '--',
            BLUE_DIAMOND: '--',
            CROWN_DIAMOND: '--',
            total_ranks: 0 // Initialize total rank count for each member
          };
        }

        // Assign username to respective rank category
        membersMap[memberId][rank] = user.username;

        // Increase the total ranks count for this member
        membersMap[memberId].total_ranks += 1;

        // Increment rank count
        rankCounts[rank]++;
      });
    });

    // Convert map to array
    const transformedData = Object.values(membersMap);

    // Create summary row separately
    const summaryRow3 = {
      sno: 'Total',
      member_id: '--',
      OPAL: rankCounts.OPAL,
      TOPAZ: rankCounts.TOPAZ,
      JASPER: rankCounts.JASPER,
      ALEXANDER: rankCounts.ALEXANDER,
      DIAMOND: rankCounts.DIAMOND,
      BLUE_DIAMOND: rankCounts.BLUE_DIAMOND,
      CROWN_DIAMOND: rankCounts.CROWN_DIAMOND,
      total_ranks: '--'
    };

    return { data: transformedData, summaryRow3 };
  };

  ///////////////




  const fetchEligibleUsersData = async () => {
    try {
      const response2 = await axios.post(
        `${Src}/api/auth/getEligibleUsers`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { data, summaryRow3 } = transformAchieversData(response2.data);
      setEligibleUsersDataSource(data);
      setSummaryRow(summaryRow3);

      // Return the data for immediate use
      return data;
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to fetch achievers users details.' });
      return []; // Return empty array on error
    }
  };

  const fetchEligible50DirectsData = async () => {
    try {
      setLoading(true); // Show loading indicator when the request starts

      // Fetching data with the appropriate headers for authorization
      const response = await axios.post(
        `${Src}/api/auth/have50Directs`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }, // Adding authorization header
        }
      );

      // Log the response to see if you are getting the expected data
      // console.log('Fetched Eligible 50 Directs:', response.data);

      // Set the state with the fetched data
      setEligible50DirectsDataSource(response.data);
      // console.log("Eligible 50 Directs Data:", eligible50DirectsDataSource);
      return response.data;

    } catch (error) {
      // Handle error
      console.error('Error fetching 50 directs data:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch eligible 50 directs users details.'
      });

    } finally {
      // Always stop loading when done
      setLoading(false);
    }
  };

  const fetchDailyTurnover = async (eligibleUsers) => {

    try {
      setLoading(true);
      // console.log("->>>>>>>>>>>>"+eligibleUsersDataSource)
      // console.log("->>>>>>>>>"+summaryRow)

      // Fetch daily turnover from the API
      const { data } = await axios.post(`${Src}/api/auth/closing-route-get-today-data`);
      const turnover = parseFloat(data.todayIncome || 0);
      // const turnover = 3575; // Fixed turnover amount

      // Map RANKS array indices to their corresponding commission rates
      const rankToIndex = {
        'OPAL': '1',
        'TOPAZ': '2',
        'JASPER': '3',
        'ALEXANDER': '4',
        'DIAMOND': '5',
        'BLUE_DIAMOND': '6',
        'CROWN_DIAMOND': '7'
      };

      // Calculate the total number of people in each rank
      const rankCounts = {
        OPAL: 0,
        TOPAZ: 0,
        JASPER: 0,
        ALEXANDER: 0,
        DIAMOND: 0,
        BLUE_DIAMOND: 0,
        CROWN_DIAMOND: 0,
      };

      // Count people in each rank
      eligibleUsers.forEach((member) => {
        Object.keys(rankCounts).forEach((rank) => {
          if (member[rank] !== '--') rankCounts[rank]++;
        });
      });
      // console.log("Rank Counts:", rankCounts);

      // Calculate distribution for each rank
      const distribution = {};
      Object.entries(rankCounts).forEach(([rank, count]) => {
        const index = rankToIndex[rank];
        const rate = DAILY_COMMISSION_RATES[index];
        distribution[index] = ((turnover * rate * count) || 0).toFixed(2);
      });
      // console.log("Distribution:", distribution);

      const totalDistributed = Object.values(distribution)
        .reduce((sum, value) => sum + parseFloat(value), 0)
        .toFixed(2);
      // console.log("Total Distributed:", totalDistributed);

      const summary2 = {
        Total: turnover.toFixed(2),
        to_distribute: totalDistributed,
        ...distribution
      };
      // console.log("summary2", summary2);

      setdailySummaryRow(summary2);
    } catch (error) {
      // console.error('Error fetching turnover:', error);
      notification.error({ message: 'Error', description: 'Failed to fetch daily turnover.' });
    }
  };

  //////for weekly
  const fetchWeeklyTurnover = async (eligible50) => {
    try {
      setLoading(true);

      // Fetch daily turnover from the API
      const { data } = await axios.post(`${Src}/api/auth/closing-route-get-week-data`);

      // console.log("API Response:", data);
      // console.log(data);

      const weekTurnover = parseFloat(data.weeklyIncome || 0);
      // const weekTurnover = 100; // Mock turnover value

      // Setting weekly turnover to 2 decimal places
      setWeeklyTurnover(parseFloat(weekTurnover).toFixed(2));

      // Setting total distribute value
      setWeekTotalDistribute((weekTurnover * 0.02*eligible50.length).toFixed(2));

      const weekUsers = eligible50DirectsDataSource.length;
      // console.log(eligible50DirectsDataSource);
      // console.log("->>>>>>>>>>>>>>>>>>>>>" + weekUsers);

      // Check if weekUsers is greater than 0 before calculating
      setWeekPerDistribute(
        weekUsers > 0
          ? (parseFloat(((weekTurnover * 0.02) / weekUsers).toFixed(2)))
          : 0  // Set 0 if no users
      );

    } catch (error) {
      console.error('Error fetching turnover:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch week turnover.'
      });
    } finally {
      setLoading(false);
    }
  };


  const fetchMonthlyData = async (eligibleUsers) => {
    try {
        const response = await axios.post(`${Src}/api/auth/closing-route-get-month-data`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        
        setMonthlyData(response.data);
        const turnover = parseFloat(response.data.monthlyIncome);
        // const turnover=1000

        // Calculate rank counts from eligible users
        const rankCounts = {
            OPAL: 0,
            TOPAZ: 0,
            JASPER: 0,
            ALEXANDER: 0,
            DIAMOND: 0,
            BLUE_DIAMOND: 0,
        };

        eligibleUsers.forEach((member) => {
            Object.keys(rankCounts).forEach((rank) => {
                if (member[rank] !== '--') rankCounts[rank]++;
            });
        });

        // Calculate distribution using MONTHLY rates
        const distribution = {};
        Object.entries(rankCounts).forEach(([rank, count]) => {
            const index = monthlyRankToIndex[rank];
            const rate = MONTHLY_COMMISSION_RATES[index];
            distribution[index] = (turnover * rate * count).toFixed(2);
        });

        const totalDistributed = Object.values(distribution)
            .reduce((sum, value) => sum + parseFloat(value), 0)
            .toFixed(2);

        const summary2 = {
            Total: turnover.toFixed(2),
            to_distribute: totalDistributed,
            ...distribution,
            // Store counts for dynamic calculation
            OPAL_count: rankCounts.OPAL,
            TOPAZ_count: rankCounts.TOPAZ,
            JASPER_count: rankCounts.JASPER,
            ALEXANDER_count: rankCounts.ALEXANDER,
            DIAMOND_count: rankCounts.DIAMOND,
            BLUE_DIAMOND_count: rankCounts.BLUE_DIAMOND
        };

        setmonthlySummaryRow(summary2);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
        notification.error({ message: 'Error', description: 'Failed to fetch monthly data.' });
    }
};

// 4. Modified dynamic monthly effect
useEffect(() => {
    if (!monthlySummaryRow) return; // Don't run if no monthly data yet
    
    const amount = parseFloat(customMonthlyAmount) || parseFloat(monthlyData.monthlyIncome || 0);
    
    // Use rank counts from monthly summary
    const rankCounts = {
        1: monthlySummaryRow.OPAL_count || 0,
        2: monthlySummaryRow.TOPAZ_count || 0,
        3: monthlySummaryRow.JASPER_count || 0,
        4: monthlySummaryRow.ALEXANDER_count || 0,
        5: monthlySummaryRow.DIAMOND_count || 0,
        6: monthlySummaryRow.BLUE_DIAMOND_count || 0
    };

    const distribution = Object.entries(MONTHLY_COMMISSION_RATES).reduce((acc, [idx, rate]) => {
        acc[idx] = (amount * rate * rankCounts[idx]).toFixed(2);
        return acc;
    }, {});

    setDynamicMonthly({
        Total: amount.toFixed(2),
        to_distribute: Object.values(distribution).reduce((sum, val) => sum + parseFloat(val), 0).toFixed(2),
        ...distribution
    });
}, [customMonthlyAmount, monthlyData, monthlySummaryRow]);





  const handleManualClosing = async (type) => {
    try {
      setLoading(true);
      const result = await axios.post(`${Src}/api/auth/check-distribute/${type}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notification.success({
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} Closing Successful `,
        description: result.data.message
      });
      // console.log(result);
      await fetchClosingData();
    } catch (error) {
      notification.error({ message: 'Error', description: `Failed to perform ${type} closing.` });
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
    const startDate = moment(start).startOf('day');
    const endDate = moment(end).endOf('day');

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
    const members = Object.entries(record.list_of_members).map(([memberId, details]) => {
      // Handle weekly format separately
      if (record.type === 'weekly') {
        return {
          memberId,
          name: details.name || 'Unknown',
          amount: details.amount || details // Handle both object and legacy number format
        };
      }

      // Handle daily/monthly format
      const memberDetails = typeof details === 'number'
        ? { amount: details }
        : Object.entries(details).reduce((acc, [key, value]) => {
          if (key.startsWith('rank')) {
            const rankIndex = parseInt(key.replace('rank', ''), 10) - 1;
            acc[RANKS[rankIndex]] = value;
          }
          return acc;
        }, {});

      return {
        memberId,
        name: details.name || 'Unknown',
        ...memberDetails
      };
    });

    const columns = record.type === 'weekly'
      ? [
        { title: 'Name', dataIndex: 'name' },
        { title: 'Member ID', dataIndex: 'memberId' },
        { title: 'Amount', dataIndex: 'amount', render: val => val?.toFixed(2) || '-' }
      ]
      : [
        { title: 'Name', dataIndex: 'name' },
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
          pagination={{ pageSize: 10 }}
        />
      )
    }
  ];

  const handleCustomMonthlyAmountChange = (e) => {
    setCustomMonthlyAmount(e.target.value);
  };

  const handleRunCustomMonthlyDistribution = async () => {
    try {
      setLoading(true);
      const result = await axios.post(`${Src}/api/auth/check-distribute/monthly`,
        { custom_monthly_amount_distribution: customMonthlyAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      notification.success({
        message: 'Monthly Distribution Successful',
        description: result.data.message,
      });
      await fetchClosingData();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to run custom monthly distribution.',
      });
    } finally {
      setLoading(false);
    }
  };

  /////////////
  // Columns with consistent width
  const achiversColumns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 80,                          // Set fixed width
      align: 'center'                      // Center align
    },
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
      width: 150,                         // Set fixed width
      align: 'center'
    },
    {
      title: 'OPAL',
      dataIndex: 'OPAL',
      key: 'OPAL',
      width: 150,                         // Set fixed width
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'TOPAZ',
      dataIndex: 'TOPAZ',
      key: 'TOPAZ',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'JASPER',
      dataIndex: 'JASPER',
      key: 'JASPER',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'ALEXANDER',
      dataIndex: 'ALEXANDER',
      key: 'ALEXANDER',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'DIAMOND',
      dataIndex: 'DIAMOND',
      key: 'DIAMOND',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'BLUE_DIAMOND',
      dataIndex: 'BLUE_DIAMOND',
      key: 'BLUE_DIAMOND',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'CROWN_DIAMOND',
      dataIndex: 'CROWN_DIAMOND',
      key: 'CROWN_DIAMOND',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    }
  ];
  const direct500Columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, __, index) => {
        const { current, pageSize } = currentPagination;
        return (current - 1) * pageSize + index + 1;
      },
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
    }
  ];



  // Ant Design table columns
  const dailyBreakdown = [
    {
      title: 'Turnover',
      dataIndex: 'Total',
      key: 'total',
      width: 180,
      align: 'center'
    },
    {
      title: 'To Distribute',
      dataIndex: 'to_distribute',
      key: 'to_distribute',
      width: 180,
      align: 'center'
    },
    {
      title: 'OPAL',
      dataIndex: '1',
      key: 'OPAL',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'TOPAZ',
      dataIndex: '2',
      key: 'TOPAZ',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'JASPER',
      dataIndex: '3',
      key: 'JASPER',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'ALEXANDER',
      dataIndex: '4',
      key: 'ALEXANDER',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'DIAMOND',
      dataIndex: '5',
      key: 'DIAMOND',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'BLUE_DIAMOND',
      dataIndex: '6',
      key: 'BLUE_DIAMOND',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    },
    {
      title: 'CROWN_DIAMOND',
      dataIndex: '7',
      key: 'CROWN_DIAMOND',
      width: 150,
      align: 'center',
      render: (text) => text || '--'
    }
  ];

  /////////

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
          <Card title="Rank Achivers">
            <Table
              columns={achiversColumns}
              dataSource={summaryRow ? [summaryRow] : []}
              pagination={false}
              rowKey="sno"
              // showHeader={false}
              footer={null}
              bordered={true}
              style={{
                marginTop: '1px',                 // Ensure no gap between tables
                borderTop: 'none',                  // Remove border between table and summary
                fontWeight: 'bold',
                // Highlight the summary row
              }}
            />
            <Table
              columns={achiversColumns}
              dataSource={eligibleUsersDataSource}
              pagination={{ pageSize: 10 }}
              rowKey="member_id"
              bordered={true}
              showHeader={false}                // Add border for visual consistency
              style={{ marginBottom: '16px' }}    // Add spacing between tables
            />

          </Card>

          <Card title="Daily Closing"
            style={{
              marginTop: '16px', // Added more space on top
            }}>
            <Table
              columns={dailyBreakdown}
              dataSource={dailySummaryRow ? [dailySummaryRow] : []}
              pagination={false}
              rowKey="Total"
              bordered={true}
              style={{
                marginTop: '10px',
                fontWeight: 'bold'
              }}
            />

            <Button
              type="primary"
              onClick={() => handleManualClosing('daily')}
              className="mt-2"
            >
              Run Daily Closing
            </Button>
          </Card>

          {/* <Card
            title="Manual Monthly Closing"
            // bordered={false}
            style={{
              marginTop: '16px', // Added more space on top
            }}
          >
             <Table
              columns={dailyBreakdown}
              dataSource={monthlySummaryRow ? [monthlySummaryRow] : []}
              pagination={false}
              rowKey="Total"
              bordered={true}
              style={{
                marginTop: '16px', 
                fontWeight: 'bold',
              }}
            />

            <Row gutter={16} style={{ marginTop: '16px' }}> 
              <Col span={8}>
                <Text strong>Total Amount: </Text>
                <Text>{`Rs. ${monthlyData.monthlyIncome || 0}`}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Start Date: </Text>
                <Text>{monthlyData.startOfMonth || 'N/A'}</Text>
              </Col>
              <Col span={8}>
                <Text strong>End Date: </Text>
                <Text>{monthlyData.endOfMonth || 'N/A'}</Text>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: '24px' }}> 
              <Col span={18}>
                <Input
                  value={customMonthlyAmount}
                  onChange={handleCustomMonthlyAmountChange}
                  addonBefore="Custom Monthly Amount"
                  placeholder="Enter custom amount"
                />
              </Col>
              <Col span={6}>
                <Button
                  type="primary"
                  onClick={handleRunCustomMonthlyDistribution}
                  style={{ width: '100%' }}
                >
                  Monthly Distribution
                </Button>
              </Col>
            </Row>
          </Card>  */}

          <Card title="Monthly Closing" style={{
            marginTop: '16px', // Added more space on top
          }}>
            <Input
              addonBefore="Custom Amount"
              value={customMonthlyAmount}
              onChange={handleCustomMonthlyAmountChange}
              className="mb-4"
              placeholder="Enter custom amount"
            />

            <Table
              dataSource={[dynamicMonthly]}
              columns={[
                { title: 'Turnover', dataIndex: 'Total', render: v => `${v}` },
                { title: 'To Distribute', dataIndex: 'to_distribute', render: v => `${v}` },
                ...RANKS.map((r, i) => ({
                  title: r,
                  dataIndex: i + 1,
                  render: v => `${v || '0.00'}`,
                })),
              ]}
              pagination={false}
              bordered
            />
            <Row gutter={16} style={{ marginTop: '16px' }}> {/* Increased space between the table and row */}
              <Col span={8}>
                <Text strong>Total Amount: </Text>
                <Text>{` ${monthlyData.monthlyIncome || 0}`}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Start Date: </Text>
                <Text>{monthlyData.startOfMonth || 'N/A'}</Text>
              </Col>
              <Col span={8}>
                <Text strong>End Date: </Text>
                <Text>{monthlyData.endOfMonth || 'N/A'}</Text>
              </Col>
            </Row>

            <Button
              type="primary"
              onClick={handleRunCustomMonthlyDistribution}
              className="mt-4"
            >
              Execute Monthly Closing
            </Button>
          </Card>


          <Card title="Weekly Closing"
            style={{
              marginTop: '16px', // Added more space on top
            }}>
            <h1>50 Directs Achivers</h1>
            <Table
              columns={direct500Columns}
              dataSource={Array.isArray(eligible50DirectsDataSource) ? eligible50DirectsDataSource : []}
              pagination={{
                current: currentPagination.current,
                pageSize: currentPagination.pageSize,
                onChange: (page, pageSize) => {
                  setCurrentPagination({ current: page, pageSize });
                }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-evenly', fontSize: '18px', alignItems: 'flex-start' }}>
              <span>Week Turnover:  {weeklyTurnover}</span>
              <span>To Distribute: {weekTotalDistribute}</span>
              {/* <span>Per User:  {weekPerDistribute}</span> */}
            </div>


            <Button
              type="primary"
              onClick={() => handleManualClosing('weekly')}
              className="mt-2"
            >
              Run weekly Closing
            </Button>
          </Card>










        </Col>
        <Col span={24}>

        </Col>
      </Row>
    </div>
  );
}





