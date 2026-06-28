import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * 렌더링 중 발생한 예외를 잡아 앱 전체가 흰 화면이 되는 것을 막는 전역 폴백.
 * react-query의 데이터 오류는 각 페이지에서 처리하므로, 여기서는
 * 예기치 못한 클라이언트 크래시만 담당한다.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-xl)',
          background: 'var(--bg-primary)',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 520,
            padding: 'var(--space-3xl) var(--space-xl)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '2.5rem',
              lineHeight: 1,
              marginBottom: 'var(--space-lg)',
            }}
          >
            ⚠
          </div>
          <h1 className="page-title" style={{ marginBottom: 'var(--space-sm)' }}>
            문제가 발생했습니다
          </h1>
          <p
            className="page-subtitle"
            style={{ lineHeight: 1.8, marginBottom: 'var(--space-xl)' }}
          >
            화면을 표시하는 중 예기치 못한 오류가 발생했습니다.
            <br />
            잠시 후 페이지를 새로고침해주세요.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.handleReload}
            style={{ justifyContent: 'center' }}
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }
}
