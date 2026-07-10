import { Tag } from 'antd'
import { WarningOutlined } from '@ant-design/icons'

const OverdueTag = ({ daysOverdue, isOverdue }) => {
  if (!isOverdue && !daysOverdue) return null

  const days = daysOverdue || 0
  let color = 'warning'
  let label = `${days}d overdue`

  if (days > 90) { color = 'error'; }
  else if (days > 30) { color = 'orange'; }

  return (
    <Tag color={color} icon={<WarningOutlined />} style={{ fontWeight: 600 }}>
      {label}
    </Tag>
  )
}

export default OverdueTag
