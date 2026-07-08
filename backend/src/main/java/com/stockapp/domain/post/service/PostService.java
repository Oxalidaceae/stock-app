package com.stockapp.domain.post.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.post.dto.PostResponse;
import com.stockapp.domain.post.dto.PostSummaryResponse;
import com.stockapp.domain.post.dto.ReactionResponse;
import com.stockapp.domain.post.entity.Post;
import com.stockapp.domain.post.entity.PostReaction;
import com.stockapp.domain.post.entity.PostStatus;
import com.stockapp.domain.post.entity.ReactionType;
import com.stockapp.domain.post.repository.PostReactionRepository;
import com.stockapp.domain.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostReactionRepository reactionRepository;

    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getPosts(int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        var result = postRepository
                .findByStatusOrderByPublishedAtDesc(PostStatus.PUBLISHED, PageRequest.of(Math.max(page, 0), safeSize))
                .map(PostSummaryResponse::from);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(Long id, String voterIpHash) {
        Post post = findPublished(id);
        ReactionType myReaction = reactionRepository.findByPostIdAndVoterIpHash(id, voterIpHash)
                .map(PostReaction::getType)
                .orElse(null);
        return PostResponse.from(post, myReaction);
    }

    /**
     * 따봉/비추 — 같은 반응 재요청은 취소(토글), 다른 반응은 전환.
     * 중복 방지 기준은 요청 IP 해시(한 IP 당 게시글별 1표) → voterId 위조로 부풀리기 차단.
     */
    @Transactional
    public ReactionResponse react(Long id, ReactionType requested, String voterIpHash, String voterId) {
        Post post = findPublished(id);

        var existing = reactionRepository.findByPostIdAndVoterIpHash(id, voterIpHash).orElse(null);
        ReactionType myReaction;
        if (existing == null) {
            reactionRepository.save(PostReaction.of(id, voterIpHash, voterId, requested));
            post.adjustCounts(null, requested);
            myReaction = requested;
        } else if (existing.getType() == requested) {
            reactionRepository.delete(existing);
            post.adjustCounts(requested, null);
            myReaction = null;
        } else {
            post.adjustCounts(existing.getType(), requested);
            existing.changeType(requested);
            myReaction = requested;
        }

        return ReactionResponse.of(post.getLikeCount(), post.getDislikeCount(), myReaction);
    }

    private Post findPublished(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다"));
        if (post.getStatus() != PostStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다");
        }
        return post;
    }
}
