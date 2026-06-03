import request from '@/utils/request.js'

export const fetchNotes = (params = {}) =>
  request({ url: '/api/notes', data: params })

export const fetchNote = (id) => request({ url: `/api/notes/${id}` })

export const createNote = (data) =>
  request({ url: '/api/notes', method: 'POST', data })

export const updateNote = (id, data) =>
  request({ url: `/api/notes/${id}`, method: 'PUT', data })

export const deleteNote = (id) =>
  request({ url: `/api/notes/${id}`, method: 'DELETE' })
