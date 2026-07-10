import api from './axios'

export const getDashboard = () => api.get('/reports/dashboard/')
export const getMembersSummary = () => api.get('/reports/members-summary/')
export const getChitsSummary = () => api.get('/reports/chits-summary/')
export const getLoansSummary = () => api.get('/reports/loans-summary/')
export const getDuesSummary = () => api.get('/reports/dues-summary/')
export const getOverdueList = () => api.get('/reports/overdue-list/')
export const getPeriodReport = (params) => api.get('/reports/period/', { params })
