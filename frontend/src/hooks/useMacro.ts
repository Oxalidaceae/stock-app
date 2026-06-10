import { useQuery } from '@tanstack/react-query'
import { getMacroKeystats } from '../api/endpoints'

export const useMacroKeystats = () =>
  useQuery({
    queryKey: ['macro', 'keystats'],
    queryFn: getMacroKeystats,
    staleTime: 10 * 60 * 1000,  // 10분 — 데몬이 매시간 갱신하므로
  })
