import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'

// 가이드 아티클 톤에 맞춘 마크다운 렌더링. 내부 링크(/로 시작)는 SPA Link 로,
// 외부 링크는 새 탭으로 연다. dangerouslySetInnerHTML 을 쓰지 않아 XSS 안전.

const heading: CSSProperties = { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 'var(--space-xl) 0 var(--space-sm)' }
const h3: CSSProperties = { fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: 'var(--space-lg) 0 var(--space-xs)' }
const para: CSSProperties = { fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.9, margin: '0 0 var(--space-md)' }
const list: CSSProperties = { margin: '0 0 var(--space-md)', paddingLeft: '1.2em', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }
const note: CSSProperties = { border: '1px solid var(--accent-orange-dim)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)', margin: '0 0 var(--space-md)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }
const anchor: CSSProperties = { color: 'var(--accent-orange)' }

const components: Components = {
  h1: ({ children }) => <h2 style={heading}>{children}</h2>,
  h2: ({ children }) => <h2 style={heading}>{children}</h2>,
  h3: ({ children }) => <h3 style={h3}>{children}</h3>,
  p: ({ children }) => <p style={para}>{children}</p>,
  ul: ({ children }) => <ul style={list}>{children}</ul>,
  ol: ({ children }) => <ol style={list}>{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <div style={note}>{children}</div>,
  strong: ({ children }) => <strong style={{ color: 'var(--text-primary)' }}>{children}</strong>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', margin: 'var(--space-lg) 0' }} />,
  a: ({ href, children }) =>
    href && href.startsWith('/')
      ? <Link to={href} style={anchor}>{children}</Link>
      : <a href={href} target="_blank" rel="noopener noreferrer" style={anchor}>{children}</a>,
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  )
}
