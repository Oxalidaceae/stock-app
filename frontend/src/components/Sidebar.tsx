import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',            icon: '◉', label: 'Dashboard' },
  { to: '/screener',    icon: '⊞', label: 'Screener' },
  { to: '/disclosures', icon: '◫', label: 'Disclosures' },
  { to: '/economic',    icon: '◈', label: 'Economic' },
]

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <span className="dot" />
        STOCK APP
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
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-primary)', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <div style={{ marginBottom: 4 }}>v0.1.0 · 15min delayed</div>
        <div>경제지표: 한국은행 ECOS</div>
        <div>공시/재무: 금융감독원 DART</div>
        <div>주가: FinanceDataReader</div>
      </div>
    </aside>
  )
}
