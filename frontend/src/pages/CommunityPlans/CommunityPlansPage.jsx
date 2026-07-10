import { useEffect, useState, useCallback } from 'react'
import {
  Card, Button, Modal, Form, Input, Select, Upload, Space, Tag, Typography,
  message, Empty, Spin, Tooltip, Popconfirm, Row, Col, Badge, Divider, Switch
} from 'antd'
import {
  PlusOutlined, FileTextOutlined, UploadOutlined, DeleteOutlined, EditOutlined,
  PaperClipOutlined, FilePdfOutlined, FileImageOutlined, EyeOutlined, DownloadOutlined,
  BookOutlined, BulbOutlined, NotificationOutlined, BarChartOutlined, ArrowLeftOutlined,
  CalendarOutlined, RightOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import * as communityApi from '../../api/communityPlans'
import usePermissions from '../../hooks/usePermissions'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

const POST_TYPE_CONFIG = {
  plan: { label: 'Future Plan', color: 'blue', icon: <BulbOutlined /> },
  work: { label: 'Ongoing Work', color: 'orange', icon: <FileTextOutlined /> },
  announcement: { label: 'Announcement', color: 'purple', icon: <NotificationOutlined /> },
  report: { label: 'Report / Update', color: 'green', icon: <BarChartOutlined /> },
}

const FileIcon = ({ type }) => {
  if (type === 'pdf') return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 16 }} />
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type))
    return <FileImageOutlined style={{ color: '#2563eb', fontSize: 16 }} />
  return <PaperClipOutlined style={{ color: '#6b7280', fontSize: 16 }} />
}

