import { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SearchBar } from './SearchBar'
import { AdUnit } from './AdUnit'

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
        <Link to="/about" style={{ color: 'var(--text-secondary)' }}>소개</Link>
        <span style={{ opacity: 0.4 }}>·</span>
        <Link to="/contact" style={{ color: 'var(--text-secondary)' }}>문의하기</Link>
        <span style={{ opacity: 0.4 }}>·</span>
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
      <div style={{ marginTop: 8, display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
        <span>© {new Date().getFullYear()} Jipyo (지표). All rights reserved.</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>
          문의:{' '}
          <a href="mailto:jipyopage@gmail.com" style={{ color: 'var(--text-secondary)' }}>
            jipyopage@gmail.com
          </a>
        </span>
      </div>
    </footer>
  )
}

export function Layout() {
  const { pathname } = useLocation()

  // 라우트 이동 시 스크롤을 맨 위로 (푸터 링크 클릭 후에도 새 페이지를 위에서 시작)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <header className="app-topbar">
          <SearchBar />
        </header>
        <div className="app-body">
          <main className="app-content">
            <Outlet />
            <Footer />
          </main>
          <aside className="app-rail" aria-label="광고">
            {/* AdSense 대시보드에서 만든 세로(반응형) 광고 단위의 슬롯 ID로 교체하세요 */}
            <AdUnit slot="0000000000" format="vertical" />
          </aside>
        </div>
      </div>
    </div>
  )
}
