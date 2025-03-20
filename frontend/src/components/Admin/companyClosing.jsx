// import { useState, useEffect } from 'react';
// import { Table, notification, Row, Col, Button, Statistic, Tabs, DatePicker, Card, Input, Typography } from 'antd';
// import axios from 'axios';
// import { LineChart, Line, PieChart, Pie, Tooltip, ResponsiveContainer, Cell, XAxis, YAxis } from 'recharts';
// import moment from 'moment-timezone';

// const { Text } = Typography;
// const { RangePicker } = DatePicker;
// const Src = import.meta.env.VITE_Src;
// const RANKS = ['OPAL', 'TOPAZ', 'JASPER', 'ALEXANDER', 'DIAMOND', 'BLUE_DIAMOND', 'CROWN DIAMOND'];
// const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

// const TurnoverTrendCard = ({ data, height }) => {
//   const [scaleFactor, setScaleFactor] = useState(1000);

//   const handleScaleChange = (increment) => {
//     setScaleFactor(prev => Math.max(100, Math.min(100000, increment ? prev * 2 : prev / 2)));
//   };

//   const scaledData = data.map(item => ({
//     ...item,
//     turnover: item.turnover / scaleFactor,
//   }));

//   return (
//     <Card
//       title="Turnover Trend"
//       extra={
//         <Button.Group>
//           <Button onClick={() => handleScaleChange(false)} disabled={scaleFactor <= 100}>-</Button>
//           <Button onClick={() => handleScaleChange(true)} disabled={scaleFactor >= 100000}>+</Button>
//         </Button.Group>
//       }
//       className="h-full flex flex-col"
//     >
//       <div className="flex-1 min-h-[200px]">
//         <ResponsiveContainer width="100%" height={height.value}>
//           <LineChart data={scaledData.reverse()} margin={{ top: 40, right: 30, left: 20, bottom: 10 }}>
//             <XAxis
//               dataKey="date_and_time_of_closing"
//               tickFormatter={date => moment(date).format('DD/MM')}
//               tick={{ fill: '#666', fontSize: 12 }}
//             />
//             <YAxis
//               tickFormatter={value => `Rs.${(value * scaleFactor).toFixed(0)}`}
//               tick={{ fill: '#666', fontSize: 12 }}
//             />
//             <Tooltip
//               labelFormatter={date => moment(date).format('MMMM D, YYYY')}
//               formatter={value => [`Rs.${(value * scaleFactor).toFixed(2)}`, 'Turnover']}
//               contentStyle={{
//                 background: 'rgba(255, 255, 255, 0.96)',
//                 border: '1px solid #ddd',
//                 borderRadius: '4px',
//                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
//               }}
//             />
//             <Line
//               type="monotone"
//               dataKey="turnover"
//               stroke="#8884d8"
//               strokeWidth={3}
//               dot={{ r: 4 }}
//               activeDot={{ r: 6 }}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </Card>
//   );
// };

// export default function DistributionAndClosing() {
//   const [closingData, setClosingData] = useState([]);
//   const [filteredData, setFilteredData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({});
//   const [selectedType, setSelectedType] = useState('all');
//   const [chartHeight, setChartHeight] = useState(300);
//   const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
//   const [customMonthlyAmount, setCustomMonthlyAmount] = useState('');
//   const [monthlyData, setMonthlyData] = useState({});

//   useEffect(() => {
//     fetchClosingData();
//     fetchMonthlyData();
//   }, []);

//   useEffect(() => {
//     calculateStats();
//   }, [filteredData]);

//   const fetchClosingData = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${Src}/api/auth/closing-details`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setClosingData(response.data.data);
//       setFilteredData(response.data.data);
//     } catch (error) {
//       notification.error({ message: 'Error', description: 'Failed to fetch closing details.' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchMonthlyData = async () => {
//     try {
//       const response = await axios.post(`${Src}/api/auth/closing-route-get-month-data`, {}, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setMonthlyData(response.data);
//     } catch (error) {
//       notification.error({ message: 'Error', description: 'Failed to fetch monthly data.' });
//     }
//   };

