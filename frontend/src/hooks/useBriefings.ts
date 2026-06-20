import { useQuery } from '@tanstack/react-query'
import { getBriefings } from '../api/endpoints'

export const useBriefings = (ministry: string, page: number, size = 30) =>
  useQuery({
    queryKey: ['briefings', ministry, page, size],
    queryFn: () => getBriefings(ministry, page, size),
    staleTime: 10 * 60 * 1000,  // 10분 — 데몬이 3시간마다 갱신
  })
