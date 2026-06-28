import axios from 'axios'

/** API 호출 실패 시 HTTP 상태 코드를 함께 전달하는 에러 */
export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const message =
      err.response?.data?.message || err.message || '요청에 실패했습니다'
    const isExpectedAuthCheck = status === 401 && err.config?.url === '/auth/me'
    if (!isExpectedAuthCheck) {
      console.error('[API Error]', message)
    }
    return Promise.reject(new ApiError(message, status))
  },
)

export default client
