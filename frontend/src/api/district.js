import api from './axios'

// District Activities
export const getDistrictActivities = (params) => api.get('/district-activities/', { params })
export const getDistrictActivity = (id) => api.get(`/district-activities/${id}/`)
export const createDistrictActivity = (data) => api.post('/district-activities/', data)
export const updateDistrictActivity = (id, data) => api.patch(`/district-activities/${id}/`, data)
export const deleteDistrictActivity = (id) => api.delete(`/district-activities/${id}/`)

// District Schemes
export const getDistrictSchemes = (params) => api.get('/district-schemes/', { params })
export const getDistrictScheme = (id) => api.get(`/district-schemes/${id}/`)
export const createDistrictScheme = (data) => api.post('/district-schemes/', data)
export const updateDistrictScheme = (id, data) => api.patch(`/district-schemes/${id}/`, data)
export const deleteDistrictScheme = (id) => api.delete(`/district-schemes/${id}/`)
