import { useQuery } from '@tanstack/react-query'
import { getSyncStatus } from '../api/endpoints'

export const useSyncStatus = () =>
  useQuery({
    queryKey: ['status', 'sync'],
    queryFn: getSyncStatus,
    staleTime: 60 * 1000,        // 1분
    refetchInterval: 60 * 1000,  // 자동 갱신
  })
