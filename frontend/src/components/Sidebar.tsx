import { NavLink } from 'react-router-dom'
import { useThemeStore } from '../stores/themeStore'

const links = [
  { to: '/',            icon: '◉', label: '대시보드' },
  { to: '/screener',    icon: '⊞', label: '스크리너' },
  { to: '/compare',     icon: '⇄', label: '종목 비교' },
  { to: '/disclosures', icon: '◫', label: '공시' },
  { to: '/economic',    icon: '◈', label: '경제지표' },
  { to: '/macro',       icon: '◇', label: '거시지표' },
  { to: '/news',        icon: '◰', label: '경제 소식' },
]

export function Sidebar() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <line x1="6" y1="25.5" x2="27.6" y2="25.5" stroke="var(--accent-orange)" strokeOpacity="0.25" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="6"  y="18" width="3.6" height="7"  rx="1.2" fill="var(--accent-orange)" />
          <rect x="12" y="15" width="3.6" height="10" rx="1.2" fill="var(--accent-orange)" />
          <rect x="18" y="12" width="3.6" height="13" rx="1.2" fill="var(--accent-orange)" />
          <rect x="24" y="9"  width="3.6" height="16" rx="1.2" fill="var(--accent-orange)" />
          <circle cx="25.8" cy="9" r="2.4" fill="var(--accent-blue)" style={{ filter: 'drop-shadow(0 0 3px var(--accent-blue))' }} />
        </svg>
        JIPYO
        <span style={{ fontWeight: 400, fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: 0 }}>지표</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
            end={link.to === '/'}
          >
            <span className="icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* 테마 토글 */}
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? '라이트 모드로' : '다크 모드로'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '8px 12px',
          padding: '8px 12px',
          background: 'transparent',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>{theme === 'dark' ? '☀' : '☾'}</span>
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-primary)', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <div style={{ marginBottom: 4 }}>v0.1.0 · 15min delayed</div>
        <div>경제지표: 한국은행 ECOS</div>
        <div>공시/재무: 금융감독원 DART</div>
        <div>주가: FinanceDataReader</div>
        <div>경제 소식: 정책브리핑(공공누리)</div>
      </div>
    </aside>
  )
}
