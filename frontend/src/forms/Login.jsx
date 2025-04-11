// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Divider, Alert, Spin } from 'antd';
import { MailOutlined, LockOutlined, GoogleOutlined, HomeOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, googleAuth, isLoggedIn, getPendingTactileRequest } from '../services/appwriteService';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        const pendingRequest = getPendingTactileRequest();
        navigate('/dashboard', { 
          state: { 
            pendingRequest: pendingRequest ? true : false 
          } 
        });
      }
    };

    checkAuth();
  }, [navigate]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError('');
      await login(values.email, values.password);
      
      const pendingRequest = getPendingTactileRequest();
      navigate('/dashboard', { 
        state: { 
          pendingRequest: pendingRequest ? true : false 
        } 
      });
    } catch (err) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      const pendingRequest = getPendingTactileRequest();
      googleAuth();
      // The page will redirect to Google's OAuth page
    } catch (err) {
      setError(err.message || 'Failed to log in with Google');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
        <Button 
          type="link" 
          icon={<HomeOutlined />} 
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </div>
      <Card>
        <Title level={2} style={{ textAlign: 'center' }}>Login</Title>
        
        {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
        
        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Log in
            </Button>
          </Form.Item>
        </Form>

        <Divider>Or</Divider>
        
        <Button 
          onClick={handleGoogleLogin} 
          icon={<GoogleOutlined />} 
          block
        >
          Continue with Google
        </Button>
        
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text>Don't have an account? <Link to="/signup">Sign up</Link></Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;