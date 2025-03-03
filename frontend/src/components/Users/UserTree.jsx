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

//2nd varint 
// import { useState, useEffect, useRef } from 'react';
// import { Card, Popover, Spin, notification, Input } from 'antd';
// import { SearchOutlined } from '@ant-design/icons';
// import axios from 'axios';

// const Src = import.meta.env.VITE_Src;

// // Generate a color based on the member ID for consistent coloring
// const getMemberColor = (memberId) => {
//   // Extract the numeric part and use it to generate a hue
//   const numericPart = parseInt(memberId.replace(/\D/g, ''));
//   const hue = (numericPart % 10) * 36; // Spread across 10 different hues
//   return `hsl(${hue}, 70%, 60%)`;
// };

// const TreeNode = ({ 
//   memberId, 
//   level = 0, 
//   searchTerm = "", 
//   autoExpand = true,
//   highlightedId = null,
//   onNodeFound = () => {}
// }) => {
//   const [directs, setDirects] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [expanded, setExpanded] = useState(autoExpand);
//   const [nodeDetails, setNodeDetails] = useState(null);
//   const nodeRef = useRef(null);
//   const isHighlighted = memberId === highlightedId;

//   // Check if this node matches the search term
//   useEffect(() => {
//     if (searchTerm && memberId.toLowerCase().includes(searchTerm.toLowerCase())) {
//       onNodeFound(memberId);
//     }
//   }, [searchTerm, memberId, onNodeFound]);

//   // Scroll into view if this node is highlighted
//   useEffect(() => {
//     if (isHighlighted && nodeRef.current) {
//       nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
//     }
//   }, [isHighlighted]);

//   // Fetch direct members on component mount if autoExpand is true
//   useEffect(() => {
//     if (autoExpand) {
//       fetchDirects();
//     }
//   }, []);

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
        
//         // Store node details for popover
//         if (response.data.directMember.length > 0) {
//           const firstMember = response.data.directMember[0];
//           setNodeDetails({
//             username: firstMember.username,
//             membership: firstMember.membership,
//             date_of_joining: new Date(firstMember.date_of_joining).toLocaleDateString()
//           });
//         }
//       } else {
//         // Only show notification if not auto-expanding
//         if (!autoExpand) {
//           notification.info({ message: response.data.message });
//         }
//       }
//     } catch (error) {
//       // Only show notification if not auto-expanding
//       if (!autoExpand) {
//         notification.error({ message: 'Error fetching members' });
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const nodeColor = getMemberColor(memberId);
  
//   const popoverContent = (
//     <div style={{ padding: 8, maxWidth: 200 }}>
//       <p style={{ margin: '4px 0', fontWeight: 'bold', fontSize: 12 }}>Member ID: {memberId}</p>
//       {nodeDetails && (
//         <>
//           <p style={{ margin: '4px 0', fontSize: 12 }}>Username: {nodeDetails.username}</p>
//           <p style={{ margin: '4px 0', fontSize: 12 }}>Membership: {nodeDetails.membership}</p>
//           <p style={{ margin: '4px 0', fontSize: 12 }}>Joined: {nodeDetails.date_of_joining}</p>
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
//             ref={nodeRef}
//             style={{
//               padding: '6px 10px',
//               border: isHighlighted ? '2px solid #ff4d4f' : `2px solid ${nodeColor}`,
//               borderRadius: 6,
//               background: isHighlighted ? '#fff1f0' : `linear-gradient(to bottom, #ffffff, ${nodeColor}20)`,
//               cursor: 'pointer',
//               margin: '8px 0',
//               width: 90,
//               textAlign: 'center',
//               boxShadow: isHighlighted ? '0 0 8px #ff4d4f' : `0 2px 4px ${nodeColor}40`,
//               position: 'relative',
//               zIndex: 2,
//               fontWeight: isHighlighted ? 'bold' : 'normal',
//               color: isHighlighted ? '#ff4d4f' : nodeColor,
//               fontSize: 12,
//               transition: 'all 0.3s ease'
//             }}
//             onClick={fetchDirects}
//           >
//             {memberId}
//             {directs.length === 0 ? (
//               <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 8 }}>
//                 {loading ? '' : '▶'}
//               </span>
//             ) : (
//               <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 8 }}>
//                 {expanded ? '▼' : '▶'}
//               </span>
//             )}
//           </div>
//         </Popover>

