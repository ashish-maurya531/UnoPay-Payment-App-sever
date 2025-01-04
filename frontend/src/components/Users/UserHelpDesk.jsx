import { Card, Modal, Row, Col, Input, Button, notification, Typography, Spin } from 'antd';
import { useEffect, useState } from 'react';
import axios from 'axios';

const { TextArea } = Input;
const { Title, Text } = Typography;

export default function UserChatSystem() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch all users with tickets
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get('http://localhost:3000/api/auth/get-all-the-users');
      setUsers(response.data); // Adjust based on your API response structure
    } catch (error) {
      console.error('Error fetching users:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch users.',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const openChatModal = async (memberId, ticketId) => {
    setSelectedUser({ memberId, ticketId });
    setIsModalVisible(true);
    await fetchChats(memberId, ticketId);
  };

  const fetchChats = async (memberId, ticketId) => {
    try {
      setLoadingChats(true);
      const response = await axios.post('http://localhost:3000/api/auth/get-user-admin-chat', {
        member_id: memberId,
        ticket_id: ticketId,
      });
      setChats(response.data); // Adjust based on your API response structure
    } catch (error) {
      console.error('Error fetching chats:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch chat history.',
      });
    } finally {
      setLoadingChats(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { memberId, ticketId } = selectedUser;
      await axios.post('http://localhost:3000/api/auth/send-message', {
        member_id: memberId,
        ticket_id: ticketId,
        message_by: 'admin',
        message: newMessage,
      });

      setChats([...chats, { message_by: 'admin', message: newMessage, created_at: new Date().toISOString() }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to send message.',
      });
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
    setChats([]);
  };

  const handleRefreshChats = () => {
    const { memberId, ticketId } = selectedUser;
    fetchChats(memberId, ticketId); // Refresh the chat history
  };

  return (
    <div style={{ padding: '20px' }}>
      <Title level={4}>User Tickets</Title>
      <Spin spinning={loadingUsers}>
        <Row gutter={[16, 16]}>
          {users.map((user) => (
            <Col key={user.ticket_id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                onClick={() => openChatModal(user.member_id, user.ticket_id)}
                title={`Member ID: ${user.member_id}`}
              >
                <Text>Ticket ID: {user.ticket_id}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Modal
        title={`Chat with Member ID: ${selectedUser?.memberId}`}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px', padding: '10px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
          {loadingChats ? (
            <Spin />
          ) : chats.length > 0 ? (
            chats.map((chat, index) => (
              <div
                key={index}
                style={{
                  textAlign: chat.message_by === 'admin' ? 'right' : 'left',
                  margin: '10px 0',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '8px 12px',
                    backgroundColor: chat.message_by === 'admin' ? '#f5f5f5' : '#e6f7ff',
                    borderRadius: '8px',
                    maxWidth: '70%',
                  }}
                >
                  <Text>{chat.message}</Text>
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#888' }}>
                  {new Date(chat.created_at).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <Text type="secondary">No messages yet.</Text>
          )}
        </div>
        <TextArea
          rows={4}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
        />
        <Button
          type="primary"
          style={{ marginTop: '10px' }}
          onClick={sendMessage}
          block
        >
          Send
        </Button>
        <Button
          type="default"
          style={{ marginTop: '10px', marginLeft: '10px' }}
          onClick={handleRefreshChats}
          block
        >
          Refresh Chats
        </Button>
      </Modal>
    </div>
  );
}