const CommunityPlansPage = () => {
  const { canWrite } = usePermissions()
  
  // Committee states
  const [committees, setCommittees] = useState([])
  const [committeesLoading, setCommitteesLoading] = useState(false)
  const [selectedCommittee, setSelectedCommittee] = useState(null)
  const [committeeModalOpen, setCommitteeModalOpen] = useState(false)
  const [editingCommittee, setEditingCommittee] = useState(null)
  const [committeeSubmitting, setCommitteeSubmitting] = useState(false)
  const [committeeForm] = Form.useForm()

  // Post states
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [fileList, setFileList] = useState([])
  const [filterType, setFilterType] = useState('')
  const [form] = Form.useForm()

  // Load committees
  const loadCommittees = useCallback(async () => {
    setCommitteesLoading(true)
    try {
      const res = await communityApi.getCommittees()
      setCommittees(res.data.results || res.data)
    } catch {
      message.error('Failed to load committees.')
    }
    setCommitteesLoading(false)
  }, [])

  useEffect(() => {
    loadCommittees()
  }, [loadCommittees])

  // Load posts for selected committee
  const loadPosts = useCallback(async () => {
    if (!selectedCommittee) return
    setLoading(true)
    try {
      const params = { committee: selectedCommittee.id }
      if (filterType) params.post_type = filterType
      const res = await communityApi.getCommunityPosts(params)
      setPosts(res.data.results || res.data)
    } catch {
      message.error('Failed to load posts.')
    }
    setLoading(false)
  }, [filterType, selectedCommittee])

  useEffect(() => {
    if (selectedCommittee) {
      loadPosts()
    }
  }, [loadPosts, selectedCommittee])

  // Committee Actions
  const handleOpenCreateCommittee = () => {
    setEditingCommittee(null)
    committeeForm.resetFields()
    committeeForm.setFieldsValue({ is_active: true })
    setCommitteeModalOpen(true)
  }

  const handleOpenEditCommittee = (committee, e) => {
    e.stopPropagation() // Prevent selecting the committee
    setEditingCommittee(committee)
    committeeForm.setFieldsValue({
      name: committee.name,
      description: committee.description,
      is_active: committee.is_active,
      president_name: committee.president_name,
      president_phone: committee.president_phone,
      secretary_name: committee.secretary_name,
      secretary_phone: committee.secretary_phone,
      treasurer_name: committee.treasurer_name,
      treasurer_phone: committee.treasurer_phone,
    })
    setCommitteeModalOpen(true)
  }

  const handleDeleteCommittee = async (id, e) => {
    e.stopPropagation() // Prevent selecting the committee
    try {
      await communityApi.deleteCommittee(id)
      message.success('Committee deleted.')
      loadCommittees()
      if (selectedCommittee?.id === id) {
        setSelectedCommittee(null)
      }
    } catch {
      message.error('Failed to delete committee.')
    }
  }

  const handleCommitteeSubmit = async (values) => {
    setCommitteeSubmitting(true)
    try {
      if (editingCommittee) {
        await communityApi.updateCommittee(editingCommittee.id, values)
        message.success('Committee updated.')
      } else {
        await communityApi.createCommittee(values)
        message.success('Committee created.')
      }
      setCommitteeModalOpen(false)
      loadCommittees()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to save committee.')
    }
    setCommitteeSubmitting(false)
  }

  // Post Actions
  const handleOpenCreate = () => {
    setEditingPost(null)
    setFileList([])
    form.resetFields()
    setModalOpen(true)
  }

  const handleOpenEdit = (post) => {
    setEditingPost(post)
    setFileList([])
    form.setFieldsValue({ title: post.title, content: post.content, post_type: post.post_type })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await communityApi.deleteCommunityPost(id)
      message.success('Post deleted.')
      loadPosts()
    } catch {
      message.error('Failed to delete.')
    }
  }

  const handleDeleteAttachment = async (attId) => {
    try {
      await communityApi.deleteCommunityAttachment(attId)
      message.success('Attachment removed.')
      loadPosts()
    } catch {
      message.error('Failed to remove attachment.')
    }
  }

  const handleSubmit = async (values) => {
    if (!selectedCommittee) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', values.title)
      fd.append('content', values.content)
      fd.append('post_type', values.post_type || 'announcement')
      fd.append('committee', selectedCommittee.id)
      
      fileList.forEach((f) => {
        if (f.originFileObj) fd.append('files', f.originFileObj)
      })

      if (editingPost) {
        await communityApi.updateCommunityPost(editingPost.id, fd)
        message.success('Post updated.')
      } else {
        await communityApi.createCommunityPost(fd)
        message.success('Post created.')
      }
      setModalOpen(false)
      loadPosts()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to save post.')
    }
    setSubmitting(false)
  }

  // RENDER COMMITTEE LIST VIEW
  if (!selectedCommittee) {
    return (
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOutlined style={{ color: '#2563eb' }} /> Committee works &amp; plans
            </Title>
            <Text style={{ color: 'var(--color-text-secondary)' }}>
              Select a committee to view their plans, ongoing works, announcements, and reports
            </Text>
          </div>
          {canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateCommittee}
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', border: 'none' }}>
              Add Committee
            </Button>
          )}
        </div>

        {committeesLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
        ) : committees.length === 0 ? (
          <Empty description="No committees registered yet. Staff can add committees to get started." image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 60 }} />
        ) : (
          <Row gutter={[20, 20]}>
            {committees.map((committee) => (
              <Col xs={24} md={12} xl={8} key={committee.id}>
                <Card
                  hoverable
                  onClick={() => setSelectedCommittee(committee)}
                  style={{
                    borderRadius: 12,
                    border: '1px solid var(--color-border)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.12)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Tag
                      color={committee.is_active ? 'green' : 'default'}
                      style={{ borderRadius: 12, padding: '1px 8px', fontWeight: 600 }}
                    >
                      {committee.is_active ? 'Active Committee' : 'Past Committee'}
                    </Tag>
                    {canWrite && (
                      <Space size={4}>
                        <Tooltip title="Edit Committee">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => handleOpenEditCommittee(committee, e)}
                            style={{ color: '#2563eb' }}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Delete this committee and all associated works/posts?"
                          onConfirm={(e) => handleDeleteCommittee(committee.id, e)}
                          okText="Delete"
                          okButtonProps={{ danger: true }}
                          onCancel={(e) => e.stopPropagation()}
                        >
                          <Tooltip title="Delete Committee">
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: '#dc2626' }}
                            />
                          </Tooltip>
                        </Popconfirm>
                      </Space>
                    )}
                  </div>

                  <Title level={4} style={{ margin: '0 0 10px', color: 'var(--color-text-primary)', fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarOutlined style={{ color: '#2563eb' }} /> {committee.name}
                  </Title>

                  <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 12, border: '1px dashed #cbd5e1', fontSize: 12, color: '#334155' }}>
                    <div style={{ marginBottom: 4 }}>👑 <strong>President:</strong> {committee.president_name || '—'} {committee.president_phone && `(${committee.president_phone})`}</div>
                    <div style={{ marginBottom: 4 }}>📝 <strong>Secretary:</strong> {committee.secretary_name || '—'} {committee.secretary_phone && `(${committee.secretary_phone})`}</div>
                    <div>💰 <strong>Treasurer:</strong> {committee.treasurer_name || '—'} {committee.treasurer_phone && `(${committee.treasurer_phone})`}</div>
                  </div>
                  
                  <Paragraph
                    ellipsis={{ rows: 3 }}
                    style={{ color: 'var(--color-text-secondary)', fontSize: 13, flex: 1, marginBottom: 16 }}
                  >
                    {committee.description || 'No description provided.'}
                  </Paragraph>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <Text style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Created: {dayjs(committee.created_at).format('DD MMM YYYY')}
                    </Text>
                    <Button type="link" style={{ padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Open works <RightOutlined style={{ fontSize: 10 }} />
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Add/Edit Committee Modal */}
        <Modal
          title={
            <Space>
              <CalendarOutlined style={{ color: '#2563eb' }} />
              {editingCommittee ? 'Edit Committee' : 'Add New Committee'}
            </Space>
          }
          open={committeeModalOpen}
          onCancel={() => setCommitteeModalOpen(false)}
          footer={null}
          width={540}
          destroyOnClose
        >
          <Form
            form={committeeForm}
            layout="vertical"
            onFinish={handleCommitteeSubmit}
            style={{ marginTop: 16 }}
          >
            <Form.Item
              label="Committee Name (e.g. 2022-24 Committee)"
              name="name"
              rules={[{ required: true, message: 'Please enter committee name' }]}
            >
              <Input placeholder="e.g. 2022-24 Committee" />
            </Form.Item>
            <Form.Item
              label="Description / Period details"
              name="description"
            >
              <TextArea rows={3} placeholder="Describe the working period, members involved, or plans..." />
            </Form.Item>

            <Title level={5} style={{ fontSize: 14, margin: '16px 0 8px', color: '#475569' }}>Authority Details</Title>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="President Name" name="president_name">
                  <Input placeholder="President full name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="President Phone" name="president_phone">
                  <Input placeholder="President phone" maxLength={15} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Secretary Name" name="secretary_name">
                  <Input placeholder="Secretary full name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Secretary Phone" name="secretary_phone">
                  <Input placeholder="Secretary phone" maxLength={15} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Treasurer Name" name="treasurer_name">
                  <Input placeholder="Treasurer full name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Treasurer Phone" name="treasurer_phone">
                  <Input placeholder="Treasurer phone" maxLength={15} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Active Status"
              name="is_active"
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Past" />
            </Form.Item>
            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setCommitteeModalOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={committeeSubmitting}>
                  {editingCommittee ? 'Save Changes' : 'Create Committee'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    )
  }

  // RENDER POSTS/WORKS VIEW INSIDE SELECTED COMMITTEE
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => { setSelectedCommittee(null); setPosts([]); }}>
          Back to Committees
        </Button>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOutlined style={{ color: '#2563eb' }} /> {selectedCommittee.name} Works &amp; Plans
          </Title>
          <Text style={{ color: 'var(--color-text-secondary)' }}>
            Ongoing works, future plans, announcements, and reports for the {selectedCommittee.name} period
          </Text>
        </div>
        <Space wrap>
          <Select
            placeholder="Filter by type"
            allowClear
            style={{ width: 160 }}
            value={filterType || undefined}
            onChange={(v) => setFilterType(v || '')}
          >
            {Object.entries(POST_TYPE_CONFIG).map(([key, cfg]) => (
              <Option key={key} value={key}>{cfg.label}</Option>
            ))}
          </Select>
          {canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', border: 'none' }}>
              Add New Post
            </Button>
          )}
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
      ) : posts.length === 0 ? (
        <Empty description="No works or plans recorded yet for this committee. Staff can add plans and updates here." image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 60 }} />
      ) : (
        <Row gutter={[20, 20]}>
          {posts.map((post) => {
            const cfg = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.announcement
            return (
              <Col xs={24} md={12} xl={8} key={post.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    border: '1px solid var(--color-border)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Tag
                      color={cfg.color}
                      icon={cfg.icon}
                      style={{ borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}
                    >
                      {cfg.label}
                    </Tag>
                    {canWrite && (
                      <Space size={4}>
                        <Tooltip title="Edit">
                          <Button
                            type="text" size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEdit(post)}
                            style={{ color: '#2563eb' }}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Delete this post?"
                          onConfirm={() => handleDelete(post.id)}
                          okText="Yes, Delete"
                          okButtonProps={{ danger: true }}
                        >
                          <Tooltip title="Delete">
                            <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#dc2626' }} />
                          </Tooltip>
                        </Popconfirm>
                      </Space>
                    )}
                  </div>

                  <Title level={5} style={{ margin: '0 0 8px', color: 'var(--color-text-primary)', fontSize: 15 }}>
                    {post.title}
                  </Title>
                  <Paragraph
                    ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                    style={{ color: 'var(--color-text-secondary)', fontSize: 13, flex: 1 }}
                  >
                    {post.content}
                  </Paragraph>

                  {post.attachments?.length > 0 && (
                    <>
                      <Divider style={{ margin: '12px 0 8px' }} />
                      <div>
                        <Text style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                          <PaperClipOutlined /> {post.attachments.length} Attachment{post.attachments.length > 1 ? 's' : ''}
                        </Text>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          {post.attachments.map((att) => (
                            <div key={att.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '4px 8px', background: 'var(--color-bg-hover)', borderRadius: 6,
                              border: '1px solid var(--color-border)'
                            }}>
                              <Space size={6}>
                                <FileIcon type={att.file_type} />
                                <Text style={{ fontSize: 12, color: 'var(--color-text-primary)' }} ellipsis={{ tooltip: att.filename }}>
                                  {att.filename?.length > 20 ? att.filename.slice(0, 20) + '...' : att.filename}
                                </Text>
                              </Space>
                              <Space size={2}>
                                <Tooltip title="View">
                                  <Button type="link" size="small" icon={<EyeOutlined />} href={att.url} target="_blank" style={{ padding: '0 4px' }} />
                                </Tooltip>
                                <Tooltip title="Download">
                                  <Button type="link" size="small" icon={<DownloadOutlined />} href={att.url} download target="_blank" style={{ padding: '0 4px' }} />
                                </Tooltip>
                                {canWrite && (
                                  <Popconfirm title="Remove attachment?" onConfirm={() => handleDeleteAttachment(att.id)} okButtonProps={{ danger: true }}>
                                    <Button type="link" size="small" danger icon={<DeleteOutlined />} style={{ padding: '0 4px' }} />
                                  </Popconfirm>
                                )}
                              </Space>
                            </div>
                          ))}
                        </Space>
                      </div>
                    </>
                  )}

                  <div style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Posted by <strong>{post.created_by_name}</strong> · {dayjs(post.created_at).format('DD MMM YYYY, hh:mm A')}
                    </Text>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}

      {/* Create / Edit Post Modal */}
      <Modal
        title={
          <Space>
            <BookOutlined style={{ color: '#2563eb' }} />
            {editingPost ? 'Edit Post' : 'Add Community Post'}
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item label="Post Type" name="post_type" initialValue="announcement" rules={[{ required: true }]}>
            <Select>
              {Object.entries(POST_TYPE_CONFIG).map(([key, cfg]) => (
                <Option key={key} value={key}>
                  <Space>{cfg.icon} {cfg.label}</Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Enter a title' }]}>
            <Input placeholder="e.g. New Building Project - Phase 2" />
          </Form.Item>
          <Form.Item label="Details / Content" name="content" rules={[{ required: true, message: 'Enter content' }]}>
            <TextArea rows={5} placeholder="Describe the work, plan, or announcement in detail..." />
          </Form.Item>
          <Form.Item label="Attach Files (PDF, Images)">
            <Upload
              multiple
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
            >
              <Button icon={<UploadOutlined />}>Select Files</Button>
              <Text style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 8 }}>PDF, JPG, PNG supported</Text>
            </Upload>
          </Form.Item>
          <Form.Item style={{ marginTop: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingPost ? 'Save Changes' : 'Publish Post'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CommunityPlansPage
