import { useQuery } from '@tanstack/react-query'
import { getGuide, getGuides } from '../api/endpoints'

export const useGuides = () =>
  useQuery({
    queryKey: ['guides'],
    queryFn: getGuides,
    staleTime: 5 * 60 * 1000,
  })

export const useGuide = (slug: string | undefined) =>
  useQuery({
    queryKey: ['guide', slug],
    queryFn: () => getGuide(slug!),
    enabled: !!slug,
  })
