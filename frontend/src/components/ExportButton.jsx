import { Button, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { downloadBlob } from '../api/imports'

const ExportButton = ({ exportFn, filename, children, ...props }) => {
  const handleExport = async () => {
    const hide = message.loading('Preparing export...', 0)
    try {
      const response = await exportFn()
      downloadBlob(response.data, filename)
      message.success('Export downloaded successfully.')
    } catch (err) {
      message.error('Export failed. Please try again.')
    } finally {
      hide()
    }
  }

  return (
    <Button
      icon={<DownloadOutlined />}
      onClick={handleExport}
      {...props}
    >
      {children || 'Export Excel'}
    </Button>
  )
}

export default ExportButton
