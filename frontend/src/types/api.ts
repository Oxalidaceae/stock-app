/* ── 공통 응답 ───────────────────────────────────────── */

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/* ── Company ─────────────────────────────────────────── */

export interface CompanySearch {
  id: number
  ticker: string
  companyName: string
  market: string
  sector: string | null
}

export interface CompanyDetail {
  id: number
  corpCode: string
  ticker: string
  companyName: string
  companyNameEn: string | null
  market: string
  sector: string | null
  industry: string | null
  ceoName: string | null
  listingDate: string | null
  fiscalMonth: number | null
  homepage: string | null
}

/* ── Stock ────────────────────────────────────────────── */

export interface StockPrice {
  tradeDate: string
  openPrice: number
  highPrice: number
  lowPrice: number
  closePrice: number
  volume: number
  marketCap: number | null
}

/* ── Disclosure ───────────────────────────────────────── */

export interface Disclosure {
  id: number
  ticker: string | null
  companyName: string | null
  receptNo: string
  reportName: string
  disclosureType: string | null
  receptDate: string
  submitter: string | null
  dartUrl: string | null
}

/* ── Financial ───────────────────────────────────────── */

export interface FinancialStatement {
  id: number
  fiscalYear: number
  reportCode: string
  fsDiv: string
  accountId: string | null
  accountName: string
  currentAmount: number | null
  previousAmount: number | null
  currency: string
}

export interface FinancialTrendPoint {
  fiscalYear: number
  revenue: number | null
  operatingIncome: number | null
  netIncome: number | null
  totalAssets: number | null
  totalEquity: number | null
  eps: number | null
  operatingMargin: number | null
  netMargin: number | null
  roe: number | null
}

export interface FinancialMetric {
  baseDate: string
  fiscalYear: number
  reportCode: string
  per: number | null
  pbr: number | null
  psr: number | null
  evEbitda: number | null
  roe: number | null
  roa: number | null
  operatingMargin: number | null
  netMargin: number | null
  debtRatio: number | null
  currentRatio: number | null
  dividendYield: number | null
  dps: number | null
  eps: number | null
  bps: number | null
  revenue: number | null
  operatingIncome: number | null
  netIncome: number | null
  totalAssets: number | null
  totalEquity: number | null
}

/* ── Sync Status ──────────────────────────────────────── */

export interface SyncStatus {
  jobName: string
  lastRunAt: string
  status: 'success' | 'failed' | 'partial'
  records: number | null
  durationMs: number | null
  message: string | null
}

/* ── Macro Keystats ───────────────────────────────────── */

export interface MacroKeystat {
  className: string
  keystatName: string
  value: string | null
  unit: string | null
  cycle: string | null
  updatedAt: string | null
  previousValue: string | null
  previousCycle: string | null
  change: number | null
  changePercent: number | null
}

/* ── Policy Briefing (경제 소식) ───────────────────────── */

export interface PolicyBriefing {
  id: number
  title: string
  summary: string | null
  ministry: string | null
  source: string | null
  link: string
  publishedAt: string | null
  editorNote: string | null
  impactTags: string | null
  relatedIndicators: string | null
  reviewedAt: string | null
}

export interface BriefingDate {
  date: string   // 'YYYY-MM-DD'
  count: number
}

export type UserRole = 'ADMIN' | 'USER'

export interface AuthUser {
  id: number
  username: string
  role: UserRole
}

export type EditorialStatus = 'COLLECTED' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface AdminPolicyBriefing extends PolicyBriefing {
  collectedAt: string | null
  editorialStatus: EditorialStatus
  reviewedBy: string | null
  updatedAt: string
}

export interface UpdateBriefingEditorialRequest {
  editorNote: string
  impactTags: string
  relatedIndicators: string
  editorialStatus: EditorialStatus
}

/* ── Economic ────────────────────────────────────────── */

export interface EconomicIndicatorSummary {
  statCode: string
  statName: string
  unit: string
}

export interface EconomicIndicator {
  id: number
  statCode: string
  statName: string
  itemCode: string
  itemName: string
  period: string
  periodType: string
  value: number | null
  unit: string
}

/* ── Screener ────────────────────────────────────────── */

export interface ScreenerRequest {
  market?: string
  perMin?: number
  perMax?: number
  pbrMin?: number
  pbrMax?: number
  roeMin?: number
  roeMax?: number
  operatingMarginMin?: number
  dividendYieldMin?: number
  debtRatioMax?: number
  sortBy?: string
  sortDir?: string
  page?: number
  size?: number
  includeNegativeValuation?: boolean
}

export interface ScreenerResult {
  ticker: string
  companyName: string
  market: string
  sector: string | null
  per: number | null
  pbr: number | null
  roe: number | null
  roa: number | null
  operatingMargin: number | null
  debtRatio: number | null
  dividendYield: number | null
  eps: number | null
  bps: number | null
  revenue: number | null
  netIncome: number | null
}
