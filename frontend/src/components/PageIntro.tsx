import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PageIntroProps {
  /** 페이지가 무엇을·어디서·어떻게 읽는지 설명하는 원본 문단. */
  children: ReactNode
  /** 개념을 더 알고 싶을 때 연결할 가이드 아티클(선택). */
  guides?: { to: string; label: string }[]
}

/**
 * 데이터 페이지 상단에 원본 설명 문단을 얹어, 표·차트만 있던 페이지에
 * 맥락(콘텐츠)을 더한다. 관련 투자 가이드로 내부 링크도 함께 제공한다.
 */
export function PageIntro({ children, guides }: PageIntroProps) {
  return (
    <div
      className="card"
      style={{
        marginBottom: 'var(--space-xl)',
        padding: 'var(--space-lg) var(--space-xl)',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.8,
      }}
    >
      {children}
      {guides && guides.length > 0 && (
        <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap', fontSize: '0.78rem' }}>
          {guides.map((g) => (
            <Link key={g.to} to={g.to} style={{ color: 'var(--accent-orange)', whiteSpace: 'nowrap' }}>
              {g.label} →
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
