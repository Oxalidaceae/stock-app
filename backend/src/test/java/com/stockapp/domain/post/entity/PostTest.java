package com.stockapp.domain.post.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PostTest {

    @Test
    void createInitializesCountsAndDraftHasNoPublishedAt() {
        Post post = Post.create("제목", "내용", PostCategory.NOTICE, PostStatus.DRAFT, null);

        assertThat(post.getLikeCount()).isZero();
        assertThat(post.getDislikeCount()).isZero();
        assertThat(post.getPublishedAt()).isNull();
        assertThat(post.getTitle()).isEqualTo("제목");
    }

    @Test
    void publishedAtIsSetOnFirstPublishAndKeptAfterwards() {
        Post post = Post.create("제목", "내용", PostCategory.NOTICE, PostStatus.PUBLISHED, null);
        var firstPublishedAt = post.getPublishedAt();
        assertThat(firstPublishedAt).isNotNull();

        // 임시저장으로 내렸다가 다시 게시해도 최초 게시 시각 유지
        post.update("제목", "내용", PostCategory.NOTICE, PostStatus.DRAFT);
        post.update("제목", "내용", PostCategory.NOTICE, PostStatus.PUBLISHED);

        assertThat(post.getPublishedAt()).isEqualTo(firstPublishedAt);
    }

    @Test
    void adjustCountsHandlesAddCancelAndSwitch() {
        Post post = Post.create("제목", "내용", PostCategory.NOTICE, PostStatus.PUBLISHED, null);

        post.adjustCounts(null, ReactionType.LIKE);              // 신규 따봉
        assertThat(post.getLikeCount()).isEqualTo(1);

        post.adjustCounts(ReactionType.LIKE, ReactionType.DISLIKE); // 전환
        assertThat(post.getLikeCount()).isZero();
        assertThat(post.getDislikeCount()).isEqualTo(1);

        post.adjustCounts(ReactionType.DISLIKE, null);           // 취소
        assertThat(post.getDislikeCount()).isZero();
    }

    @Test
    void adjustCountsNeverGoesNegative() {
        Post post = Post.create("제목", "내용", PostCategory.NOTICE, PostStatus.PUBLISHED, null);

        // 집계가 0인 상태에서 감소가 들어와도 음수가 되지 않는다
        post.adjustCounts(ReactionType.LIKE, null);
        post.adjustCounts(ReactionType.DISLIKE, null);

        assertThat(post.getLikeCount()).isZero();
        assertThat(post.getDislikeCount()).isZero();
    }
}
