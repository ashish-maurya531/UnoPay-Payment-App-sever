import { useEffect, useState, useRef } from 'react';
import { Card, Form, Input, Button, DatePicker, Switch, message, Spin, Typography, Space, Divider, Select, Row, Col } from 'antd';
import { LinkOutlined, CalendarOutlined, VideoCameraOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const Src = import.meta.env.VITE_Src;

export default function MeetingScheduler() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [meetingData, setMeetingData] = useState(null);
  const [isEveryday, setIsEveryday] = useState(false);
  const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));

  // States for OTP-style time input
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [ampm, setAmpm] = useState('AM');

  // References for input fields
  const hourRef = useRef(null);
  const minuteRef = useRef(null);

  useEffect(() => {
    fetchMeetingDetails();
  }, []);

  // Fetch meeting details from API
  const fetchMeetingDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${Src}/api/auth/getMeetingDetails`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "true") {
        const meeting = response.data.meetingDetails;
        setMeetingData(meeting);
        
        // Parse the datetime
        const dateTime = moment(meeting.date_time);
        const isEveryDay = dateTime.year() === 1970;
        
        setIsEveryday(isEveryDay);
        
        // Set form values
        form.setFieldsValue({
          title: meeting.title,
          link: meeting.link,
          date: isEveryDay ? null : dateTime,
        });

        // Set time values
        const hourVal = dateTime.format('h');
        const minuteVal = dateTime.format('mm');
        const ampmVal = dateTime.format('A');
        
        setHour(hourVal);
        setMinute(minuteVal);
        setAmpm(ampmVal);
      }
    } catch (error) {
      message.error('Failed to fetch meeting details');
      console.error('Error fetching meeting details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save meeting details
  const saveMeetingDetails = async (values) => {
    // Validate time inputs before proceeding
    if (!hour || !minute) {
      message.error('Please enter a valid time');
      return;
    }

    setLoading(true);
    try {
      // Format date and time
      let date;
      if (isEveryday) {
        date = "everyday";
      } else {
        date = values.date.format('YYYY-MM-DD');
      }
      
      // Format time from OTP-style inputs
      let formattedHour = parseInt(hour);
      // Convert 12-hour format to 24-hour format
      if (ampm === 'PM' && formattedHour < 12) {
        formattedHour += 12;
      } else if (ampm === 'AM' && formattedHour === 12) {
        formattedHour = 0;
      }
      
      const formattedMinute = minute.padStart(2, '0');
      const timeString = `${formattedHour.toString().padStart(2, '0')}:${formattedMinute}:00`;

      const response = await axios.post(
        `${Src}/api/auth/postMeetingDetails`,
        {
          title: values.title,
          link: values.link,
          date: date,
          time: timeString,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "true") {
        message.success(response.data.message);
        fetchMeetingDetails(); // Refresh data
      } else {
        message.error(response.data.message || 'Failed to save meeting details');
      }
    } catch (error) {
      message.error('Error saving meeting details');
      console.error('Error saving meeting details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle hour input change with validation
  const handleHourChange = (e) => {
    const value = e.target.value;
    // Only allow digits
    if (/^\d*$/.test(value)) {
      // Validate hour range (1-12)
      if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 12)) {
        setHour(value);
        // Auto-focus to minute input when 2 digits entered or valid single digit
        if ((value.length === 2 && parseInt(value) > 0) || 
            (value.length === 1 && parseInt(value) > 0)) {
          minuteRef.current && minuteRef.current.focus();
        }
      }
    }
  };

  // Handle minute input change with validation
  const handleMinuteChange = (e) => {
    const value = e.target.value;
    // Only allow digits
    if (/^\d*$/.test(value)) {
      // Validate minute range (0-59)
      if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
        setMinute(value);
      }
    }
  };

  // Format displayed time for current meeting
  const formatDisplayTime = (dateTimeStr) => {
    const dateTime = moment(dateTimeStr);
    if (dateTime.year() === 1970) {
      return 'Every day at ' + dateTime.format('h:mm A');
    }
    return dateTime.format('YYYY-MM-DD h:mm A');
  };

  // Validate the form before submission
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        if (!hour || !minute) {
          message.error('Please enter a valid time');
          return;
        }
        saveMeetingDetails(values);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card 
        title={
          <Title level={3}>
            <VideoCameraOutlined /> Meeting Scheduler
          </Title>
        }
        bordered={true}
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              title: '',
              link: '',
            }}
          >
            <Form.Item
              name="title"
              label="Meeting Title"
              rules={[{ required: true, message: 'Please enter meeting title' }]}
            >
              <TextArea 
                placeholder="Enter meeting title" 
                size="large"
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ resize: 'vertical' }}
                maxLength={300}
              />
            </Form.Item>

            <Form.Item
              name="link"
              label="Meeting Link"
              rules={[
                { required: true, message: 'Please enter meeting link' },
                { type: 'url', message: 'Please enter a valid URL' }
              ]}
            >
              <Input 
                placeholder="https://meeting-link.com/join" 
                prefix={<LinkOutlined />}
                size="large"
              />
            </Form.Item>

            <Form.Item label="Schedule Type">
              <Space>
                <Switch
                  checked={isEveryday}
                  onChange={(checked) => setIsEveryday(checked)}
                />
                <Text>{isEveryday ? 'Everyday Meeting' : 'One-time Meeting'}</Text>
              </Space>
            </Form.Item>

            {!isEveryday && (
              <Form.Item
                name="date"
                label="Meeting Date"
                rules={[{ required: !isEveryday, message: 'Please select meeting date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  size="large"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            )}

            <Form.Item
              label="Meeting Time"
              required
              validateStatus={(hour && minute) ? 'success' : undefined}
              help={(hour && minute) ? null : 'Please enter meeting time'}
            >
              <Row gutter={12} align="middle">
                <Col xs={6}>
                  <Input
                    ref={hourRef}
                    size="large"
                    value={hour}
                    onChange={handleHourChange}
                    placeholder="HH"
                    maxLength={2}
                    style={{ textAlign: 'center', fontSize: '16px' }}
                  />
                </Col>
                <Col xs={1} style={{ textAlign: 'center' }}>:</Col>
                <Col xs={6}>
                  <Input
                    ref={minuteRef}
                    size="large"
                    value={minute}
                    onChange={handleMinuteChange}
                    placeholder="MM"
                    maxLength={2}
                    style={{ textAlign: 'center', fontSize: '16px' }}
                  />
                </Col>
                <Col xs={8}>
                  <Select
                    size="large"
                    value={ampm}
                    onChange={setAmpm}
                    style={{ width: '100%' }}
                  >
                    <Option value="AM">AM</Option>
                    <Option value="PM">PM</Option>
                  </Select>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                block
              >
                {meetingData ? 'Update Meeting' : 'Schedule Meeting'}
              </Button>
            </Form.Item>
          </Form>
        </Spin>

        {meetingData && (
          <>
            <Divider />
            <div>
              <Title level={4}>Current Meeting</Title>
              <Card type="inner">
                <p><strong>Title:</strong></p>
                <Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 16 }}>
                  {meetingData.title}
                </Paragraph>
                <p>
                  <strong>Schedule:</strong>{' '}
                  {meetingData.date_time && formatDisplayTime(meetingData.date_time)}
                </p>
                <p>
                  <strong>Link:</strong>{' '}
                  <a href={meetingData.link} target="_blank" rel="noopener noreferrer">
                    {meetingData.link}
                  </a>
                </p>
              </Card>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}















///////////////////company closing 
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




// import { useState, useEffect, useCallback } from 'react';
// import { Table, notification, Row, Col, Button, Statistic, Tabs, DatePicker, Card, Input, Typography, Spin } from 'antd';
// import axios from 'axios';
// import { LineChart, Line, PieChart, Pie, Tooltip, ResponsiveContainer, Cell, XAxis, YAxis } from 'recharts';
// import moment from 'moment-timezone';
// import { TurnoverTrendCard } from './components/TurnoverTrendCard';
// import { AchieversTable } from './components/AchieversTable';
// import { DirectsTable } from './components/DirectsTable';

// const { Text } = Typography;
// const { RangePicker } = DatePicker;
// const Src = import.meta.env.VITE_Src;
// const RANKS = ['OPAL', 'TOPAZ', 'JASPER', 'ALEXANDER', 'DIAMOND', 'BLUE_DIAMOND', 'CROWN DIAMOND'];
// const DAILY_COMMISSION_RATES = [0.015, 0.016, 0.0165, 0.0175, 0.02, 0.01, 0.01];
// const WEEKLY_COMMISSION_RATE = 0.02;

// const useClosingData = (token) => {
//   const [data, setData] = useState({
//     closing: [],
//     eligibleUsers: [],
//     eligibleDirects: [],
//     dailySummary: null,
//     weeklySummary: null,
//     monthlySummary: null,
//     monthlyRaw: {}
//   });

//   const [loading, setLoading] = useState(true);

//   const fetchAllData = useCallback(async () => {
//     try {
//       setLoading(true);
//       const [closingRes, usersRes, directsRes, dailyRes, weeklyRes, monthlyRes] = await Promise.all([
//         axios.get(`${Src}/api/auth/closing-details`, { headers: { Authorization: `Bearer ${token}` } }),
//         axios.post(`${Src}/api/auth/getEligibleUsers`, {}, { headers: { Authorization: `Bearer ${token}` } }),
//         axios.post(`${Src}/api/auth/have50Directs`, {}, { headers: { Authorization: `Bearer ${token}` } }),
//         axios.post(`${Src}/api/auth/closing-route-get-today-data`),
//         axios.post(`${Src}/api/auth/closing-route-get-week-data`),
//         axios.post(`${Src}/api/auth/closing-route-get-month-data`, {}, { headers: { Authorization: `Bearer ${token}` } })
//       ]);

//       const transformAchievers = (responseData) => {
//         const membersMap = {};
//         const rankCounts = RANKS.reduce((acc, rank) => ({ ...acc, [rank]: 0 }), {});

//         Object.entries(responseData).forEach(([rank, users]) => {
//           users.forEach(user => {
//             if (!membersMap[user.member_id]) {
//               membersMap[user.member_id] = RANKS.reduce((acc, r) => ({ ...acc, [r]: '--' }), {
//                 sno: Object.keys(membersMap).length + 1,
//                 member_id: user.member_id,
//                 total_ranks: 0
//               });
//             }
//             membersMap[user.member_id][rank] = user.username;
//             membersMap[user.member_id].total_ranks += 1;
//             rankCounts[rank]++;
//           });
//         });

//         return {
//           data: Object.values(membersMap),
//           summary: RANKS.reduce((acc, rank) => ({ ...acc, [rank]: rankCounts[rank] }), { sno: 'Total' })
//         };
//       };

//       setData(prev => ({
//         ...prev,
//         closing: closingRes.data.data,
//         eligibleUsers: transformAchievers(usersRes.data).data,
//         eligibleSummary: transformAchievers(usersRes.data).summary,
//         eligibleDirects: directsRes.data,
//         dailySummary: calculateDistribution(dailyRes.data.todayIncome, DAILY_COMMISSION_RATES),
//         weeklySummary: calculateWeeklySummary(weeklyRes.data.weeklyIncome, directsRes.data.length),
//         monthlySummary: calculateDistribution(monthlyRes.data.monthlyIncome, DAILY_COMMISSION_RATES),
//         monthlyRaw: monthlyRes.data
//       }));

//     } catch (error) {
//       notification.error({ message: 'Data Loading Error', description: error.message });
//     } finally {
//       setLoading(false);
//     }
//   }, [token]);

//   useEffect(() => {
//     fetchAllData();
//   }, [fetchAllData]);

//   const calculateDistribution = (turnover, rates) => {
//     const distribution = rates.reduce((acc, rate, idx) => ({
//       ...acc,
//       [idx + 1]: (turnover * rate).toFixed(2)
//     }), {});

//     return {
//       Total: parseFloat(turnover).toFixed(2),
//       to_distribute: Object.values(distribution).reduce((sum, val) => sum + parseFloat(val), 0).toFixed(2),
//       ...distribution
//     };
//   };

//   const calculateWeeklySummary = (turnover, userCount) => ({
//     turnover: parseFloat(turnover).toFixed(2),
//     to_distribute: (turnover * WEEKLY_COMMISSION_RATE).toFixed(2),
//     per_user: userCount > 0 ? (turnover * WEEKLY_COMMISSION_RATE / userCount).toFixed(2) : '0.00'
//   });

//   return { ...data, loading, refetch: fetchAllData };
// };

// const DistributionAndClosing = () => {
//   const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
//   const {
//     closing,
//     eligibleUsers,
//     eligibleSummary,
//     eligibleDirects,
//     dailySummary,
//     weeklySummary,
//     monthlySummary,
//     monthlyRaw,
//     loading,
//     refetch
//   } = useClosingData(token);

//   const [filteredClosing, setFilteredClosing] = useState([]);
//   const [selectedType, setSelectedType] = useState('all');
//   const [customMonthlyAmount, setCustomMonthlyAmount] = useState('');
//   const [stats, setStats] = useState({ totalTurnover: 0, totalDistributed: 0, totalMembers: 0 });

//   // Closing operations
//   const handleManualClosing = async (type, amount = null) => {
//     try {
//       const config = {
//         url: `${Src}/api/auth/check-distribute/${type}`,
//         method: 'POST',
//         headers: { Authorization: `Bearer ${token}` },
//         ...(amount && { data: { custom_monthly_amount_distribution: amount } })
//       };

//       const result = await axios(config);
//       notification.success({ message: `${type} Closing Successful`, description: result.data.message });
//       await refetch();
//     } catch (error) {
//       notification.error({ message: `${type} Closing Failed`, description: error.message });
//     }
//   };

//   // Filters and calculations
//   const handleDateFilter = dates => {
//     if (!dates?.length) return setFilteredClosing(closing);
//     const [start, end] = dates.map(d => moment(d).startOf('day'));
//     setFilteredClosing(closing.filter(item => moment(item.date_and_time_of_closing).isBetween(start, end, null, '[]')));
//   };

//   const calculateStats = useCallback(() => {
//     const stats = filteredClosing.reduce((acc, curr) => ({
//       totalTurnover: acc.totalTurnover + parseFloat(curr.turnover),
//       totalDistributed: acc.totalDistributed + parseFloat(curr.distributed_amount),
//       totalMembers: acc.totalMembers + Object.keys(curr.list_of_members).length
//     }), { totalTurnover: 0, totalDistributed: 0, totalMembers: 0 });
//     setStats(stats);
//   }, [filteredClosing]);

//   useEffect(() => {
//     calculateStats();
//     setFilteredClosing(closing);
//   }, [closing, calculateStats]);

//   // Dynamic monthly calculation
//   const [dynamicMonthly, setDynamicMonthly] = useState(monthlySummary);
//   useEffect(() => {
//     const amount = parseFloat(customMonthlyAmount) || parseFloat(monthlyRaw.monthlyIncome || 0);
//     const distribution = DAILY_COMMISSION_RATES.reduce((acc, rate, idx) => ({
//       ...acc,
//       [idx + 1]: (amount * rate).toFixed(2)
//     }), {});

//     setDynamicMonthly({
//       Total: amount.toFixed(2),
//       to_distribute: Object.values(distribution).reduce((sum, val) => sum + parseFloat(val), 0).toFixed(2),
//       ...distribution
//     });
//   }, [customMonthlyAmount, monthlyRaw]);

//   return (
//     <div className="p-5 space-y-6">
//       <Row gutter={16}>
//         <Col span={8}>
//           <Card>
//             <Statistic title="Total Turnover" value={stats.totalTurnover.toFixed(2)} prefix="Rs." />
//           </Card>
//         </Col>
//         <Col span={8}>
//           <Card>
//             <Statistic title="Total Distributed" value={stats.totalDistributed.toFixed(2)} prefix="Rs." />
//           </Card>
//         </Col>
//         <Col span={8}>
//           <Card>
//             <Statistic title="Total Members" value={stats.totalMembers} />
//           </Card>
//         </Col>
//       </Row>

//       <Row gutter={16}>
//         <Col span={12}>
//           <RangePicker
//             format="YYYY-MM-DD"
//             onChange={handleDateFilter}
//             className="w-full"
//             placeholder={['Start Date', 'End Date']}
//           />
//         </Col>
//         <Col span={12} className="flex justify-end gap-2">
//           {['all', 'daily', 'weekly', 'monthly'].map(type => (
//             <Button
//               key={type}
//               onClick={() => setSelectedType(type)}
//               type={selectedType === type ? 'primary' : 'default'}
//             >
//               {type.charAt(0).toUpperCase() + type.slice(1)}
//             </Button>
//           ))}
//         </Col>
//       </Row>

//       <Spin spinning={loading}>
//         <Tabs
//           items={[
//             {
//               key: 'closing',
//               label: 'Closing Records',
//               children: (
//                 <Table
//                   dataSource={filteredClosing}
//                   columns={[
//                     { title: 'Type', dataIndex: 'type' },
//                     { title: 'Date', dataIndex: 'date_and_time_of_closing', render: d => moment(d).format('LLL') },
//                     { title: 'Turnover', dataIndex: 'turnover', render: v => `Rs.${parseFloat(v).toFixed(2)}` },
//                     { title: 'Distributed', dataIndex: 'distributed_amount', render: v => `Rs.${parseFloat(v).toFixed(2)}` },
//                     { title: 'Members', dataIndex: 'list_of_members', render: m => Object.keys(m).length }
//                   ]}
//                   pagination={{ pageSize: 10 }}
//                 />
//               )
//             },
//             {
//               key: 'analytics',
//               label: 'Analytics',
//               children: (
//                 <Row gutter={16}>
//                   <Col span={12}>
//                     <TurnoverTrendCard data={filteredClosing} />
//                   </Col>
//                   <Col span={12}>
//                     <Card title="Distribution Breakdown">
//                       <ResponsiveContainer width="100%" height={300}>
//                         <PieChart>
//                           <Pie
//                             data={[
//                               { name: 'Turnover', value: stats.totalTurnover },
//                               { name: 'Distributed', value: stats.totalDistributed },
//                               { name: 'Remaining', value: stats.totalTurnover - stats.totalDistributed }
//                             ]}
//                             dataKey="value"
//                             label={({ name }) => name}
//                           >
//                             {['#0088FE', '#00C49F', '#FFBB28'].map((c, i) => (
//                               <Cell key={i} fill={c} />
//                             ))}
//                           </Pie>
//                           <Tooltip formatter={v => `Rs.${v.toFixed(2)}` />
//                         </PieChart>
//                       </ResponsiveContainer>
//                     </Card>
//                   </Col>
//                 </Row>
//               )
//             }
//           ]}
//         />

//         <div className="space-y-6 mt-6">
//           <AchieversTable data={eligibleUsers} summary={eligibleSummary} />

//           <Card title="Daily Closing" className="shadow-lg">
//             <Table
//               dataSource={[dailySummary]}
//               columns={RANKS.map((r, i) => ({
//                 title: r,
//                 dataIndex: i + 1,
//                 render: v => `Rs.${v || '0.00'}`
//               })).concat([
//                 { title: 'Turnover', dataIndex: 'Total', render: v => `Rs.${v}` },
//                 { title: 'To Distribute', dataIndex: 'to_distribute', render: v => `Rs.${v}` }
//               ])}
//               pagination={false}
//               bordered
//             />
//             <Button type="primary" onClick={() => handleManualClosing('daily')} className="mt-4">
//               Execute Daily Closing
//             </Button>
//           </Card>

//           <Card title="Weekly Closing" className="shadow-lg">
//             <DirectsTable data={eligibleDirects} />
//             <div className="flex justify-around my-4 text-lg font-medium">
//               <span>Turnover: Rs.{weeklySummary?.turnover}</span>
//               <span>To Distribute: Rs.{weeklySummary?.to_distribute}</span>
//               <span>Per User: Rs.{weeklySummary?.per_user}</span>
//             </div>
//             <Button type="primary" onClick={() => handleManualClosing('weekly')}>
//               Execute Weekly Closing
//             </Button>
//           </Card>

//           <Card title="Monthly Closing" className="shadow-lg">
//             <Input
//               addonBefore="Custom Amount"
//               value={customMonthlyAmount}
//               onChange={e => setCustomMonthlyAmount(e.target.value)}
//               className="mb-4"
//             />
//             <Table
//               dataSource={[dynamicMonthly]}
//               columns={RANKS.map((r, i) => ({
//                 title: r,
//                 dataIndex: i + 1,
//                 render: v => `Rs.${v || '0.00'}`
//               })).concat([
//                 { title: 'Turnover', dataIndex: 'Total', render: v => `Rs.${v}` },
//                 { title: 'To Distribute', dataIndex: 'to_distribute', render: v => `Rs.${v}` }
//               ])}
//               pagination={false}
//               bordered
//             />
//             <Button 
//               type="primary" 
//               onClick={() => handleManualClosing('monthly', customMonthlyAmount)}
//               className="mt-4"
//             >
//               Execute Monthly Closing
//             </Button>
//           </Card>
//         </div>
//       </Spin>
//     </div>
//   );
// };

// export default DistributionAndClosing;