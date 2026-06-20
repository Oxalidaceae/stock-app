import { Outlet, Link } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SearchBar } from './SearchBar'

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-primary)',
        padding: 'var(--space-lg)',
        marginTop: 'var(--space-xl)',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        lineHeight: 1.7,
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 6, flexWrap: 'wrap' }}>
        <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>개인정보처리방침</Link>
        <span style={{ opacity: 0.4 }}>·</span>
        <Link to="/terms" style={{ color: 'var(--text-secondary)' }}>이용약관 및 면책조항</Link>
      </div>
      <div>
        본 사이트의 정보는 투자 참고용이며 투자 권유가 아닙니다. 투자 판단의 책임은 이용자 본인에게 있습니다.
      </div>
      <div style={{ marginTop: 4 }}>
        데이터 출처: 금융감독원 DART · 한국은행 ECOS · FinanceDataReader · 대한민국 정책브리핑(공공누리)
      </div>
    </footer>
  )
}

export function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <header className="app-topbar">
          <SearchBar />
        </header>
        <main className="app-content">
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  )
}
