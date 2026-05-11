import { useQuery } from '@tanstack/react-query'
import { searchCompanies, getCompanyDetail } from '../api/endpoints'

export const useCompanySearch = (q: string, market?: string) =>
  useQuery({
    queryKey: ['companies', 'search', q, market],
    queryFn: () => searchCompanies(q, market),
    enabled: q.length >= 1,
    staleTime: 60 * 1000,
  })

export const useCompanyDetail = (ticker: string) =>
  useQuery({
    queryKey: ['companies', ticker],
    queryFn: () => getCompanyDetail(ticker),
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
  })
