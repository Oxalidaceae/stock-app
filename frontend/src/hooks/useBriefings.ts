import { useQuery } from '@tanstack/react-query'
import { getBriefingDates, getBriefings } from '../api/endpoints'

export const useBriefingDates = (ministry: string) =>
  useQuery({
    queryKey: ['briefing-dates', ministry],
    queryFn: () => getBriefingDates(ministry),
    staleTime: 10 * 60 * 1000,  // 10분 — 데몬이 매시간 갱신
  })

// date=null 이면 전체(최근순), 날짜 지정 시 그 날짜만. curatedOnly=true 면 게시(요약)분만
export const useBriefings = (ministry: string, date: string | null, curatedOnly: boolean, page: number, size = 30) =>
  useQuery({
    queryKey: ['briefings', ministry, date, curatedOnly, page, size],
    queryFn: () => getBriefings(ministry, date, curatedOnly, page, size),
    staleTime: 10 * 60 * 1000,
  })
