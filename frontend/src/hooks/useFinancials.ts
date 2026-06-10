import { useQuery } from '@tanstack/react-query'
import { getStatements, getMetrics } from '../api/endpoints'

export const useStatements = (ticker: string, year?: number, reportCode?: string, fsDiv?: string) =>
  useQuery({
    queryKey: ['financials', ticker, 'statements', year, reportCode, fsDiv],
    queryFn: () => getStatements(ticker, year, reportCode, fsDiv),
    enabled: !!ticker,
    staleTime: 30 * 60 * 1000,
  })

export const useMetrics = (ticker: string) =>
  useQuery({
    queryKey: ['financials', ticker, 'metrics'],
    queryFn: () => getMetrics(ticker),
    enabled: !!ticker,
    staleTime: 30 * 60 * 1000,
  })
