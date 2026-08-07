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
  /** 연속 실패 횟수 (0 = 마지막 실행 성공) */
  consecutiveFailures: number
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

// 원문 요약(summary)은 공개 응답에 담기지 않는다 — PolicyBriefingResponse 주석 참조.
// 편집자용 원문 요약은 AdminBriefing 쪽에 있다.
export interface PolicyBriefing {
  id: number
  title: string
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
  /**
   * 원문 요약 — 관리자 응답에만 있다. 편집자가 큐레이션을 쓸 때 원문 맥락을
   * 보기 위한 것이며, 공개 응답(PolicyBriefing)에는 담기지 않는다.
   */
  summary: string | null
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

/* ── Post (게시판) ───────────────────────────────────── */

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
/** 게시글 분류. 한글 라벨은 lib/postCategory.ts 참고. */
export type PostCategory = 'NOTICE' | 'UPDATE' | 'NOTE'
export type ReactionType = 'LIKE' | 'DISLIKE'

/** 게시판 목록 항목. */
export interface PostSummary {
  id: number
  title: string
  category: PostCategory
  excerpt: string
  likeCount: number
  dislikeCount: number
  authorName: string | null
  publishedAt: string | null
}

/** 게시글 상세 (본문 + 조회자 반응 상태). */
export interface Post {
  id: number
  title: string
  category: PostCategory
  content: string
  likeCount: number
  dislikeCount: number
  authorName: string | null
  publishedAt: string | null
  myReaction: ReactionType | null
}

/** 관리자용 게시글 (상태·타임스탬프 포함). */
export interface AdminPost {
  id: number
  title: string
  content: string
  category: PostCategory
  status: PostStatus
  likeCount: number
  dislikeCount: number
  authorName: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PostRequest {
  title: string
  content: string
  category: PostCategory
  status: PostStatus
}

/** 반응 후 응답 (집계 + 조회자의 현재 반응). */
export interface ReactionResult {
  likeCount: number
  dislikeCount: number
  myReaction: ReactionType | null
}

/* ── Guide (투자 가이드) ─────────────────── */

/** 가이드 목록 항목. */
export interface GuideSummary {
  slug: string
  title: string
  summary: string | null
  tag: string | null
  publishedAt: string | null
}

/** 가이드 상세 (마크다운 본문). */
export interface GuideDetail {
  slug: string
  title: string
  summary: string | null
  tag: string | null
  content: string
  authorName: string | null
  publishedAt: string | null
  updatedAt: string | null
}

/** 관리자용 가이드 (상태·타임스탬프 포함). */
export interface AdminGuide {
  id: number
  slug: string
  title: string
  summary: string | null
  tag: string | null
  content: string
  status: PostStatus
  authorName: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface GuideRequest {
  slug: string
  title: string
  summary: string
  tag: string
  content: string
  status: PostStatus
}
