import { useQuery } from '@tanstack/react-query'
import { getLatestPrice } from '../api/endpoints'

export const useLatestPrice = (ticker: string) =>
  useQuery({
    queryKey: ['stocks', ticker, 'price'],
    queryFn: () => getLatestPrice(ticker),
    enabled: !!ticker,
    staleTime: 60 * 1000,
  })
