import { Tag } from 'antd'
import { getStatusColor } from '../utils/formatters'

const STATUS_LABELS = {
  active: 'Active', inactive: 'Inactive', deceased: 'Deceased',
  suspended: 'Suspended', pending: 'Pending', paid: 'Paid',
  overdue: 'Overdue', waived: 'Waived', closed: 'Closed',
  defaulted: 'Defaulted', completed: 'Completed', upcoming: 'Upcoming',
  terminated: 'Terminated', written_off: 'Written Off',
  regular: 'Regular', associate: 'Associate', honorary: 'Honorary',
}

const StatusBadge = ({ status, className }) => {
  if (!status) return null
  const label = STATUS_LABELS[status] || status
  const color = getStatusColor(status)

  return (
    <Tag color={color} className={`status-${status} ${className || ''}`}>
      {label}
    </Tag>
  )
}

export default StatusBadge
