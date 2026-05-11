import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDividendCalendar } from '../hooks/useDividends'
import { LoadingSpinner } from '../components/LoadingSpinner'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

export default function DividendCalendarPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { data: dividends, isLoading } = useDividendCalendar(year, month)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }

  const getDividendsForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dividends?.filter(d => d.exDividendDate === dateStr) || []
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dividend Calendar</h1>
        <p className="page-subtitle">배당 기준일 기반 월별 캘린더</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'var(--space-xl)' }}>
        <button className="btn btn-sm" onClick={prevMonth}>←</button>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, minWidth: 120, textAlign: 'center' }}>{year}년 {month}월</span>
        <button className="btn btn-sm" onClick={nextMonth}>→</button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="calendar-grid">
          {DAYS.map(d => <div key={d} className="calendar-header">{d}</div>)}
          {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} className="calendar-cell empty" />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dayDividends = getDividendsForDay(day)
            return (
              <div key={day} className="calendar-cell">
                <div className="calendar-day">{day}</div>
                {dayDividends.map(d => (
                  <div key={d.id} className="calendar-event" onClick={() => navigate(`/stock/${d.ticker}`)} title={`${d.companyName} ${d.dividendPerShare?.toLocaleString()}원`}>
                    {d.ticker} {d.dividendPerShare?.toLocaleString()}원
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
