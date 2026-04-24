import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // For cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const url = String(originalRequest.url || '')
    const skipRefresh =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password')

    // If 401 and not already retried, try to refresh token (not for login/register failures or public links)
    const isPublicLink = url.includes('/diagrams/public/')
    if (error.response?.status === 401 && !originalRequest._retry && !skipRefresh && !isPublicLink) {
      originalRequest._retry = true

      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        )

        localStorage.setItem('accessToken', data.data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
