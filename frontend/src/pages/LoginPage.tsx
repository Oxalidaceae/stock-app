import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useCurrentUser, useLogin } from '../hooks/useAuth'
import { useNoIndex } from '../hooks/useNoIndex'

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
            {loginMutation.error.message}
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
