import { useEffect, useState, useCallback } from 'react'
import {
  Card, Button, Modal, Form, Input, Select, DatePicker, Space, Tag, Typography,
  Table, Statistic, Row, Col, message, Popconfirm, Tooltip, Divider, InputNumber, Tabs
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined,
  BookOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import * as districtApi from '../../api/district'
import { formatCurrency, formatDate } from '../../utils/formatters'
import usePermissions from '../../hooks/usePermissions'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const ACTIVITY_TYPES = {
  payment: { label: 'Payment to District', color: 'blue' },
  collection: { label: 'Collection / Remittance', color: 'cyan' },
  report: { label: 'Report Submission', color: 'purple' },
  meeting: { label: 'Meeting / Visit', color: 'orange' },
  inspection: { label: 'Inspection', color: 'gold' },
  other: { label: 'Other', color: 'default' },
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning', icon: <ClockCircleOutlined /> },
  completed: { label: 'Completed', color: 'success', icon: <CheckCircleOutlined /> },
  partial: { label: 'Partial', color: 'processing', icon: <ExclamationCircleOutlined /> },
  cancelled: { label: 'Cancelled', color: 'error', icon: <CloseCircleOutlined /> },
}

const SCHEME_STATUS_CONFIG = {
  active: { label: 'Active', color: 'success', icon: <CheckCircleOutlined /> },
  inactive: { label: 'Inactive', color: 'default', icon: <ClockCircleOutlined /> },
  completed: { label: 'Completed', color: 'blue', icon: <CheckCircleOutlined /> },
}

const DistrictPage = () => {
  const { canWrite } = usePermissions()
  const [activeTab, setActiveTab] = useState('activities')

  // Activities states
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [activitySubmitting, setActivitySubmitting] = useState(false)
  const [filterActivityType, setFilterActivityType] = useState('')
  const [filterActivityStatus, setFilterActivityStatus] = useState('')
  const [activityForm] = Form.useForm()

  // Schemes states
  const [schemes, setSchemes] = useState([])
  const [schemesLoading, setSchemesLoading] = useState(false)
  const [schemeModalOpen, setSchemeModalOpen] = useState(false)
  const [editingScheme, setEditingScheme] = useState(null)
  const [schemeSubmitting, setSchemeSubmitting] = useState(false)
  const [filterSchemeStatus, setFilterSchemeStatus] = useState('')
  const [schemeForm] = Form.useForm()

  // Load Activities
  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true)
    try {
      const params = {}
      if (filterActivityType) params.activity_type = filterActivityType
      if (filterActivityStatus) params.status = filterActivityStatus
      const res = await districtApi.getDistrictActivities(params)
      setActivities(res.data.results || res.data)
    } catch {
      message.error('Failed to load district activities.')
    }
    setActivitiesLoading(false)
  }, [filterActivityType, filterActivityStatus])

  // Load Schemes
  const loadSchemes = useCallback(async () => {
    setSchemesLoading(true)
    try {
      const params = {}
      if (filterSchemeStatus) params.status = filterSchemeStatus
      const res = await districtApi.getDistrictSchemes(params)
      setSchemes(res.data.results || res.data)
    } catch {
      message.error('Failed to load district schemes.')
    }
    setSchemesLoading(false)
  }, [filterSchemeStatus])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  useEffect(() => {
    loadSchemes()
  }, [loadSchemes])

  // Activity Handlers
  const handleOpenCreateActivity = () => {
    setEditingActivity(null)
    activityForm.resetFields()
    activityForm.setFieldsValue({ activity_date: dayjs(), status: 'pending' })
    setActivityModalOpen(true)
  }

  const handleOpenEditActivity = (item) => {
    setEditingActivity(item)
    activityForm.setFieldsValue({
      ...item,
      activity_date: dayjs(item.activity_date),
    })
    setActivityModalOpen(true)
  }

  const handleDeleteActivity = async (id) => {
    try {
      await districtApi.deleteDistrictActivity(id)
      message.success('Activity deleted.')
      loadActivities()
    } catch {
      message.error('Failed to delete activity.')
    }
  }

  const handleActivitySubmit = async (values) => {
    setActivitySubmitting(true)
    try {
      const payload = {
        ...values,
        activity_date: values.activity_date?.format('YYYY-MM-DD'),
      }
      if (editingActivity) {
        await districtApi.updateDistrictActivity(editingActivity.id, payload)
        message.success('Activity updated.')
      } else {
        await districtApi.createDistrictActivity(payload)
        message.success('Activity recorded.')
      }
      setActivityModalOpen(false)
      loadActivities()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to save activity.')
    }
    setActivitySubmitting(false)
  }

  // Scheme Handlers
  const handleOpenCreateScheme = () => {
    setEditingScheme(null)
    schemeForm.resetFields()
    schemeForm.setFieldsValue({ status: 'active', start_date: dayjs() })
    setSchemeModalOpen(true)
  }

  const handleOpenEditScheme = (scheme) => {
    setEditingScheme(scheme)
    schemeForm.setFieldsValue({
      ...scheme,
      start_date: scheme.start_date ? dayjs(scheme.start_date) : null,
      end_date: scheme.end_date ? dayjs(scheme.end_date) : null,
    })
    setSchemeModalOpen(true)
  }

  const handleDeleteScheme = async (id) => {
    try {
      await districtApi.deleteDistrictScheme(id)
      message.success('Scheme deleted.')
      loadSchemes()
    } catch {
      message.error('Failed to delete scheme.')
    }
  }

  const handleSchemeSubmit = async (values) => {
    setSchemeSubmitting(true)
    try {
      const payload = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      }
      if (editingScheme) {
        await districtApi.updateDistrictScheme(editingScheme.id, payload)
        message.success('Scheme updated.')
      } else {
        await districtApi.createDistrictScheme(payload)
        message.success('Scheme created.')
      }
      setSchemeModalOpen(false)
      loadSchemes()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to save scheme.')
    }
    setSchemeSubmitting(false)
  }

  // Activity columns
  const activityColumns = [
    {
      title: 'Date',
      dataIndex: 'activity_date',
      key: 'date',
      render: (v) => formatDate(v),
      sorter: (a, b) => a.activity_date.localeCompare(b.activity_date),
    },
    {
      title: 'Type',
      dataIndex: 'activity_type',
      key: 'type',
      render: (v) => {
        const cfg = ACTIVITY_TYPES[v] || ACTIVITY_TYPES.other
        return <Tag color={cfg.color} style={{ borderRadius: 12 }}>{cfg.label}</Tag>
      }
    },
    {
      title: 'Title / Description',
      key: 'title',
      render: (_, row) => (
        <div>
          <Text strong style={{ color: 'var(--color-text-primary)' }}>{row.title}</Text>
          {row.reference_no && (
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>Ref: {row.reference_no}</Text>
          )}
          {row.description && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{row.description}</div>
          )}
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v) => v ? <Text strong style={{ color: '#1e40af' }}>{formatCurrency(v)}</Text> : <Text type="secondary">—</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const cfg = STATUS_CONFIG[v] || STATUS_CONFIG.pending
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
      }
    },
    {
      title: 'Recorded By',
      dataIndex: 'created_by_name',
      key: 'created_by',
      render: (v) => v || 'Staff'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => canWrite ? (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenEditActivity(row)} style={{ color: '#2563eb' }} />
          </Tooltip>
          <Popconfirm
            title="Delete this activity record?"
            onConfirm={() => handleDeleteActivity(row.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#dc2626' }} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ) : null
    }
  ]

  // Scheme columns
  const schemeColumns = [
    {
      title: 'Scheme Code',
      dataIndex: 'scheme_code',
      key: 'scheme_code',
      render: (v) => v ? <Tag color="blue">{v}</Tag> : <Text type="secondary">—</Text>
    },
    {
      title: 'Scheme Name / Description',
      key: 'name',
      render: (_, row) => (
        <div>
          <Text strong style={{ color: 'var(--color-text-primary)' }}>{row.name}</Text>
          {row.description && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{row.description}</div>
          )}
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v) => v ? <Text strong style={{ color: '#1e40af' }}>{formatCurrency(v)}</Text> : <Text type="secondary">—</Text>
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>Start: {row.start_date ? formatDate(row.start_date) : 'N/A'}</Text>
          {row.end_date && <Text style={{ fontSize: 12 }} type="secondary">End: {formatDate(row.end_date)}</Text>}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const cfg = SCHEME_STATUS_CONFIG[v] || SCHEME_STATUS_CONFIG.active
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
      }
    },
    {
      title: 'Recorded By',
      dataIndex: 'created_by_name',
      key: 'created_by',
      render: (v) => v || 'Staff'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => canWrite ? (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenEditScheme(row)} style={{ color: '#2563eb' }} />
          </Tooltip>
          <Popconfirm
            title="Delete this scheme record?"
            onConfirm={() => handleDeleteScheme(row.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#dc2626' }} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ) : null
    }
  ]

  // Stats for Activities
  const totalActivityAmount = activities.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
  const completedActivityCount = activities.filter(a => a.status === 'completed').length
  const pendingActivityCount = activities.filter(a => a.status === 'pending').length

  // Stats for Schemes
  const totalSchemeAmount = schemes.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
  const activeSchemeCount = schemes.filter(s => s.status === 'active').length
  const completedSchemeCount = schemes.filter(s => s.status === 'completed').length

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ApartmentOutlined style={{ color: '#2563eb' }} /> District (TCR) Section
          </Title>
          <Text style={{ color: 'var(--color-text-secondary)' }}>
            Track repayments, activities, and welfare/loan schemes related to the TCR district unit
          </Text>
        </div>
        {canWrite && (
          activeTab === 'activities' ? (
            <Button
              type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateActivity}
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', border: 'none' }}
            >
              Add Activity
            </Button>
          ) : (
            <Button
              type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateScheme}
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', border: 'none' }}
            >
              Add Scheme
            </Button>
          )
        )}
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" style={{ marginBottom: 16 }}>
        {/* TAB 1: ACTIVITIES */}
        <Tabs.TabPane tab="District Activities" key="activities">
          {/* Summary Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card bodyStyle={{ padding: 20 }} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
                <Statistic
                  title={<Text style={{ color: '#1e40af', fontWeight: 600 }}>Total Activities</Text>}
                  value={activities.length}
                  valueStyle={{ color: '#1e40af', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bodyStyle={{ padding: 20 }} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                <Statistic
                  title={<Text style={{ color: '#16a34a', fontWeight: 600 }}>Completed Activities</Text>}
                  value={completedActivityCount}
                  valueStyle={{ color: '#16a34a', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bodyStyle={{ padding: 20 }} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10 }}>
                <Statistic
                  title={<Text style={{ color: '#ea580c', fontWeight: 600 }}>Total Amount</Text>}
                  value={totalActivityAmount}
                  prefix="₹"
                  valueStyle={{ color: '#ea580c', fontWeight: 700 }}
                  formatter={(v) => v.toLocaleString('en-IN')}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card style={{ marginBottom: 16, borderRadius: 10 }}>
            <Space wrap size={12}>
              <Text strong>Filter Activities:</Text>
              <Select
                placeholder="Activity Type"
                allowClear
                style={{ width: 180 }}
                value={filterActivityType || undefined}
                onChange={(v) => setFilterActivityType(v || '')}
              >
                {Object.entries(ACTIVITY_TYPES).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
              <Select
                placeholder="Status"
                allowClear
                style={{ width: 140 }}
                value={filterActivityStatus || undefined}
                onChange={(v) => setFilterActivityStatus(v || '')}
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
              <Button onClick={loadActivities}>Refresh</Button>
            </Space>
          </Card>

          {/* Table */}
          <Card style={{ borderRadius: 10 }}>
            <Table
              dataSource={activities}
              columns={activityColumns}
              rowKey="id"
              loading={activitiesLoading}
              pagination={{ pageSize: 15 }}
              scroll={{ x: true }}
              rowClassName={(row) => row.status === 'pending' ? 'table-row-pending' : ''}
            />
          </Card>
        </Tabs.TabPane>

        {/* TAB 2: SCHEMES */}
        <Tabs.TabPane tab="District Schemes" key="schemes">
          {/* Summary Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card bodyStyle={{ padding: 20 }} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
                <Statistic
                  title={<Text style={{ color: '#1e40af', fontWeight: 600 }}>Total Schemes</Text>}
                  value={schemes.length}
                  valueStyle={{ color: '#1e40af', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bodyStyle={{ padding: 20 }} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                <Statistic
                  title={<Text style={{ color: '#16a34a', fontWeight: 600 }}>Active Schemes</Text>}
                  value={activeSchemeCount}
                  valueStyle={{ color: '#16a34a', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bodyStyle={{ padding: 20 }} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10 }}>
                <Statistic
                  title={<Text style={{ color: '#ea580c', fontWeight: 600 }}>Scheme Value</Text>}
                  value={totalSchemeAmount}
                  prefix="₹"
                  valueStyle={{ color: '#ea580c', fontWeight: 700 }}
                  formatter={(v) => v.toLocaleString('en-IN')}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card style={{ marginBottom: 16, borderRadius: 10 }}>
            <Space wrap size={12}>
              <Text strong>Filter Schemes:</Text>
              <Select
                placeholder="Scheme Status"
                allowClear
                style={{ width: 180 }}
                value={filterSchemeStatus || undefined}
                onChange={(v) => setFilterSchemeStatus(v || '')}
              >
                {Object.entries(SCHEME_STATUS_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
              <Button onClick={loadSchemes}>Refresh</Button>
            </Space>
          </Card>

          {/* Table */}
          <Card style={{ borderRadius: 10 }}>
            <Table
              dataSource={schemes}
              columns={schemeColumns}
              rowKey="id"
              loading={schemesLoading}
              pagination={{ pageSize: 15 }}
              scroll={{ x: true }}
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>

      {/* Activity Create / Edit Modal */}
      <Modal
        title={
          <Space>
            <ApartmentOutlined style={{ color: '#2563eb' }} />
            {editingActivity ? 'Edit District Activity' : 'Add District Activity'}
          </Space>
        }
        open={activityModalOpen}
        onCancel={() => setActivityModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={activityForm}
          layout="vertical"
          onFinish={handleActivitySubmit}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Activity Type" name="activity_type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  {Object.entries(ACTIVITY_TYPES).map(([k, v]) => (
                    <Option key={k} value={k}>{v.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Activity Date" name="activity_date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Enter a title' }]}>
                <Input placeholder="e.g. Monthly payment submission to TCR district" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Amount (₹)" name="amount">
                <InputNumber min={0} style={{ width: '100%' }} prefix="₹" placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <Option key={k} value={k}>{v.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Reference No." name="reference_no">
                <Input placeholder="Voucher / Reference number (optional)" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Description / Notes" name="description">
                <TextArea rows={3} placeholder="Additional details about this activity..." />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setActivityModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={activitySubmitting}>
                {editingActivity ? 'Save Changes' : 'Record Activity'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Scheme Create / Edit Modal */}
      <Modal
        title={
          <Space>
            <BookOutlined style={{ color: '#2563eb' }} />
            {editingScheme ? 'Edit District Scheme' : 'Add District Scheme'}
          </Space>
        }
        open={schemeModalOpen}
        onCancel={() => setSchemeModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={schemeForm}
          layout="vertical"
          onFinish={handleSchemeSubmit}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Scheme Name" name="name" rules={[{ required: true, message: 'Please enter scheme name' }]}>
                <Input placeholder="e.g. Welfare scheme for small traders" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Scheme Code" name="scheme_code">
                <Input placeholder="e.g. WS-2026-TCR" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Fund Amount / Target (₹)" name="amount">
                <InputNumber min={0} style={{ width: '100%' }} prefix="₹" placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(SCHEME_STATUS_CONFIG).map(([k, v]) => (
                    <Option key={k} value={k}>{v.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Start Date" name="start_date">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="End Date" name="end_date">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Description / Details" name="description">
                <TextArea rows={4} placeholder="Describe the rules, criteria or details of this district scheme..." />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setSchemeModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={schemeSubmitting}>
                {editingScheme ? 'Save Changes' : 'Publish Scheme'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DistrictPage