//   const handleManualClosing = async (type) => {
//     try {
//       setLoading(true);
//       const result =await axios.post(`${Src}/api/auth/check-distribute/${type}`, {}, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       notification.success({
//         message: `${type.charAt(0).toUpperCase() + type.slice(1)} Closing Successful `,
//         description:result.data.message
//       });
//       // console.log(result);
//       await fetchClosingData();
//     } catch (error) {
//       notification.error({ message: 'Error', description: `Failed to perform ${type} closing.` });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateStats = () => {
//     const stats = filteredData.reduce((acc, curr) => ({
//       totalTurnover: acc.totalTurnover + parseFloat(curr.turnover),
//       totalDistributed: acc.totalDistributed + parseFloat(curr.distributed_amount),
//       totalMembers: acc.totalMembers + Object.keys(curr.list_of_members).length
//     }), { totalTurnover: 0, totalDistributed: 0, totalMembers: 0 });
//     setStats(stats);
//   };

//   const calculateYearlyStats = () => 
//     filteredData.reduce((acc, curr) => {
//       const year = moment(curr.date_and_time_of_closing).year();
//       if (!acc[year]) acc[year] = { totalTurnover: 0, totalDistributed: 0 };
//       acc[year].totalTurnover += parseFloat(curr.turnover);
//       acc[year].totalDistributed += parseFloat(curr.distributed_amount);
//       return acc;
//     }, {});

//   const handleDateFilter = (dates) => {
//     if (!dates?.length) {
//       setFilteredData(closingData);
//       return;
//     }
  
//     const [start, end] = dates;
//     const startDate = moment(start).startOf('day');
//     const endDate = moment(end).endOf('day');
  
//     const filtered = closingData.filter(item => {
//       const itemDate = moment(item.date_and_time_of_closing);
//       return itemDate.isBetween(startDate, endDate, 'day', '[]');
//     });
  
//     setFilteredData(filtered);
//   };

//   const handleTypeFilter = (type) => {
//     setSelectedType(type);
//     setFilteredData(type === 'all' ? closingData : closingData.filter(item => item.type === type));
//   };

//   const expandedRowRender = (record) => {
//     const members = Object.entries(record.list_of_members).map(([memberId, details]) => {
//       // Handle weekly format separately
//       if (record.type === 'weekly') {
//         return {
//           memberId,
//           name: details.name || 'Unknown',
//           amount: details.amount || details // Handle both object and legacy number format
//         };
//       }
  
//       // Handle daily/monthly format
//       const memberDetails = typeof details === 'number' 
//         ? { amount: details }
//         : Object.entries(details).reduce((acc, [key, value]) => {
//             if (key.startsWith('rank')) {
//               const rankIndex = parseInt(key.replace('rank', ''), 10) - 1;
//               acc[RANKS[rankIndex]] = value;
//             }
//             return acc;
//           }, {});
  
//       return {
//         memberId,
//         name: details.name || 'Unknown',
//         ...memberDetails
//       };
//     });
  
//     const columns = record.type === 'weekly' 
//       ? [
//           { title: 'Name', dataIndex: 'name' },
//           { title: 'Member ID', dataIndex: 'memberId' },
//           { title: 'Amount', dataIndex: 'amount', render: val => val?.toFixed(2) || '-' }
//         ]
//       : [
//           { title: 'Name', dataIndex: 'name' },
//           { title: 'Member ID', dataIndex: 'memberId' },
//           ...RANKS.map(rank => ({
//             title: rank,
//             dataIndex: rank,
//             render: val => val?.toFixed(2) || '-'
//           }))
//         ];
  
//     return <Table columns={columns} dataSource={members} pagination={false} size="small" />;
//   };
//   const renderCharts = () => {
//   const chartData = [
//     { name: 'Turnover', value: stats.totalTurnover },
//     { name: 'Distributed', value: stats.totalDistributed },
//     { name: 'Remaining', value: stats.totalTurnover - stats.totalDistributed }
//   ];

//   return (
//     <Row gutter={16} className="mt-5">
//       <Col span={12}>
//         <TurnoverTrendCard 
//           data={filteredData} 
//           height={{ value: chartHeight, set: setChartHeight }}
//         />
//       </Col>
//       <Col span={12}>
//         <Card title="Distribution Breakdown">
//           <ResponsiveContainer width="100%" height={chartHeight}>
//             <PieChart>
//               <Pie
//                 data={chartData}
//                 dataKey="value"
//                 nameKey="name"
//                 cx="50%"
//                 cy="50%"
//                 outerRadius={100}
//                 label={({ name, value }) => `${name}: Rs.${value.toFixed(2)}`}
//               >
//                 {chartData.map((_, index) => (
//                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Pie>
//               <Tooltip formatter={value => `Rs.${value.toFixed(2)}`} />
//             </PieChart>
//           </ResponsiveContainer>
//         </Card>
//       </Col>
//     </Row>
//   );
// };

//   const items = [
//     {
//       key: '1',
//       label: 'Closing Records',
//       children: (
//         <Table
//           loading={loading}
//           columns={[
//             { title: 'Type', dataIndex: 'type' },
//             { 
//               title: 'Date', 
//               dataIndex: 'date_and_time_of_closing',
//               sorter: (a, b) => moment(a.date_and_time_of_closing).unix() - moment(b.date_and_time_of_closing).unix(),
//               render: date => moment(date).format('LLL')
//             },
//             { 
//               title: 'Turnover', 
//               dataIndex: 'turnover',
//               sorter: (a, b) => a.turnover - b.turnover,
//               render: val => `Rs.${parseFloat(val).toFixed(2)}`
//             },
//             { 
//               title: 'Distributed', 
//               dataIndex: 'distributed_amount',
//               sorter: (a, b) => a.distributed_amount - b.distributed_amount,
//               render: val => `Rs.${parseFloat(val).toFixed(2)}`
//             },
//             { 
//               title: 'Members',
//               dataIndex: 'list_of_members',
//               render: members => Object.keys(members).length
//             }
//           ]}
//           dataSource={filteredData}
//           expandable={{ expandedRowRender }}
//           rowKey="sno"
//           pagination={{ pageSize: 10 }}
//         />
//       )
//     },
//     {
//       key: '2',
//       label: 'Year View',
//       children: (
//         <Table
//           columns={[
//             { title: 'Year', dataIndex: 'year' },
//             { 
//               title: 'Total Turnover', 
//               dataIndex: 'totalTurnover',
//               render: val => `Rs.${parseFloat(val).toFixed(2)}`
//             },
//             { 
//               title: 'Total Distributed', 
//               dataIndex: 'totalDistributed',
//               render: val => `Rs.${parseFloat(val).toFixed(2)}`
//             },
//           ]}
//           dataSource={Object.entries(calculateYearlyStats()).map(([year, stats]) => ({
//             year,
//             ...stats,
//           }))}
//           rowKey="year"
//           pagination={{ pageSize: 8 }}
//         />
//       )
//     }
//   ];

//   const handleCustomMonthlyAmountChange = (e) => {
//     setCustomMonthlyAmount(e.target.value);
//   };

