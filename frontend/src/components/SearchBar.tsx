import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompanySearch } from '../hooks/useCompanies'
import { useSearchStore } from '../stores/searchStore'

const MAX_RESULTS = 10

export function SearchBar() {
  const navigate = useNavigate()
  const { query, isOpen, setQuery, close } = useSearchStore()
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [close])

  const { data: results } = useCompanySearch(debouncedQuery)
  const visible = results?.slice(0, MAX_RESULTS) ?? []

  // 결과가 바뀌면 하이라이트 초기화
  useEffect(() => {
    setActiveIndex(-1)
  }, [debouncedQuery])

  // 선택 항목이 화면에 보이도록 스크롤
  useEffect(() => {
    if (activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const handleSelect = (ticker: string) => {
    setQuery('')
    close()
    navigate(`/stock/${ticker}`)
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
        if (target) handleSelect(target.ticker)
        break
      }
      case 'Escape':
        close()
        break
    }
  }

  return (
    <div className="search-container" ref={ref}>
      <span className="search-icon">⌕</span>
      <input
        className="search-input"
        placeholder="종목명 또는 종목코드 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (query) useSearchStore.getState().open() }}
        onKeyDown={handleKeyDown}
      />
      {isOpen && visible.length > 0 && (
        <div className="search-dropdown">
          {visible.map((c, i) => (
            <div
              key={c.id}
              ref={(el) => { itemRefs.current[i] = el }}
              className={`search-item${i === activeIndex ? ' active' : ''}`}
              onClick={() => handleSelect(c.ticker)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="ticker">{c.ticker}</span>
              <span className="name">{c.companyName}</span>
              <span className={`badge badge-${c.market?.toLowerCase()}`}>
                {c.market}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
