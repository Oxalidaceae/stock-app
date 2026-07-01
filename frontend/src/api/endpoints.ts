import client from './client'
import type {
  ApiResponse,
  PageResponse,
  CompanySearch,
  CompanyDetail,
  StockPrice,
  Disclosure,
  FinancialStatement,
  FinancialMetric,
  FinancialTrendPoint,
  EconomicIndicatorSummary,
  EconomicIndicator,
  MacroKeystat,
  PolicyBriefing,
  BriefingDate,
  AuthUser,
  AdminPolicyBriefing,
  EditorialStatus,
  UpdateBriefingEditorialRequest,
  SyncStatus,
  ScreenerRequest,
  ScreenerResult,
  PostSummary,
  Post,
  AdminPost,
  PostRequest,
  PostStatus,
  ReactionType,
  ReactionResult,
  GuideSummary,
  GuideDetail,
  AdminGuide,
  GuideRequest,
} from '../types/api'

/* ── Company ─────────────────────────────── */

export const searchCompanies = (q: string, market?: string) =>
  client
    .get<ApiResponse<CompanySearch[]>>('/companies/search', { params: { q, market } })
    .then((r) => r.data.data)

export const getCompanyDetail = (ticker: string) =>
  client
    .get<ApiResponse<CompanyDetail>>(`/companies/${ticker}`)
    .then((r) => r.data.data)

/* ── Stock ────────────────────────────────── */

export const getLatestPrice = (ticker: string) =>
  client
    .get<ApiResponse<StockPrice>>(`/stocks/${ticker}/price`)
    .then((r) => r.data.data)

/* ── Disclosure ───────────────────────────── */

export const getDisclosures = (ticker: string, type?: string, page = 0, size = 20) =>
  client
    .get<ApiResponse<PageResponse<Disclosure>>>('/disclosures', {
      params: { ticker, type, page, size },
    })
    .then((r) => r.data.data)

export const getRecentDisclosures = (page = 0, size = 20, q = '') =>
  client
    .get<ApiResponse<PageResponse<Disclosure>>>('/disclosures/recent', {
      params: { page, size, q: q || undefined },
    })
    .then((r) => r.data.data)

/* ── Financial ────────────────────────────── */

export const getStatements = (
  ticker: string,
  year?: number,
  reportCode?: string,
  fsDiv?: string,
) =>
  client
    .get<ApiResponse<FinancialStatement[]>>(`/financials/${ticker}/statements`, {
      params: { year, reportCode, fsdiv: fsDiv },
    })
    .then((r) => r.data.data)

export const getMetrics = (ticker: string) =>
  client
    .get<ApiResponse<FinancialMetric>>(`/financials/${ticker}/metrics`)
    .then((r) => r.data.data)

export const getFinancialTrend = (ticker: string, reportCode?: string, fsDiv?: string) =>
  client
    .get<ApiResponse<FinancialTrendPoint[]>>(`/financials/${ticker}/trend`, {
      params: { reportCode, fsdiv: fsDiv },
    })
    .then((r) => r.data.data)

/* ── Economic ─────────────────────────────── */

export const getIndicatorList = () =>
  client
    .get<ApiResponse<EconomicIndicatorSummary[]>>('/economic/indicators')
    .then((r) => r.data.data)

export const getIndicatorData = (statCode: string, start?: string, end?: string) =>
  client
    .get<ApiResponse<EconomicIndicator[]>>(`/economic/indicators/${statCode}`, {
      params: { start, end },
    })
    .then((r) => r.data.data)

/* ── Macro ────────────────────────────────── */

export const getMacroKeystats = () =>
  client
    .get<ApiResponse<MacroKeystat[]>>('/macro/keystats')
    .then((r) => r.data.data)

/* ── Policy Briefing (경제 소식) ──────────── */

export const getBriefingDates = (ministry?: string) =>
  client
    .get<ApiResponse<BriefingDate[]>>('/briefings/dates', {
      params: { ministry: ministry || undefined },
    })
    .then((r) => r.data.data)

export const getBriefings = (ministry: string | undefined, date: string | null, curatedOnly: boolean, page = 0, size = 30) =>
  client
    .get<ApiResponse<PageResponse<PolicyBriefing>>>('/briefings', {
      params: { ministry: ministry || undefined, date: date || undefined, curatedOnly: curatedOnly || undefined, page, size },
    })
    .then((r) => r.data.data)

