import dayjs from 'dayjs'

/**
 * Format amount as Indian currency (₹)
 */
export const formatCurrency = (amount, decimals = 2) => {
  if (amount === null || amount === undefined || amount === '') return '—'
  const num = parseFloat(amount)
  if (isNaN(num)) return '—'
  const formattedVal = num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `₹${formattedVal}`
}

/**
 * Format date for display
 */
export const formatDate = (date, format = 'DD MMM YYYY') => {
  if (!date) return '—'
  return dayjs(date).format(format)
}

/**
 * Format date-time for display
 */
export const formatDateTime = (dt) => {
  if (!dt) return '—'
  return dayjs(dt).format('DD MMM YYYY, HH:mm')
}

/**
 * Mask Aadhaar number: show only last 4 digits
 */
export const maskAadhaar = (aadhaar) => {
  if (!aadhaar || aadhaar.length < 4) return '—'
  return `XXXX-XXXX-${aadhaar.slice(-4)}`
}

/**
 * Format phone for display
 */
export const formatPhone = (phone) => {
  if (!phone) return '—'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return phone
}

/**
 * Get days since a date (for overdue calculation display)
 */
export const getDaysOverdue = (dueDate) => {
  if (!dueDate) return 0
  const today = dayjs()
  const due = dayjs(dueDate)
  if (today.isAfter(due)) {
    return today.diff(due, 'day')
  }
  return 0
}

/**
 * Truncate text with ellipsis
 */
export const truncate = (str, length = 40) => {
  if (!str) return ''
  return str.length > length ? `${str.substring(0, length)}...` : str
}

/**
 * Format percentage
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined) return '—'
  return `${parseFloat(value).toFixed(2)}%`
}

/**
 * Get relative time (e.g. "2 hours ago")
 */
export const fromNow = (dt) => {
  if (!dt) return ''
  return dayjs(dt).fromNow()
}

/**
 * Get color for status
 */
export const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    inactive: 'default',
    deceased: 'error',
    suspended: 'warning',
    pending: 'warning',
    paid: 'success',
    overdue: 'error',
    waived: 'default',
    closed: 'default',
    defaulted: 'error',
    completed: 'processing',
    upcoming: 'blue',
    terminated: 'error',
    written_off: 'error',
    regular: 'green',
    associate: 'blue',
    honorary: 'gold',
  }
  return colors[status] || 'default'
}

/**
 * Parse API error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.'
  if (typeof error === 'string') return error
  return error?.response?.data?.message
    || error?.response?.data?.detail
    || error?.message
    || 'An unexpected error occurred.'
}
