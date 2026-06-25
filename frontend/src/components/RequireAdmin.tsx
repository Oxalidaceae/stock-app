import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorFallback } from './ErrorFallback'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) {
    return <LoadingSpinner message="관리자 권한 확인 중..." />
  }
  if (isError || !user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  if (user.role !== 'ADMIN') {
    return <ErrorFallback message="관리자 권한이 필요합니다" />
  }
  return children
}
