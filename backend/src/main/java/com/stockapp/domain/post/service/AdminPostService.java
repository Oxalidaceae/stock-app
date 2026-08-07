package com.stockapp.domain.post.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.common.response.PageResponse;
import com.stockapp.common.util.Pagination;
import com.stockapp.domain.post.dto.AdminPostResponse;
import com.stockapp.domain.post.dto.PostRequest;
import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.PostCategory;
import com.stockapp.domain.post.entity.PostStatus;
import com.stockapp.domain.post.repository.PostRepository;
import com.stockapp.domain.user.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminPostService {

    private final PostRepository postRepository;
    private final AppUserRepository userRepository;

    /** status·category 는 각각 null 이면 해당 조건을 걸지 않는다. */
    @Transactional(readOnly = true)
    public PageResponse<AdminPostResponse> getPosts(PostStatus status, PostCategory category, int page, int size) {
        var pageable = Pagination.adminPage(page, size);
        Page<Post> found;
        if (category == null) {
            found = (status == null)
                    ? postRepository.findAllByOrderByUpdatedAtDesc(pageable)
                    : postRepository.findByStatusOrderByUpdatedAtDesc(status, pageable);
        } else {
            found = (status == null)
                    ? postRepository.findByCategoryOrderByUpdatedAtDesc(category, pageable)
                    : postRepository.findByStatusAndCategoryOrderByUpdatedAtDesc(status, category, pageable);
        }
        return PageResponse.from(found.map(AdminPostResponse::from));
    }

    @Transactional
    public AdminPostResponse create(PostRequest request, Long authorId) {
        var author = userRepository.findById(authorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다"));
        Post post = Post.create(request.getTitle(), request.getContent(),
                request.getCategory(), request.getStatus(), author);
        return AdminPostResponse.from(postRepository.save(post));
    }

    @Transactional
    public AdminPostResponse update(Long id, PostRequest request) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다"));
        post.update(request.getTitle(), request.getContent(), request.getCategory(), request.getStatus());
        return AdminPostResponse.from(post);
    }

    @Transactional
    public void delete(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다"));
        postRepository.delete(post);
    }
}
