// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Tag, Image, Button, Modal, Spin, message } from 'antd';
import { ExclamationCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserTactileRequests, logout, getPendingTactileRequest, submitTactileRequest, clearPendingTactileRequest } from '../services/appwriteService';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [submittingPending, setSubmittingPending] = useState(false);
  
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const userRequests = await getUserTactileRequests();
      setRequests(userRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      message.error('Failed to load your requests');
    }
  };

  useEffect(() => {
    const fetchUserAndRequests = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          message.error('Please login to view your dashboard');
          navigate('/login');
          return;
        }
        
        setUser(currentUser);
        await fetchRequests();
        
        // Check for pending request
        const pending = getPendingTactileRequest();
        if (pending) {
          setPendingRequest(pending);
          message.info('You have a pending request. Complete it below.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndRequests();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      message.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Failed to log out');
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRequest(record);
    setDetailsVisible(true);
  };

  const handleSubmitPendingRequest = async () => {
    if (!pendingRequest) return;
    
    try {
      setSubmittingPending(true);
      await submitTactileRequest(
        pendingRequest.imageFile, 
        pendingRequest.description, 
        pendingRequest.additionalInfo
      );
      message.success('Tactile request submitted successfully!');
      clearPendingTactileRequest();
      setPendingRequest(null);
      await fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error submitting pending request:', error);
      message.error('Failed to submit request');
    } finally {
      setSubmittingPending(false);
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'Requested':
        return <Tag color="blue">Requested</Tag>;
      case 'Generated':
        return <Tag color="green">Generated</Tag>;
      case 'Rejected':
        return <Tag color="red">Rejected</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'imagePreview',
      key: 'imagePreview',
      render: (url) => url ? (
        <Image 
          src={url} 
          alt="Tactile request image"
          style={{ width: 80, height: 80, objectFit: 'cover' }}
          preview={false}
        />
      ) : <Text type="secondary">No image</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewDetails(record)}>
          View Details
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <Title level={3} style={{ margin: 0 }}>
          Welcome, {user?.name || 'User'}
        </Title>
        <Button type="link" icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Title level={2}>Your Tactile Requests</Title>
        
        {pendingRequest && (
          <div style={{ marginBottom: 24, background: '#f8f8f8', padding: 16, borderRadius: 8 }}>
            <Title level={4}>Pending Request</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Paragraph>
                <strong>Description:</strong> {pendingRequest.description}
              </Paragraph>
              {pendingRequest.additionalInfo && (
                <Paragraph>
                  <strong>Additional Info:</strong> {pendingRequest.additionalInfo}
                </Paragraph>
              )}
              <div>
                <Button 
                  type="primary" 
                  onClick={handleSubmitPendingRequest}
                  loading={submittingPending}
                >
                  Submit Pending Request
                </Button>
                <Button 
                  style={{ marginLeft: 8 }} 
                  onClick={() => {
                    confirm({
                      title: 'Are you sure you want to discard this pending request?',
                      icon: <ExclamationCircleOutlined />,
                      content: 'This action cannot be undone.',
                      onOk() {
                        clearPendingTactileRequest();
                        setPendingRequest(null);
                        message.success('Pending request discarded');
                      },
                    });
                  }}
                >
                  Discard
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <Table 
          dataSource={requests} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No requests found' }}
        />
        
        <Modal
          title="Request Details"
          open={detailsVisible}
          onCancel={() => setDetailsVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailsVisible(false)}>
              Close
            </Button>
          ]}
          width={700}
        >
          {selectedRequest && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Image
                  src={selectedRequest.imagePreview}
                  alt="Tactile request image"
                  style={{ maxWidth: '100%', maxHeight: 400 }}
                />
              </div>
              
              <Paragraph>
                <strong>Status:</strong> {getStatusTag(selectedRequest.status)}
              </Paragraph>
              
              <Paragraph>
                <strong>Description:</strong> {selectedRequest.description}
              </Paragraph>
              
              {selectedRequest.additionalInfo && (
                <Paragraph>
                  <strong>Additional Information:</strong> {selectedRequest.additionalInfo}
                </Paragraph>
              )}
              
              <Paragraph>
                <strong>Request Date:</strong> {new Date(selectedRequest.requestDate).toLocaleString()}
              </Paragraph>
              
              {selectedRequest.estimatedCompletionDate && (
                <Paragraph>
                  <strong>Estimated Completion:</strong> {new Date(selectedRequest.estimatedCompletionDate).toLocaleString()}
                </Paragraph>
              )}
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default Dashboard;