import { useQuery } from '@tanstack/react-query'
import { getDividendCalendar } from '../api/endpoints'

export const useDividendCalendar = (year: number, month: number) =>
  useQuery({
    queryKey: ['dividends', year, month],
    queryFn: () => getDividendCalendar(year, month),
    staleTime: 60 * 60 * 1000,
  })
