import { useEffect } from 'react'

/** canonical·OG URL 기준이 되는 운영 도메인 (프리렌더 스크립트와 동일). */
const SITE_ORIGIN = 'https://jipyo.net'

interface PageMeta {
  title: string
  description?: string
  /** 절대 경로(예: /stock/005930). 지정 시 canonical 링크를 해당 경로로 설정한다. */
  path?: string
}

/**
 * 동적 라우트(종목 상세 등)의 <title>·description·canonical 을 런타임에 설정한다.
 * 고정 경로는 빌드 타임 프리렌더(scripts/prerender-meta.mjs)가 처리하므로,
 * 이 훅은 프리렌더가 다룰 수 없는 경로에서 JS 실행 크롤러를 위해 사용한다.
 * 언마운트 시 이전 값으로 되돌린다.
 */
export function usePageMeta({ title, description, path }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    let descEl: HTMLMetaElement | null = null
    let descCreated = false
    let previousDesc = ''
    if (description) {
      descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (!descEl) {
        descEl = document.createElement('meta')
        descEl.name = 'description'
        document.head.appendChild(descEl)
        descCreated = true
      }
      previousDesc = descEl.content
      descEl.content = description
    }

    let linkEl: HTMLLinkElement | null = null
    let linkCreated = false
    let previousHref = ''
    if (path) {
      linkEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!linkEl) {
        linkEl = document.createElement('link')
        linkEl.rel = 'canonical'
        document.head.appendChild(linkEl)
        linkCreated = true
      }
      previousHref = linkEl.href
      linkEl.href = `${SITE_ORIGIN}${path}`
    }

    return () => {
      document.title = previousTitle
      if (descEl) {
        if (descCreated) descEl.remove()
        else descEl.content = previousDesc
      }
      if (linkEl) {
        if (linkCreated) linkEl.remove()
        else linkEl.href = previousHref
      }
    }
  }, [title, description, path])
}
