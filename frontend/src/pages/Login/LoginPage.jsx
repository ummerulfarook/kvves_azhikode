import { useState } from 'react'
import { Form, Input, Button, Typography, Alert, Space, Divider } from 'antd'
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginUser, selectAuthLoading, selectAuthError, clearError } from '../../app/slices/authSlice'
import { ORG_NAME_ML, ORG_BRANCH } from '../../utils/constants'

const { Title, Text } = Typography

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading = useSelector(selectAuthLoading)
  const error = useSelector(selectAuthError)
  const [form] = Form.useForm()

  const handleLogin = async (values) => {
    dispatch(clearError())
    const result = await dispatch(loginUser(values))
    if (loginUser.fulfilled.match(result)) {
      navigate('/')
    }
  }

  return (
    <div className="login-card" style={{
      background: 'var(--color-bg-card)',
      borderRadius: 16,
      border: '1px solid var(--color-border)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      padding: '40px 36px',
      width: 420,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto 16px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid var(--color-primary-light)',
          boxShadow: '0 4px 12px var(--color-primary-fade)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}>
          <img
            src="/logo.jpg"
            alt="Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
        <Title level={4} style={{
          color: 'var(--color-text-primary)',
          margin: '0 0 6px',
          fontFamily: "'Noto Sans Malayalam', sans-serif",
        }}>
          {ORG_NAME_ML}
        </Title>
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {ORG_BRANCH} · Management System
        </Text>
      </div>

      <Divider style={{ borderColor: 'var(--color-border)', margin: '0 0 24px' }}>
        <Text style={{ color: '#6b7280', fontSize: 12 }}>Staff Login</Text>
      </Divider>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16, borderRadius: 8 }}
          onClose={() => dispatch(clearError())}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleLogin}
        autoComplete="off"
        requiredMark={false}
      >
        <Form.Item
          label={<Text style={{ color: 'var(--color-text-secondary)' }}>Username</Text>}
          name="username"
          rules={[{ required: true, message: 'Please enter your username.' }]}
        >
          <Input
            id="login-username"
            prefix={<UserOutlined style={{ color: 'var(--color-text-muted)' }} />}
            placeholder="Enter username"
            size="large"
            autoFocus
          />
        </Form.Item>

        <Form.Item
          label={<Text style={{ color: 'var(--color-text-secondary)' }}>Password</Text>}
          name="password"
          rules={[{ required: true, message: 'Please enter your password.' }]}
        >
          <Input.Password
            id="login-password"
            prefix={<LockOutlined style={{ color: '#6b7280' }} />}
            placeholder="Enter password"
            size="large"
            iconRender={(visible) =>
              visible ? <EyeTwoTone twoToneColor="#2563eb" /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
          <Button
            id="login-submit"
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            block
            style={{
              background: 'linear-gradient(135deg, #1e40af, #2563eb)',
              border: 'none',
              height: 48,
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              boxShadow: '0 4px 15px rgba(30,64,175,0.4)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Text style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
          KVVES Management System v1.0 · Secure Login
        </Text>
      </div>
    </div>
  )
}

export default LoginPage
