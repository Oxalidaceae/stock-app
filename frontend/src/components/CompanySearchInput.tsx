import { useEffect, useRef, useState } from 'react'
import { useCompanySearch } from '../hooks/useCompanies'
import type { CompanySearch } from '../types/api'

const MAX_RESULTS = 10

interface Props {
  placeholder?: string
  onSelect: (company: CompanySearch) => void
  excludeTickers?: string[]
  disabled?: boolean
}

/**
 * 종목 자동완성 검색 입력. SearchBar 와 동일한 UX(디바운스 + 화살표·엔터 네비)이지만
 * 전역 store 의존 없이 onSelect 콜백으로 결과를 부모에 전달.
 */
export function CompanySearchInput({
  placeholder = '회사명 또는 종목코드 검색...',
  onSelect,
  excludeTickers = [],
  disabled = false,
}: Props) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // 디바운스
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  // 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: results } = useCompanySearch(debouncedQuery)
  const visible = (results ?? [])
    .filter((c) => !excludeTickers.includes(c.ticker))
    .slice(0, MAX_RESULTS)

  useEffect(() => {
    setActiveIndex(-1)
  }, [debouncedQuery])

  useEffect(() => {
    if (activeIndex >= 0) itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleSelect = (company: CompanySearch) => {
    onSelect(company)
    setQuery('')
    setDebouncedQuery('')
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || visible.length === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % visible.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i <= 0 ? visible.length - 1 : i - 1))
        break
      case 'Enter': {
        e.preventDefault()
        const target = activeIndex >= 0 ? visible[activeIndex] : visible[0]
        if (target) handleSelect(target)
        break
      }
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div className="search-container" ref={ref} style={{ width: '100%' }}>
      <span className="search-icon">⌕</span>
      <input
        className="search-input"
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(e.target.value.length > 0)
        }}
        onFocus={() => {
          if (query) setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
      />
      {isOpen && visible.length > 0 && (
        <div className="search-dropdown">
          {visible.map((c, i) => (
            <div
              key={c.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className={`search-item${i === activeIndex ? ' active' : ''}`}
              onClick={() => handleSelect(c)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="ticker">{c.ticker}</span>
              <span className="name">{c.companyName}</span>
              {c.market && <span className={`badge badge-${c.market.toLowerCase()}`}>{c.market}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
