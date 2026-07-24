package com.stockapp.domain.guide.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.common.response.PageResponse;
import com.stockapp.common.util.Pagination;
import com.stockapp.domain.guide.dto.AdminGuideResponse;
import com.stockapp.domain.guide.dto.GuideRequest;
import com.stockapp.domain.guide.entity.Guide;
import com.stockapp.domain.guide.entity.GuideStatus;
import com.stockapp.domain.guide.repository.GuideRepository;
import com.stockapp.domain.user.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminGuideService {

    private final GuideRepository guideRepository;
    private final AppUserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminGuideResponse> getGuides(GuideStatus status, int page, int size) {
        var pageable = Pagination.adminPage(page, size);
        var result = (status == null
                ? guideRepository.findAllByOrderByUpdatedAtDesc(pageable)
                : guideRepository.findByStatusOrderByUpdatedAtDesc(status, pageable))
                .map(AdminGuideResponse::from);
        return PageResponse.from(result);
    }

    @Transactional
    public AdminGuideResponse create(GuideRequest request, Long authorId) {
        String slug = request.getSlug().trim();
        if (guideRepository.existsBySlug(slug)) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "이미 사용 중인 slug 입니다: " + slug);
        }
        var author = userRepository.findById(authorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다"));
        Guide guide = Guide.create(
                slug, request.getTitle(), request.getSummary(), request.getTag(),
                request.getContent(), request.getStatus(), author);
        return AdminGuideResponse.from(guideRepository.save(guide));
    }

    @Transactional
    public AdminGuideResponse update(Long id, GuideRequest request) {
        Guide guide = guideRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "가이드를 찾을 수 없습니다"));
        String slug = request.getSlug().trim();
        // slug 를 다른 가이드가 이미 쓰고 있으면 거부
        guideRepository.findBySlug(slug).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new BusinessException(ErrorCode.INVALID_PARAMETER, "이미 사용 중인 slug 입니다: " + slug);
            }
        });
        guide.update(slug, request.getTitle(), request.getSummary(), request.getTag(),
                request.getContent(), request.getStatus());
        return AdminGuideResponse.from(guide);
    }

    @Transactional
    public void delete(Long id) {
        Guide guide = guideRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "가이드를 찾을 수 없습니다"));
        guideRepository.delete(guide);
    }
}
