/**
 * Validation utility functions for form fields.
 */

export const validatePhone = (phone) => {
  const cleaned = phone?.replace(/\D/g, '')
  if (!cleaned || cleaned.length !== 10) {
    return 'Phone number must be exactly 10 digits.'
  }
  return null
}

export const validateAadhaar = (aadhaar) => {
  if (!aadhaar) return null  // optional
  if (!/^\d{12}$/.test(aadhaar)) {
    return 'Aadhaar number must be exactly 12 digits.'
  }
  return null
}

export const validatePAN = (pan) => {
  if (!pan) return null  // optional
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
    return 'PAN must follow the format: ABCDE1234F'
  }
  return null
}

export const validatePINCode = (pin) => {
  if (!pin) return null  // optional
  if (!/^\d{6}$/.test(pin)) {
    return 'PIN code must be 6 digits.'
  }
  return null
}

export const validateMemberNo = (memberNo) => {
  if (!memberNo || memberNo.trim() === '') {
    return 'Member number is required.'
  }
  return null
}

export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required.`
  }
  return null
}

// Ant Design form rule helpers
export const phoneRule = {
  validator(_, value) {
    if (!value) return Promise.resolve()
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      return Promise.reject(new Error('Phone number must be exactly 10 digits.'))
    }
    return Promise.resolve()
  },
}

export const aadhaarRule = {
  validator(_, value) {
    if (!value) return Promise.resolve()
    if (!/^\d{12}$/.test(value)) {
      return Promise.reject(new Error('Aadhaar must be exactly 12 digits.'))
    }
    return Promise.resolve()
  },
}

export const panRule = {
  validator(_, value) {
    if (!value) return Promise.resolve()
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase())) {
      return Promise.reject(new Error('PAN format: ABCDE1234F'))
    }
    return Promise.resolve()
  },
}

export const pinRule = {
  validator(_, value) {
    if (!value) return Promise.resolve()
    if (!/^\d{6}$/.test(value)) {
      return Promise.reject(new Error('PIN code must be 6 digits.'))
    }
    return Promise.resolve()
  },
}
