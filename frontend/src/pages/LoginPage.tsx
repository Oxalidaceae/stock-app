import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useCurrentUser, useLogin } from '../hooks/useAuth'
import { useNoIndex } from '../hooks/useNoIndex'

/** 로그인 실패 사유를 사용자가 이해하기 쉬운 문구로 변환한다. */
function loginErrorMessage(error: Error): string {
  const status = error instanceof ApiError ? error.status : undefined
  // 인증 실패(잘못된 자격 증명 또는 권한 거부)
  if (status === 401 || status === 403) {
    return '아이디 또는 비밀번호가 일치하지 않습니다.'
  }
  // 로그인 시도 횟수 초과 등 서버가 안내 문구를 내려준 경우
  if (status === 429) {
    return error.message
  }
  return '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
}

export default function LoginPage() {
  useNoIndex('로그인 | Jipyo (지표)')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: currentUser, isLoading: currentUserLoading } = useCurrentUser()
  const loginMutation = useLogin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (!currentUserLoading && currentUser?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    loginMutation.mutate(
      { username, password },
      {
        onSuccess: (user) => {
          const requested = searchParams.get('next')
          const destination =
            user.role === 'ADMIN' && requested?.startsWith('/admin')
              ? requested
              : user.role === 'ADMIN'
                ? '/admin'
                : '/'
          navigate(destination, { replace: true })
        },
      },
    )
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">로그인</h1>
        <p className="page-subtitle">Jipyo 계정으로 로그인합니다</p>
      </div>

      <form
        className="card"
        onSubmit={submit}
        style={{ maxWidth: 420, padding: 'var(--space-xl)' }}
      >
        <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
          <label className="form-label" htmlFor="login-username">아이디</label>
          <input
            id="login-username"
            className="form-input"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
          <label className="form-label" htmlFor="login-password">비밀번호</label>
          <input
            id="login-password"
            className="form-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {loginMutation.isError && (
          <div
            role="alert"
            style={{
              color: 'var(--color-down)',
              fontSize: '0.8rem',
              marginBottom: 'var(--space-md)',
            }}
          >
            {loginErrorMessage(loginMutation.error)}
          </div>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loginMutation.isPending}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loginMutation.isPending ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </>
  )
}
