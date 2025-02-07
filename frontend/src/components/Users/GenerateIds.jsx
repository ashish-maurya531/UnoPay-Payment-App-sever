import { Button, message } from 'antd';
import axios from 'axios';
const Src = import.meta.env.VITE_Src;
const token = localStorage.getItem('adminToken')||sessionStorage.removeItem('adminToken');


export default function GenerateIds() {
  const handleGenerateIds = async () => {
    try {
      const response = await axios.post(`${Src}/api/auth/generate-user-ids`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
      });
      if (response.data.success) {
        message.success('IDs generated successfully!');
      } else {
        message.error('Failed to generate IDs.');
      }
    } catch (error) {
      console.error('Error generating IDs:', error);
      message.error('An error occurred.');
    }
  };

  return (
    <div>
      <h2>Generate User IDs</h2>
      <Button onClick={handleGenerateIds} type="primary">
        Generate 10 User IDs
      </Button>
    </div>
  );
}

