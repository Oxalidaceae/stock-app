package com.stockapp.domain.post.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.post.dto.PostResponse;
import com.stockapp.domain.post.dto.PostSummaryResponse;
import com.stockapp.domain.post.dto.ReactionRequest;
import com.stockapp.domain.post.dto.ReactionResponse;
import com.stockapp.domain.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    /** 게시판 목록 — 게시된 글만. */
    @GetMapping
    public ApiResponse<PageResponse<PostSummaryResponse>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(postService.getPosts(page, size));
    }

    /** 게시글 상세 — voterId 지정 시 조회자의 현재 반응 상태 포함. */
    @GetMapping("/{id}")
    public ApiResponse<PostResponse> getPost(
            @PathVariable Long id,
            @RequestParam(required = false) String voterId) {
        return ApiResponse.success(postService.getPost(id, voterId));
    }

    /** 따봉/비추 — 로그인 불필요. */
    @PostMapping("/{id}/reaction")
    public ApiResponse<ReactionResponse> react(
            @PathVariable Long id,
            @Valid @RequestBody ReactionRequest request) {
        return ApiResponse.success(postService.react(id, request));
    }
}
