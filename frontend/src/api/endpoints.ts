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

export const getBriefingsByDate = (ministry: string | undefined, date: string) =>
  client
    .get<ApiResponse<PolicyBriefing[]>>('/briefings', {
      params: { ministry: ministry || undefined, date },
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
