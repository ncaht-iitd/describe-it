import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Tag, Image, Button, Modal, Spin, message, Card, Row, Col, Divider, Form, Input, Empty } from 'antd';
import { ExclamationCircleOutlined, LogoutOutlined, PlusOutlined, FileImageOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, getUserTactileRequests, logout, getPendingTactileRequest, submitTactileRequest, clearPendingTactileRequest } from '../services/appwriteService';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { confirm } = Modal;

const FallbackDashboard = ({ user, onLogout, onCreateNew }) => {
  const navigate = useNavigate();
  
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
        <div className="flex items-center gap-4">
          <Button 
            type="text" 
            icon={<HomeOutlined />} 
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Welcome, {user?.name || 'User'}
          </Title>
        </div>
        <Button type="link" icon={<LogoutOutlined />} onClick={onLogout}>
          Logout
        </Button>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Card style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>Database Access Issue</Title>
            <Paragraph>
              We're experiencing issues with our storage system. Some features may be limited.
            </Paragraph>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />}
              onClick={onCreateNew}
              style={{ marginTop: 16 }}
            >
              Create New Tactile Request
            </Button>
          </div>
        </Card>
        
        <Card>
          <Empty
            image={<FileImageOutlined style={{ fontSize: 64, color: '#ccc' }} />}
            description={
              <span>
                Unable to load your tactile requests due to database access issues.
                <br />
                Please try again later or contact support if the issue persists.
              </span>
            }
          />
        </Card>
      </Content>
    </Layout>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const [submittingPending, setSubmittingPending] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [form] = Form.useForm();
  const [dbError, setDbError] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const fetchRequests = async () => {
    try {
      const userRequests = await getUserTactileRequests();
      setRequests(userRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      message.error('Failed to load your requests');
      setDbError(true);
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
        
        try {
          await fetchRequests();
        } catch (error) {
          console.error('Database error:', error);
          setDbError(true);
        }
        
        // Check for pending request
        const pending = getPendingTactileRequest();
        if (pending) {
          setPendingRequest(pending);
          
          // If we have an imageDataUrl, we can display it directly
          if (pending.imageDataUrl) {
            setPendingImageUrl(pending.imageDataUrl);
          }
          
          // Set additional info if it exists
          if (pending.additionalInfo) {
            setAdditionalInfo(pending.additionalInfo);
            form.setFieldsValue({ additionalInfo: pending.additionalInfo });
          }
          
          message.info('You have a pending request. You can submit it below.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndRequests();
    
    // Clean up any created object URLs
    return () => {
      if (pendingImageUrl) {
        URL.revokeObjectURL(pendingImageUrl);
      }
    };
  }, [navigate, form]);

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
      
      // We need to convert the imageDataUrl back to a File object
      let imageFile;
      
      if (pendingRequest.imageDataUrl) {
        // Convert the data URL to a Blob
        const response = await fetch(pendingRequest.imageDataUrl);
        const blob = await response.blob();
        
        // Create a File object from the Blob
        imageFile = new File([blob], 'image.jpg', { type: blob.type });
      } else {
        // If we somehow have a direct imageFile, use it (fallback)
        imageFile = pendingRequest.imageFile;
      }
      
      if (!imageFile) {
        throw new Error('Image file not found');
      }
      
      await submitTactileRequest(
        imageFile, 
        pendingRequest.description, 
        additionalInfo || pendingRequest.additionalInfo
      );
      
      message.success('Tactile request submitted successfully!');
      clearPendingTactileRequest();
      setPendingRequest(null);
      setPendingImageUrl(null);
      setAdditionalInfo('');
      await fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error submitting pending request:', error);
      message.error('Failed to submit request');
    } finally {
      setSubmittingPending(false);
    }
  };

  const handleAdditionalInfoChange = (e) => {
    setAdditionalInfo(e.target.value);
  };

  const handleCreateNewRequest = () => {
    navigate('/');
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'Requested':
        return <Tag color="blue">Requested</Tag>;
      case 'In Progress':
        return <Tag color="orange">In Progress</Tag>;
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
      width: '30%',
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

  // Use fallback dashboard if database error occurred
  if (dbError) {
    return (
      <FallbackDashboard 
        user={user} 
        onLogout={handleLogout} 
        onCreateNew={handleCreateNewRequest}
      />
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
        <div className="flex items-center gap-4">
          <Button 
            type="text" 
            icon={<HomeOutlined />} 
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Welcome, {user?.name || 'User'}
          </Title>
        </div>
        <Button type="link" icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        {pendingRequest ? (
          <Card 
            title={<Title level={4}>Pending Tactile Request</Title>}
            style={{ marginBottom: 24 }}
            extra={
              <Button 
                danger
                onClick={() => {
                  confirm({
                    title: 'Are you sure you want to discard this pending request?',
                    icon: <ExclamationCircleOutlined />,
                    content: 'This action cannot be undone.',
                    onOk() {
                      clearPendingTactileRequest();
                      setPendingRequest(null);
                      setPendingImageUrl(null);
                      message.success('Pending request discarded');
                    },
                  });
                }}
              >
                Discard
              </Button>
            }
          >
            <Row gutter={24}>
              <Col xs={24} sm={12} md={10} lg={8}>
                {pendingImageUrl && (
                  <Image
                    src={pendingImageUrl}
                    alt="Pending image"
                    style={{ 
                      width: '100%',
                      maxHeight: 300,
                      objectFit: 'contain',
                      marginBottom: 16
                    }}
                  />
                )}
              </Col>
              <Col xs={24} sm={12} md={14} lg={16}>
                <Title level={5}>Generated Description:</Title>
                <Paragraph style={{ 
                  padding: 16, 
                  background: '#f5f5f5', 
                  borderRadius: 4, 
                  marginBottom: 16 
                }}>
                  {pendingRequest.description}
                </Paragraph>
                
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{ additionalInfo: pendingRequest.additionalInfo || '' }}
                >
                  <Form.Item 
                    name="additionalInfo" 
                    label="Additional Information (optional):"
                  >
                    <TextArea 
                      rows={4} 
                      value={additionalInfo} 
                      onChange={handleAdditionalInfoChange}
                      placeholder="Add any additional details that might help with creating the tactile image"
                    />
                  </Form.Item>
                </Form>
                
                <Button 
                  type="primary" 
                  size="large"
                  block
                  onClick={handleSubmitPendingRequest}
                  loading={submittingPending}
                >
                  Submit Tactile Request
                </Button>
              </Col>
            </Row>
          </Card>
        ) : (
          <Card 
            title={<Title level={4}>Create New Request</Title>}
            style={{ marginBottom: 24, textAlign: 'center' }}
          >
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />}
              onClick={handleCreateNewRequest}
            >
              Create New Tactile Request
            </Button>
            <Paragraph style={{ marginTop: 16 }}>
              Upload an image, get AI-generated description, and request a tactile version.
            </Paragraph>
          </Card>
        )}
        
        <Divider />
        
        <Title level={4}>Your Tactile Requests</Title>
        
        <Table 
          dataSource={requests} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ 
            emptyText: (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <FileImageOutlined style={{ fontSize: 36, color: '#ccc', marginBottom: 16 }} />
                <p>No tactile requests found</p>
                <Button type="primary" onClick={handleCreateNewRequest}>
                  Create Your First Request
                </Button>
              </div>
            ) 
          }}
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