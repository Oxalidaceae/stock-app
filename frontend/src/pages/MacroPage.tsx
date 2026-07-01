import { useMemo } from 'react'
import { useMacroKeystats } from '../hooks/useMacro'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'
import { PageIntro } from '../components/PageIntro'
import type { MacroKeystat } from '../types/api'

// 핵심 지표 8개 — 카드 강조 표시
const HIGHLIGHT_KEYSTATS = new Set([
  '한국은행 기준금리',
  '원/달러 환율(종가)',
  '코스피지수',
  '경제성장률(실질, 계절조정 전기대비)',
  '소비자물가지수',  // 100대 지표 명 확정 후 보정 가능
  'M2(광의통화, 평잔)',
  '경상수지',
  '국고채수익률(3년)',
])

/**
 * cycle 문자열을 사람이 읽기 쉽게.
 *   "20260608" → "2026-06-08"
 *   "202604"   → "2026-04"
 *   "2026Q1"   → "2026 Q1"
 */
function formatCycle(cycle: string | null): string {
  if (!cycle) return ''
  if (/^\d{8}$/.test(cycle)) return `${cycle.slice(0, 4)}-${cycle.slice(4, 6)}-${cycle.slice(6, 8)}`
  if (/^\d{6}$/.test(cycle)) return `${cycle.slice(0, 4)}-${cycle.slice(4, 6)}`
  if (/^\d{4}Q\d$/.test(cycle)) return `${cycle.slice(0, 4)} ${cycle.slice(4)}`
  return cycle
}

function ChangeBadge({ item }: { item: MacroKeystat }) {
  if (item.change == null) return null

  const color =
    item.change > 0 ? '#00c853'
    : item.change < 0 ? '#ff1744'
    : '#8b8fa3'
  const arrow = item.change > 0 ? '▲' : item.change < 0 ? '▼' : '–'
  const sign = item.change > 0 ? '+' : ''

  return (
    <span style={{ color, fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>
      {arrow} {sign}{item.change.toLocaleString()}
      {item.changePercent != null && (
        <span style={{ marginLeft: 4, opacity: 0.85 }}>
          ({sign}{item.changePercent.toFixed(2)}%)
        </span>
      )}
    </span>
  )
}

function MacroCard({ item, highlight }: { item: MacroKeystat; highlight?: boolean }) {
  return (
    <div
      className="card"
      style={{
        borderColor: highlight ? 'var(--accent-orange-dim)' : undefined,
        padding: 'var(--space-md) var(--space-lg)',
      }}
    >
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>
        {item.className}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, minHeight: '2.4em' }}>
        {item.keystatName}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {item.value ?? '—'}
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>{item.unit}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, minHeight: '1em' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {formatCycle(item.cycle)}
        </span>
        <ChangeBadge item={item} />
      </div>
    </div>
  )
}

export default function MacroPage() {
  const { data, isLoading, error } = useMacroKeystats()

  const { highlights, grouped } = useMemo(() => {
    const list = data ?? []
    const highlights = list.filter((it) => HIGHLIGHT_KEYSTATS.has(it.keystatName))
    const byClass = new Map<string, MacroKeystat[]>()
    for (const it of list) {
      if (!byClass.has(it.className)) byClass.set(it.className, [])
      byClass.get(it.className)!.push(it)
    }
    return { highlights, grouped: Array.from(byClass.entries()) }
  }, [data])

  if (isLoading) return <LoadingSpinner message="거시 지표 로딩 중..." />
  if (error) return <ErrorFallback />

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Macro Economics</h1>
        <p className="page-subtitle">한국은행 100대 통계지표 — 거시경제 한눈에 보기</p>
      </div>

      <PageIntro guides={[{ to: '/guide/base-rate-and-stocks', label: '기준금리와 주식' }]}>
        한국은행이 선정한 ‘100대 통계지표’는 시장금리·환율·통화량·성장률 등 한국 경제를 폭넓게
        조망하는 대표 지표 묶음입니다. 이 페이지는 그 지표들을 분야별로 모아 매시간 갱신해 보여줍니다.
        개별 종목보다 경기와 유동성의 큰 흐름을 읽고 싶을 때 참고하세요.
      </PageIntro>

      {/* 핵심 지표 — 강조 카드 */}
      {highlights.length > 0 && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', paddingLeft: 'var(--space-sm)' }}>
            ◉ Key Indicators
          </div>
          <div className="grid-4">
            {highlights.map((it) => (
              <MacroCard key={`${it.className}-${it.keystatName}`} item={it} highlight />
            ))}
          </div>
        </div>
      )}

      {/* 카테고리별 전체 */}
      {grouped.map(([cls, items]) => (
        <div key={cls} style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', paddingLeft: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent-orange)' }}>▸</span>
            {cls}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{items.length}</span>
          </div>
          <div className="grid-4">
            {items.map((it) => (
              <MacroCard key={`${it.className}-${it.keystatName}`} item={it} />
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-primary)' }}>
        ※ 한국은행 경제통계시스템(ECOS)의 100대 통계지표 API를 활용. 데이터 시점은 카드별로 다르며, 매시간 자동 갱신됩니다.
      </div>
    </>
  )
}
