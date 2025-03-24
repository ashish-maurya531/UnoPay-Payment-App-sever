import { useState } from 'react';
import { Input, Card, Collapse, Spin, notification, Typography, Button, Table } from 'antd';
import { CopyOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
const { Panel } = Collapse;
const { Title } = Typography;

const TeamHierarchy = () => {
  const [memberId, setMemberId] = useState('');
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const Src = import.meta.env.VITE_Src;
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    const formattedDay = day < 10 ? `0${day}` : day.toString();
    
    return `${formattedDay} ${month} ${year}`;
  };

  const columns = [
    {
      title: 'Member ID',
      dataIndex: 'member',
      key: 'member',
      render: (text) => (
        <span>
          {text}
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(text);
              notification.success({ message: 'Copied to clipboard!' });
            }}
          />
        </span>
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Membership',
      dataIndex: 'membership',
      key: 'membership',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
        title: 'Activation Date',
        dataIndex: 'activationDate',
        key: 'activationDate',
        render: (value) => (value === "0" ? 'Not Activated' : value),
      },
      
    {
      title: 'Join Date',
      dataIndex: 'date_of_joining',
      key: 'date_of_joining',
      render: (text) => formatDate(text),
    },
  ];

  const fetchTeamData = async () => {
    if (!memberId) {
      notification.error({ message: 'Please enter a Member ID' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${Src}/api/auth/getTeamList`, { member_id: memberId });
      
      if (response.data.success) {
        const groupedData = response.data.teamMembers.reduce((acc, member) => {
          (acc[member.level] = acc[member.level] || []).push(member);
          return acc;
        }, {});

        setTeamData(Object.entries(groupedData).map(([level, members]) => ({
          level,
          members,
          count: members.length
        })));
        
        setError(null);
      } else {
        notification.warning({ message: response.data.message });
        setTeamData([]);
      }
    } catch (err) {
      notification.error({ 
        message: 'No team data',
        description: err.response?.data?.message || 'Please check the Member ID and try again'
      });
      setTeamData([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <Title level={3} style={{ margin: 0 }}>
          Team Hierarchy Viewer
        </Title>
      }
      style={{ 
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        background: 'linear-gradient(145deg, #f0f2f5 0%, #ffffff 100%)',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Input
          placeholder="Enter Member ID (e.g., UP100070)"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          style={{ width: 300, marginRight: 16 }}
          onPressEnter={fetchTeamData}
          suffix={<SearchOutlined />}
        />
        <Button 
          type="primary" 
          onClick={fetchTeamData}
          loading={loading}
          style={{ borderRadius: 6 }}
        >
          Search Team
        </Button>
      </div>

      <Spin spinning={loading} tip="Loading team hierarchy...">
        {teamData.length > 0 ? (
          <Collapse accordion bordered={false} ghost>
            {teamData.sort((a, b) => a.level - b.level).map(({ level, members, count }) => (
              <Panel
                key={level}
                header={
                  <span style={{ fontWeight: 600 }}>
                    Level {level} ({count} members)
                  </span>
                }
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  marginBottom: 8,
                  border: '1px solid #f0f0f0',
                }}
              >
                <Table
                  columns={columns}
                  dataSource={members}
                  rowKey="member"
                  pagination={false}
                  size="small"
                  bordered
                  scroll={{ x: true }}
                  style={{ margin: '8px 0' }}
                />
              </Panel>
            ))}
          </Collapse>
        ) : (
          !loading && (
            <Card style={{ textAlign: 'center', background: 'transparent' }}>
              <Title level={4} type="secondary">
                {error ? 'No team members found for this ID' : 'Enter a Member ID to view team hierarchy'}
              </Title>
            </Card>
          )
        )}
      </Spin>
    </Card>
  );
};

export default TeamHierarchy;


// import { useState, useEffect } from 'react';
// import { Card, Popover, Spin, notification } from 'antd';
// import axios from 'axios';

// const Src = import.meta.env.VITE_Src;

// const TreeNode = ({ memberId, level = 0 }) => {
//   const [directs, setDirects] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [expanded, setExpanded] = useState(false);
//   const [nodeDetails, setNodeDetails] = useState(null);

//   const fetchDirects = async () => {
//     if (expanded && directs.length > 0) {
//       setExpanded(false);
//       return;
//     }
    
//     setLoading(true);
//     try {
//       const response = await axios.post(`${Src}/api/auth/getDirectMemberList`, { member_id: memberId });
//       if (response.data.success) {
//         setDirects(response.data.directMember);
//         setExpanded(true);
        
//         // Store first node details for popover
//         if (response.data.directMember.length > 0) {
//           const firstMember = response.data.directMember[0];
//           setNodeDetails({
//             username: firstMember.username,
//             membership: firstMember.membership,
//             date_of_joining: new Date(firstMember.date_of_joining).toLocaleDateString()
//           });
//         }
//       } else {
//         notification.info({ message: response.data.message });
//       }
//     } catch (error) {
//       notification.error({ message: 'Error fetching members' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const popoverContent = (
//     <div style={{ padding: 8, maxWidth: 200 }}>
//       <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Member ID: {memberId}</p>
//       {nodeDetails && (
//         <>
//           <p style={{ margin: '4px 0' }}>Username: {nodeDetails.username}</p>
//           <p style={{ margin: '4px 0' }}>Membership: {nodeDetails.membership}</p>
//           <p style={{ margin: '4px 0' }}>Joined: {nodeDetails.date_of_joining}</p>
//         </>
//       )}
//     </div>
//   );

//   return (
//     <div style={{ position: 'relative' }}>
//       <div className="node-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//         <Popover 
//           content={popoverContent}
//           trigger="hover"
//           placement="right"
//         >
//           <div
//             style={{
//               padding: '10px 16px',
//               border: '2px solid #1890ff',
//               borderRadius: 8,
//               background: 'linear-gradient(to bottom, #ffffff, #f0f5ff)',
//               cursor: 'pointer',
//               margin: '10px 0',
//               width: 120,
//               textAlign: 'center',
//               boxShadow: '0 2px 6px rgba(24, 144, 255, 0.2)',
//               position: 'relative',
//               zIndex: 2,
//               fontWeight: 'bold',
//               color: '#1890ff'
//             }}
//             onClick={fetchDirects}
//           >
//             {memberId}
//             {directs.length === 0 ? (
//               <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10 }}>
//                 {loading ? '' : '▶'}
//               </span>
//             ) : (
//               <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10 }}>
//                 {expanded ? '▼' : '▶'}
//               </span>
//             )}
//           </div>
//         </Popover>

//         {loading && <Spin size="small" style={{ position: 'absolute', top: 20, right: -20 }} />}

//         {expanded && directs.length > 0 && (
//           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
//             {/* Vertical connecting line from parent to children container */}
//             <div style={{ 
//               width: 2, 
//               height: 20, 
//               backgroundColor: '#1890ff',
//               opacity: 0.6
//             }}></div>
            
//             {/* Children container */}
//             <div style={{ 
//               display: 'flex', 
//               justifyContent: 'center',
//               gap: 40,
//               position: 'relative',
//               paddingTop: 0
//             }}>
//               {/* Horizontal line connecting all children */}
//               {directs.length > 1 && (
//                 <div style={{ 
//                   position: 'absolute',
//                   top: 0, 
//                   left: 0, 
//                   right: 0, 
//                   height: 2, 
//                   backgroundColor: '#1890ff',
//                   opacity: 0.6
//                 }}></div>
//               )}
              
//               {/* Render child nodes */}
//               {directs.map((member, index) => (
//                 <div key={member.member} style={{ 
//                   display: 'flex', 
//                   flexDirection: 'column', 
//                   alignItems: 'center',
//                   position: 'relative'
//                 }}>
//                   {/* Vertical line to each child */}
//                   <div style={{ 
//                     width: 2, 
//                     height: 20, 
//                     backgroundColor: '#1890ff',
//                     opacity: 0.6
//                   }}></div>
                  
//                   <TreeNode 
//                     memberId={member.member} 
//                     level={level + 1}
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// const MemberTree = () => {
//   return (
//     <Card 
//       title="Member Hierarchy Tree" 
//       style={{ 
//         borderRadius: 12,
//         boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
//         minHeight: 500,
//         margin: 20,
//         overflow: 'auto'
//       }}
//       headStyle={{
//         backgroundColor: '#1890ff',
//         color: 'white',
//         fontWeight: 'bold',
//         fontSize: 18,
//         textAlign: 'center'
//       }}
//       bodyStyle={{
//         padding: 24,
//         display: 'flex',
//         justifyContent: 'center'
//       }}
//     >
//       <div style={{ overflowX: 'auto', paddingBottom: 40, paddingTop: 20 }}>
//         <TreeNode memberId="UP100010" />
//       </div>
//     </Card>
//   );
// };

// export default MemberTree;