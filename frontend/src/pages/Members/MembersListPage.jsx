import { useEffect, useState } from 'react'
import {
  Table, Button, Input, Select, DatePicker, Space, Typography, Tag, Tooltip, message,
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { fetchMembers, selectMembers, selectMembersLoading, selectMembersPagination } from '../../app/slices/membersSlice'
import { formatDate, formatPhone } from '../../utils/formatters'
import { MEMBER_STATUS_OPTIONS, MEMBERSHIP_TYPE_OPTIONS } from '../../utils/constants'
import StatusBadge from '../../components/StatusBadge'
import ExportButton from '../../components/ExportButton'
import { exportMembers } from '../../api/imports'
import usePermissions from '../../hooks/usePermissions'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const MembersListPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const members = useSelector(selectMembers)
  const loading = useSelector(selectMembersLoading)
  const pagination = useSelector(selectMembersPagination)
  const { canWrite } = usePermissions()

  const [filters, setFilters] = useState({
    search: '', status: '', membership_type: '', page: 1,
    joining_date_from: null, joining_date_to: null,
    ordering: 'member_no',
  })

  useEffect(() => {
    const params = { ...filters }
    if (!params.search) delete params.search
    if (!params.status) delete params.status
    if (!params.membership_type) delete params.membership_type
    if (!params.ordering) delete params.ordering
    dispatch(fetchMembers(params))
  }, [filters, dispatch])

  const columns = [
    {
      title: 'Member No', dataIndex: 'member_no', key: 'member_no', width: 110,
      render: (v) => <Text style={{ color: '#2563eb', fontWeight: 600, fontFamily: 'monospace' }}>{v}</Text>,
      sorter: true,
    },
    {
      title: 'Name', dataIndex: 'full_name', key: 'full_name',
      render: (name, row) => (
        <div 
          onClick={() => navigate(`/members/${row.id}`)}
          style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <div style={{ fontWeight: 600, color: '#3b82f6' }}>{name}</div>
          {row.full_name_ml && (
            <div style={{ fontSize: 11, color: '#9ba3bc', fontFamily: 'Noto Sans Malayalam' }}>
              {row.full_name_ml}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Phone', dataIndex: 'phone', key: 'phone', width: 140,
      render: (v) => <Text style={{ color: '#9ba3bc', fontSize: 13 }}>{formatPhone(v)}</Text>,
    },
    {
      title: 'Type', dataIndex: 'membership_type', key: 'membership_type', width: 110,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      title: 'Joined', dataIndex: 'joining_date', key: 'joining_date', width: 110,
      render: (v) => formatDate(v),
    },
    {
      title: 'Actions', key: 'actions', width: 100, fixed: 'right',
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text" size="small" icon={<EyeOutlined />}
              style={{ color: '#2563eb' }}
              onClick={() => navigate(`/members/${row.id}`)}
              id={`view-member-${row.id}`}
            />
          </Tooltip>
          {canWrite && (
            <Tooltip title="Edit Member">
              <Button
                type="text" size="small" icon={<EditOutlined />}
                style={{ color: '#3b82f6' }}
                onClick={() => navigate(`/members/${row.id}/edit`)}
                id={`edit-member-${row.id}`}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>Members</Title>
          <Text style={{ color: '#9ba3bc' }}>
            {pagination.count} members total
          </Text>
        </div>
        <Space>
          <ExportButton exportFn={() => exportMembers({ status: filters.status })} filename="kvva_members.xlsx" />
          {canWrite && (
            <Button
              type="primary" icon={<PlusOutlined />}
              onClick={() => navigate('/members/add')}
              id="add-member-btn"
            >
              Add Member
            </Button>
          )}
        </Space>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <Input
          id="member-search"
          placeholder="Search by name, phone, member no..."
          prefix={<SearchOutlined style={{ color: '#6b7280' }} />}
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          id="member-status-filter"
          placeholder="All Statuses"
          value={filters.status || undefined}
          onChange={(v) => setFilters((f) => ({ ...f, status: v || '', page: 1 }))}
          style={{ width: 160 }}
          allowClear
        >
          {MEMBER_STATUS_OPTIONS.map((o) => (
            <Option key={o.value} value={o.value}>{o.label}</Option>
          ))}
        </Select>
        <Select
          id="member-type-filter"
          placeholder="All Types"
          value={filters.membership_type || undefined}
          onChange={(v) => setFilters((f) => ({ ...f, membership_type: v || '', page: 1 }))}
          style={{ width: 160 }}
          allowClear
        >
          {MEMBERSHIP_TYPE_OPTIONS.map((o) => (
            <Option key={o.value} value={o.value}>{o.label}</Option>
          ))}
        </Select>
        <RangePicker
          format="DD/MM/YYYY"
          placeholder={['Joined From', 'Joined To']}
          onChange={(dates) => setFilters((f) => ({
            ...f,
            joining_date_from: dates?.[0]?.format('YYYY-MM-DD') || null,
            joining_date_to: dates?.[1]?.format('YYYY-MM-DD') || null,
            page: 1,
          }))}
        />
      </div>

      {/* Table */}
      <Table
        id="members-table"
        columns={columns}
        dataSource={members}
        loading={loading}
        rowKey="id"
        onChange={(pagi, fltr, sorter) => {
          const params = {}
          if (sorter.field) {
            params.ordering = sorter.order === 'descend' ? `-${sorter.field}` : sorter.field
          } else {
            params.ordering = ''
          }
          setFilters((f) => ({
            ...f,
            ...params,
            page: pagi.current,
          }))
        }}
        pagination={{
          total: pagination.count,
          pageSize: 20,
          current: filters.page,
          showSizeChanger: false,
          showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
        }}
        scroll={{ x: 800 }}
        onRow={(row) => ({
          onDoubleClick: () => navigate(`/members/${row.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}

export default MembersListPage
