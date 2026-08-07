package com.stockapp.domain.post.controller;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.common.response.ApiResponse;
import com.stockapp.common.response.PageResponse;
import com.stockapp.common.util.ClientIp;
import com.stockapp.domain.post.dto.PostResponse;
import com.stockapp.domain.post.dto.PostSummaryResponse;
import com.stockapp.domain.post.dto.ReactionRequest;
import com.stockapp.domain.post.dto.ReactionResponse;
import com.stockapp.domain.post.entity.PostCategory;
import com.stockapp.domain.post.service.PostService;
import com.stockapp.domain.post.service.ReactionRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final ReactionRateLimiter reactionRateLimiter;

    @Value("${app.reaction.ip-salt:jipyo-reaction}")
    private String ipSalt;

    /** 게시판 목록 — 게시된 글만. category 를 생략하면 전체 분류. */
    @GetMapping
    public ApiResponse<PageResponse<PostSummaryResponse>> getPosts(
            @RequestParam(required = false) PostCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(postService.getPosts(category, page, size));
    }

    /** 게시글 상세 — 조회자 IP 로 현재 반응 상태를 판정해 함께 반환. */
    @GetMapping("/{id}")
    public ApiResponse<PostResponse> getPost(@PathVariable Long id, HttpServletRequest http) {
        String ipHash = ClientIp.hash(ClientIp.resolve(http), ipSalt);
        return ApiResponse.success(postService.getPost(id, ipHash));
    }

    /** 따봉/비추 — 로그인 불필요. IP 기준 속도 제한 + IP 당 게시글별 1표. */
    @PostMapping("/{id}/reaction")
    public ApiResponse<ReactionResponse> react(
            @PathVariable Long id,
            @Valid @RequestBody ReactionRequest request,
            HttpServletRequest http) {
        String ip = ClientIp.resolve(http);
        if (!reactionRateLimiter.allow(ip)) {
            throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_REQUESTS.getMessage());
        }
        String ipHash = ClientIp.hash(ip, ipSalt);
        return ApiResponse.success(postService.react(id, request.getType(), ipHash, request.getVoterId()));
    }
}
