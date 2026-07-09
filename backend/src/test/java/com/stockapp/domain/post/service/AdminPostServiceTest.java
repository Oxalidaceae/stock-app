package com.stockapp.domain.post.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.post.dto.PostRequest;
import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.PostStatus;
import com.stockapp.domain.post.repository.PostRepository;
import com.stockapp.domain.user.entity.AppUser;
import com.stockapp.domain.user.entity.UserRole;
import com.stockapp.domain.user.repository.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
        PostRequest request = new PostRequest();
        request.setTitle(title);
        request.setContent("내용");
        request.setStatus(status);
        return request;
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
        Post post = Post.create("원제목", "원내용", PostStatus.DRAFT, null);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        var response = adminPostService.update(1L, request("새 제목", PostStatus.PUBLISHED));

        assertThat(response.getTitle()).isEqualTo("새 제목");
        assertThat(response.getStatus()).isEqualTo("PUBLISHED");
    }

    @Test
    void deleteRemovesExistingPost() {
        Post post = Post.create("제목", "내용", PostStatus.DRAFT, null);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        adminPostService.delete(1L);

        verify(postRepository).delete(post);
    }
}
