export function ok(res, data = null, message = 'ok') {
  return res.json({ code: 200, message, result: data })
}

export function fail(res, code, message) {
  return res.status(code >= 400 ? code : 400).json({ code, message, result: null })
}