/* ── Authentication ───────────────────────────────────── */

export const login = (username: string, password: string) =>
  client
    .post<ApiResponse<AuthUser>>('/auth/login', { username, password })
    .then((r) => r.data.data)

export const logout = () =>
  client
    .post<ApiResponse<null>>('/auth/logout')
    .then((r) => r.data.data)

export const getCurrentUser = () =>
  client
    .get<ApiResponse<AuthUser>>('/auth/me')
    .then((r) => r.data.data)

/* ── Admin: Policy Briefing ───────────────────────────── */

export const getAdminBriefings = (
  status?: EditorialStatus,
  ministry?: string,
  q?: string,
  page = 0,
  size = 20,
) =>
  client
    .get<ApiResponse<PageResponse<AdminPolicyBriefing>>>('/admin/briefings', {
      params: {
        status: status || undefined,
        ministry: ministry || undefined,
        q: q || undefined,
        page,
        size,
      },
    })
    .then((r) => r.data.data)

export const updateBriefingEditorial = (
  id: number,
  request: UpdateBriefingEditorialRequest,
) =>
  client
    .put<ApiResponse<AdminPolicyBriefing>>(`/admin/briefings/${id}`, request)
    .then((r) => r.data.data)

/* ── Sync Status ──────────────────────────── */

export const getSyncStatus = () =>
  client
    .get<ApiResponse<SyncStatus[]>>('/status/sync')
    .then((r) => r.data.data)

/* ── Screener ─────────────────────────────── */

export const screenStocks = (req: ScreenerRequest) =>
  client
    .post<ApiResponse<PageResponse<ScreenerResult>>>('/screener', req)
    .then((r) => r.data.data)

/* ── Post (게시판) ────────────────────────── */

export const getPosts = (page = 0, size = 20) =>
  client
    .get<ApiResponse<PageResponse<PostSummary>>>('/posts', { params: { page, size } })
    .then((r) => r.data.data)

export const getPost = (id: number, voterId?: string) =>
  client
    .get<ApiResponse<Post>>(`/posts/${id}`, { params: { voterId: voterId || undefined } })
    .then((r) => r.data.data)

export const reactToPost = (id: number, type: ReactionType, voterId: string) =>
  client
    .post<ApiResponse<ReactionResult>>(`/posts/${id}/reaction`, { type, voterId })
    .then((r) => r.data.data)

/* ── Admin: Post ──────────────────────────── */

export const getAdminPosts = (status?: PostStatus, page = 0, size = 20) =>
  client
    .get<ApiResponse<PageResponse<AdminPost>>>('/admin/posts', {
      params: { status: status || undefined, page, size },
    })
    .then((r) => r.data.data)

export const createPost = (request: PostRequest) =>
  client
    .post<ApiResponse<AdminPost>>('/admin/posts', request)
    .then((r) => r.data.data)

export const updatePost = (id: number, request: PostRequest) =>
  client
    .put<ApiResponse<AdminPost>>(`/admin/posts/${id}`, request)
    .then((r) => r.data.data)

export const deletePost = (id: number) =>
  client
    .delete<ApiResponse<null>>(`/admin/posts/${id}`)
    .then((r) => r.data.data)

/* ── Guide (투자 가이드) ──────────────────── */

export const getGuides = () =>
  client
    .get<ApiResponse<GuideSummary[]>>('/guides')
    .then((r) => r.data.data)

export const getGuide = (slug: string) =>
  client
    .get<ApiResponse<GuideDetail>>(`/guides/${slug}`)
    .then((r) => r.data.data)

/* ── Admin: Guide ─────────────────────────── */

export const getAdminGuides = (status?: PostStatus, page = 0, size = 20) =>
  client
    .get<ApiResponse<PageResponse<AdminGuide>>>('/admin/guides', {
      params: { status: status || undefined, page, size },
    })
    .then((r) => r.data.data)

export const createGuide = (request: GuideRequest) =>
  client
    .post<ApiResponse<AdminGuide>>('/admin/guides', request)
    .then((r) => r.data.data)

export const updateGuide = (id: number, request: GuideRequest) =>
  client
    .put<ApiResponse<AdminGuide>>(`/admin/guides/${id}`, request)
    .then((r) => r.data.data)

export const deleteGuide = (id: number) =>
  client
    .delete<ApiResponse<null>>(`/admin/guides/${id}`)
    .then((r) => r.data.data)
