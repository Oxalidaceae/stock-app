import { Link } from 'react-router-dom'
import { useNoIndex } from '../hooks/useNoIndex'

export default function NotFoundPage() {
  useNoIndex('페이지를 찾을 수 없습니다 | Jipyo (지표)')

  return (
    <div
      className="card"
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: 'var(--space-3xl) var(--space-xl)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '4rem',
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--accent-orange)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        404
      </div>
      <h1
        className="page-title"
        style={{ marginBottom: 'var(--space-sm)' }}
      >
        페이지를 찾을 수 없습니다
      </h1>
      <p
        className="page-subtitle"
        style={{ lineHeight: 1.8, marginBottom: 'var(--space-xl)' }}
      >
        요청하신 페이지가 존재하지 않거나, 주소가 변경되었을 수 있습니다.
        <br />
        입력하신 주소가 정확한지 다시 한 번 확인해주세요.
      </p>
      <Link to="/" className="btn btn-primary" style={{ justifyContent: 'center' }}>
        홈으로 돌아가기
      </Link>
    </div>
  )
}
