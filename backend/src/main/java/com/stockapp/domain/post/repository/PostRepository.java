package com.stockapp.domain.post.repository;

import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    /** 공개 목록 — 게시된 글만 최신 게시순. */
    Page<Post> findByStatusOrderByPublishedAtDesc(PostStatus status, Pageable pageable);

    /** 사이트맵용 — 게시된 글 전체. */
    List<Post> findAllByStatusOrderByPublishedAtDesc(PostStatus status);

    /** 관리자 목록 — 전체 최근 수정순. */
    Page<Post> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    /** 관리자 목록 — 상태 필터 + 최근 수정순. */
    Page<Post> findByStatusOrderByUpdatedAtDesc(PostStatus status, Pageable pageable);
}
