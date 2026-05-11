import { useQuery } from '@tanstack/react-query'
import { getLatestPrice, getChart } from '../api/endpoints'

export const useLatestPrice = (ticker: string) =>
  useQuery({
    queryKey: ['stocks', ticker, 'price'],
    queryFn: () => getLatestPrice(ticker),
    enabled: !!ticker,
    staleTime: 60 * 1000,
  })

export const useChart = (ticker: string, period = '3M') =>
  useQuery({
    queryKey: ['stocks', ticker, 'chart', period],
    queryFn: () => getChart(ticker, period),
    enabled: !!ticker,
    staleTime: 60 * 1000,
  })