//         {loading && <Spin size="small" style={{ position: 'absolute', top: 14, right: -16 }} />}

//         {expanded && directs.length > 0 && (
//           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
//             {/* Vertical connecting line from parent to children container */}
//             <div style={{ 
//               width: 2, 
//               height: 16, 
//               backgroundColor: nodeColor,
//               opacity: 0.6,
            
//             }}></div>
            
//             {/* Children container */}
//             <div style={{ 
//               display: 'flex', 
//               justifyContent: 'center',
//               gap: 20, // Reduced gap between nodes
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
//                   backgroundColor: nodeColor,
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
//                     height: 16, 
//                     backgroundColor: nodeColor,
//                     opacity: 0.6
//                   }}></div>
                  
//                   <TreeNode 
//                     memberId={member.member} 
//                     level={level + 1}
//                     searchTerm={searchTerm}
//                     autoExpand={autoExpand}
//                     highlightedId={highlightedId}
//                     onNodeFound={onNodeFound}
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
//   const [searchTerm, setSearchTerm] = useState("");
//   const [highlightedId, setHighlightedId] = useState(null);
//   const treeContainerRef = useRef(null);

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//     if (!e.target.value) {
//       setHighlightedId(null);
//     }
//   };

//   const handleNodeFound = (memberId) => {
//     setHighlightedId(memberId);
//   };

//   return (
//     <Card 
//       title="Member Hierarchy Tree" 
//       style={{ 
//         borderRadius: 12,
//         boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
//         minHeight: 500,
//         margin: 20,
//         overflow: 'hidden', // Changed to hidden to prevent double scrollbars
//       }}
//       headStyle={{
//         backgroundColor: '#1890ff',
//         color: 'white',
//         fontWeight: 'bold',
//         fontSize: 16,
//         textAlign: 'center',
//         padding: '8px 16px'
//       }}
//       bodyStyle={{
//         padding: 16,
//         display: 'flex',
//         flexDirection: 'column'
//       }}
//       extra={
//         <Input 
//           placeholder="Search member ID" 
//           prefix={<SearchOutlined />} 
//           style={{ width: 200, fontSize: 12 }}
//           onChange={handleSearch}
//           allowClear
//         />
//       }
//     >
//       <div 
//         ref={treeContainerRef}
//         style={{ 
//           overflowX: 'auto', 
//           overflowY: 'auto', 
//           paddingBottom: 40, 
//           paddingTop: 20,
//           paddingLeft: 20,
//           paddingRight: 20,
//           display: 'flex',
//           justifyContent: 'center',
//           width: '100%',
//           height: '100%',
//           minHeight: 400
//         }}
//       >
//         <TreeNode 
//           memberId="UP100010" 
//           searchTerm={searchTerm}
//           autoExpand={true}
//           highlightedId={highlightedId}
//           onNodeFound={handleNodeFound}
//         />
//       </div>
//     </Card>
//   );
// };

// export default MemberTree;




// import { useState, useEffect, useRef } from 'react';
// import { Card, Popover, Spin, notification, Input } from 'antd';
// import { SearchOutlined } from '@ant-design/icons';
// import axios from 'axios';

// const Src = import.meta.env.VITE_Src;

// // Generate a color based on the member ID for consistent coloring
// const getMemberColor = (memberId) => {
//   // Extract the numeric part and use it to generate a hue
//   const numericPart = parseInt(memberId.replace(/\D/g, ''));
//   const hue = (numericPart % 10) * 36; // Spread across 10 different hues
//   return `hsl(${hue}, 70%, 60%)`;
// };

// const TreeNode = ({ 
//   memberId, 
//   level = 0, 
//   searchTerm = "", 
//   autoExpand = true,
//   highlightedId = null,
//   onNodeFound = () => {},
//   onExpandComplete = () => {}
// }) => {
//   const [directs, setDirects] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [expanded, setExpanded] = useState(autoExpand);
//   const [nodeDetails, setNodeDetails] = useState(null);
//   const [expandedCount, setExpandedCount] = useState(0);
//   const nodeRef = useRef(null);
//   const isHighlighted = memberId === highlightedId;

