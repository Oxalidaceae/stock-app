import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPost, getPosts, reactToPost } from '../api/endpoints'
import type { Post, PostCategory, ReactionType } from '../types/api'

/** category 를 넘기지 않으면 전체 분류. */
export const usePosts = (page: number, category?: PostCategory) =>
  useQuery({
    queryKey: ['posts', category ?? 'ALL', page],
    queryFn: () => getPosts(page, 20, category),
  })

/**
 * 게시된 글이 하나라도 있는지. 게시판이 비어 있는 동안에는 사이드바에서 메뉴를
 * 숨겨, 빈 섹션이 노출되지 않게 한다(글이 올라오면 자동으로 다시 나타난다).
 * 레이아웃 전역에서 쓰이므로 1건만 조회하고 캐시를 길게 잡는다.
 */
export const useHasPosts = () =>
  useQuery({
    queryKey: ['posts', 'any'],
    queryFn: () => getPosts(0, 1).then((p) => p.totalElements > 0),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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
