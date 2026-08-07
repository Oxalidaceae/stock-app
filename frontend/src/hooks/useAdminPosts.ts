import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPost, deletePost, getAdminPosts, updatePost } from '../api/endpoints'
import type { PostCategory, PostRequest, PostStatus } from '../types/api'

export const useAdminPosts = (status: PostStatus | '', category: PostCategory | '', page: number) =>
  useQuery({
    queryKey: ['admin', 'posts', status, category, page],
    queryFn: () => getAdminPosts(status || undefined, category || undefined, page),
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
