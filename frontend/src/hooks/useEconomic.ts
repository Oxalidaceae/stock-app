import { useQuery } from '@tanstack/react-query'
import { getIndicatorList, getIndicatorData } from '../api/endpoints'

export const useIndicatorList = () =>
  useQuery({
    queryKey: ['economic', 'list'],
    queryFn: getIndicatorList,
    staleTime: 60 * 60 * 1000,
  })

export const useIndicatorData = (statCode: string, start?: string, end?: string) =>
  useQuery({
    queryKey: ['economic', statCode, start, end],
    queryFn: () => getIndicatorData(statCode, start, end),
    enabled: !!statCode,
    staleTime: 60 * 60 * 1000,
  })
