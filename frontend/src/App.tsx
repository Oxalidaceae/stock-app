import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import StockDetailPage from './pages/StockDetailPage'
import DisclosuresPage from './pages/DisclosuresPage'
import EconomicPage from './pages/EconomicPage'
import ScreenerPage from './pages/ScreenerPage'
import ComparePage from './pages/ComparePage'
import MacroPage from './pages/MacroPage'
import { useThemeStore } from './stores/themeStore'

export default function App() {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/stock/:ticker" element={<StockDetailPage />} />
        <Route path="/disclosures" element={<DisclosuresPage />} />
        <Route path="/economic" element={<EconomicPage />} />
        <Route path="/macro" element={<MacroPage />} />
        <Route path="/screener" element={<ScreenerPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Route>
    </Routes>
  )
}
