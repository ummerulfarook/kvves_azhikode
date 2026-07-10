import api from './axios'

// Committees
export const getCommittees = (params) => api.get('/committees/', { params })
export const getCommittee = (id) => api.get(`/committees/${id}/`)
export const createCommittee = (data) => api.post('/committees/', data)
export const updateCommittee = (id, data) => api.patch(`/committees/${id}/`, data)
export const deleteCommittee = (id) => api.delete(`/committees/${id}/`)

// Community Posts
export const getCommunityPosts = (params) => api.get('/community-posts/', { params })
export const getCommunityPost = (id) => api.get(`/community-posts/${id}/`)
export const createCommunityPost = (formData) =>
  api.post('/community-posts/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateCommunityPost = (id, formData) =>
  api.patch(`/community-posts/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteCommunityPost = (id) => api.delete(`/community-posts/${id}/`)
export const deleteCommunityAttachment = (id) => api.delete(`/community-posts/attachments/${id}/`)
