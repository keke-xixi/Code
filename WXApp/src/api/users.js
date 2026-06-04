import request from '@/utils/request.js'

export const fetchUsers = () => request({ url: '/users' })

export const createUser = (data) =>
  request({ url: '/users', method: 'POST', data })

export const updateUser = (id, data) =>
  request({ url: `/users/${id}`, method: 'PATCH', data })

export const removeUser = (id) =>
  request({ url: `/users/${id}`, method: 'DELETE' })
