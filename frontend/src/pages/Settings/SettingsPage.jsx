import { useState } from 'react'
import {
  Card, Form, Input, Button, Typography, Tabs, Table, Modal, Select,
  Space, Switch, message, Row, Col, Divider, Alert, Tag,
} from 'antd'
import {
  UserOutlined, LockOutlined, PlusOutlined, EditOutlined,
  SaveOutlined, EyeOutlined, EyeInvisibleOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, selectUser } from '../../app/slices/authSlice'
import { updateProfile, changePassword, getUsers, createUser, updateUser, toggleUser } from '../../api/auth'
import usePermissions from '../../hooks/usePermissions'
import { useEffect } from 'react'

const { Title, Text } = Typography
const { Option } = Select

const SettingsPage = () => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const { isAdmin } = usePermissions()
  const [activeTab, setActiveTab] = useState('profile')

  // Profile
  const [profileForm] = Form.useForm()
  const [profileLoading, setProfileLoading] = useState(false)

  // Password
  const [passwordForm] = Form.useForm()
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Users (admin only)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userModal, setUserModal] = useState({ open: false, editData: null })
  const [userForm] = Form.useForm()
  const [userSubmitting, setUserSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
      })
    }
  }, [user, profileForm])

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab, isAdmin])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await getUsers()
      setUsers(res.data.results || res.data)
    } catch (_) {}
    setUsersLoading(false)
  }

  const handleUpdateProfile = async () => {
    setProfileLoading(true)
    try {
      const values = await profileForm.validateFields()
      await updateProfile(values)
      await dispatch(fetchProfile())
      message.success('Profile updated successfully!')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to update profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordLoading(true)
    try {
      const values = await passwordForm.validateFields()
      if (values.new_password !== values.confirm_password) {
        message.error('New passwords do not match.')
        return
      }
      await changePassword(values)
      message.success('Password changed successfully!')
      passwordForm.resetFields()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to change password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSaveUser = async () => {
    setUserSubmitting(true)
    try {
      const values = await userForm.validateFields()
      if (userModal.editData) {
        await updateUser(userModal.editData.id, values)
        message.success('User updated.')
      } else {
        await createUser(values)
        message.success('User created.')
      }
      setUserModal({ open: false, editData: null })
      userForm.resetFields()
      loadUsers()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Operation failed.')
    } finally {
      setUserSubmitting(false)
    }
  }

  const handleToggleUser = async (userId) => {
    try {
      await toggleUser(userId)
      message.success('User status toggled.')
      loadUsers()
    } catch (_) { message.error('Failed to toggle user.') }
  }

  const userColumns = [
    {
      title: 'Username', dataIndex: 'username',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#9ba3bc' }}>
            {row.first_name} {row.last_name}
          </div>
        </div>
      ),
    },
    { title: 'Email', dataIndex: 'email', render: v => v || '—' },
    { title: 'Role', dataIndex: 'role', render: v => (
        <Tag color={v === 'admin' ? 'red' : v === 'staff' ? 'blue' : 'default'}>
          {v?.toUpperCase()}
        </Tag>
      )
    },
    { title: 'Phone', dataIndex: 'phone', render: v => v || '—' },
    { title: 'Active', dataIndex: 'is_active', render: v => v
        ? <Tag color="success">Active</Tag>
        : <Tag color="error">Inactive</Tag>
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}
            onClick={() => {
              userForm.setFieldsValue(row)
              setUserModal({ open: true, editData: row })
            }}>
            Edit
          </Button>
          <Button size="small" danger={row.is_active} onClick={() => handleToggleUser(row.id)}>
            {row.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </Space>
      ),
    },
  ]

  const tabs = [
    {
      key: 'profile',
      label: 'My Profile',
      children: (
        <div style={{ maxWidth: 560 }}>
          <Card title={<Text style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Personal Information</Text>} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--color-bg-elevated)', borderRadius: 8 }}>
              <Text style={{ color: '#9ba3bc', fontSize: 12 }}>Username: </Text>
              <Text style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{user?.username}</Text>
              <Divider type="vertical" />
              <Tag color={user?.role === 'admin' ? 'red' : user?.role === 'staff' ? 'blue' : 'default'}>
                {user?.role?.toUpperCase()}
              </Tag>
            </div>
            <Form form={profileForm} layout="vertical">
              <Row gutter={12}>
                <Col xs={12}>
                  <Form.Item label="First Name" name="first_name">
                    <Input id="profile-first-name" />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item label="Last Name" name="last_name">
                    <Input id="profile-last-name" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Email" name="email"
                rules={[{ type: 'email', message: 'Invalid email' }]}>
                <Input id="profile-email" />
              </Form.Item>
              <Form.Item label="Phone" name="phone">
                <Input id="profile-phone" maxLength={15} />
              </Form.Item>
              <Button type="primary" icon={<SaveOutlined />}
                loading={profileLoading} onClick={handleUpdateProfile} id="save-profile-btn">
                Save Changes
              </Button>
            </Form>
          </Card>

          <Card title={<Text style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Change Password</Text>}>
            <Form form={passwordForm} layout="vertical">
              <Form.Item label="Current Password" name="old_password"
                rules={[{ required: true, message: 'Required' }]}>
                <Input.Password id="old-password" prefix={<LockOutlined style={{ color: '#6b7280' }} />} />
              </Form.Item>
              <Form.Item label="New Password" name="new_password"
                rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}>
                <Input.Password id="new-password" prefix={<LockOutlined style={{ color: '#6b7280' }} />} />
              </Form.Item>
              <Form.Item label="Confirm New Password" name="confirm_password"
                rules={[{ required: true, message: 'Required' }]}>
                <Input.Password id="confirm-password" prefix={<LockOutlined style={{ color: '#6b7280' }} />} />
              </Form.Item>
              <Button type="primary" danger loading={passwordLoading}
                onClick={handleChangePassword} id="change-password-btn">
                Change Password
              </Button>
            </Form>
          </Card>
        </div>
      ),
    },
  ]

  if (isAdmin) {
    tabs.push({
      key: 'users',
      label: 'User Management',
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ color: '#9ba3bc' }}>Manage system users and their access roles</Text>
            <Button type="primary" icon={<PlusOutlined />}
              onClick={() => { userForm.resetFields(); setUserModal({ open: true, editData: null }) }}
              id="add-user-btn">
              Add User
            </Button>
          </div>
          <Table
            columns={userColumns}
            dataSource={users}
            loading={usersLoading}
            rowKey="id"
            id="users-table"
            pagination={false}
          />

          <Modal
            title={userModal.editData ? 'Edit User' : 'Create User'}
            open={userModal.open}
            onCancel={() => { setUserModal({ open: false, editData: null }); userForm.resetFields() }}
            onOk={handleSaveUser}
            confirmLoading={userSubmitting}
            okText={userModal.editData ? 'Save' : 'Create User'}
          >
            <Form form={userForm} layout="vertical">
              <Row gutter={12}>
                <Col xs={12}>
                  <Form.Item label="First Name" name="first_name" rules={[{ required: true }]}>
                    <Input id="user-first-name" />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item label="Last Name" name="last_name">
                    <Input id="user-last-name" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                <Input id="user-username" disabled={!!userModal.editData} />
              </Form.Item>
              <Form.Item label="Email" name="email" rules={[{ type: 'email' }]}>
                <Input id="user-email" />
              </Form.Item>
              <Form.Item label="Phone" name="phone">
                <Input id="user-phone" maxLength={15} />
              </Form.Item>
              <Form.Item label="Role" name="role" rules={[{ required: true }]} initialValue="staff">
                <Select id="user-role">
                  <Option value="admin">Admin</Option>
                  <Option value="staff">Staff</Option>
                  <Option value="viewer">Viewer</Option>
                </Select>
              </Form.Item>
              {!userModal.editData && (
                <Form.Item label="Password" name="password"
                  rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}>
                  <Input.Password id="user-password" />
                </Form.Item>
              )}
            </Form>
          </Modal>
        </div>
      ),
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Settings</Title>
        <Text style={{ color: '#9ba3bc' }}>Manage your profile and system configuration</Text>
      </div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
    </div>
  )
}

export default SettingsPage
