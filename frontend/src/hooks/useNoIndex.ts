import { useEffect } from 'react'

export function useNoIndex(title: string) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const created = !robots
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    const previousContent = robots.content
    robots.content = 'noindex, nofollow'

    return () => {
      document.title = previousTitle
      if (created) {
        robots?.remove()
      } else if (robots) {
        robots.content = previousContent
      }
    }
  }, [title])
}
