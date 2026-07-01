import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useIndicatorList, useIndicatorData } from '../hooks/useEconomic'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageIntro } from '../components/PageIntro'
import { ErrorFallback } from '../components/ErrorFallback'

/**
 * ECOS period 문자열을 사람이 읽기 쉽게 변환.
 *   "2024"     → "2024"      (연)
 *   "202401"   → "2024-01"   (월)
 *   "2024Q1"   → "2024 Q1"   (분기)
 *   "20240115" → "2024-01-15" (일)
 */
function formatPeriod(period: string): string {
  if (!period) return ''
  if (/^\d{8}$/.test(period)) {
    return `${period.slice(0, 4)}-${period.slice(4, 6)}-${period.slice(6, 8)}`
  }
  if (/^\d{6}$/.test(period)) {
    return `${period.slice(0, 4)}-${period.slice(4, 6)}`
  }
  if (/^\d{4}Q\d$/.test(period)) {
    return `${period.slice(0, 4)} ${period.slice(4)}`
  }
  return period
}

interface ChartPoint {
  period: string
  value: number | null
  pctChange: number | null
  absChange: number | null
}

function periodLabel(periodType: string | undefined): string {
  if (periodType === 'D') return '전일 대비'
  if (periodType === 'Q') return '전분기 대비'
  if (periodType === 'A') return '전년 대비'
  return '전월 대비'
}

interface TooltipPayload {
  payload: ChartPoint
}

function ChangeTooltip(props: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
  unit: string
  changeLabel: string
}) {
  const { active, payload, label, unit, changeLabel } = props
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const { value, pctChange, absChange } = d

  const color =
    pctChange == null ? '#8b8fa3'
    : pctChange > 0 ? '#00c853'
    : pctChange < 0 ? '#ff1744'
    : '#8b8fa3'
  const sign = pctChange != null && pctChange > 0 ? '+' : ''

  return (
    <div style={{
      background: '#12121a',
      border: '1px solid #2a2a3a',
      borderRadius: 6,
      padding: '8px 12px',
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
    }}>
      <div style={{ color: '#8b8fa3', marginBottom: 4 }}>{formatPeriod(String(label ?? ''))}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>
        {value != null ? value.toLocaleString() : '—'}
        <span style={{ color: '#8b8fa3', fontSize: 11, marginLeft: 4 }}>{unit}</span>
      </div>
      {pctChange != null && (
        <div style={{ color, marginTop: 4 }}>
          {changeLabel}: {sign}{pctChange.toFixed(2)}%
          {absChange != null && (
            <span style={{ marginLeft: 6, opacity: 0.8 }}>
              ({sign}{absChange.toLocaleString(undefined, { maximumFractionDigits: 2 })})
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function EconomicPage() {
  const { data: indicators, isLoading: listLoading } = useIndicatorList()
  const [selected, setSelected] = useState('')
  const activeCode = selected || indicators?.[0]?.statCode || ''
  const { data: series, isLoading: seriesLoading } = useIndicatorData(activeCode)
  const activeName = indicators?.find(i => i.statCode === activeCode)?.statName || ''
  const activeUnit = indicators?.find(i => i.statCode === activeCode)?.unit || ''
  const activePeriodType = series?.[0]?.periodType
  const changeLabel = periodLabel(activePeriodType)

  // 전기 대비 변화량/변화율 계산
  const chartData: ChartPoint[] = useMemo(() => {
    if (!series) return []
    return series.map((d, i) => {
      const prev = i > 0 ? series[i - 1].value : null
      let pctChange: number | null = null
      let absChange: number | null = null
      if (d.value != null && prev != null && prev !== 0) {
        absChange = d.value - prev
        pctChange = (absChange / prev) * 100
      }
      return { period: d.period, value: d.value, pctChange, absChange }
    })
  }, [series])

  if (listLoading) return <LoadingSpinner />

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Economic Indicators</h1>
        <p className="page-subtitle">한국은행 ECOS 주요 경제지표</p>
      </div>

      <PageIntro guides={[
        { to: '/guide/base-rate-and-stocks', label: '기준금리와 주식' },
        { to: '/guide/exchange-rate-and-stocks', label: '환율과 주식' },
      ]}>
        금리·환율·물가 같은 거시지표는 개별 종목을 넘어 시장 전체의 방향을 좌우합니다. 이 페이지는
        한국은행 ECOS의 기준금리·소비자물가·원달러 환율·통화량 등 핵심 지표를 최대 10년치 추이와 함께
        정리합니다. 종목을 보기 전에 지금이 어떤 금리·물가 국면인지 확인하는 출발점으로 활용하세요.
      </PageIntro>
      <div className="tab-group">
        {indicators?.map(ind => (
          <div key={ind.statCode} className={`tab${activeCode === ind.statCode ? ' active' : ''}`} onClick={() => setSelected(ind.statCode)}>{ind.statName}</div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <div>
            <span className="card-title">{activeName}</span>
            <span className="card-subtitle" style={{ marginLeft: 8 }}>{activeUnit}</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>출처: 한국은행 ECOS</span>
        </div>
        {seriesLoading ? <LoadingSpinner /> : chartData.length ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fill: '#8b8fa3', fontSize: 11 }}
                axisLine={{ stroke: '#1e1e2e' }}
                tickLine={false}
                tickFormatter={formatPeriod}
                minTickGap={40}
              />
              <YAxis
                tick={{ fill: '#8b8fa3', fontSize: 11 }}
                axisLine={{ stroke: '#1e1e2e' }}
                tickLine={false}
                domain={[
                  (dataMin: number) => Math.floor(dataMin - Math.abs(dataMin) * 0.02),
                  (dataMax: number) => Math.ceil(dataMax + Math.abs(dataMax) * 0.02),
                ]}
                allowDataOverflow={false}
              />
              <Tooltip
                cursor={{ stroke: '#2a2a3a', strokeWidth: 1 }}
                content={(p: any) => <ChangeTooltip {...p} unit={activeUnit} changeLabel={changeLabel} />}
              />
              <Line type="monotone" dataKey="value" stroke="#ff6600" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <ErrorFallback message="데이터가 없습니다" />}
      </div>
      <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-primary)' }}>
        ※ 본 데이터는 한국은행 경제통계시스템(ECOS)의 Open API를 활용하였습니다. 통계 수치는 잠정치일 수 있으며, 확정치 발표 시 변경될 수 있습니다.
      </div>
    </>
  )
}
