import request from '@/utils/request.js'

export const fetchUsers = () => request({ url: '/api/users' })

export const createUser = (data) =>
  request({ url: '/api/users', method: 'POST', data })

export const updateUser = (id, data) =>
  request({ url: `/api/users/${id}`, method: 'PATCH', data })

export const removeUser = (id) =>
  request({ url: `/api/users/${id}`, method: 'DELETE' })
