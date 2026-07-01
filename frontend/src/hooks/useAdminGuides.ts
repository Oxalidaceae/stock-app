import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createGuide, deleteGuide, getAdminGuides, updateGuide } from '../api/endpoints'
import type { GuideRequest, PostStatus } from '../types/api'

export const useAdminGuides = (status: PostStatus | '', page: number) =>
  useQuery({
    queryKey: ['admin', 'guides', status, page],
    queryFn: () => getAdminGuides(status || undefined, page),
  })

const useInvalidateGuides = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'guides'] })
    queryClient.invalidateQueries({ queryKey: ['guides'] })
    queryClient.invalidateQueries({ queryKey: ['guide'] })
  }
}

export const useCreateGuide = () => {
  const invalidate = useInvalidateGuides()
  return useMutation({
    mutationFn: (request: GuideRequest) => createGuide(request),
    onSuccess: invalidate,
  })
}

export const useUpdateGuide = () => {
  const invalidate = useInvalidateGuides()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: GuideRequest }) => updateGuide(id, request),
    onSuccess: invalidate,
  })
}

export const useDeleteGuide = () => {
  const invalidate = useInvalidateGuides()
  return useMutation({
    mutationFn: (id: number) => deleteGuide(id),
    onSuccess: invalidate,
  })
}
