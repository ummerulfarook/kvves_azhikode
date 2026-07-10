import api from './axios'

export const login = (credentials) => api.post('/auth/login/', credentials)
export const logout = (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken })
export const getProfile = () => api.get('/auth/me/')
export const updateProfile = (data) => api.put('/auth/me/', data)
export const changePassword = (data) => api.put('/auth/change-password/', data)

// Admin user management
export const getUsers = (params) => api.get('/admin/users/', { params })
export const createUser = (data) => api.post('/admin/users/', data)
export const updateUser = (id, data) => api.put(`/admin/users/${id}/`, data)
export const toggleUser = (id) => api.patch(`/admin/users/${id}/toggle/`)
