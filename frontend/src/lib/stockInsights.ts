// 종목 상세 페이지의 "지표 해석" 자동 요약.
//
// 목적: 지표 숫자만 나열하던 페이지에 부가가치(해석·맥락)를 더한다.
// 각 문장은 해당 종목의 '실제 값'에 따라 달라지므로 종목마다 내용이 달라진다
// (동일 템플릿을 전 종목에 복제하는 auto-generated/중복 콘텐츠 함정을 피함).
// 어디까지나 공개 데이터를 기준값과 비교한 기계적 요약이며 투자 권유가 아니다.

import type { FinancialMetric, FinancialTrendPoint } from '../types/api'

export interface StockInsight {
  key: string
  /** 항목명 (예: '밸류에이션'). */
  label: string
  /** 해당 종목 값에 근거한 해석 문장. */
  text: string
  /** 개념을 더 알고 싶을 때 연결할 가이드 아티클. */
  guide?: { to: string; label: string }
}

const G_PER = { to: '/guide/per-pbr-valuation', label: 'PER·PBR 읽는 법' }
const G_ROE = { to: '/guide/roe-roa-profitability', label: 'ROE·ROA 읽는 법' }
const G_FS = { to: '/guide/financial-statements-basics', label: '재무제표 읽는 법' }
const G_RATE = { to: '/guide/base-rate-and-stocks', label: '기준금리와 주식' }

export function buildStockInsights(
  metrics: FinancialMetric | undefined,
  trend: FinancialTrendPoint[] | undefined,
): StockInsight[] {
  const insights: StockInsight[] = []
  if (!metrics) return insights

  const { per, pbr, roe, debtRatio, dividendYield } = metrics

  // 밸류에이션 — PER
  if (per != null && per > 0) {
    const band =
      per < 10 ? '이익 대비 낮은 편으로, 시장이 저평가하거나 이익 둔화를 예상할 때 나타나는 구간입니다'
        : per <= 20 ? '국내 증시에서 흔히 보이는 보통 수준입니다'
          : '이익 대비 높은 편으로, 향후 이익 성장 기대가 반영됐을 수 있습니다'
    insights.push({ key: 'per', label: '밸류에이션', text: `PER ${per.toFixed(1)}배 — ${band}.`, guide: G_PER })
  }

  // 자산 대비 주가 — PBR
  if (pbr != null && pbr > 0) {
    const band =
      pbr < 1 ? '주가가 장부상 순자산보다 낮은 1배 미만 구간입니다'
        : pbr <= 2 ? '순자산 대비 보통 수준입니다'
          : '순자산 대비 높은 편입니다'
    insights.push({ key: 'pbr', label: '자산 대비 주가', text: `PBR ${pbr.toFixed(2)}배 — ${band}. 업종 특성에 따라 정상 범위가 다릅니다.`, guide: G_PER })
  }

  // 수익성 — ROE
  if (roe != null) {
    const band =
      roe < 0 ? '적자 상태로, 자기자본을 까먹고 있는 구간입니다'
        : roe >= 15 ? '자본을 효율적으로 굴리는 우수한 편입니다'
          : roe >= 8 ? '보통 수준입니다'
            : '다소 낮은 편입니다'
    insights.push({ key: 'roe', label: '수익성', text: `ROE ${roe.toFixed(1)}% — ${band}.`, guide: G_ROE })
  }

  // 재무 안정성 — 부채비율
  if (debtRatio != null) {
    const band =
      debtRatio < 100 ? '100% 미만으로 재무 안정성이 양호한 편입니다'
        : debtRatio < 200 ? '보통 수준입니다'
          : '높은 편으로, 이자 부담과 금리 민감도를 함께 살펴야 합니다'
    insights.push({ key: 'debt', label: '재무 안정성', text: `부채비율 ${debtRatio.toFixed(0)}% — ${band}.`, guide: G_FS })
  }

  // 배당 — 배당수익률
  if (dividendYield != null && dividendYield > 0) {
    insights.push({
      key: 'dividend',
      label: '배당',
      text: `배당수익률 ${dividendYield.toFixed(2)}% 수준입니다. 금리 환경에 따라 배당주의 상대 매력은 달라집니다.`,
      guide: G_RATE,
    })
  }

  // 매출 추세 — 재무 추이 첫 해 대비 최근 해
  if (trend && trend.length >= 2) {
    const withRev = trend
      .filter((t): t is FinancialTrendPoint & { revenue: number } => t.revenue != null && t.revenue > 0)
      .sort((a, b) => a.fiscalYear - b.fiscalYear)
    if (withRev.length >= 2) {
      const first = withRev[0]
      const last = withRev[withRev.length - 1]
      const chg = ((last.revenue - first.revenue) / first.revenue) * 100
      const dir = chg > 5 ? '증가' : chg < -5 ? '감소' : '보합'
      insights.push({
        key: 'trend',
        label: '매출 추세',
        text: `${first.fiscalYear}~${last.fiscalYear}년 매출은 ${dir} 흐름입니다(누적 ${chg >= 0 ? '+' : ''}${chg.toFixed(0)}%). 한 시점의 지표보다 추세가 더 많은 것을 말해줍니다.`,
        guide: G_FS,
      })
    }
  }

  return insights
}
