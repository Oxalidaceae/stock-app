import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || '요청에 실패했습니다'
    const isExpectedAuthCheck =
      err.response?.status === 401 && err.config?.url === '/auth/me'
    if (!isExpectedAuthCheck) {
      console.error('[API Error]', message)
    }
    return Promise.reject(new Error(message))
  },
)

export default client
