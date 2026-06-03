import request from '@/utils/request.js'

export const login = (username, password) =>
  request({ url: '/api/auth/login', method: 'POST', data: { username, password } })

export const fetchMe = () => request({ url: '/api/auth/me' })

export const changePassword = (oldPassword, newPassword) =>
  request({
    url: '/api/auth/change-password',
    method: 'POST',
    data: { oldPassword, newPassword },
  })