//   // Check if this node matches the search term
//   useEffect(() => {
//     if (searchTerm && memberId.toLowerCase().includes(searchTerm.toLowerCase())) {
//       onNodeFound(memberId);
//     }
//   }, [searchTerm, memberId, onNodeFound]);

//   // Scroll into view if this node is highlighted
//   useEffect(() => {
//     if (isHighlighted && nodeRef.current) {
//       nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
//     }
//   }, [isHighlighted]);

//   // Fetch direct members on component mount if autoExpand is true
//   useEffect(() => {
//     if (autoExpand) {
//       fetchDirects();
//     }
//   }, []);

//   // Track expanded children and notify parent when all are expanded
//   useEffect(() => {
//     if (expandedCount === directs.length && directs.length > 0) {
//       onExpandComplete();
//     }
//   }, [expandedCount, directs.length]);

//   const handleChildExpanded = () => {
//     setExpandedCount(prev => prev + 1);
//   };

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
//         setExpandedCount(0); // Reset expanded count for new children
        
//         // Store node details for popover
//         if (response.data.directMember.length > 0) {
//           const firstMember = response.data.directMember[0];
//           setNodeDetails({
//             username: firstMember.username,
//             membership: firstMember.membership,
//             date_of_joining: new Date(firstMember.date_of_joining).toLocaleDateString()
//           });
//         }
        
//         // If no children to expand, notify parent we're done expanding
//         if (response.data.directMember.length === 0) {
//           onExpandComplete();
//         }
//       } else {
//         // Only show notification if not auto-expanding
//         if (!autoExpand) {
//           notification.info({ message: response.data.message });
//         }
//         onExpandComplete(); // Still need to notify parent even if no children
//       }
//     } catch (error) {
//       // Only show notification if not auto-expanding
//       if (!autoExpand) {
//         notification.error({ message: 'Error fetching members' });
//       }
//       onExpandComplete(); // Still need to notify parent even if error
//     } finally {
//       setLoading(false);
//     }
//   };

//   const nodeColor = getMemberColor(memberId);
  
//   const popoverContent = (
//     <div style={{ padding: 8, maxWidth: 200 }}>
//       <p style={{ margin: '4px 0', fontWeight: 'bold', fontSize: 12 }}>Member ID: {memberId}</p>
      

      
//       {nodeDetails && (
//         <>
//           <p style={{ margin: '4px 0', fontSize: 12 }}>Username: {nodeDetails.username}</p>
//           <p style={{ margin: '4px 0', fontSize: 12 }}>Membership: {nodeDetails.membership}</p>
//           <p style={{ margin: '4px 0', fontSize: 12 }}>Joined: {nodeDetails.date_of_joining}</p>
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
//             ref={nodeRef}
//             style={{
//               padding: '6px 10px',
//               border: isHighlighted ? '2px solid #ff4d4f' : `2px solid ${nodeColor}`,
//               borderRadius: 6,
//               background: isHighlighted ? '#fff1f0' : `linear-gradient(to bottom, #ffffff, ${nodeColor}20)`,
//               cursor: 'pointer',
//               margin: '8px 0',
//               width: 90,
//               textAlign: 'center',
//               boxShadow: isHighlighted ? '0 0 8px #ff4d4f' : `0 2px 4px ${nodeColor}40`,
//               position: 'relative',
//               zIndex: 2,
//               fontWeight: isHighlighted ? 'bold' : 'normal',
//               color: isHighlighted ? '#ff4d4f' : nodeColor,
//               fontSize: 12,
//               transition: 'all 0.3s ease'
//             }}
//             onClick={fetchDirects}
//           >
//             {memberId}
//             {directs.length === 0 ? (
//               <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 8 }}>
//                 {loading ? '' : '▶'}
//               </span>
//             ) : (
//               <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 8 }}>
//                 {expanded ? '▼' : '▶'}
//               </span>
//             )}
//           </div>
//         </Popover>

