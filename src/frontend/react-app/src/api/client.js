const normalize = (base) => {
  if (!base) return ''
  return base.endsWith('/') ? base.slice(0, -1) : base
}

const API_BASE_URL = normalize(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
const ENABLE_BACKEND = (import.meta.env.VITE_ENABLE_BACKEND || 'false').toLowerCase() === 'true'

const defaultHeaders = {
  'Content-Type': 'application/json',
}

const getCsrfToken = () => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

async function request(path, { method = 'GET', data, headers = {}, ...rest } = {}) {
  if (!ENABLE_BACKEND) {
    throw new Error('Backend calls disabled. Set VITE_ENABLE_BACKEND=true to enable API requests.')
  }

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  const options = {
    method,
    headers: { ...defaultHeaders, ...headers },
    credentials: 'include',
    ...rest,
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const token = getCsrfToken()
    if (token && !options.headers['X-CSRFToken']) {
      options.headers['X-CSRFToken'] = token
    }
  }

  if (data !== undefined) {
    if (data instanceof FormData) {
      delete options.headers['Content-Type']
      options.body = data
    } else {
      options.body = JSON.stringify(data)
    }
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API ${method} ${url} failed: ${response.status} ${text}`)
  }

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export function apiGet(path, options) {
  return request(path, { ...options, method: 'GET' })
}

export function apiPost(path, data, options) {
  return request(path, { ...options, method: 'POST', data })
}

export function apiPatch(path, data, options) {
  return request(path, { ...options, method: 'PATCH', data })
}

export function apiDelete(path, options) {
  return request(path, { ...options, method: 'DELETE' })
}

export function isBackendEnabled() {
  return ENABLE_BACKEND
}

export function getApiBaseUrl() {
  return API_BASE_URL
}
