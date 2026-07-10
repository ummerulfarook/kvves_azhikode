import { useEffect } from 'react'
import { Row, Col, Card, Statistic, Skeleton, Table, Typography, Tag, Space } from 'antd'
import {
  TeamOutlined, BankOutlined, CreditCardOutlined, AlertOutlined,
  SafetyOutlined, CheckCircleOutlined, UserOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { fetchDashboard, selectDashboard, selectDashboardLoading } from '../../app/slices/reportsSlice'
import { formatCurrency, formatDate } from '../../utils/formatters'
import StatusBadge from '../../components/StatusBadge'

const { Title, Text } = Typography

const DashboardPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const dashboard = useSelector(selectDashboard)
  const loading = useSelector(selectDashboardLoading)

  useEffect(() => {
    dispatch(fetchDashboard())
  }, [dispatch])

  const stats = dashboard?.stats || {}

  const statCards = [
    {
      title: 'Total Members', value: stats.total_members || 0,
      icon: <TeamOutlined />, color: '#2563eb', link: '/members',
    },
    {
      title: 'Active Members', value: stats.active_fee_paying_members || 0,
      icon: <UserOutlined />, color: '#16a34a', link: '/members',
      tooltip: 'Members who paid monthly dues (Masavari) in last 12 months',
    },
    {
      title: 'Active Welfare', value: stats.active_chits || 0,
      icon: <BankOutlined />, color: '#7c3aed', link: '/chits',
    },
    {
      title: 'Active Loans', value: stats.active_loans || 0,
      icon: <CreditCardOutlined />, color: '#0891b2', link: '/loans',
    },
    {
      title: 'Overdue Count', value: stats.overdue_count || 0,
      icon: <AlertOutlined />, color: '#ef4444', link: '/reports',
      isAlert: stats.overdue_count > 0,
    },
  ]

  const overdueColumns = [
    { title: 'Member', dataIndex: 'member_name', key: 'member_name',
      render: (name, row) => (
        <span>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 11, color: '#9ba3bc' }}>{row.member_no}</div>
        </span>
      )
    },
    { title: 'Type', dataIndex: 'type', key: 'type',
      render: (t) => (
        <Tag color={t === 'Welfare' || t === 'Welfare Payment' || t === 'Chit Payment' ? 'blue' : t === 'Loan EMI' ? 'purple' : 'orange'} style={{ borderRadius: 20 }}>
          {t}
        </Tag>
      )
    },
    { title: 'Amount', dataIndex: 'amount', key: 'amount',
      render: (v) => <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(v)}</span>
    },
    { title: 'Days Overdue', dataIndex: 'days_overdue', key: 'days_overdue',
      render: (v) => <Tag color={v > 90 ? 'red' : 'orange'}>{v}d</Tag>
    },
    { title: 'Details', dataIndex: 'detail', key: 'detail',
      render: (v) => <Text style={{ color: '#9ba3bc', fontSize: 12 }}>{v}</Text>
    },
  ]

  const recentMemberColumns = [
    { title: 'Member No', dataIndex: 'member_no', key: 'member_no',
      render: (v, row) => (
        <a
          onClick={() => navigate(`/members/${row.id}`)}
          style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
        >
          {v}
        </a>
      )
    },
    { title: 'Name', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Joined', dataIndex: 'joining_date', key: 'joining_date',
      render: (v) => formatDate(v)
    },
    { title: 'Type', dataIndex: 'membership_type', key: 'membership_type',
      render: (v) => <StatusBadge status={v} />
    },
  ]

  if (loading && !dashboard) {
    return (
      <div>
        <Title level={3} style={{ color: 'var(--color-text-primary)', marginBottom: 24 }}>Dashboard</Title>
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Col key={i} xs={24} sm={12} lg={6} xl={5}>
              <Card><Skeleton active /></Card>
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: 'var(--color-text-primary)', margin: 0 }}>Dashboard</Title>
        <Text style={{ color: 'var(--color-text-secondary)' }}>Overview of community finance activities</Text>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card) => (
          <Col key={card.title} xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card
              className="stat-card"
              onClick={() => navigate(card.link)}
              style={{ cursor: 'pointer' }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <Text style={{ color: '#9ba3bc', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {card.title}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    {card.isCurrency ? (
                      <Text style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {formatCurrency(card.value, 0)}
                      </Text>
                    ) : (
                      <Text style={{
                        fontSize: 28, fontWeight: 700,
                        color: card.isAlert && card.value > 0 ? '#ef4444' : 'var(--color-text-primary)'
                      }}>
                        {card.value.toLocaleString()}
                      </Text>
                    )}
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${card.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: card.color,
                }}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<Text style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Monthly Welfare Collections</Text>}
            bodyStyle={{ padding: '16px 8px' }}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dashboard?.monthly_chit_collections || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Bar dataKey="total" fill="#2563eb" name="Collected" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<Text style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Monthly Loan Repayments</Text>}
            bodyStyle={{ padding: '16px 8px' }}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dashboard?.monthly_loan_repayments || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Bar dataKey="total" fill="#8b5cf6" name="Repaid" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <AlertOutlined style={{ color: '#ef4444' }} />
                <Text style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Top Overdue Payments</Text>
              </Space>
            }
          >
            <Table
              columns={overdueColumns}
              dataSource={dashboard?.overdue_list || []}
              pagination={false}
              size="small"
              rowKey={(r, i) => i}
              scroll={{ x: true }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={<Text style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Recently Joined Members</Text>}
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={recentMemberColumns}
              dataSource={dashboard?.recent_members || []}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage
