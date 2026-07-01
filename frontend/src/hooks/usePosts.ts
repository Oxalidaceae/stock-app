import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPost, getPosts, reactToPost } from '../api/endpoints'
import type { Post, ReactionType } from '../types/api'

export const usePosts = (page: number) =>
  useQuery({
    queryKey: ['posts', page],
    queryFn: () => getPosts(page),
  })

export const usePost = (id: number, voterId?: string) =>
  useQuery({
    queryKey: ['post', id],
    queryFn: () => getPost(id, voterId),
    enabled: Number.isFinite(id) && id > 0,
  })

export const useReactToPost = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ type, voterId }: { type: ReactionType; voterId: string }) =>
      reactToPost(id, type, voterId),
    onSuccess: (result) => {
      // 상세 캐시에 집계·내 반응 상태 즉시 반영
      queryClient.setQueryData<Post>(['post', id], (prev) =>
        prev
          ? {
              ...prev,
              likeCount: result.likeCount,
              dislikeCount: result.dislikeCount,
              myReaction: result.myReaction,
            }
          : prev,
      )
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
