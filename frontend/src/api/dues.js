import api from './axios'

export const getDeposits = (params) => api.get('/deposits/', { params })
export const createDeposit = (data) => api.post('/deposits/', data)
export const updateDeposit = (id, data) => api.put(`/deposits/${id}/`, data)
export const withdrawDeposit = (id) => api.patch(`/deposits/${id}/withdraw/`)

export const getDues = (params) => api.get('/dues/', { params })
export const createDue = (data) => api.post('/dues/', data)
export const updateDue = (id, data) => api.put(`/dues/${id}/`, data)
export const markDuePaid = (id) => api.patch(`/dues/${id}/mark-paid/`)

export const getOverdueDues = () => api.get('/dues/overdue/')

// Masavari (Monthly Membership Fee)
export const getMasavari = (params) => api.get('/masavari/', { params })
export const createMasavari = (data) => api.post('/masavari/', data)
export const updateMasavari = (id, data) => api.put(`/masavari/${id}/`, data)
export const markMasavariPaid = (id, data) => api.patch(`/masavari/${id}/mark-paid/`, data)
export const getMasavariOverdue = () => api.get('/masavari/overdue/')
