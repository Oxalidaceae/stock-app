import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPost, deletePost, getAdminPosts, updatePost } from '../api/endpoints'
import type { PostRequest, PostStatus } from '../types/api'

export const useAdminPosts = (status: PostStatus | '', page: number) =>
  useQuery({
    queryKey: ['admin', 'posts', status, page],
    queryFn: () => getAdminPosts(status || undefined, page),
  })

const useInvalidatePosts = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }
}

export const useCreatePost = () => {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (request: PostRequest) => createPost(request),
    onSuccess: invalidate,
  })
}

export const useUpdatePost = () => {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: PostRequest }) => updatePost(id, request),
    onSuccess: invalidate,
  })
}

export const useDeletePost = () => {
  const invalidate = useInvalidatePosts()
  return useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: invalidate,
  })
}
