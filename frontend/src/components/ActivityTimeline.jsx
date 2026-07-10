import { Timeline, Tag, Typography } from 'antd'
import { ACTIVITY_ICONS } from '../utils/constants'
import { formatDateTime, formatCurrency } from '../utils/formatters'

const { Text } = Typography

const ActivityTimeline = ({ activities = [] }) => {
  if (!activities.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ba3bc' }}>
        No activity recorded yet.
      </div>
    )
  }

  const items = activities.map((activity) => ({
    key: activity.id,
    dot: (
      <span style={{ fontSize: 16 }}>
        {ACTIVITY_ICONS[activity.activity_type] || '📌'}
      </span>
    ),
    children: (
      <div style={{ paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <Tag
            color={getActivityColor(activity.activity_type)}
            style={{ margin: 0, fontSize: 11 }}
          >
            {activity.activity_type_display || activity.activity_type}
          </Tag>
          {activity.amount && (
            <Text strong style={{ color: '#22c55e', fontSize: 13 }}>
              {formatCurrency(activity.amount)}
            </Text>
          )}
        </div>
        <Text style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: 4 }}>
          {activity.description}
        </Text>
        <Text style={{ color: '#6b7280', fontSize: 12 }}>
          {formatDateTime(activity.timestamp)}
          {activity.performed_by_name && ` · by ${activity.performed_by_name}`}
        </Text>
      </div>
    ),
  }))

  return <Timeline items={items} />
}

function getActivityColor(type) {
  const colors = {
    member_joined: 'green', member_updated: 'blue', chit_enrolled: 'cyan',
    chit_payment: 'geekblue', chit_prize: 'gold', loan_applied: 'orange',
    loan_approved: 'success', loan_repayment: 'processing', deposit_made: 'success',
    deposit_withdrawn: 'warning', due_paid: 'success', due_overdue: 'error',
    nominee_added: 'purple', nominee_updated: 'purple', status_changed: 'magenta',
  }
  return colors[type] || 'default'
}

export default ActivityTimeline
