import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Badge, Button, Tooltip } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  DashboardOutlined, TeamOutlined, BankOutlined, CreditCardOutlined,
  FileTextOutlined, BarChartOutlined, UploadOutlined, SettingOutlined,
  LogoutOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  AlertOutlined, SunOutlined, MoonOutlined, DollarOutlined,
  ProjectOutlined, ApartmentOutlined
} from '@ant-design/icons'
import { logoutUser, toggleTheme, selectTheme } from '../app/slices/authSlice'
import useAuth from '../hooks/useAuth'
import usePermissions from '../hooks/usePermissions'
import { ORG_NAME_ML, ORG_BRANCH } from '../utils/constants'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const navItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/members', icon: <TeamOutlined />, label: 'Members' },
  { key: '/chits', icon: <BankOutlined />, label: 'Welfare Funds' },
  { key: '/collections', icon: <DollarOutlined />, label: 'Daily Collections' },
  { key: '/loans', icon: <CreditCardOutlined />, label: 'Loans' },
  { key: '/dues', icon: <FileTextOutlined />, label: 'Dues & Fees' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
  { key: '/import', icon: <UploadOutlined />, label: 'Import / Export' },
]

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { canManageUsers } = usePermissions()
  const currentTheme = useSelector(selectTheme)

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  const userMenuItems = [
    { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true },
  ]

  const handleUserMenu = ({ key }) => {
    if (key === 'logout') handleLogout()
    if (key === 'profile') navigate('/settings')
  }

  const allNavItems = canManageUsers
    ? [...navItems,
        { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
        { key: '/district', icon: <ApartmentOutlined />, label: 'District (TCR)' },
      ]
    : navItems

  const selectedKey = '/' + location.pathname.split('/')[1]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={260}
        collapsedWidth={64}
        trigger={null}
        style={{
          background: 'var(--color-bg-elevated)',
          borderRight: '1px solid var(--color-border)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '12px 16px' : '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          transition: 'all 0.3s',
        }}>
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/logo.jpg"
                alt="Logo"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--color-border)',
                }}
              />
              <div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--color-primary-light)',
                  lineHeight: 1.3,
                  fontFamily: "'Noto Sans Malayalam', sans-serif",
                }}>
                  {ORG_NAME_ML}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {ORG_BRANCH}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <img
                src="/logo.jpg"
                alt="Logo"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          height: 'calc(100vh - 130px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-border) transparent',
          paddingBottom: 16,
        }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ marginTop: 8, border: 'none', background: 'transparent' }}
            items={allNavItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              onClick: () => navigate(item.key),
            }))}
          />
        </div>

        {/* Collapse toggle */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: 'var(--color-text-muted)', width: '100%' }}
          />
        </div>
      </Sider>

      {/* Main content */}
      <Layout style={{ marginLeft: collapsed ? 64 : 260, transition: 'margin-left 0.3s' }}>
        {/* Top header */}
        <Header style={{
          background: 'var(--color-bg-elevated)',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          height: 56,
        }}>
          <Space size={16}>
            <Tooltip title="Community Works & Plans">
              <Button
                type="text"
                shape="circle"
                icon={<ProjectOutlined style={{ color: '#2563eb' }} />}
                onClick={() => navigate('/community-plans')}
                style={{
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Tooltip>
            <Tooltip title={currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
              <Button
                type="text"
                shape="circle"
                icon={currentTheme === 'light' ? <MoonOutlined style={{ color: '#4b5563' }} /> : <SunOutlined style={{ color: '#f59e0b' }} />}
                onClick={() => dispatch(toggleTheme())}
                style={{
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-secondary)',
                }}
              />
            </Tooltip>
            <Text style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
              Welcome, <strong style={{ color: 'var(--color-text-primary)' }}>
                {user?.first_name || user?.username}
              </strong>
            </Text>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenu }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Avatar
                style={{
                  backgroundColor: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
                size={36}
              >
                {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </Avatar>
            </Dropdown>
          </Space>
        </Header>

        {/* Page content */}
        <Content style={{
          padding: '24px',
          minHeight: 'calc(100vh - 56px)',
          background: 'var(--color-bg-base)',
        }}>
          <div className="page-enter">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