//         {loading && <Spin size="small" style={{ position: 'absolute', top: 14, right: -16 }} />}

//         {expanded && directs.length > 0 && (
//           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
//             {/* Vertical connecting line from parent to children container */}
//             <div style={{ 
//               width: 2, 
//               height: 16, 
//               backgroundColor: nodeColor,
//               opacity: 0.6
//             }}></div>
            
//             {/* Children container */}
//             <div style={{ 
//               display: 'flex', 
//               justifyContent: 'center',
//               gap: 20, // Reduced gap between nodes
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
//                   backgroundColor: nodeColor,
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
//                     height: 16, 
//                     backgroundColor: nodeColor,
//                     opacity: 0.6
//                   }}></div>
                  
//                   <TreeNode 
//                     memberId={member.member} 
//                     level={level + 1}
//                     searchTerm={searchTerm}
//                     autoExpand={autoExpand}
//                     highlightedId={highlightedId}
//                     onNodeFound={onNodeFound}
//                     onExpandComplete={handleChildExpanded}
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
//   const [searchTerm, setSearchTerm] = useState("");
//   const [highlightedId, setHighlightedId] = useState(null);
//   const [treeFullyExpanded, setTreeFullyExpanded] = useState(false);
//   const treeContainerRef = useRef(null);
//   const treeWrapperRef = useRef(null);

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//     if (!e.target.value) {
//       setHighlightedId(null);
//     }
//   };

//   const handleNodeFound = (memberId) => {
//     setHighlightedId(memberId);
//   };

//   const handleRootExpanded = () => {
//     setTreeFullyExpanded(true);
//   };

//   // Center the tree after it's completely expanded
//   useEffect(() => {
//     if (treeFullyExpanded && treeWrapperRef.current && treeContainerRef.current) {
//       // Add padding to ensure scrollability to extremes
//       const treeWrapper = treeWrapperRef.current;
//       const treeContainer = treeContainerRef.current;
      
//       // Calculate the total width the tree might need
//       const contentWidth = treeContainer.scrollWidth;
//       const containerWidth = treeWrapper.clientWidth;
      
//       // Set minimum padding to ensure we can scroll all the way
//       const minPadding = Math.max(contentWidth / 2, containerWidth / 2);
      
//       // Apply the padding
//       treeContainer.style.paddingLeft = `${minPadding}px`;
//       treeContainer.style.paddingRight = `${minPadding}px`;
      
//       // Scroll to center initially
//       treeWrapper.scrollLeft = (treeContainer.scrollWidth - treeWrapper.clientWidth) / 2;
//     }
//   }, [treeFullyExpanded]);

//   return (
//     <Card 
//       title="Member Hierarchy Tree" 
//       style={{ 
//         borderRadius: 12,
//         boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
//         minHeight: 500,
//         margin: 20
//       }}
//       headStyle={{
//         backgroundColor: '#1890ff',
//         color: 'white',
//         fontWeight: 'bold',
//         fontSize: 16,
//         textAlign: 'center',
//         padding: '8px 16px'
//       }}
//       bodyStyle={{
//         padding: 16,
//         display: 'flex',
//         flexDirection: 'column',
//         height: 'calc(100% - 56px)', // Subtract header height
//         overflow: 'hidden' // Prevent double scrollbars
//       }}
//       extra={
//         <Input 
//           placeholder="Search member ID" 
//           prefix={<SearchOutlined />} 
//           style={{ width: 200, fontSize: 12 }}
//           onChange={handleSearch}
//           allowClear
//         />
//       }
//     >
//       <div 
//         ref={treeWrapperRef}
//         style={{ 
//           width: '100%',
//           height: '100%',
//           overflowX: 'auto',
//           overflowY: 'auto',
//           position: 'relative'
//         }}
//       >
//         <div 
//           ref={treeContainerRef}
//           style={{ 
//             paddingTop: 20,
//             paddingBottom: 40,
//             minHeight: 400,
//             display: 'inline-flex', // Use inline-flex to allow container to grow with content
//             justifyContent: 'center',
//             margin: '0 auto', // Center the tree horizontally
//             minWidth: '100%', // Ensure minimum width
//             position: 'relative'
//           }}
//         >
//           <TreeNode 
//             memberId="UP100010" 
//             searchTerm={searchTerm}
//             autoExpand={true}
//             highlightedId={highlightedId}
//             onNodeFound={handleNodeFound}
//             onExpandComplete={handleRootExpanded}
//           />
//         </div>
//       </div>
//     </Card>
//   );
// };

