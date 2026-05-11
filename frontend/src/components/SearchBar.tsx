import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompanySearch } from '../hooks/useCompanies'
import { useSearchStore } from '../stores/searchStore'

export function SearchBar() {
  const navigate = useNavigate()
  const { query, isOpen, setQuery, close } = useSearchStore()
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

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

  const handleSelect = (ticker: string) => {
    setQuery('')
    close()
    navigate(`/stock/${ticker}`)
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
      />
      {isOpen && results && results.length > 0 && (
        <div className="search-dropdown">
          {results.slice(0, 10).map((c) => (
            <div
              key={c.id}
              className="search-item"
              onClick={() => handleSelect(c.ticker)}
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
