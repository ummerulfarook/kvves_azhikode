import api from './axios'

export const getChitGroups = (params) => api.get('/chit-groups/', { params })
export const getChitGroup = (id) => api.get(`/chit-groups/${id}/`)
export const createChitGroup = (data) => api.post('/chit-groups/', data)
export const updateChitGroup = (id, data) => api.put(`/chit-groups/${id}/`, data)
export const patchChitGroup = (id, data) => api.patch(`/chit-groups/${id}/`, data)
export const deleteChitGroup = (id) => api.delete(`/chit-groups/${id}/`)

export const getEnrollments = (groupId) => api.get(`/chit-groups/${groupId}/enrollments/`)
export const getAllEnrollments = (params) => api.get('/enrollments/', { params })
export const enrollMember = (groupId, data) => api.post(`/chit-groups/${groupId}/enroll/`, data)
export const updateEnrollment = (eid, data) => api.put(`/enrollments/${eid}/`, data)
export const patchEnrollment = (eid, data) => api.patch(`/enrollments/${eid}/`, data)
export const deleteEnrollment = (eid) => api.delete(`/enrollments/${eid}/`)

export const getPayments = (enrollmentId) => api.get(`/enrollments/${enrollmentId}/payments/`)
export const recordPayment = (enrollmentId, data) => api.post(`/enrollments/${enrollmentId}/payments/`, data)
export const updatePayment = (pid, data) => api.put(`/payments/${pid}/`, data)

export const getOverdueChits = (params) => api.get('/chits/overdue/', { params })
export const clearDuesUpToMonth = (enrollmentId, data) => api.post(`/enrollments/${enrollmentId}/clear-dues/`, data)

export const getActiveAuction = (groupId, month) => api.get(`/chit-groups/${groupId}/active-auction/`, { params: month ? { month } : {} })
export const completeActiveAuction = (groupId, data) => api.post(`/chit-groups/${groupId}/active-auction/complete/`, data)
export const getWelfareAuctions = (groupId) => api.get(`/chit-groups/${groupId}/auctions/`)
