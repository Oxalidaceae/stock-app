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

export interface ChartPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PriceChart {
  ticker: string
  period: string
  data: ChartPoint[]
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
