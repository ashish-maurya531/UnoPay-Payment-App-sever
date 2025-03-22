



// import { useEffect, useState } from 'react';
// import { Card, Form, Input, Button, DatePicker, TimePicker, Switch, message, Spin, Typography, Space, Divider } from 'antd';
// import { LinkOutlined, CalendarOutlined, ClockCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';
// import axios from 'axios';
// import moment from 'moment';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const Src = import.meta.env.VITE_Src;

// export default function MeetingScheduler() {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [meetingData, setMeetingData] = useState(null);
//   const [isEveryday, setIsEveryday] = useState(false);
//   const [token] = useState(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));

//   useEffect(() => {
//     fetchMeetingDetails();
//   }, []);

//   // Fetch meeting details from API
//   const fetchMeetingDetails = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.post(
//         `${Src}/api/auth/getMeetingDetails`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (response.data.status === "true") {
//         const meeting = response.data.meetingDetails;
//         setMeetingData(meeting);
        
//         // Parse the datetime
//         const dateTime = moment(meeting.date_time);
//         const isEveryDay = dateTime.year() === 1970;
        
//         setIsEveryday(isEveryDay);
        
//         // Set form values
//         form.setFieldsValue({
//           title: meeting.title,
//           link: meeting.link,
//           time: dateTime,
//           date: isEveryDay ? null : dateTime,
//         });
//       }
//     } catch (error) {
//       message.error('Failed to fetch meeting details');
//       console.error('Error fetching meeting details:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Save meeting details
//   const saveMeetingDetails = async (values) => {
//     setLoading(true);
//     try {
//       // Format date and time
//       let date;
//       if (isEveryday) {
//         date = "everyday";
//       } else {
//         date = values.date.format('YYYY-MM-DD');
//       }
      
//       const time = values.time.format('HH:mm:ss');

//       const response = await axios.post(
//         `${Src}/api/auth/postMeetingDetails`,
//         {
//           title: values.title,
//           link: values.link,
//           date: date,
//           time: time,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (response.data.status === "true") {
//         message.success(response.data.message);
//         fetchMeetingDetails(); // Refresh data
//       } else {
//         message.error(response.data.message || 'Failed to save meeting details');
//       }
//     } catch (error) {
//       message.error('Error saving meeting details');
//       console.error('Error saving meeting details:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 800, margin: '0 auto' }}>
//       <Card 
//         title={
//           <Title level={3}>
//             <VideoCameraOutlined /> Meeting Scheduler
//           </Title>
//         }
//         bordered={true}
//         style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
//       >
//         <Spin spinning={loading}>
//           <Form
//             form={form}
//             layout="vertical"
//             onFinish={saveMeetingDetails}
//             initialValues={{
//               title: '',
//               link: '',
//             }}
//           >
//             <Form.Item
//               name="title"
//               label="Meeting Title"
//               rules={[{ required: true, message: 'Please enter meeting title' }]}
//             >
//               <TextArea 
//                 placeholder="Enter meeting title" 
//                 prefix={<CalendarOutlined />}
//                 size="large"
//                 autoSize={{ minRows: 2, maxRows: 4 }}
//                 style={{ resize: 'vertical' }}
//               />
//             </Form.Item>

//             <Form.Item
//               name="link"
//               label="Meeting Link"
//               rules={[
//                 { required: true, message: 'Please enter meeting link' },
//                 { type: 'url', message: 'Please enter a valid URL' }
//               ]}
//             >
//               <Input 
//                 placeholder="https://meeting-link.com/join" 
//                 prefix={<LinkOutlined />}
//                 size="large"
//               />
//             </Form.Item>

//             <Form.Item label="Schedule Type">
//               <Space>
//                 <Switch
//                   checked={isEveryday}
//                   onChange={(checked) => setIsEveryday(checked)}
//                 />
//                 <Text>{isEveryday ? 'Everyday Meeting' : 'One-time Meeting'}</Text>
//               </Space>
//             </Form.Item>

//             {!isEveryday && (
//               <Form.Item
//                 name="date"
//                 label="Meeting Date"
//                 rules={[{ required: !isEveryday, message: 'Please select meeting date' }]}
//               >
//                 <DatePicker 
//                   style={{ width: '100%' }} 
//                   size="large"
//                   format="YYYY-MM-DD"
//                 />
//               </Form.Item>
//             )}

//             <Form.Item
//               name="time"
//               label="Meeting Time"
//               rules={[{ required: true, message: 'Please select meeting time' }]}
//             >
//               <TimePicker 
//                 style={{ width: '100%' }} 
//                 size="large"
//                 format="h:mm a"  // 12-hour format with AM/PM
//                 use12Hours  // Enable 12-hour clock
//                 minuteStep={5}
//                 inputReadOnly  // Prevents keyboard input to force using the clock picker
//                 prefix={<ClockCircleOutlined />}
//               />
//             </Form.Item>

//             <Form.Item>
//               <Button 
//                 type="primary" 
//                 htmlType="submit" 
//                 size="large"
//                 block
//               >
//                 {meetingData ? 'Update Meeting' : 'Schedule Meeting'}
//               </Button>
//             </Form.Item>
//           </Form>
//         </Spin>

//         {meetingData && (
//           <>
//             <Divider />
//             <div>
//               <Title level={4}>Current Meeting</Title>
//               <Card type="inner">
//                 <p><strong>Title:</strong></p>
//                 <Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 16 }}>
//                   {meetingData.title}
//                 </Paragraph>
//                 <p>
//                   <strong>Schedule:</strong>{' '}
//                   {meetingData.date_time && moment(meetingData.date_time).year() === 1970 
//                     ? 'Every day at ' + moment(meetingData.date_time).format('h:mm a')
//                     : moment(meetingData.date_time).format('YYYY-MM-DD h:mm a')}
//                 </p>
//                 <p>
//                   <strong>Link:</strong>{' '}
//                   <a href={meetingData.link} target="_blank" rel="noopener noreferrer">
//                     {meetingData.link}
//                   </a>
//                 </p>
//               </Card>
//             </div>
//           </>
//         )}
//       </Card>
//     </div>
//   );
// }

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