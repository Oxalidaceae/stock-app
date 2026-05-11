import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useIndicatorList, useIndicatorData } from '../hooks/useEconomic'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorFallback } from '../components/ErrorFallback'

export default function EconomicPage() {
  const { data: indicators, isLoading: listLoading } = useIndicatorList()
  const [selected, setSelected] = useState('')
  const activeCode = selected || indicators?.[0]?.statCode || ''
  const { data: series, isLoading: seriesLoading } = useIndicatorData(activeCode)
  const activeName = indicators?.find(i => i.statCode === activeCode)?.statName || ''
  const activeUnit = indicators?.find(i => i.statCode === activeCode)?.unit || ''

  if (listLoading) return <LoadingSpinner />

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Economic Indicators</h1>
        <p className="page-subtitle">한국은행 ECOS 주요 경제지표</p>
      </div>
      <div className="tab-group">
        {indicators?.map(ind => (
          <div key={ind.statCode} className={`tab${activeCode === ind.statCode ? ' active' : ''}`} onClick={() => setSelected(ind.statCode)}>{ind.statName}</div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <span className="card-title">{activeName}</span>
          <span className="card-subtitle">{activeUnit}</span>
        </div>
        {seriesLoading ? <LoadingSpinner /> : series?.length ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={series.map(d => ({ period: d.period, value: d.value }))}>
              <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fill: '#8b8fa3', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} tickLine={false} />
              <YAxis tick={{ fill: '#8b8fa3', fontSize: 11 }} axisLine={{ stroke: '#1e1e2e' }} tickLine={false} />
              <Tooltip contentStyle={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 6, fontSize: 12 }} />
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
