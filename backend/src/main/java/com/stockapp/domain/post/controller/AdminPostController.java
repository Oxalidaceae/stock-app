package com.stockapp.domain.post.controller;

import com.stockapp.common.response.ApiResponse;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.post.dto.AdminPostResponse;
import com.stockapp.domain.post.dto.PostRequest;
import com.stockapp.domain.post.entity.PostCategory;
import com.stockapp.domain.post.entity.PostStatus;
import com.stockapp.domain.post.service.AdminPostService;
import com.stockapp.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
public class AdminPostController {

    private final AdminPostService adminPostService;

    @GetMapping
    public ApiResponse<PageResponse<AdminPostResponse>> getPosts(
            @RequestParam(required = false) PostStatus status,
            @RequestParam(required = false) PostCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(adminPostService.getPosts(status, category, page, size));
    }

    @PostMapping
    public ApiResponse<AdminPostResponse> create(
            @Valid @RequestBody PostRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(adminPostService.create(request, principal.getId()));
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminPostResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody PostRequest request) {
        return ApiResponse.success(adminPostService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        adminPostService.delete(id);
        return ApiResponse.success();
    }
}
