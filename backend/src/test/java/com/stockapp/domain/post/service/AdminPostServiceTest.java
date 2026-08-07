package com.stockapp.domain.post.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.post.dto.PostRequest;
import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.PostCategory;
import com.stockapp.domain.post.entity.PostStatus;
import com.stockapp.domain.post.repository.PostRepository;
import com.stockapp.domain.user.entity.AppUser;
import com.stockapp.domain.user.entity.UserRole;
import com.stockapp.domain.user.repository.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AdminPostServiceTest {

    private PostRepository postRepository;
    private AppUserRepository userRepository;
    private AdminPostService adminPostService;

    @BeforeEach
    void setUp() {
        postRepository = mock(PostRepository.class);
        userRepository = mock(AppUserRepository.class);
        adminPostService = new AdminPostService(postRepository, userRepository);
    }

    private PostRequest request(String title, PostStatus status) {
        return request(title, PostCategory.NOTICE, status);
    }

    private PostRequest request(String title, PostCategory category, PostStatus status) {
        PostRequest request = new PostRequest();
        request.setTitle(title);
        request.setContent("내용");
        request.setCategory(category);
        request.setStatus(status);
        return request;
    }

    /**
     * 상태·분류 필터 조합이 각각 다른 레포지토리 메서드로 갈라진다.
     * 잘못 갈라지면 필터가 조용히 무시돼 "필터가 안 먹는다" 로만 보인다.
     */
    @Test
    void adminListDispatchesByStatusAndCategoryCombination() {
        var onePage = new PageImpl<>(List.of(
                Post.create("제목", "내용", PostCategory.NOTICE, PostStatus.DRAFT, null)));
        when(postRepository.findAllByOrderByUpdatedAtDesc(any(Pageable.class))).thenReturn(onePage);
        when(postRepository.findByStatusOrderByUpdatedAtDesc(any(), any(Pageable.class))).thenReturn(onePage);
        when(postRepository.findByCategoryOrderByUpdatedAtDesc(any(), any(Pageable.class))).thenReturn(onePage);
        when(postRepository.findByStatusAndCategoryOrderByUpdatedAtDesc(any(), any(), any(Pageable.class)))
                .thenReturn(onePage);

        adminPostService.getPosts(null, null, 0, 20);
        verify(postRepository).findAllByOrderByUpdatedAtDesc(any(Pageable.class));

        adminPostService.getPosts(PostStatus.DRAFT, null, 0, 20);
        verify(postRepository).findByStatusOrderByUpdatedAtDesc(eq(PostStatus.DRAFT), any(Pageable.class));

        adminPostService.getPosts(null, PostCategory.UPDATE, 0, 20);
        verify(postRepository).findByCategoryOrderByUpdatedAtDesc(eq(PostCategory.UPDATE), any(Pageable.class));

        adminPostService.getPosts(PostStatus.PUBLISHED, PostCategory.NOTE, 0, 20);
        verify(postRepository).findByStatusAndCategoryOrderByUpdatedAtDesc(
                eq(PostStatus.PUBLISHED), eq(PostCategory.NOTE), any(Pageable.class));
    }

    @Test
    void createStoresRequestedCategory() {
        AppUser author = AppUser.create("admin", "hash", UserRole.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = adminPostService.create(
                request("업데이트 안내", PostCategory.UPDATE, PostStatus.PUBLISHED), 1L);

        assertThat(response.getCategory()).isEqualTo("UPDATE");
    }

    @Test
    void updateCanChangeCategory() {
        Post post = Post.create("제목", "내용", PostCategory.NOTICE, PostStatus.DRAFT, null);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        var response = adminPostService.update(1L, request("제목", PostCategory.NOTE, PostStatus.DRAFT));

        assertThat(response.getCategory()).isEqualTo("NOTE");
    }

    @Test
    void createSavesPostWithAuthor() {
        AppUser author = AppUser.create("admin", "hash", UserRole.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = adminPostService.create(request("  공지  ", PostStatus.PUBLISHED), 1L);

        assertThat(response.getTitle()).isEqualTo("공지");   // trim 확인
        assertThat(response.getStatus()).isEqualTo("PUBLISHED");
        assertThat(response.getAuthorName()).isEqualTo("admin");
        assertThat(response.getPublishedAt()).isNotNull();
    }

    @Test
    void createFailsWhenAuthorMissing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminPostService.create(request("공지", PostStatus.DRAFT), 99L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    void updateFailsWhenPostMissing() {
        when(postRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminPostService.update(1L, request("수정", PostStatus.DRAFT)))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    void updateAppliesChanges() {
        Post post = Post.create("원제목", "원내용", PostCategory.NOTICE, PostStatus.DRAFT, null);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        var response = adminPostService.update(1L, request("새 제목", PostStatus.PUBLISHED));

        assertThat(response.getTitle()).isEqualTo("새 제목");
        assertThat(response.getStatus()).isEqualTo("PUBLISHED");
    }

    @Test
    void deleteRemovesExistingPost() {
        Post post = Post.create("제목", "내용", PostCategory.NOTICE, PostStatus.DRAFT, null);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        adminPostService.delete(1L);

        verify(postRepository).delete(post);
    }
}
