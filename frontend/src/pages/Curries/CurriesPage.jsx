import { useEffect, useState, useCallback } from 'react'
import {
  Row, Col, Card, Button, Table, Tag, Typography, Space, Modal, Form,
  Input, InputNumber, Select, DatePicker, Tabs, message, Alert, Switch,
  Divider,
} from 'antd'
import {
  PlusOutlined, EyeOutlined, UserAddOutlined, SafetyOutlined,
  ArrowLeftOutlined, TeamOutlined, WarningOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import * as curriesApi from '../../api/curries'
import * as membersApi from '../../api/members'
import { formatCurrency, formatDate } from '../../utils/formatters'
import StatusBadge from '../../components/StatusBadge'
import usePermissions from '../../hooks/usePermissions'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'terminated', label: 'Terminated' },
]

const CurriesPage = () => {
  const navigate = useNavigate()
  const { canWrite } = usePermissions()

  const [curries, setCurries] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCurry, setSelectedCurry] = useState(null)
  const [participants, setParticipants] = useState([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [overduePayments, setOverduePayments] = useState([])
  const [overdueLoading, setOverdueLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Modals
  const [curryModal, setCurryModal] = useState(false)
  const [enrollModal, setEnrollModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState({ open: false, participant: null })
  const [curryForm] = Form.useForm()
  const [enrollForm] = Form.useForm()
  const [paymentForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  // Member search
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [isMember, setIsMember] = useState(true)

  useEffect(() => {
    loadCurries()
    loadOverdue()
  }, [])

  useEffect(() => {
    if (selectedCurry) loadParticipants(selectedCurry.id)
    else setParticipants([])
  }, [selectedCurry])

  const loadCurries = async () => {
    setLoading(true)
    try {
      const res = await curriesApi.getCurries()
      setCurries(res.data.results || res.data)
    } catch (_) { message.error('Failed to load curries.') }
    setLoading(false)
  }

  const loadParticipants = async (id) => {
    setParticipantsLoading(true)
    try {
      const res = await curriesApi.getCurryParticipants(id)
      setParticipants(res.data.results || res.data)
    } catch (_) {}
    setParticipantsLoading(false)
  }

  const loadOverdue = async () => {
    setOverdueLoading(true)
    try {
      const res = await curriesApi.getOverdueCurryPayments()
      setOverduePayments(res.data.results || res.data)
    } catch (_) {}
    setOverdueLoading(false)
  }

  const loadMembersForSelect = useCallback(async (search = '') => {
    setMembersLoading(true)
    try {
      const res = await membersApi.getMembers({ search, status: 'active', page_size: 100 })
      setMembers(res.data.results || res.data)
    } catch (_) {}
    setMembersLoading(false)
  }, [])

  const openAddParticipantModal = (curry) => {
    if (!curry) return
    setSelectedCurry(curry)
    setIsMember(true)
    enrollForm.resetFields()
    enrollForm.setFieldValue('is_member', true)
    loadMembersForSelect('')
    setEnrollModal(true)
  }

  const handleCreateCurry = async () => {
    setSubmitting(true)
    try {
      const values = await curryForm.validateFields()
      const res = await curriesApi.createCurry({
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      })
      message.success('Curry created!')
      setCurryModal(false)
      curryForm.resetFields()
      await loadCurries()
      Modal.confirm({
        title: 'Add Participants Now?',
        content: `Curry "${res.data.name}" created. Add participants now?`,
        okText: 'Yes, Add Participants',
        cancelText: 'Later',
        onOk: () => openAddParticipantModal(res.data),
      })
    } catch (err) {
      if (err?.errorFields) return
      const data = err?.response?.data
      message.error(data?.message || data?.curry_no?.[0] || 'Failed to create curry.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnrollParticipant = async () => {
    if (!selectedCurry) { message.error('No curry selected.'); return }
    setSubmitting(true)
    try {
      const values = await enrollForm.validateFields()
      await curriesApi.enrollParticipant(selectedCurry.id, {
        ...values,
        is_member: isMember,
        ticket_number: String(values.ticket_number),
        enrollment_date: values.enrollment_date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
      })
      message.success('Participant added!')
      setEnrollModal(false)
      enrollForm.resetFields()
      loadParticipants(selectedCurry.id)
      loadCurries()
    } catch (err) {
      const data = err?.response?.data
      if (data) {
        const msg = data.message || data.non_field_errors?.[0] || data.guarantor_name?.[0] || data.participant_name?.[0] || JSON.stringify(data)
        message.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordPayment = async () => {
    setSubmitting(true)
    try {
      const values = await paymentForm.validateFields()
      await curriesApi.recordCurryPayment(paymentModal.participant.id, {
        ...values,
        month_number: paymentModal.participant.currentMonth,
        amount: paymentModal.participant.curry?.monthly_amount || values.amount,
        paid_date: dayjs().format('YYYY-MM-DD'),
      })
      message.success('Payment recorded!')
      setPaymentModal({ open: false, participant: null })
      paymentForm.resetFields()
      if (selectedCurry) loadParticipants(selectedCurry.id)
      loadOverdue()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Payment failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeCurries = curries.filter((c) => c.status === 'active')
  const inactiveCurries = curries.filter((c) => c.status !== 'active')

  const curryColumns = [
    {
      title: 'Curry No', dataIndex: 'curry_no', key: 'curry_no', width: 110,
      render: (v) => <Text style={{ color: '#7c3aed', fontWeight: 600, fontFamily: 'monospace' }}>{v}</Text>,
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Monthly', dataIndex: 'monthly_amount', width: 110, render: (v) => formatCurrency(v) },
    { title: 'Duration', dataIndex: 'duration_months', width: 90, render: (v) => `${v}m` },
    { title: 'Start', dataIndex: 'start_date', width: 110, render: (v) => formatDate(v) },
    { title: 'Status', dataIndex: 'status', width: 100, render: (v) => <StatusBadge status={v} /> },
    { title: 'Participants', dataIndex: 'participant_count', width: 100, render: (v) => <Tag color="purple">{v || 0}</Tag> },
    {
      title: 'Actions', key: 'actions', fixed: 'right', width: 170,
      render: (_, row) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => { setActiveTab('all'); setSelectedCurry(row) }}
            style={{ color: '#7c3aed' }}>View</Button>
          {canWrite && (
            <Button size="small" type="primary" icon={<UserAddOutlined />}
              style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
              onClick={() => openAddParticipantModal(row)}>Add</Button>
          )}
        </Space>
      ),
    },
  ]

  const overdueColumns = [
    {
      title: 'Participant', key: 'participant',
      render: (_, row) => (
        <div style={{ cursor: row.member_id ? 'pointer' : 'default' }}
          onClick={() => row.member_id && navigate(`/members/${row.member_id}`)}>
          <div style={{ fontWeight: 600, color: row.member_id ? '#3b82f6' : '#e8eaf0' }}>{row.display_name || '—'}</div>
          {row.member_no && <div style={{ color: '#9ba3bc', fontSize: 11 }}>{row.member_no}</div>}
        </div>
      ),
    },
    {
      title: 'Curry', key: 'curry',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.curry_name || '—'}</div>
          <div style={{ color: '#9ba3bc', fontSize: 11 }}>{row.curry_no}</div>
        </div>
      ),
    },
    { title: 'Month', dataIndex: 'month_number', width: 70 },
    { title: 'Amount', dataIndex: 'amount', width: 110, render: (v) => formatCurrency(v) },
    { title: 'Due Date', dataIndex: 'due_date', width: 110, render: (v) => formatDate(v) },
    { title: 'Overdue', dataIndex: 'days_overdue', width: 100, render: (v) => <Tag color="error">{v || 0}d</Tag> },
    canWrite ? {
      title: 'Action', key: 'action', fixed: 'right', width: 140,
      render: (_, row) => (
        <Button size="small" type="primary" danger
          onClick={() => setPaymentModal({ open: true, participant: { id: row.participant_id, currentMonth: row.month_number, amount: row.amount } })}>
          Record Payment
        </Button>
      ),
    } : {},
  ].filter((c) => Object.keys(c).length > 0)

  const CurryDetailPanel = ({ curry }) => (
    <Card
      style={{ marginTop: 16, borderTop: '3px solid #7c3aed' }}
      title={
        <Space>
          <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => setSelectedCurry(null)}>All Curries</Button>
          <SafetyOutlined style={{ color: '#7c3aed' }} />
          <Text style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{curry.name}</Text>
          <Tag color="purple" style={{ fontFamily: 'monospace' }}>{curry.curry_no}</Tag>
          <StatusBadge status={curry.status} />
        </Space>
      }
      extra={
        canWrite && (
          <Button type="primary" icon={<UserAddOutlined />} size="small"
            style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
            onClick={() => openAddParticipantModal(curry)}>
            Add Participant
          </Button>
        )
      }
    >
      {/* Stats */}
      <Row gutter={[12, 8]} style={{ marginBottom: 20 }}>
        {[
          { label: 'Monthly Amount', value: formatCurrency(curry.monthly_amount), color: '#7c3aed' },
          { label: 'Duration', value: `${curry.duration_months} months`, color: '#059669' },
          { label: 'Total Slots', value: curry.total_slots, color: '#2563eb' },
          { label: 'Participants', value: participants.length, color: '#0891b2' },
          { label: 'Start Date', value: formatDate(curry.start_date), color: '#d97706' },
        ].map((s) => (
          <Col key={s.label} xs={12} sm={8} md={4} lg={4}>
            <Card size="small" style={{ textAlign: 'center', borderColor: '#ede9fe', background: '#faf5ff' }}
              bodyStyle={{ padding: '10px 8px' }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>{s.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {curry.description && (
        <Alert message={curry.description} type="info" showIcon style={{ marginBottom: 12 }} />
      )}

      <Divider style={{ margin: '8px 0 16px' }} />

      {participants.length === 0 && !participantsLoading && (
        <Alert
          message="No participants yet"
          description={canWrite ? 'Click "Add Participant" to enroll people. Non-members need a guarantor.' : 'No one enrolled yet.'}
          type="info" showIcon style={{ marginBottom: 12 }}
        />
      )}

      <Table
        dataSource={participants}
        loading={participantsLoading}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 20 }}
        scroll={{ x: true }}
        columns={[
          { title: '#', dataIndex: 'ticket_number', width: 60, render: (v) => <Tag color="purple">{v}</Tag> },
          {
            title: 'Participant', key: 'person',
            render: (_, row) => (
              <div>
                <div
                  style={{ fontWeight: 600, color: row.member ? '#3b82f6' : '#e8eaf0', cursor: row.member ? 'pointer' : 'default' }}
                  onClick={() => row.member && navigate(`/members/${row.member}`)}
                >
                  {row.display_name}
                  {!row.is_member && <Tag color="orange" style={{ marginLeft: 6, fontSize: 10 }}>Non-Member</Tag>}
                </div>
                {row.member_no && <div style={{ fontSize: 11, color: '#9ba3bc' }}>{row.member_no}</div>}
                {!row.is_member && row.participant_phone && (
                  <div style={{ fontSize: 11, color: '#9ba3bc' }}>📞 {row.participant_phone}</div>
                )}
              </div>
            ),
          },
          {
            title: 'Guarantor', key: 'guarantor',
            render: (_, row) => !row.is_member && row.guarantor_name ? (
              <div>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{row.guarantor_name}</div>
                <div style={{ fontSize: 11, color: '#9ba3bc' }}>📞 {row.guarantor_phone}</div>
              </div>
            ) : <span style={{ color: '#6b7280' }}>—</span>,
          },
          { title: 'Enrolled', dataIndex: 'enrollment_date', width: 110, render: (v) => formatDate(v) },
          { title: 'Paid', dataIndex: 'paid_months', width: 90, render: (v) => `${v || 0}/${curry.duration_months}` },
          { title: 'Total Paid', dataIndex: 'total_paid_amount', render: (v) => <Text style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(v)}</Text> },
          { title: 'Status', dataIndex: 'status', width: 90, render: (v) => <StatusBadge status={v} /> },
        ]}
      />
    </Card>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <Title level={3} style={{ color: 'var(--color-text-primary)', margin: 0 }}>Curries</Title>
          <Text style={{ color: 'var(--color-text-secondary)' }}>
            {curries.length} total · {activeCurries.length} active · {overduePayments.length > 0 && (
              <span style={{ color: '#ef4444' }}>{overduePayments.length} overdue</span>
            )}
          </Text>
        </div>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCurryModal(true)}
            style={{ background: '#7c3aed', borderColor: '#7c3aed' }} id="add-curry-btn">
            New Curry
          </Button>
        )}
      </div>

      {/* Active Curries Banner */}
      {activeCurries.length > 0 && (
        <Card
          style={{ marginBottom: 20, background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', border: '1px solid #c4b5fd' }}
          bodyStyle={{ padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <SafetyOutlined style={{ color: '#7c3aed', fontSize: 18 }} />
            <Text style={{ fontWeight: 700, fontSize: 15, color: '#5b21b6' }}>Active Curries</Text>
            <Tag color="purple" style={{ borderRadius: 20 }}>{activeCurries.length} active</Tag>
            {overduePayments.length > 0 && (
              <Tag color="error" style={{ borderRadius: 20 }}>
                <WarningOutlined /> {overduePayments.length} overdue
              </Tag>
            )}
          </div>
          <Row gutter={[12, 8]}>
            {activeCurries.map((c, idx) => (
              <Col key={c.id} xs={24} sm={12} md={8} lg={6}>
                <div
                  style={{
                    background: 'white', border: '1px solid #c4b5fd', borderRadius: 10,
                    padding: '10px 14px', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(124,58,237,0.08)',
                  }}
                  onClick={() => { setActiveTab('all'); setSelectedCurry(c) }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#ede9fe', border: '1px solid #c4b5fd',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#7c3aed',
                    }}>{idx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#5b21b6' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {c.curry_no} · {formatCurrency(c.monthly_amount)}/mo · {c.participant_count || 0} joined
                      </div>
                    </div>
                  </div>
                  {canWrite && (
                    <Button size="small" type="link" style={{ padding: 0, marginTop: 4, fontSize: 12, color: '#7c3aed' }}
                      icon={<UserAddOutlined />}
                      onClick={(e) => { e.stopPropagation(); openAddParticipantModal(c) }}>
                      Add Participant
                    </Button>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(k) => { setActiveTab(k); setSelectedCurry(null) }}
        items={[
          {
            key: 'all',
            label: 'All Curries',
            children: (
              <>
                <Table
                  columns={curryColumns}
                  dataSource={curries}
                  loading={loading}
                  rowKey="id"
                  pagination={{ pageSize: 20 }}
                  scroll={{ x: 900 }}
                  onRow={(row) => ({
                    onDoubleClick: () => setSelectedCurry(row),
                    style: { cursor: 'pointer' },
                  })}
                />
                {selectedCurry && <CurryDetailPanel curry={selectedCurry} />}
              </>
            ),
          },
          {
            key: 'overdue',
            label: (
              <span>
                Overdue Payments
                {overduePayments.length > 0 && <Tag color="error" style={{ marginLeft: 6 }}>{overduePayments.length}</Tag>}
              </span>
            ),
            children: (
              <>
                {overduePayments.length === 0 && !overdueLoading && (
                  <Alert message="No overdue curry payments" type="success" showIcon style={{ marginBottom: 16 }} />
                )}
                <Table
                  columns={overdueColumns}
                  dataSource={overduePayments}
                  loading={overdueLoading}
                  rowKey="id"
                  pagination={{ pageSize: 20 }}
                  scroll={{ x: true }}
                />
              </>
            ),
          },
        ]}
      />

      {/* Create Curry Modal */}
      <Modal
        title="Create New Curry"
        open={curryModal}
        onCancel={() => { setCurryModal(false); curryForm.resetFields() }}
        onOk={handleCreateCurry}
        confirmLoading={submitting}
        okText="Create Curry"
        width={640}
      >
        <Form form={curryForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={12}>
              <Form.Item label="Curry No" name="curry_no" rules={[{ required: true }]}>
                <Input id="curry-no" placeholder="e.g. CRY-2026-001" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Curry Name" name="name" rules={[{ required: true }]}>
                <Input id="curry-name" placeholder="e.g. Monthly Savings Curry" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Monthly Amount (₹)" name="monthly_amount" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} prefix="₹" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Total Slots" name="total_slots" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Duration (Months)" name="duration_months" rules={[{ required: true }]}>
                <InputNumber min={1} max={120} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Status" name="status" initialValue="active">
                <Select>
                  {STATUS_OPTIONS.map((o) => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Start Date" name="start_date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="End Date (optional)" name="end_date">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Description (optional)" name="description">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Add Participant Modal */}
      <Modal
        title={
          <Space>
            <UserAddOutlined style={{ color: '#7c3aed' }} />
            <span>Add Participant to {selectedCurry?.name || 'Curry'}</span>
          </Space>
        }
        open={enrollModal}
        onCancel={() => { setEnrollModal(false); enrollForm.resetFields() }}
        onOk={handleEnrollParticipant}
        confirmLoading={submitting}
        okText="Add Participant"
        width={560}
        destroyOnClose
      >
        {selectedCurry && (
          <Alert
            message={`${selectedCurry.name} (${selectedCurry.curry_no})`}
            description={`Monthly: ${formatCurrency(selectedCurry.monthly_amount)} · ${selectedCurry.duration_months} months`}
            type="info" showIcon style={{ marginBottom: 16 }}
          />
        )}
        <Form form={enrollForm} layout="vertical">
          <Form.Item label="Participant Type" name="is_member">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Switch
                checked={isMember}
                onChange={(v) => { setIsMember(v); enrollForm.resetFields(['member', 'participant_name', 'participant_phone', 'participant_address', 'guarantor_name', 'guarantor_phone', 'guarantor_address', 'guarantor_relation']) }}
                checkedChildren="Member"
                unCheckedChildren="Non-Member"
              />
              <Text style={{ color: '#9ba3bc', fontSize: 12 }}>
                {isMember ? 'Select from registered members' : 'Non-member — guarantor required'}
              </Text>
            </div>
          </Form.Item>

          {isMember ? (
            <Form.Item label="Select Member" name="member" rules={[{ required: true }]}>
              <Select
                showSearch filterOption={false}
                loading={membersLoading}
                onSearch={loadMembersForSelect}
                onFocus={() => members.length === 0 && loadMembersForSelect('')}
                placeholder="Search member..."
                notFoundContent={membersLoading ? 'Searching...' : 'No members found'}
              >
                {members.map((m) => (
                  <Option key={m.id} value={m.id}>
                    <span style={{ fontWeight: 600 }}>{m.full_name}</span>
                    <span style={{ color: '#9ba3bc', fontSize: 12, marginLeft: 8 }}>({m.member_no})</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <>
              <Divider orientation="left" style={{ fontSize: 12 }}>Participant Details</Divider>
              <Row gutter={12}>
                <Col xs={12}>
                  <Form.Item label="Full Name" name="participant_name" rules={[{ required: true }]}>
                    <Input placeholder="Participant full name" />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item label="Phone" name="participant_phone" rules={[{ required: true }]}>
                    <Input placeholder="Phone number" maxLength={10} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Address" name="participant_address">
                    <TextArea rows={2} placeholder="Participant address" />
                  </Form.Item>
                </Col>
              </Row>
              <Divider orientation="left" style={{ fontSize: 12, color: '#ef4444' }}>
                Guarantor Details (Required)
              </Divider>
              <Row gutter={12}>
                <Col xs={12}>
                  <Form.Item label="Guarantor Name" name="guarantor_name" rules={[{ required: true }]}>
                    <Input placeholder="Guarantor full name" />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item label="Guarantor Phone" name="guarantor_phone" rules={[{ required: true }]}>
                    <Input placeholder="Guarantor phone" maxLength={10} />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item label="Relation to Participant" name="guarantor_relation">
                    <Input placeholder="e.g. Neighbour, Friend" />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item label="Guarantor Address" name="guarantor_address">
                    <Input placeholder="Guarantor address" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Divider style={{ margin: '8px 0 12px' }} />
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item label="Ticket Number" name="ticket_number" rules={[{ required: true }]}>
                <Input placeholder="e.g. 1, 2, 3..." />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Enrollment Date" name="enrollment_date" initialValue={dayjs()}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        title="Record Curry Payment"
        open={paymentModal.open}
        onCancel={() => { setPaymentModal({ open: false, participant: null }); paymentForm.resetFields() }}
        onOk={handleRecordPayment}
        confirmLoading={submitting}
        okText="Record Payment"
        destroyOnClose
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item label="Payment Mode" name="payment_mode" initialValue="cash" rules={[{ required: true }]}>
            <Select>
              <Option value="cash">Cash</Option>
              <Option value="bank_transfer">Bank Transfer</Option>
              <Option value="upi">UPI</Option>
              <Option value="cheque">Cheque</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Receipt No (optional)" name="receipt_no">
            <Input placeholder="Receipt number" />
          </Form.Item>
          <Form.Item label="Remarks" name="remarks">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CurriesPage
