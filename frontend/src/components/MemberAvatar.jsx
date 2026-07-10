import { Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'

const MemberAvatar = ({ member, size = 64, showName = false }) => {
  const photoUrl = member?.photo
    ? (member.photo.startsWith('http') ? member.photo : `/media/${member.photo}`)
    : null

  const initials = member?.full_name
    ? member.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const avatar = photoUrl ? (
    <Avatar size={size} src={photoUrl} />
  ) : (
    <Avatar
      size={size}
      style={{
        backgroundColor: '#1a6b3c',
        fontSize: size > 48 ? 18 : 14,
        fontWeight: 700,
      }}
    >
      {initials}
    </Avatar>
  )

  if (!showName) return avatar

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {avatar}
      <div>
        <div style={{ fontWeight: 600, color: '#e8eaf0' }}>{member?.full_name}</div>
        <div style={{ fontSize: 12, color: '#9ba3bc' }}>{member?.member_no}</div>
      </div>
    </div>
  )
}

export default MemberAvatar
