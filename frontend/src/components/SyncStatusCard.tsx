import { useSyncStatus } from '../hooks/useStatus'
import type { SyncStatus } from '../types/api'

const JOB_LABELS: Record<string, string> = {
  disclosures:        '공시',
  daily_prices:       '일별 주가',
  ecos_indicators:    '경제지표 시계열',
  macro_keystats:     '100대 통계지표',
  financial_metrics:  '재무지표',
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  const diffMs = Date.now() - t
  if (Number.isNaN(diffMs) || diffMs < 0) return '방금'
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return '방금'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  return `${day}일 전`
}

function StatusDot({ status }: { status: SyncStatus['status'] }) {
  const color =
    status === 'success' ? 'var(--color-up)'
    : status === 'failed' ? 'var(--color-down)'
    : 'var(--color-warn)'
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        marginRight: 8,
      }}
    />
  )
}

export function SyncStatusCard() {
  const { data, isLoading } = useSyncStatus()
  if (isLoading || !data || data.length === 0) return null

  // 정해진 순서로 정렬
  const order = Object.keys(JOB_LABELS)
  const sorted = [...data].sort((a, b) => {
    const ai = order.indexOf(a.jobName)
    const bi = order.indexOf(b.jobName)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <div className="card-header">
        <span className="card-title">Data Sync Status</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 'normal' }}>
          서버 데이터 마지막 갱신 시점
        </span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-md)',
        marginTop: 'var(--space-sm)',
      }}>
        {sorted.map((s) => (
          <div
            key={s.jobName}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
            }}
            title={s.message || ''}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <StatusDot status={s.status} />
              <span style={{ color: 'var(--text-secondary)' }}>
                {JOB_LABELS[s.jobName] ?? s.jobName}
              </span>
            </div>
            <div style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {timeAgo(s.lastRunAt)}
              {s.records != null && (
                <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  · {s.records.toLocaleString()}건
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
