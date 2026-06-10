import { useMutation } from '@tanstack/react-query'
import { screenStocks } from '../api/endpoints'
import type { ScreenerRequest } from '../types/api'

export const useScreener = () =>
  useMutation({
    mutationFn: (req: ScreenerRequest) => screenStocks(req),
  })
