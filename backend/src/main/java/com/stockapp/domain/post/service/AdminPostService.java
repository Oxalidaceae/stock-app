package com.stockapp.domain.post.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.post.dto.AdminPostResponse;
import com.stockapp.domain.post.dto.PostRequest;
import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.PostStatus;
import com.stockapp.domain.post.repository.PostRepository;
import com.stockapp.domain.user.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminPostService {

    private final PostRepository postRepository;
    private final AppUserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminPostResponse> getPosts(PostStatus status, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        var pageable = PageRequest.of(Math.max(page, 0), safeSize);
        var result = (status == null
                ? postRepository.findAllByOrderByUpdatedAtDesc(pageable)
                : postRepository.findByStatusOrderByUpdatedAtDesc(status, pageable))
                .map(AdminPostResponse::from);
        return PageResponse.from(result);
    }

    @Transactional
    public AdminPostResponse create(PostRequest request, Long authorId) {
        var author = userRepository.findById(authorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다"));
        Post post = Post.create(request.getTitle(), request.getContent(), request.getStatus(), author);
        return AdminPostResponse.from(postRepository.save(post));
    }

    @Transactional
    public AdminPostResponse update(Long id, PostRequest request) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다"));
        post.update(request.getTitle(), request.getContent(), request.getStatus());
        return AdminPostResponse.from(post);
    }

    @Transactional
    public void delete(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다"));
        postRepository.delete(post);
    }
}