//   const handleRunCustomMonthlyDistribution = async () => {
//     try {
//       setLoading(true);
//       const result=await axios.post(`${Src}/api/auth/check-distribute/monthly`, 
//         { custom_monthly_amount_distribution: customMonthlyAmount }, 
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       notification.success({
//         message: 'Monthly Distribution Successful',
//         description: result.data.message,
//       });
//       await fetchClosingData();
//     } catch (error) {
//       notification.error({
//         message: 'Error',
//         description: 'Failed to run custom monthly distribution.',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-5">
//       <Row gutter={16} className="mb-5">
//         {[
//           { title: "Total Turnover", value: stats.totalTurnover },
//           { title: "Total Distributed", value: stats.totalDistributed },
//           { title: "Total Members", value: stats.totalMembers }
//         ].map((stat, i) => (
//           <Col span={8} key={i}>
//             <Card>
//               <Statistic
//                 title={stat.title}
//                 value={stat.title.includes('Member') ? stat.value : stat.value?.toFixed(2)}
//                 prefix={stat.title.includes('Member') ? null : "Rs."}
//               />
//             </Card>
//           </Col>
//         ))}
//       </Row>

//       <Row gutter={16} className="mb-5">
//         <Col span={12}>
//           <RangePicker
//             format="YYYY-MM-DD"
//             onChange={handleDateFilter}
//             className="w-full"
//             placeholder={['Start date (IST)', 'End date (IST)']}
//           />
//         </Col>
//         <Col span={12}>
//           <Button.Group className="float-right">
//             {['all', 'daily', 'weekly', 'monthly'].map(type => (
//               <Button 
//                 key={type}
//                 onClick={() => handleTypeFilter(type)}
//                 type={selectedType === type ? 'primary' : 'default'}
//               >
//                 {type.charAt(0).toUpperCase() + type.slice(1)}
//               </Button>
//             ))}
//           </Button.Group>
//         </Col>
//       </Row>

//       <Tabs items={items} />

//       {renderCharts()}

//       <Row gutter={16} className="mt-5">
//         <Col span={24}>
//           <Card title="Manual Closing Operations">
//             <Button.Group>
//               {['daily', 'weekly'].map(type => (
//                 <Button
//                   key={type}
//                   type="primary"
//                   onClick={() => handleManualClosing(type)}
//                   className="mr-2"
//                 >
//                   Run {type.charAt(0).toUpperCase() + type.slice(1)} Closing
//                 </Button>
//               ))}
//             </Button.Group>
//           </Card>
//         </Col>
//         <Col span={24}>
//           <Card
//             title="Manual Monthly Closing"
//             bordered={false}
//             style={{ backgroundColor: '#f7f7f7' }}
//           >
//             <Row gutter={16}>
//               <Col span={8}>
//                 <Text strong>Total Amount: </Text>
//                 <Text>{`Rs. ${monthlyData.monthlyIncome || 0}`}</Text>
//               </Col>
//               <Col span={8}>
//                 <Text strong>Start Date: </Text>
//                 <Text>{monthlyData.startOfMonth || 'N/A'}</Text>
//               </Col>
//               <Col span={8}>
//                 <Text strong>End Date: </Text>
//                 <Text>{monthlyData.endOfMonth || 'N/A'}</Text>
//               </Col>
//             </Row>

//             <Row gutter={16} style={{ marginTop: 16 }}>
//               <Col span={18}>
//                 <Input
//                   value={customMonthlyAmount}
//                   onChange={handleCustomMonthlyAmountChange}
//                   addonBefore="Custom Monthly Amount"
//                   placeholder="Enter custom amount"
//                 />
//               </Col>
//               <Col span={6}>
//                 <Button
//                   type="primary"
//                   onClick={handleRunCustomMonthlyDistribution}
//                   style={{ width: '100%' }}
//                 >
//                   Monthly Distribution
//                 </Button>
//               </Col>
//             </Row>
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// }











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
  const [eligible50DirectsDataSource, setEligible50DirectsDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedType, setSelectedType] = useState('all');
  const [chartHeight, setChartHeight] = useState(300);
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
  const [customMonthlyAmount, setCustomMonthlyAmount] = useState('');
  const [monthlyData, setMonthlyData] = useState({});

  useEffect(() => {
    fetchClosingData();
    fetchMonthlyData();
    fetchEligibleUsersData();
    fetchEligible50DirectsData();
  }, []);

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
  
    // Add a summary row at the end
    transformedData.push({
      sno: 'Total', // Label row as 'Total'
      member_id: '--',
      OPAL: rankCounts.OPAL,
      TOPAZ: rankCounts.TOPAZ,
      JASPER: rankCounts.JASPER,
      ALEXANDER: rankCounts.ALEXANDER,
      DIAMOND: rankCounts.DIAMOND,
      BLUE_DIAMOND: rankCounts.BLUE_DIAMOND,
      CROWN_DIAMOND: rankCounts.CROWN_DIAMOND,
      total_ranks: '--' // No total count for this row
    });
  
    return transformedData;
  };
  
  
  const fetchEligibleUsersData = async () => {
    try {
      setLoading(true);
      const response2 = await axios.post(`${Src}/api/auth/getEligibleUsers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log(response2.data); // Debugging API Response
  
      // Transform response before setting state
      const formattedData = transformAchieversData(response2.data);
      setEligibleUsersDataSource(formattedData);
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to fetch achievers users details.' });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEligible50DirectsData = async () => {
    try{
      setLoading(true);
      const response2= await axios.post(`${Src}/api/auth/have50Directs`,{
        headers: { Authorization: `Bearer ${token}` },
      });
      setEligible50DirectsDataSource(response2.data.data);
    }
    catch(error){
      notification.error({ message: 'Error', description: 'Failed to fetch achivers users details.' });
    }finally{
      setLoading(false);
    }

  };

  const fetchMonthlyData = async () => {
    try {
      const response = await axios.post(`${Src}/api/auth/closing-route-get-month-data`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMonthlyData(response.data);
    } catch (error) {
      notification.error({ message: 'Error', description: 'Failed to fetch monthly data.' });
    }
  };

  const handleManualClosing = async (type) => {
    try {
      setLoading(true);
      const result =await axios.post(`${Src}/api/auth/check-distribute/${type}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notification.success({
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} Closing Successful `,
        description:result.data.message
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
          pagination={{ pageSize: 8 }}
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
      const result=await axios.post(`${Src}/api/auth/check-distribute/monthly`, 
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
  const achiversColumns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      // render: (_, __, index) => 
      //   (currentPagination.current - 1) * currentPagination.pageSize + index + 1,
    },
    {
      title: 'Member ID',
      dataIndex: 'member_id',
      key: 'member_id',
    },
    {
      title: 'OPAL',
      dataIndex: 'OPAL',
      key: 'OPAL',
      render: (text) => text || '--'
    },
    {
      title: 'TOPAZ',
      dataIndex: 'TOPAZ',
      key: 'TOPAZ',
      render: (text) => text || '--'
    },
    {
      title: 'JASPER',
      dataIndex: 'JASPER',
      key: 'JASPER',
      render: (text) => text || '--'
    },
    {
      title: 'ALEXANDER',
      dataIndex: 'ALEXANDER',
      key: 'ALEXANDER',
      render: (text) => text || '--'
    },
    {
      title: 'DIAMOND',
      dataIndex: 'DIAMOND',
      key: 'DIAMOND',
      render: (text) => text || '--'
    },
    {
      title: 'BLUE_DIAMOND',
      dataIndex: 'BLUE_DIAMOND',
      key: 'BLUE_DIAMOND',
      render: (text) => text || '--'
    },
    {
      title: 'CROWN_DIAMOND',
      dataIndex: 'CROWN_DIAMOND',
      key: 'CROWN_DIAMOND',
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
              dataSource={Array.isArray(eligibleUsersDataSource) ? eligibleUsersDataSource : []}
              rowKey="member_id"
            />

        </Card>

        <Card title="Daily Closing">
            {/* <Table
              columns={achiversColumns}
              dataSource={Array.isArray(eligibleUsersDataSource) ? eligibleUsersDataSource : []}
              rowKey="member_id"
            /> */}
               <Button
              type="primary"
              onClick={() => handleManualClosing('daily')}
              className="mt-2"
            >
              Run Daily Closing
            </Button>
         </Card>

         <Card
            title="Manual Monthly Closing"
            // bordered={false}
           
          >
            <Row gutter={16}>
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

            <Row gutter={16} style={{ marginTop: 16 }}>
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
          </Card>

          <Card title="Weekly Closing">
            {/* <Table
              columns={achiversColumns}
              dataSource={Array.isArray(eligibleUsersDataSource) ? eligibleUsersDataSource : []}
              rowKey="member_id"
            /> */}
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
