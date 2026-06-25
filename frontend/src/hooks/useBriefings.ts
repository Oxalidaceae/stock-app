import { useQuery } from '@tanstack/react-query'
import { getBriefingDates, getBriefingsByDate } from '../api/endpoints'

export const useBriefingDates = (ministry: string) =>
  useQuery({
    queryKey: ['briefing-dates', ministry],
    queryFn: () => getBriefingDates(ministry),
    staleTime: 10 * 60 * 1000,  // 10분 — 데몬이 매시간 갱신
  })

export const useBriefingsByDate = (ministry: string, date: string | null) =>
  useQuery({
    queryKey: ['briefings', ministry, date],
    queryFn: () => getBriefingsByDate(ministry, date as string),
    enabled: !!date,
    staleTime: 10 * 60 * 1000,
  })
