import request from '@/utils/request.js'

export const login = (username, password) =>
  request({ url: '/auth/login', method: 'POST', data: { username, password } })

export const fetchMe = () => request({ url: '/auth/me' })

export const changePassword = (oldPassword, newPassword) =>
  request({
    url: '/auth/change-password',
    method: 'POST',
    data: { oldPassword, newPassword },
  })
