package com.stockapp.domain.post.repository;

import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.PostStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    /** 공개 목록 — 게시된 글만 최신 게시순. */
    Page<Post> findByStatusOrderByPublishedAtDesc(PostStatus status, Pageable pageable);

    /** 사이트맵용 — 게시된 글 전체. */
    List<Post> findAllByStatusOrderByPublishedAtDesc(PostStatus status);

    /**
     * 반응 처리용 — 행 잠금(SELECT ... FOR UPDATE)으로 게시글 단위 직렬화.
     * 동시 반응 시 like/dislike 카운트 lost update 와
     * (post_id, voter_ip_hash) 동시 INSERT 충돌(500)을 방지한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Post p where p.id = :id")
    Optional<Post> findWithLockById(@Param("id") Long id);

    /** 관리자 목록 — 전체 최근 수정순. */
    Page<Post> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    /** 관리자 목록 — 상태 필터 + 최근 수정순. */
    Page<Post> findByStatusOrderByUpdatedAtDesc(PostStatus status, Pageable pageable);
}
