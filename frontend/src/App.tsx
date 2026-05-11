import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import StockDetailPage from './pages/StockDetailPage'
import DisclosuresPage from './pages/DisclosuresPage'
import EconomicPage from './pages/EconomicPage'
import ScreenerPage from './pages/ScreenerPage'
import DividendCalendarPage from './pages/DividendCalendarPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/stock/:ticker" element={<StockDetailPage />} />
        <Route path="/disclosures" element={<DisclosuresPage />} />
        <Route path="/economic" element={<EconomicPage />} />
        <Route path="/screener" element={<ScreenerPage />} />
        <Route path="/dividends" element={<DividendCalendarPage />} />
      </Route>
    </Routes>
  )
}
