import request from '@/utils/request.js'

export const fetchNotes = (params = {}) =>
  request({ url: '/notes', data: params })

export const fetchNote = (id) => request({ url: `/notes/${id}` })

export const createNote = (data) =>
  request({ url: '/notes', method: 'POST', data })

export const updateNote = (id, data) =>
  request({ url: `/notes/${id}`, method: 'PUT', data })

export const deleteNote = (id) =>
  request({ url: `/notes/${id}`, method: 'DELETE' })
