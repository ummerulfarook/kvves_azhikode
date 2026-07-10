import api from './axios'

export const getCurries = (params) => api.get('/curries/', { params })
export const getCurry = (id) => api.get(`/curries/${id}/`)
export const createCurry = (data) => api.post('/curries/', data)
export const updateCurry = (id, data) => api.patch(`/curries/${id}/`, data)
export const deleteCurry = (id) => api.delete(`/curries/${id}/`)
export const getCurryStats = () => api.get('/curries/stats/')
export const getOverdueCurryPayments = () => api.get('/curries/overdue/')

export const getCurryParticipants = (curryId) => api.get(`/curries/${curryId}/participants/`)
export const enrollParticipant = (curryId, data) => api.post(`/curries/${curryId}/enroll/`, data)
export const recordCurryPayment = (participantId, data) => api.post(`/curry-participants/${participantId}/payments/`, data)
export const bulkPayCurry = (curryId, payments) => api.post(`/curries/${curryId}/bulk-pay/`, { payments })
