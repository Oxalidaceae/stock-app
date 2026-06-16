import { NavLink } from 'react-router-dom'
import { useThemeStore } from '../stores/themeStore'

const links = [
  { to: '/',            icon: '◉', label: 'Dashboard' },
  { to: '/screener',    icon: '⊞', label: 'Screener' },
  { to: '/compare',     icon: '⇄', label: 'Compare' },
  { to: '/disclosures', icon: '◫', label: 'Disclosures' },
  { to: '/economic',    icon: '◈', label: 'Economic' },
  { to: '/macro',       icon: '◇', label: 'Macro' },
]

export function Sidebar() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <span className="dot" />
        JIPYO
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
      </div>
    </aside>
  )
}
