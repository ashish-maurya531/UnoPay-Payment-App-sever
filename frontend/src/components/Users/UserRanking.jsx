// import { Table, notification, Row, Col, Tag, Input } from 'antd';
// import { useState, useEffect } from 'react';
// import axios from 'axios';

// const Src = import.meta.env.VITE_Src; // Assuming this is where your API URL is defined

// export default function RankList() {
//   const [rankData, setRankData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchText, setSearchText] = useState('');

//   useEffect(() => {
//     fetchRankData();
//   }, []);

//   const fetchRankData = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get('http://localhost:3000/api/auth/getAllUsersRank');
//       console.log(response);
//       setRankData(response?.data);
//     } catch (error) {
//       console.error('Error fetching rank data:', error);
//       notification.error({
//         message: 'Error',
//         description: 'Failed to fetch rank data.',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter rank data based on search text
//   const filteredData = rankData.filter(row =>
//     Object.values(row).some(value =>
//       value && value.toString().toLowerCase().includes(searchText.toLowerCase())
//     )
//   );

//   const columns = [
//     {
//       title: 'Sponsor ID',
//       dataIndex: 'sponser_id',
//       key: 'sponser_id',
//     },
//     {
//       title: 'Member ID',
//       dataIndex: 'member_id',
//       key: 'member_id',
//     },
//     {
//       title: 'Directs',
//       dataIndex: 'directs',
//       key: 'directs',
//     },
//     {
//       title: 'Active Directs',
//       dataIndex: 'active_directs',
//       key: 'active_directs',
//     },
//     {
//       title: 'Rank No.',
//       dataIndex: 'rank_no',
//       key: 'rank_no',
//     },
//     {
//       title: 'Active Directs List',
//       dataIndex: 'active_directs_list',
//       key: 'active_directs_list',
//       render: (text) => {
//         // Display the active directs list as a JSON string or in another readable format
//         return <pre>{JSON.stringify(text, null, 2)}</pre>;
//       },
//     },
//     {
//       title: 'Updated At',
//       dataIndex: 'updated_at',
//       key: 'updated_at',
//     },
//     {
//       title: 'OPAL',
//       dataIndex: 'OPAL',
//       key: 'OPAL',
//     },
//     {
//       title: 'TOPAZ',
//       dataIndex: 'TOPAZ',
//       key: 'TOPAZ',
//     },
//     {
//       title: 'JASPER',
//       dataIndex: 'JASPER',
//       key: 'JASPER',
//     },
//     {
//       title: 'ALEXANDER',
//       dataIndex: 'ALEXANDER',
//       key: 'ALEXANDER',
//     },
//     {
//       title: 'DIAMOND',
//       dataIndex: 'DIAMOND',
//       key: 'DIAMOND',
//     },
//     {
//       title: 'BLUE DIAMOND',
//       dataIndex: 'BLUE_DIAMOND',
//       key: 'BLUE_DIAMOND',
//     },
//     {
//       title: 'CROWN DIAMOND',
//       dataIndex: 'CROWN_DIAMOND',
//       key: 'CROWN_DIAMOND',
//     },
//   ];

//   return (
//     <>
//       <Row gutter={16} style={{ marginBottom: 16 }}>
//         <Col span={24}>
//           <Input.Search
//             placeholder="Search across all fields"
//             value={searchText}
//             onChange={(e) => setSearchText(e.target.value)}
//             style={{ width: '100%' }}
//             allowClear
//           />
//         </Col>
//       </Row>
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading}
//         pagination={{ pageSize: 10 }}
//         rowKey="member_id"
//         size="small"
//       />
//     </>
//   );
// }
