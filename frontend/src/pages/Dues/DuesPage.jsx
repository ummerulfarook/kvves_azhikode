import { useEffect, useState } from 'react'
import {
  Tabs, Button, Table, Tag, Typography, Space, Modal, Form,
  Input, InputNumber, Select, DatePicker, message, Row, Col, Card, Badge,
} from 'antd'
import {
  PlusOutlined, CheckCircleOutlined, DollarOutlined, CalendarOutlined, AlertOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import * as duesApi from '../../api/dues'
import * as membersApi from '../../api/members'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { DEPOSIT_TYPE_OPTIONS, DUE_TYPE_OPTIONS, PAYMENT_MODE_OPTIONS } from '../../utils/constants'
import StatusBadge from '../../components/StatusBadge'
import OverdueTag from '../../components/OverdueTag'
import usePermissions from '../../hooks/usePermissions'

const { Title, Text } = Typography
const { Option } = Select

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

const DuesPage = () => {
  const { canWrite } = usePermissions()
  const [deposits, setDeposits] = useState([])
  const [dues, setDues] = useState([])
  const [overdues, setOverdues] = useState([])
  const [masavari, setMasavari] = useState([])
  const [masavariOverdue, setMasavariOverdue] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('masavari')
  const [stats, setStats] = useState({
    totalDeposits: 0, pendingDues: 0, overdueCount: 0,
    masavariPaid: 0, masavariOverdue: 0,
  })

  // Modals
  const [depositModal, setDepositModal] = useState(false)
  const [dueModal, setDueModal] = useState(false)
  const [masavariModal, setMasavariModal] = useState(false)
  const [masavariPayModal, setMasavariPayModal] = useState({ open: false, record: null })
  const [depositForm] = Form.useForm()
  const [dueForm] = Form.useForm()
  const [masavariForm] = Form.useForm()
  const [masavariPayForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [members, setMembers] = useState([])
  const [filters, setFilters] = useState({ deposit_type: '', status: '' })
  const [masavariFilters, setMasavariFilters] = useState({ year: dayjs().year(), status: '' })
  const [masavariSearch, setMasavariSearch] = useState('')

  useEffect(() => {
    loadDeposits()
    loadDues()
    loadOverdue()
    loadMasavari()
    loadMasavariOverdue()
  }, [filters, masavariFilters, masavariSearch])

  const loadDeposits = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.deposit_type) params.deposit_type = filters.deposit_type
      if (filters.status) params.status = filters.status
      const res = await duesApi.getDeposits(params)
      const data = res.data.results || res.data
      setDeposits(data)
      const total = data.filter(d => d.status === 'active').reduce((s, d) => s + parseFloat(d.amount), 0)
      setStats(prev => ({ ...prev, totalDeposits: total }))
    } catch (_) {}
    setLoading(false)
  }

  const loadDues = async () => {
    try {
      const res = await duesApi.getDues({ status: 'pending' })
      const data = res.data.results || res.data
      setDues(data)
      setStats(prev => ({ ...prev, pendingDues: data.length }))
    } catch (_) {}
  }

  const loadOverdue = async () => {
    try {
      const res = await duesApi.getOverdueDues()
      const data = res.data.results || res.data
      setOverdues(data)
      setStats(prev => ({ ...prev, overdueCount: data.length }))
    } catch (_) {}
  }

  const loadMasavari = async () => {
    try {
      const params = {}
      if (masavariFilters.year) params.year = masavariFilters.year
      if (masavariFilters.status) params.status = masavariFilters.status
      if (masavariSearch) params.search = masavariSearch
      const res = await duesApi.getMasavariDues(params)
      const data = res.data.results || res.data
      // Filter by status if needed (server returns all pending/overdue by default)
      const filtered = masavariFilters.status ? data.filter(m => m.status === masavariFilters.status) : data
      setMasavari(filtered)
      const paidCount = data.filter(m => m.status === 'paid').length
      setStats(prev => ({ ...prev, masavariPaid: paidCount }))
    } catch (_) {}
  }

  const loadMasavariOverdue = async () => {
    try {
      const res = await duesApi.getMasavariOverdue()
      const data = res.data.results || res.data
      setMasavariOverdue(data)
      setStats(prev => ({ ...prev, masavariOverdue: data.length }))
    } catch (_) {}
  }

  const loadMembers = async (search = '') => {
    try {
      const res = await membersApi.getMembers({ search, status: 'active' })
      setMembers(res.data.results || res.data)
    } catch (_) {}
  }

  const handleAddDeposit = async () => {
    setSubmitting(true)
    try {
      const values = await depositForm.validateFields()
      await duesApi.createDeposit({
        ...values,
        deposit_date: values.deposit_date?.format('YYYY-MM-DD'),
        maturity_date: values.maturity_date?.format('YYYY-MM-DD'),
      })
      message.success('Deposit recorded successfully!')
      setDepositModal(false)
      depositForm.resetFields()
      loadDeposits()
    } catch (err) {
      if (err?.response?.data?.message) message.error(err.response.data.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddDue = async () => {
    setSubmitting(true)
    try {
      const values = await dueForm.validateFields()
      await duesApi.createDue({
        ...values,
        due_date: values.due_date?.format('YYYY-MM-DD'),
      })
      message.success('Due created successfully!')
      setDueModal(false)
      dueForm.resetFields()
      loadDues()
    } catch (err) {
      if (err?.response?.data?.message) message.error(err.response.data.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddMasavari = async () => {
    setSubmitting(true)
    try {
      const values = await masavariForm.validateFields()
      await duesApi.createMasavari({
        ...values,
        due_date: values.due_date?.format('YYYY-MM-DD'),
        paid_date: values.paid_date?.format('YYYY-MM-DD') || null,
      })
      message.success('Masavari entry recorded!')
      setMasavariModal(false)
      masavariForm.resetFields()
      loadMasavari()
      loadMasavariOverdue()
    } catch (err) {
      if (err?.response?.data?.message) message.error(err.response.data.message)
      else if (err?.response?.data) {
        const errMsg = Object.values(err.response.data).flat().join(', ')
        message.error(errMsg || 'Failed to record Masavari.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkMasavariPaid = async () => {
    setSubmitting(true)
    try {
      const values = await masavariPayForm.validateFields()
      const row = masavariPayModal.record
      let recordId = row.id

      // If virtual row (no DB id), create the record first
      if (!recordId) {
        const createRes = await duesApi.createMasavari({
          member: row.member,
          year: row.year,
          month: row.month,
          amount: row.amount,
          due_date: row.due_date,
          payment_mode: values.payment_mode || 'cash',
          receipt_no: values.receipt_no || '',
          status: 'paid',
          paid_date: values.paid_date?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        })
        recordId = createRes.data?.id
      } else {
        await duesApi.markMasavariPaid(recordId, {
          paid_date: values.paid_date?.format('YYYY-MM-DD'),
          payment_mode: values.payment_mode,
          receipt_no: values.receipt_no,
        })
      }

      message.success('Masavari marked as paid!')
      setMasavariPayModal({ open: false, record: null })
      masavariPayForm.resetFields()
      loadMasavari()
      loadMasavariOverdue()
    } catch (_) { message.error('Failed to mark Masavari as paid.') }
    finally { setSubmitting(false) }
  }

  const handleWithdraw = async (depositId) => {
    try {
      await duesApi.withdrawDeposit(depositId)
      message.success('Deposit marked as withdrawn.')
      loadDeposits()
    } catch (_) { message.error('Failed to withdraw deposit.') }
  }

  const handleMarkPaid = async (dueId) => {
    try {
      await duesApi.markDuePaid(dueId)
      message.success('Due marked as paid!')
      loadDues()
      loadOverdue()
    } catch (_) { message.error('Failed to mark due as paid.') }
  }

  // ─── Column Definitions ───────────────────────────────────────────────────
  const depositColumns = [
    {
      title: 'Member', key: 'member',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.member_name}</div>
          <div style={{ fontSize: 11, color: '#9ba3bc' }}>{row.member_no}</div>
        </div>
      ),
    },
    {
      title: 'Fee Type', dataIndex: 'deposit_type',
      render: (v) => <Tag>{DEPOSIT_TYPE_OPTIONS.find(o => o.value === v)?.label || v?.replace(/_/g, ' ')}</Tag>
    },
    {
      title: 'Amount', dataIndex: 'amount',
      render: (v) => <span style={{ fontWeight: 700, color: '#22c55e' }}>{formatCurrency(v)}</span>
    },
    { title: 'Date Paid', dataIndex: 'deposit_date', render: (v) => formatDate(v) },
    { title: 'Receipt No', dataIndex: 'receipt_no', render: (v) => v || '—' },
    { title: 'Status', dataIndex: 'status', render: (v) => <StatusBadge status={v} /> },
  ]

  const dueColumns = [
    {
      title: 'Member', key: 'member',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.member_name}</div>
          <div style={{ fontSize: 11, color: '#9ba3bc' }}>{row.member_no}</div>
        </div>
      ),
    },
    { title: 'Type', dataIndex: 'due_type', render: (v) => <Tag>{v?.replace(/_/g, ' ')}</Tag> },
    {
      title: 'Amount', dataIndex: 'amount',
      render: (v) => <span style={{ fontWeight: 700, color: '#ef4444' }}>{formatCurrency(v)}</span>
    },
    { title: 'Due Date', dataIndex: 'due_date', render: (v) => formatDate(v) },
    {
      title: 'Overdue', key: 'overdue',
      render: (_, row) => row.is_overdue
        ? <OverdueTag isOverdue daysOverdue={row.days_overdue} />
        : <Tag color="green">On Time</Tag>,
    },
    { title: 'Status', dataIndex: 'status', render: (v) => <StatusBadge status={v} /> },
    canWrite ? {
      title: 'Actions', key: 'actions',
      render: (_, row) => row.status !== 'paid' && (
        <Button size="small" type="primary" icon={<CheckCircleOutlined />}
          onClick={() => handleMarkPaid(row.id)}>
          Mark Paid
        </Button>
      ),
    } : {},
  ].filter(c => Object.keys(c).length > 0)

  const masavariColumns = [
    {
      title: 'Member', key: 'member',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.member_name}</div>
          <div style={{ fontSize: 11, color: '#9ba3bc' }}>{row.member_no}</div>
        </div>
      ),
    },
    {
      title: 'Month / Year', key: 'period',
      render: (_, row) => (
        <Tag icon={<CalendarOutlined />} color="blue">
          {MONTHS.find(m => m.value === row.month)?.label} {row.year}
        </Tag>
      ),
    },
    {
      title: 'Amount', dataIndex: 'amount',
      render: (v) => <span style={{ fontWeight: 700, color: '#6366f1' }}>{formatCurrency(v)}</span>
    },
    { title: 'Due Date', dataIndex: 'due_date', render: (v) => formatDate(v) },
    {
      title: 'Status', key: 'status',
      render: (_, row) => {
        if (row.is_overdue) return <OverdueTag isOverdue daysOverdue={row.days_overdue || 0} />
        return <Tag color="warning">Pending</Tag>
      },
    },
    canWrite ? {
      title: 'Action', key: 'action',
      render: (_, row) => (
        <Button size="small" type="primary" icon={<CheckCircleOutlined />}
          onClick={() => { masavariPayForm.resetFields(); setMasavariPayModal({ open: true, record: row }) }}>
          Mark Paid
        </Button>
      ),
    } : {},
  ].filter(c => Object.keys(c).length > 0)

  const currentYear = dayjs().year()
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>Dues & Fees</Title>
          <Text style={{ color: '#9ba3bc' }}>Manage monthly Masavari, registration fees, and dues</Text>
        </div>
        {canWrite && (
          <Space>
            <Button type="primary" icon={<CalendarOutlined />}
              onClick={() => { masavariForm.resetFields(); loadMembers(); setMasavariModal(true) }}
              id="add-masavari-btn"
              style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              Record Masavari
            </Button>
            <Button type="default" icon={<PlusOutlined />}
              onClick={() => { dueForm.resetFields(); loadMembers(); setDueModal(true) }}
              id="add-due-btn">
              Add Due
            </Button>
            <Button icon={<DollarOutlined />}
              onClick={() => { depositForm.resetFields(); loadMembers(); setDepositModal(true) }}
              id="add-deposit-btn">
              Record Fee Payment
            </Button>
          </Space>
        )}
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card" bodyStyle={{ padding: 16 }}>
            <Text style={{ color: '#9ba3bc', fontSize: 11, textTransform: 'uppercase' }}>Masavari Paid (Year)</Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1', marginTop: 4 }}>{stats.masavariPaid}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card" bodyStyle={{ padding: 16 }}>
            <Text style={{ color: '#9ba3bc', fontSize: 11, textTransform: 'uppercase' }}>Masavari Overdue</Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>{stats.masavariOverdue}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card" bodyStyle={{ padding: 16 }}>
            <Text style={{ color: '#9ba3bc', fontSize: 11, textTransform: 'uppercase' }}>Pending Dues</Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>{stats.pendingDues}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card" bodyStyle={{ padding: 16 }}>
            <Text style={{ color: '#9ba3bc', fontSize: 11, textTransform: 'uppercase' }}>Overdue Dues</Text>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>{stats.overdueCount}</div>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}
        items={[
          {
            key: 'masavari',
            label: (
              <span>
                Masavari (Monthly Pay)
                {stats.masavariOverdue > 0 && (
                  <Badge count={stats.masavariOverdue} style={{ marginLeft: 8, background: '#ef4444' }} />
                )}
              </span>
            ),
            children: (
              <div>
                {/* Masavari Filters */}
                <div className="filter-bar" style={{ marginBottom: 16 }}>
                  <Input.Search
                    placeholder="Search member name or number…"
                    allowClear
                    style={{ width: 240 }}
                    onSearch={(v) => setMasavariSearch(v)}
                    onChange={(e) => !e.target.value && setMasavariSearch('')}
                  />
                  <Select
                    value={masavariFilters.year}
                    onChange={(v) => setMasavariFilters(f => ({ ...f, year: v }))}
                    style={{ width: 120 }}>
                    {yearOptions.map(y => <Option key={y} value={y}>{y}</Option>)}
                  </Select>
                  <Select
                    placeholder="All Statuses"
                    allowClear
                    style={{ width: 160 }}
                    onChange={(v) => setMasavariFilters(f => ({ ...f, status: v || '' }))}>
                    <Option value="pending">Pending</Option>
                    <Option value="overdue">Overdue</Option>
                  </Select>
                </div>
                <Table
                  columns={masavariColumns}
                  dataSource={masavari.map((r, i) => ({ ...r, _key: r.id ?? `virtual-${i}` }))}
                  loading={loading}
                  rowKey="_key"
                  id="masavari-table"
                  pagination={{ pageSize: 30 }}
                  scroll={{ x: true }}
                  rowClassName={(row) => row.is_overdue ? 'text-overdue' : ''}
                />
              </div>
            ),
          },
          {
            key: 'deposits',
            label: `Registration Fees & Capital (${deposits.length})`,
            children: (
              <div>
                <div className="filter-bar">
                  <Select placeholder="All Types" allowClear style={{ width: 180 }}
                    onChange={(v) => setFilters(f => ({ ...f, deposit_type: v || '' }))}>
                    {DEPOSIT_TYPE_OPTIONS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                  </Select>
                  <Select placeholder="All Statuses" allowClear style={{ width: 160 }}
                    onChange={(v) => setFilters(f => ({ ...f, status: v || '' }))}>
                    <Option value="active">Active</Option>
                    <Option value="withdrawn">Withdrawn</Option>
                    <Option value="matured">Matured</Option>
                  </Select>
                </div>
                <Table columns={depositColumns} dataSource={deposits} loading={loading}
                  rowKey="id" id="deposits-table" pagination={{ pageSize: 20 }} scroll={{ x: true }} />
              </div>
            ),
          },
          {
            key: 'dues',
            label: `Pending Dues (${dues.length})`,
            children: (
              <Table columns={dueColumns} dataSource={dues} loading={loading}
                rowKey="id" id="dues-table" pagination={{ pageSize: 20 }} scroll={{ x: true }} />
            ),
          },
          {
            key: 'overdue',
            label: (
              <span style={overdues.length > 0 ? { color: '#ef4444' } : {}}>
                Overdue Dues {overdues.length > 0 && `(${overdues.length})`}
                {overdues.length > 0 && <AlertOutlined style={{ marginLeft: 4 }} />}
              </span>
            ),
            children: (
              <Table
                columns={dueColumns}
                dataSource={overdues}
                rowKey="id"
                id="overdue-dues-table"
                pagination={{ pageSize: 20 }}
                scroll={{ x: true }}
                rowClassName={() => 'text-overdue'}
              />
            ),
          },
        ]}
      />

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}

      {/* Add Masavari Modal */}
      <Modal title={<span style={{ fontSize: 16 }}>📅 Record Masavari (Monthly Pay)</span>}
        open={masavariModal} width={520}
        onCancel={() => { setMasavariModal(false); masavariForm.resetFields() }}
        onOk={handleAddMasavari} confirmLoading={submitting} okText="Record">
        <Form form={masavariForm} layout="vertical">
          <Form.Item label="Member" name="member" rules={[{ required: true }]}>
            <Select id="mav-member" showSearch filterOption={false} onSearch={loadMembers}
              placeholder="Search member by name or number">
              {members.map(m => <Option key={m.id} value={m.id}>{m.full_name} ({m.member_no})</Option>)}
            </Select>
          </Form.Item>
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item label="Month" name="month" rules={[{ required: true }]}
                initialValue={dayjs().month() + 1}>
                <Select id="mav-month">
                  {MONTHS.map(m => <Option key={m.value} value={m.value}>{m.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Year" name="year" rules={[{ required: true }]}
                initialValue={dayjs().year()}>
                <Select id="mav-year">
                  {yearOptions.map(y => <Option key={y} value={y}>{y}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item label="Amount (₹)" name="amount" rules={[{ required: true }]}>
                <InputNumber id="mav-amount" min={0} style={{ width: '100%' }} prefix="₹" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Status" name="status" initialValue="paid">
                <Select id="mav-status">
                  <Option value="paid">Paid</Option>
                  <Option value="pending">Pending</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item label="Due Date" name="due_date" rules={[{ required: true }]}
                initialValue={dayjs().startOf('month')}>
                <DatePicker id="mav-duedate" style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Paid Date" name="paid_date" initialValue={dayjs()}>
                <DatePicker id="mav-paiddate" style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item label="Payment Mode" name="payment_mode" initialValue="cash">
                <Select id="mav-mode">
                  {PAYMENT_MODE_OPTIONS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Receipt No" name="receipt_no">
                <Input id="mav-receipt" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea id="mav-remarks" rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Mark Masavari Paid Modal */}
      <Modal title="Mark Masavari as Paid"
        open={masavariPayModal.open} width={420}
        onCancel={() => { setMasavariPayModal({ open: false, record: null }); masavariPayForm.resetFields() }}
        onOk={handleMarkMasavariPaid} confirmLoading={submitting} okText="Confirm Payment">
        {masavariPayModal.record && (
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(99,102,241,0.1)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)' }}>
            <Text strong style={{ color: 'var(--color-text-primary)' }}>{masavariPayModal.record.member_name}</Text>
            <div style={{ color: '#9ba3bc', fontSize: 12 }}>
              {MONTHS.find(m => m.value === masavariPayModal.record.month)?.label} {masavariPayModal.record.year} —
              {' '}{formatCurrency(masavariPayModal.record.amount)}
            </div>
          </div>
        )}
        <Form form={masavariPayForm} layout="vertical">
          <Form.Item label="Paid Date" name="paid_date" rules={[{ required: true }]} initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Payment Mode" name="payment_mode" initialValue="cash">
            <Select>
              {PAYMENT_MODE_OPTIONS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Receipt No" name="receipt_no">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Deposit Modal */}
      <Modal title="Record Registration Fee / Share Capital" open={depositModal} width={560}
        onCancel={() => { setDepositModal(false); depositForm.resetFields() }}
        onOk={handleAddDeposit} confirmLoading={submitting} okText="Record Payment">
        <Form form={depositForm} layout="vertical">
          <Form.Item label="Member" name="member" rules={[{ required: true }]}>
            <Select id="dep-member" showSearch filterOption={false} onSearch={loadMembers}
              placeholder="Search member by name or number">
              {members.map(m => <Option key={m.id} value={m.id}>{m.full_name} ({m.member_no})</Option>)}
            </Select>
          </Form.Item>
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item label="Fee/Capital Type" name="deposit_type" rules={[{ required: true }]}>
                <Select id="dep-type">
                  {DEPOSIT_TYPE_OPTIONS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Amount (₹)" name="amount" rules={[{ required: true }]}>
                <InputNumber id="dep-amount" min={0} style={{ width: '100%' }} prefix="₹" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24}>
              <Form.Item label="Payment Date" name="deposit_date" rules={[{ required: true }]} initialValue={dayjs()}>
                <DatePicker id="dep-date" style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item label="Payment Mode" name="payment_mode" initialValue="cash">
                <Select id="dep-mode">
                  {PAYMENT_MODE_OPTIONS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Receipt No" name="receipt_no">
                <Input id="dep-receipt" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea id="dep-remarks" rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Due Modal */}
      <Modal title="Create Due" open={dueModal} width={480}
        onCancel={() => { setDueModal(false); dueForm.resetFields() }}
        onOk={handleAddDue} confirmLoading={submitting} okText="Create Due">
        <Form form={dueForm} layout="vertical">
          <Form.Item label="Member" name="member" rules={[{ required: true }]}>
            <Select id="due-member" showSearch filterOption={false} onSearch={loadMembers}
              placeholder="Search member">
              {members.map(m => <Option key={m.id} value={m.id}>{m.full_name} ({m.member_no})</Option>)}
            </Select>
          </Form.Item>
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item label="Due Type" name="due_type" rules={[{ required: true }]}>
                <Select id="due-type">
                  {DUE_TYPE_OPTIONS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Amount (₹)" name="amount" rules={[{ required: true }]}>
                <InputNumber id="due-amount" min={0} style={{ width: '100%' }} prefix="₹" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Due Date" name="due_date" rules={[{ required: true }]}>
            <DatePicker id="due-date" style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea id="due-desc" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DuesPage
