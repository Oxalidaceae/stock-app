import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// AdSense 퍼블리셔 ID. 승인 후 발급받은 값으로 교체하세요.
// index.html 의 adsbygoogle 스크립트 client 값과 동일해야 합니다.
export const ADSENSE_CLIENT = 'ca-pub-8138774908169765'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

// 퍼블리셔 ID가 실제 값으로 채워졌는지 (ca-pub- + 숫자 16자리)
const isConfigured = /^ca-pub-\d{16}$/.test(ADSENSE_CLIENT)

type AdUnitProps = {
  slot: string
  format?: string
  responsive?: boolean
  style?: React.CSSProperties
  className?: string
}

export function AdUnit({ slot, format = 'auto', responsive = true, style, className }: AdUnitProps) {
  const { pathname } = useLocation()

  // SPA는 라우트가 바뀌어도 페이지가 새로 로드되지 않으므로,
  // 경로 변경마다 광고 슬롯을 다시 채워야 한다.
  useEffect(() => {
    if (!isConfigured) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* 승인 전이거나 중복 push 시 무시 */
    }
  }, [pathname])

  // 퍼블리셔 ID 미설정 시: 레이아웃 확인용 플레이스홀더
  if (!isConfigured) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 600,
          border: '1px dashed var(--border-secondary)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          ...style,
        }}
      >
        광고 영역
      </div>
    )
  }

  return (
    <ins
      // 라우트 변경 시 재마운트 → "이미 광고가 있음" 오류 방지
      key={pathname + slot}
      className={`adsbygoogle${className ? ` ${className}` : ''}`}
      style={{ display: 'block', ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  )
}
