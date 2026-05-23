import { useQuery } from '@tanstack/react-query'
import { getDisclosures, getRecentDisclosures } from '../api/endpoints'

export const useDisclosures = (ticker: string, type?: string, page = 0, size = 20) =>
  useQuery({
    queryKey: ['disclosures', ticker, type, page, size],
    queryFn: () => getDisclosures(ticker, type, page, size),
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
  })

export const useRecentDisclosures = (page = 0, size = 20, q = '') =>
  useQuery({
    queryKey: ['disclosures', 'recent', page, size, q],
    queryFn: () => getRecentDisclosures(page, size, q),
    staleTime: 5 * 60 * 1000,
  })