// export default MemberTree;






import { useState, useEffect, useRef } from 'react';
import { Card, Popover, Spin, notification, Input, Button } from 'antd';
import { SearchOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import axios from 'axios';

const Src = import.meta.env.VITE_Src;

// Get membership color
const getMembershipColor = (membership) => {
  if (!membership) return '#000000';
  
  const membershipLower = membership.toLowerCase();
  if (membershipLower === 'free') return 'green';
  if (membershipLower === 'basic') return '#ff8c00'; // Orange
  if (membershipLower === 'premium') return '#1890ff'; // Blue
  
  return '#000000'; // Default to black for unknown memberships
};

// Get level color for connecting lines
const getLevelColor = (level) => {
  const colors = [
    '#ff4d4f', // Level 0 - Red (root)
    '#52c41a', // Level 1 - Green
    '#1890ff', // Level 2 - Blue
    '#722ed1', // Level 3 - Purple
    '#fa8c16', // Level 4 - Orange
    '#eb2f96', // Level 5 - Pink
    '#13c2c2', // Level 6 - Cyan
    '#2f54eb', // Level 7 - Geekblue
    '#722ed1', // Level 8 - Purple
    '#fa541c', // Level 9 - Volcano
    '#faad14', // Level 10 - Gold
    '#525252', // Level 11 - Grey
    '#f5222d', // Level 12 - Red
    '#3f51b5', // Level 13 - Cyan
    '#009688', // Level 14 - Teal
  ];
  
  return colors[level % colors.length];
};

const TreeNode = ({ 
  memberId, 
  nodeData = null, // Added parameter to receive parent node data
  level = 0, 
  searchTerm = "", 
  autoExpand = true,
  maxAutoExpandLevel = 3,
  highlightedId = null,
  onNodeFound = () => {},
  onExpandComplete = () => {},
  onLoadNextLevels = () => {} // Added callback for load next levels
}) => {
  const [directs, setDirects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(autoExpand && level < maxAutoExpandLevel);
  const [nodeDetails, setNodeDetails] = useState(nodeData); // Use parent data if provided
  const [expandedCount, setExpandedCount] = useState(0);
  const [username, setUsername] = useState(nodeData?.username || '');
  const [membership, setMembership] = useState(nodeData?.membership || '');
  const nodeRef = useRef(null);
  const isHighlighted = memberId === highlightedId;
  const isRootNode = memberId === 'UP100010';
  const [childrenExpanded, setChildrenExpanded] = useState(false);

  // Check if this node matches the search term
  useEffect(() => {
    if (searchTerm && memberId.toLowerCase().includes(searchTerm.toLowerCase())) {
      onNodeFound(memberId);
    }
  }, [searchTerm, memberId, onNodeFound]);

  // Scroll into view if this node is highlighted
  useEffect(() => {
    if (isHighlighted && nodeRef.current) {
      nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  // Fetch direct members on component mount if autoExpand is true and level is within max level
  useEffect(() => {
    if (autoExpand && level < maxAutoExpandLevel) {
      fetchDirects();
    }
  }, [maxAutoExpandLevel]); // Re-run when maxAutoExpandLevel changes

  // Track expanded children and notify parent when all are expanded
  useEffect(() => {
    if (expandedCount === directs.length && directs.length > 0) {
      onExpandComplete();
      setChildrenExpanded(true);
    }
  }, [expandedCount, directs.length]);

  const handleChildExpanded = () => {
    setExpandedCount(prev => prev + 1);
  };

  const fetchDirects = async () => {
    if (expanded && directs.length > 0) {
      setExpanded(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${Src}/api/auth/getDirectMemberList`, { member_id: memberId });
      if (response.data.success) {
        // Get member details from the response if available
        if (!nodeDetails && response.data.memberDetails) {
          // Use the current node's details from the response
          const currentMember = response.data.memberDetails;
          setNodeDetails({
            username: currentMember.username,
            membership: currentMember.membership,
            date_of_joining: new Date(currentMember.date_of_joining).toLocaleDateString(),
            level: level
          });
          
          // Set username and membership for display
          setUsername(currentMember.username);
          setMembership(currentMember.membership);
        }
        
        // Store the direct members with their details
        setDirects(response.data.directMember.map(member => ({
          ...member,
          // Include the member details for each direct member
          nodeData: {
            username: member.username,
            membership: member.membership,
            date_of_joining: member.date_of_joining,
            level: level + 1
          }
        })));
        
        setExpanded(true);
        setExpandedCount(0); // Reset expanded count for new children
                
        // If no children to expand, notify parent we're done expanding
        if (response.data.directMember.length === 0) {
          onExpandComplete();
        }
      } else {
        // Only show notification if not auto-expanding
        if (!autoExpand || level >= maxAutoExpandLevel) {
          notification.info({ message: response.data.message });
        }
        onExpandComplete(); // Still need to notify parent even if no children
      }
    } catch (error) {
      // Only show notification if not auto-expanding
      if (!autoExpand || level >= maxAutoExpandLevel) {
        notification.error({ message: 'Error fetching members' });
      }
      onExpandComplete(); // Still need to notify parent even if error
    } finally {
      setLoading(false);
    }
  };

  // Get node color based on membership or root status
  const nodeColor = isRootNode ? '#ff4d4f' : getMembershipColor(membership);
  
  // Get line color based on level
  const lineColor = getLevelColor(level);
  
  const popoverContent = (
    <div style={{ padding: 8, maxWidth: 200 }}>
      <p style={{ margin: '4px 0', fontWeight: 'bold', fontSize: 12 }}>Member ID: {memberId}</p>
      {nodeDetails && (
        <>
          <p style={{ margin: '4px 0', fontSize: 12 }}>Username: {nodeDetails.username}</p>
          <p style={{ margin: '4px 0', fontSize: 12 }}>Membership: {nodeDetails.membership}</p>
          <p style={{ margin: '4px 0', fontSize: 12 }}>Joined: {nodeDetails.date_of_joining}</p>
          <p style={{ margin: '4px 0', fontSize: 12 }}>Level: {nodeDetails.level}</p>
        </>
      )}
    </div>
  );

  // Determine if this node should be auto-expanded based on new max level
  const shouldAutoExpand = level < maxAutoExpandLevel && !expanded && !childrenExpanded;
  
  // Check for auto-expand when maxAutoExpandLevel increases
  useEffect(() => {
    if (shouldAutoExpand) {
      fetchDirects();
    }
  }, [shouldAutoExpand]);

  return (
    <div style={{ position: 'relative' }}>
      <div className="node-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Popover 
          content={popoverContent}
          trigger="hover"
          placement="right"
          overlayStyle={{ zIndex: 1000 - level }} // Lower z-index for deeper levels to prevent overlap
        >
          <div
            ref={nodeRef}
            style={{
              padding: '6px 10px',
              border: isHighlighted ? '2px solid #ff4d4f' : `2px solid ${nodeColor}`,
              borderRadius: 6,
              background: isHighlighted ? '#fff1f0' : `linear-gradient(to bottom, #ffffff, ${nodeColor}20)`,
              cursor: 'pointer',
              margin: '8px 0',
              width: username ? 140 : 110, // Make wider if we have username
              textAlign: 'center',
              boxShadow: isHighlighted ? '0 0 8px #ff4d4f' : `0 2px 4px ${nodeColor}40`,
              position: 'relative',
              zIndex: 2,
              fontWeight: isHighlighted ? 'bold' : 'normal',
              color: isHighlighted ? '#ff4d4f' : nodeColor,
              fontSize: 12,
              transition: 'all 0.3s ease'
            }}
            onClick={fetchDirects}
          >
            <div>{memberId}</div>
            {username && <div style={{ fontSize: 10, marginTop: 2 }}>{username}</div>}
            <div style={{ fontSize: 9, marginTop: 2 }}>Level: {level}</div>
            
            {loading ? (
              <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 10 }}>
                <Spin size="small" />
              </span>
            ) : (
              <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 10 }}>
                {expanded ? <DownOutlined /> : <RightOutlined />}
              </span>
            )}
          </div>
        </Popover>

        {expanded && directs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* Vertical connecting line from parent to children container */}
            <div style={{ 
              width: 2, 
              height: 16, 
              backgroundColor: lineColor,
              opacity: 0.8
            }}></div>
            
            {/* Children container */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: 20, // Gap between nodes
              position: 'relative',
              paddingTop: 0,
              minWidth: directs.length * 150 // Ensure enough space for all children
            }}>
              {/* Horizontal line connecting all children */}
              {directs.length > 1 && (
                <div style={{ 
                  position: 'absolute',
                  top: 0, 
                  left: `${(directs.length > 1 ? 20 : 0)}px`, 
                  right: `${(directs.length > 1 ? 20 : 0)}px`, 
                  height: 2, 
                  backgroundColor: lineColor,
                  opacity: 0.8
                }}></div>
              )}
              
              {/* Render child nodes */}
              {directs.map((member, index) => (
                <div key={member.member} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  position: 'relative'
                }}>
                  {/* Vertical line to each child */}
                  <div style={{ 
                    width: 2, 
                    height: 16, 
                    backgroundColor: lineColor,
                    opacity: 0.8
                  }}></div>
                  
                  <TreeNode 
                    memberId={member.member} 
                    nodeData={member.nodeData} // Pass the member details
                    level={level + 1}
                    searchTerm={searchTerm}
                    autoExpand={autoExpand}
                    maxAutoExpandLevel={maxAutoExpandLevel}
                    highlightedId={highlightedId}
                    onNodeFound={onNodeFound}
                    onExpandComplete={handleChildExpanded}
                    onLoadNextLevels={onLoadNextLevels}
                  />
                </div>
              ))}
            </div>
            
            {/* Show "Load more" button for levels that exceed max auto-expand */}
            {level + 1 >= maxAutoExpandLevel && level % 3 === 0 && (
              <Button 
                type="dashed" 
                size="small" 
                style={{ marginTop: 16, fontSize: 11 }}
                onClick={() => {
                  // Actually trigger the load next levels action
                  onLoadNextLevels();
                }}
              >
                Load next 3 levels
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MemberTree = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedId, setHighlightedId] = useState(null);
  const [treeFullyExpanded, setTreeFullyExpanded] = useState(false);
  const [maxAutoExpandLevel, setMaxAutoExpandLevel] = useState(3);
  const treeContainerRef = useRef(null);
  const treeWrapperRef = useRef(null);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (!e.target.value) {
      setHighlightedId(null);
    }
  };

  const handleNodeFound = (memberId) => {
    setHighlightedId(memberId);
  };

  const handleRootExpanded = () => {
    setTreeFullyExpanded(true);
  };

  // Center the tree after it's completely expanded
  useEffect(() => {
    if (treeFullyExpanded && treeWrapperRef.current && treeContainerRef.current) {
      // Add padding to ensure scrollability to extremes
      const treeWrapper = treeWrapperRef.current;
      const treeContainer = treeContainerRef.current;
      
      // Calculate the total width the tree might need
      const contentWidth = treeContainer.scrollWidth;
      const containerWidth = treeWrapper.clientWidth;
      
      // Set minimum padding to ensure we can scroll all the way
      // Set minimum padding to ensure we can scroll all the way
      const minPadding = Math.max(contentWidth / 2, containerWidth / 2);
      
      // Apply the padding
      treeContainer.style.paddingLeft = `${minPadding}px`;
      treeContainer.style.paddingRight = `${minPadding}px`;
      
      // Scroll to center initially
      treeWrapper.scrollLeft = (treeContainer.scrollWidth - treeWrapper.clientWidth) / 2;
    }
  }, [treeFullyExpanded]);

  const handleExpandNextLevels = () => {
    setMaxAutoExpandLevel(prev => prev + 3);
    notification.info({ 
      message: 'Auto-expanding next 3 levels', 
      description: 'The tree will now expand to show 3 more levels of the hierarchy'
    });
  };

  const legendItems = [
    { name: 'Root Node', color: '#ff4d4f' },
    { name: 'Free Member', color: 'green' },
    { name: 'Basic Member', color: '#ff8c00' },
    { name: 'Premium Member', color: '#1890ff' },
  ];

  const lineLegendItems = [
    { name: 'Level 0', color: getLevelColor(0) },
    { name: 'Level 1', color: getLevelColor(1) },
    { name: 'Level 2', color: getLevelColor(2) },
    { name: 'Level 3', color: getLevelColor(3) },
    { name: 'Level 4', color: getLevelColor(4) },
    { name: 'Level 5', color: getLevelColor(5) },
    { name: 'Level 6', color: getLevelColor(6) },
    { name: 'Level 7', color: getLevelColor(7) },
    { name: 'Level 8', color: getLevelColor(8) },
    { name: 'Level 9', color: getLevelColor(9) },
    { name: 'Level 10', color: getLevelColor(10) },
    { name: 'Level 11', color: getLevelColor(11) },
    { name: 'Level 12', color: getLevelColor(12) },
    { name: 'Level 13', color: getLevelColor(13) },
    { name: 'Level 14', color: getLevelColor(14) },
    { name: 'Level 15', color: getLevelColor(15) },
    { name: 'Level 16', color: getLevelColor(16) },
    { name: 'Level 17', color: getLevelColor(17) },
    { name: 'Level 18', color: getLevelColor(18) },
    { name: 'Level 19', color: getLevelColor(19) },
    { name: 'Level 20', color: getLevelColor(20) },
   
  ];

  return (
    <Card 
      title="Member Hierarchy Tree" 
      style={{ 
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minHeight: 500,
        margin: 20
      }}
      headStyle={{
        backgroundColor: '#1890ff',
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
        padding: '8px 16px'
      }}
      bodyStyle={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100% - 56px)', // Subtract header height
        overflow: 'hidden' // Prevent double scrollbars
      }}
      extra={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Input 
            placeholder="Search member ID" 
            prefix={<SearchOutlined />}
            style={{ width: 200, fontSize: 12 }}
            onChange={handleSearch}
            allowClear
          />
          <Button 
            type="primary" 
            size="small"
            onClick={handleExpandNextLevels}
          >
            Expand Next 3 Levels
          </Button>
        </div>
      }
    >
      {/* Legend for node colors */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, gap: 16 }}>
        {legendItems.map(item => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: 2 }}></div>
            <span style={{ fontSize: 12 }}>{item.name}</span>
          </div>
        ))}
      </div>
      
      {/* Legend for line colors */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, gap: 16 }}>
        {lineLegendItems.map(item => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* <div style={{ width: 16, height: 2, backgroundColor: item.color }}></div> */}
            {/* <span style={{ fontSize: 10 }}>{item.name} Line</span> */}
          </div>
        ))}
      </div>
      
      <div 
        ref={treeWrapperRef}
        style={{ 
          width: '100%',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        <div 
          ref={treeContainerRef}
          style={{ 
            paddingTop: 20,
            paddingBottom: 40,
            minHeight: 400,
            display: 'inline-flex', // Use inline-flex to allow container to grow with content
            justifyContent: 'center',
            margin: '0 auto', // Center the tree horizontally
            minWidth: '100%', // Ensure minimum width
            position: 'relative'
          }}
        >
          <TreeNode 
            memberId="UP100010" 
            searchTerm={searchTerm}
            autoExpand={true}
            maxAutoExpandLevel={maxAutoExpandLevel}
            highlightedId={highlightedId}
            onNodeFound={handleNodeFound}
            onExpandComplete={handleRootExpanded}
            onLoadNextLevels={handleExpandNextLevels}
          />
        </div>
      </div>
    </Card>
  );
};

export default MemberTree;