package com.stockapp.domain.post.repository;

import com.stockapp.domain.post.entity.PostReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostReactionRepository extends JpaRepository<PostReaction, Long> {

    Optional<PostReaction> findByPostIdAndVoterId(Long postId, String voterId);
}
