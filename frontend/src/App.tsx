import { lazy, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAdmin } from './components/RequireAdmin'
import { useThemeStore } from './stores/themeStore'

// 라우트별 코드 스플리팅 — 첫 로딩은 공통 셸만 받고, 각 페이지 청크(특히 recharts·
// react-markdown 같은 무거운 의존성)는 해당 라우트 진입 시에만 내려받는다.
// 로딩 폴백은 Layout 의 <Suspense> 가 담당한다.
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const StockDetailPage = lazy(() => import('./pages/StockDetailPage'))
const DisclosuresPage = lazy(() => import('./pages/DisclosuresPage'))
const EconomicPage = lazy(() => import('./pages/EconomicPage'))
const ScreenerPage = lazy(() => import('./pages/ScreenerPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const MacroPage = lazy(() => import('./pages/MacroPage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))
const GuidePage = lazy(() => import('./pages/GuidePage'))
const GuideArticlePage = lazy(() => import('./pages/GuideArticlePage'))
const BoardPage = lazy(() => import('./pages/BoardPage'))
const BoardPostPage = lazy(() => import('./pages/BoardPostPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

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
