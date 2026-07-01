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
import NewsPage from './pages/NewsPage'
import GuidePage from './pages/GuidePage'
import GuideArticlePage from './pages/GuideArticlePage'
import BoardPage from './pages/BoardPage'
import BoardPostPage from './pages/BoardPostPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import NotFoundPage from './pages/NotFoundPage'
import { RequireAdmin } from './components/RequireAdmin'
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
        <Route path="/news" element={<NewsPage />} />
        <Route path="/screener" element={<ScreenerPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/guide/:slug" element={<GuideArticlePage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/board/:id" element={<BoardPostPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={(
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          )}
        />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
