package com.stockapp.domain.briefing.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.common.response.PageResponse;
import com.stockapp.domain.briefing.dto.AdminBriefingResponse;
import com.stockapp.domain.briefing.dto.UpdateBriefingEditorialRequest;
import com.stockapp.domain.briefing.entity.EditorialStatus;
import com.stockapp.domain.briefing.repository.PolicyBriefingRepository;
import com.stockapp.domain.user.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminBriefingService {

    private final PolicyBriefingRepository briefingRepository;
    private final AppUserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminBriefingResponse> getBriefings(
            EditorialStatus status,
            String ministry,
            String q,
            int page,
            int size) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        var result = briefingRepository
                .findForAdmin(status, ministry, q, PageRequest.of(Math.max(page, 0), safeSize))
                .map(AdminBriefingResponse::from);
        return PageResponse.from(result);
    }

    @Transactional
    public AdminBriefingResponse update(
            Long id,
            UpdateBriefingEditorialRequest request,
            Long reviewerId) {
        var briefing = briefingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "기사를 찾을 수 없습니다"));
        var reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다"));

        if (request.getEditorialStatus() == EditorialStatus.PUBLISHED
                && (request.getEditorNote() == null || request.getEditorNote().isBlank())) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "게시하려면 Jipyo 해설을 작성해야 합니다");
        }

        briefing.updateEditorial(
                request.getEditorNote(),
                request.getImpactTags(),
                request.getRelatedIndicators(),
                request.getEditorialStatus(),
                reviewer
        );
        return AdminBriefingResponse.from(briefing);
    }
}
