/**
 * Application constants.
 */

export const MEMBER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deceased', label: 'Deceased' },
  { value: 'suspended', label: 'Suspended' },
]

export const MEMBERSHIP_TYPE_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'associate', label: 'Associate' },
  { value: 'honorary', label: 'Honorary' },
]

export const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
]

export const PAYMENT_MODE_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
]

export const LOAN_TYPE_OPTIONS = [
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' },
]

export const LOAN_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Approval' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'defaulted', label: 'Defaulted' },
  { value: 'written_off', label: 'Written Off' },
]

export const DEPOSIT_TYPE_OPTIONS = [
  { value: 'membership_fee', label: 'Registration Fee' },
  { value: 'share_capital', label: 'Share Capital' },
  { value: 'other', label: 'Other Fees' },
]

export const DUE_TYPE_OPTIONS = [
  { value: 'chit_instalment', label: 'Welfare Payment' },
  { value: 'loan_emi', label: 'Loan EMI' },
  { value: 'membership_renewal', label: 'Membership Renewal' },
  { value: 'masavari', label: 'Masavari (Monthly Due)' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'other', label: 'Other' },
]

export const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'other', label: 'Other' },
]

export const CHIT_STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'terminated', label: 'Terminated' },
]

// Welfare is the renamed version of Chit
export const WELFARE_STATUS_OPTIONS = CHIT_STATUS_OPTIONS

export const PAGE_SIZE = 20

export const ACTIVITY_ICONS = {
  member_joined: '👤',
  member_updated: '✏️',
  chit_enrolled: '📋',
  chit_payment: '💸',
  chit_prize: '🏆',
  loan_applied: '📄',
  loan_approved: '✅',
  loan_repayment: '💳',
  deposit_made: '💰',
  deposit_withdrawn: '🏧',
  due_paid: '✔️',
  due_overdue: '⚠️',
  masavari_paid: '📅',
  nominee_added: '👥',
  nominee_updated: '👥',
  status_changed: '🔄',
  other: '📌',
}

export const ORG_NAME = 'Kerala Vyapari Vyavasayi Ekopana Samithi'
export const ORG_NAME_ML = 'കേരള വ്യാപാരി വ്യവസായി ഏകോപന സമിതി'
export const ORG_BRANCH = 'Azhikode Paybazar Unit (Reg No. 262/81)'
