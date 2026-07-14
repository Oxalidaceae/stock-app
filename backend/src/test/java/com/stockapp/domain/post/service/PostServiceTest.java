package com.stockapp.domain.post.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.PostReaction;
import com.stockapp.domain.post.entity.PostStatus;
import com.stockapp.domain.post.entity.ReactionType;
import com.stockapp.domain.post.repository.PostReactionRepository;
import com.stockapp.domain.post.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PostServiceTest {

    private static final String IP_HASH = "ip-hash-a";

    private PostRepository postRepository;
    private PostReactionRepository reactionRepository;
    private PostService postService;

    @BeforeEach
    void setUp() {
        postRepository = mock(PostRepository.class);
        reactionRepository = mock(PostReactionRepository.class);
        postService = new PostService(postRepository, reactionRepository);
    }

    private Post publishedPost() {
        return Post.create("제목", "내용", PostStatus.PUBLISHED, null);
    }

    @Test
    void getPostReturnsMyReactionByIpHash() {
        Post post = publishedPost();
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(reactionRepository.findByPostIdAndVoterIpHash(1L, IP_HASH))
                .thenReturn(Optional.of(PostReaction.of(1L, IP_HASH, "voter", ReactionType.LIKE)));

        var response = postService.getPost(1L, IP_HASH);

        assertThat(response.getMyReaction()).isEqualTo("LIKE");
    }

    @Test
    void getPostRejectsUnpublishedPost() {
        Post draft = Post.create("제목", "내용", PostStatus.DRAFT, null);
        when(postRepository.findById(1L)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> postService.getPost(1L, IP_HASH))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    void reactRejectsUnpublishedPost() {
        Post draft = Post.create("제목", "내용", PostStatus.DRAFT, null);
        when(postRepository.findWithLockById(1L)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> postService.react(1L, ReactionType.LIKE, IP_HASH, "voter"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    void newReactionIncrementsCountAndSaves() {
        Post post = publishedPost();
        when(postRepository.findWithLockById(1L)).thenReturn(Optional.of(post));
        when(reactionRepository.findByPostIdAndVoterIpHash(1L, IP_HASH)).thenReturn(Optional.empty());

        var response = postService.react(1L, ReactionType.LIKE, IP_HASH, "voter");

        assertThat(response.getLikeCount()).isEqualTo(1);
        assertThat(response.getMyReaction()).isEqualTo("LIKE");
        verify(reactionRepository).save(any(PostReaction.class));
    }

    @Test
    void sameReactionTogglesOff() {
        Post post = publishedPost();
        post.adjustCounts(null, ReactionType.LIKE);  // 기존 따봉 1 반영
        PostReaction existing = PostReaction.of(1L, IP_HASH, "voter", ReactionType.LIKE);
        when(postRepository.findWithLockById(1L)).thenReturn(Optional.of(post));
        when(reactionRepository.findByPostIdAndVoterIpHash(1L, IP_HASH)).thenReturn(Optional.of(existing));

        var response = postService.react(1L, ReactionType.LIKE, IP_HASH, "voter");

        assertThat(response.getLikeCount()).isZero();
        assertThat(response.getMyReaction()).isNull();
        verify(reactionRepository).delete(existing);
    }

    @Test
    void oppositeReactionSwitches() {
        Post post = publishedPost();
        post.adjustCounts(null, ReactionType.LIKE);
        PostReaction existing = PostReaction.of(1L, IP_HASH, "voter", ReactionType.LIKE);
        when(postRepository.findWithLockById(1L)).thenReturn(Optional.of(post));
        when(reactionRepository.findByPostIdAndVoterIpHash(1L, IP_HASH)).thenReturn(Optional.of(existing));

        var response = postService.react(1L, ReactionType.DISLIKE, IP_HASH, "voter");

        assertThat(response.getLikeCount()).isZero();
        assertThat(response.getDislikeCount()).isEqualTo(1);
        assertThat(response.getMyReaction()).isEqualTo("DISLIKE");
        assertThat(existing.getType()).isEqualTo(ReactionType.DISLIKE);
        verify(reactionRepository, never()).save(any());
        verify(reactionRepository, never()).delete(any());
    }
}
