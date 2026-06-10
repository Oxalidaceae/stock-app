import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SearchBar } from './SearchBar'

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
        </main>
      </div>
    </div>
  )
}
