import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminBriefings, updateBriefingEditorial } from '../api/endpoints'
import type { EditorialStatus, UpdateBriefingEditorialRequest } from '../types/api'

export const useAdminBriefings = (
  status: EditorialStatus | '',
  ministry: string,
  q: string,
  page: number,
) =>
  useQuery({
    queryKey: ['admin', 'briefings', status, ministry, q, page],
    queryFn: () => getAdminBriefings(status || undefined, ministry, q, page),
  })

export const useUpdateBriefingEditorial = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number
      request: UpdateBriefingEditorialRequest
    }) => updateBriefingEditorial(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'briefings'] })
      queryClient.invalidateQueries({ queryKey: ['briefings'] })
    },
  })
}
