import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Tag, 
  Button, 
  Modal, 
  Image, 
  Spin, 
  message, 
  Select, 
  DatePicker,
  Popconfirm,
  Card,
  Typography
} from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { 
  getAllTactileRequests, 
  updateTactileRequestStatus, 
  deleteTactileRequest,
  isAdmin
} from '../services/appwriteService';

const { Title } = Typography;
const { Option } = Select;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const isUserAdmin = await isAdmin();
      if (!isUserAdmin) {
        message.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
        return;
      }
      loadRequests();
    };

    checkAdminAccess();
  }, [navigate]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const allRequests = await getAllTactileRequests();
      setRequests(allRequests);
    } catch (error) {
      message.error('Failed to load requests');
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (record) => {
    setSelectedRequest(record);
    setPreviewVisible(true);
  };

  const handleStatusChange = async (requestId, status, estimatedCompletionDate = null) => {
    try {
      setUpdatingStatus(true);
      await updateTactileRequestStatus(requestId, status, estimatedCompletionDate);
      message.success('Status updated successfully');
      loadRequests(); // Refresh the list
    } catch (error) {
      message.error('Failed to update status');
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (requestId) => {
    try {
      await deleteTactileRequest(requestId);
      message.success('Request deleted successfully');
      loadRequests(); // Refresh the list
    } catch (error) {
      message.error('Failed to delete request');
      console.error('Error deleting request:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusColors = {
      'Requested': 'blue',
      'In Progress': 'orange',
      'Completed': 'green',
      'Rejected': 'red'
    };
    return <Tag color={statusColors[status] || 'default'}>{status}</Tag>;
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      render: (_, record) => (
        <div>
          <div>{record.userName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.userEmail}</div>
        </div>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'imagePreview',
      key: 'imagePreview',
      render: (url) => (
        <Image
          src={url}
          alt="Request Preview"
          width={100}
          height={100}
          style={{ objectFit: 'cover' }}
        />
      ),
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(record.id, value)}
          disabled={updatingStatus}
        >
          <Option value="Requested">Requested</Option>
          <Option value="In Progress">In Progress</Option>
          <Option value="Completed">Completed</Option>
          <Option value="Rejected">Rejected</Option>
        </Select>
      ),
    },
    {
      title: 'Estimated Completion',
      dataIndex: 'estimatedCompletionDate',
      key: 'estimatedCompletionDate',
      render: (date, record) => (
        <DatePicker
          value={date ? new Date(date) : null}
          onChange={(date) => handleStatusChange(record.id, record.status, date?.toISOString())}
          disabled={updatingStatus}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            View
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this request?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2} style={{ marginBottom: '24px' }}>Tactile Requests Management</Title>
        
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Request Details"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {selectedRequest && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <strong>User:</strong> {selectedRequest.userName} ({selectedRequest.userEmail})
            </div>
            <Image
              src={selectedRequest.imagePreview}
              alt="Request Preview"
              style={{ width: '100%', marginBottom: '16px' }}
            />
            <div style={{ marginBottom: '16px' }}>
              <strong>Description:</strong> {selectedRequest.description}
            </div>
            {selectedRequest.additionalInfo && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Additional Information:</strong> {selectedRequest.additionalInfo}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <strong>Status:</strong> {getStatusTag(selectedRequest.status)}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Request Date:</strong> {new Date(selectedRequest.requestDate).toLocaleDateString()}
            </div>
            {selectedRequest.estimatedCompletionDate && (
              <div>
                <strong>Estimated Completion:</strong> {new Date(selectedRequest.estimatedCompletionDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard; 