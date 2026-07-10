import { useState } from 'react'
import {
  Upload, Button, Table, Typography, Alert, Card, Row, Col, Tag, Space,
  Progress, Divider, Steps, message, Tabs,
} from 'antd'
import {
  UploadOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FileExcelOutlined, TeamOutlined,
} from '@ant-design/icons'
import * as importsApi from '../../api/imports'
import ExportButton from '../../components/ExportButton'
import { exportMembers, downloadMemberTemplate } from '../../api/imports'
import usePermissions from '../../hooks/usePermissions'

const { Title, Text, Paragraph } = Typography
const { Dragger } = Upload

const ImportPage = () => {
  const { canWrite } = usePermissions()
  const [activeTab, setActiveTab] = useState('import')

  // Import state
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const handleFileSelect = (file) => {
    setFile(file)
    setPreview(null)
    setImportResult(null)
    return false // prevent auto-upload
  }

  const handlePreview = async () => {
    if (!file) { message.warning('Please select a file first.'); return }
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('preview', 'true')
      const res = await importsApi.previewImport(fd)
      setPreview(res.data)
      setStep(1)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to preview file.')
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await importsApi.importMembers(fd)
      setImportResult(res.data)
      setStep(2)
      message.success(`Successfully imported ${res.data.imported_count} members!`)
    } catch (err) {
      const errData = err?.response?.data
      if (errData?.errors) {
        setPreview(prev => ({ ...prev, errors: errData.errors, error_count: errData.errors.length }))
        message.error(`Import failed: ${errData.errors.length} validation errors.`)
      } else {
        message.error(errData?.message || 'Import failed.')
      }
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setStep(0)
    setFile(null)
    setPreview(null)
    setImportResult(null)
  }

  const errorColumns = [
    { title: '#', dataIndex: 'index', key: 'index', width: 40,
      render: (_, __, i) => i + 1
    },
    { title: 'Error', dataIndex: 'error', key: 'error',
      render: (_, row) => <Text style={{ color: '#ef4444' }}>{typeof row === 'string' ? row : JSON.stringify(row)}</Text>
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>Import / Export</Title>
          <Text style={{ color: '#9ba3bc' }}>Bulk import members and export data to Excel</Text>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}
        items={[
          /* ─── IMPORT TAB ─── */
          {
            key: 'import',
            label: 'Import Members',
            children: canWrite ? (
              <div style={{ maxWidth: 800 }}>
                {/* Steps */}
                <Steps
                  current={step}
                  style={{ marginBottom: 32 }}
                  items={[
                    { title: 'Upload File', description: 'Select Excel file' },
                    { title: 'Preview', description: 'Validate data' },
                    { title: 'Complete', description: 'Import done' },
                  ]}
                />

                {/* Step 0: Upload */}
                {step === 0 && (
                  <Card>
                    <div style={{ marginBottom: 16 }}>
                      <Text style={{ color: '#9ba3bc' }}>
                        Download the template first, fill in member data, then upload.
                      </Text>
                    </div>
                    <Button
                      icon={<DownloadOutlined />}
                      style={{ marginBottom: 24 }}
                      onClick={async () => {
                        const hide = message.loading('Preparing template...', 0)
                        try {
                          const res = await downloadMemberTemplate()
                          importsApi.downloadBlob(res.data, 'kvva_members_import_template.xlsx')
                        } catch (_) { message.error('Failed to download template.') }
                        finally { hide() }
                      }}
                      id="download-template-btn"
                    >
                      Download Import Template
                    </Button>

                    <Dragger
                      accept=".xlsx,.xls"
                      beforeUpload={handleFileSelect}
                      onRemove={() => setFile(null)}
                      maxCount={1}
                      fileList={file ? [file] : []}
                      style={{ padding: '24px 0' }}
                    >
                      <p style={{ fontSize: 32, marginBottom: 8 }}>
                        <FileExcelOutlined style={{ color: '#2563eb' }} />
                      </p>
                      <Text style={{ color: 'var(--color-text-primary)', fontSize: 15 }}>
                        Click or drag Excel file here
                      </Text>
                      <br />
                      <Text style={{ color: '#9ba3bc', fontSize: 12 }}>
                        Supports .xlsx and .xls files only
                      </Text>
                    </Dragger>

                    <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                      <Button type="primary" loading={importing} onClick={handlePreview}
                        disabled={!file} icon={<CheckCircleOutlined />} id="preview-import-btn">
                        Preview & Validate
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Step 1: Preview */}
                {step === 1 && preview && (
                  <Card>
                    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                      <Col xs={8}>
                        <Card size="small" style={{ textAlign: 'center' }}>
                          <Text style={{ color: '#9ba3bc', fontSize: 11 }}>TOTAL ROWS</Text>
                          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {preview.total_rows}
                          </div>
                        </Card>
                      </Col>
                      <Col xs={8}>
                        <Card size="small" style={{ textAlign: 'center' }}>
                          <Text style={{ color: '#9ba3bc', fontSize: 11 }}>VALID ROWS</Text>
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>
                            {preview.valid_rows}
                          </div>
                        </Card>
                      </Col>
                      <Col xs={8}>
                        <Card size="small" style={{ textAlign: 'center' }}>
                          <Text style={{ color: '#9ba3bc', fontSize: 11 }}>ERRORS</Text>
                          <div style={{ fontSize: 22, fontWeight: 700, color: preview.error_count > 0 ? '#ef4444' : '#22c55e' }}>
                            {preview.error_count}
                          </div>
                        </Card>
                      </Col>
                    </Row>

                    {preview.error_count > 0 && (
                      <Alert
                        type="error"
                        message={`${preview.error_count} validation errors found`}
                        description="Fix the errors in your Excel file and re-upload."
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}

                    {preview.errors?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <Text style={{ color: '#ef4444', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                          Errors:
                        </Text>
                        <div style={{
                          maxHeight: 200, overflowY: 'auto', background: '#0f1117',
                          borderRadius: 8, padding: 12, border: '1px solid #2d3148'
                        }}>
                          {preview.errors.map((err, i) => (
                            <div key={i} style={{ color: '#ef4444', fontSize: 12, marginBottom: 4 }}>
                              {typeof err === 'string' ? err : JSON.stringify(err)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {preview.preview?.length > 0 && (
                      <div>
                        <Text style={{ color: 'var(--color-text-primary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                          Sample Valid Rows (first {Math.min(preview.preview.length, 10)}):
                        </Text>
                        <Table
                          dataSource={preview.preview}
                          rowKey={(_, i) => i}
                          size="small"
                          pagination={false}
                          scroll={{ x: true }}
                          columns={[
                            { title: 'Member No', dataIndex: 'member_no', width: 100 },
                            { title: 'Name', dataIndex: 'full_name' },
                            { title: 'Gender', dataIndex: 'gender', width: 70 },
                            { title: 'Phone', dataIndex: 'phone', width: 110 },
                            { title: 'Type', dataIndex: 'membership_type' },
                            { title: 'Joining Date', dataIndex: 'joining_date',
                              render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—'
                            },
                          ]}
                        />
                      </div>
                    )}

                    <Divider />
                    <Space>
                      <Button onClick={handleReset} icon={<CloseCircleOutlined />}>Start Over</Button>
                      <Button type="primary" onClick={handleImport} loading={importing}
                        disabled={preview.error_count > 0}
                        icon={<TeamOutlined />} id="confirm-import-btn">
                        Import {preview.valid_rows} Members
                      </Button>
                    </Space>
                  </Card>
                )}

                {/* Step 2: Success */}
                {step === 2 && importResult && (
                  <Card>
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                      <Title level={3} style={{ color: '#22c55e' }}>
                        Import Successful!
                      </Title>
                      <Text style={{ color: '#9ba3bc', fontSize: 16 }}>
                        {importResult.imported_count} members imported successfully
                      </Text>
                      <div style={{ marginTop: 24 }}>
                        <Button type="primary" onClick={handleReset}>Import More</Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Alert type="warning" message="You do not have permission to import members." showIcon />
            ),
          },

          /* ─── EXPORT TAB ─── */
          {
            key: 'export',
            label: 'Export Data',
            children: (
              <div style={{ maxWidth: 600 }}>
                <Row gutter={[16, 16]}>
                  {[
                    {
                      title: 'All Members',
                      desc: 'Export complete member list with nominees, welfares, loans, and deposits in a multi-sheet Excel file.',
                      icon: '👥',
                      exportFn: () => exportMembers(),
                      filename: 'kvva_members_full.xlsx',
                      id: 'export-all-members-btn',
                    },
                    {
                      title: 'Active Members Only',
                      desc: 'Export only currently active members.',
                      icon: '✅',
                      exportFn: () => exportMembers({ status: 'active' }),
                      filename: 'kvva_members_active.xlsx',
                      id: 'export-active-members-btn',
                    },
                    {
                      title: 'Overdue Report',
                      desc: 'Export all overdue welfare, loan, and due payments sorted by days overdue.',
                      icon: '⚠️',
                      exportFn: importsApi.exportOverdue,
                      filename: 'kvva_overdue_report.xlsx',
                      id: 'export-overdue-btn',
                    },
                    {
                      title: 'Import Template',
                      desc: 'Download blank Excel template for member import with correct column headers and examples.',
                      icon: '📋',
                      exportFn: downloadMemberTemplate,
                      filename: 'kvva_members_import_template.xlsx',
                      id: 'export-template-btn',
                    },
                  ].map(item => (
                    <Col key={item.title} xs={24} sm={12}>
                      <Card
                        className="chit-group-card"
                        bodyStyle={{ padding: 20 }}
                      >
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                        <Title level={5} style={{ margin: '0 0 6px' }}>{item.title}</Title>
                        <Text style={{ color: '#9ba3bc', fontSize: 12, display: 'block', marginBottom: 16 }}>
                          {item.desc}
                        </Text>
                        <ExportButton
                          exportFn={item.exportFn}
                          filename={item.filename}
                          id={item.id}
                          type="primary"
                          block
                        >
                          Download Excel
                        </ExportButton>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

export default ImportPage
