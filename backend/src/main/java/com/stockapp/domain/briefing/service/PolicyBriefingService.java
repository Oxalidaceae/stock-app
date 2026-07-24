package com.stockapp.domain.briefing.service;

import com.stockapp.common.response.PageResponse;
import com.stockapp.common.util.Pagination;
import com.stockapp.domain.briefing.dto.BriefingDateResponse;
import com.stockapp.domain.briefing.dto.PolicyBriefingResponse;
import com.stockapp.domain.briefing.entity.EditorialStatus;
import com.stockapp.domain.briefing.repository.PolicyBriefingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolicyBriefingService {

    /** 공개 노출 대상: 요약(해설) 게시분 + 원본 수집분. (DRAFT·ARCHIVED는 숨김) */
    private static final List<EditorialStatus> PUBLIC_STATUSES =
            List.of(EditorialStatus.PUBLISHED, EditorialStatus.COLLECTED);
    /** '요약만 보기' — 게시분만. */
    private static final List<EditorialStatus> CURATED_STATUSES =
            List.of(EditorialStatus.PUBLISHED);

    private final PolicyBriefingRepository repository;

    /** 날짜 탭 — 공개 소식이 있는 날짜와 건수 (최신순). */
    public List<BriefingDateResponse> getDates(String ministry) {
        return repository.findPublicDateCounts(ministry).stream()
                .map(row -> new BriefingDateResponse(
                        ((Date) row[0]).toLocalDate(),
                        ((Number) row[1]).longValue()))
                .toList();
    }

    /** 공개 소식 — date 지정 시 그 날짜만(미지정=전체 최근순), curatedOnly=true 면 게시분만. 항상 페이징. */
    public PageResponse<PolicyBriefingResponse> getBriefings(
            String ministry, LocalDate date, boolean curatedOnly, int page, int size) {
        var statuses = curatedOnly ? CURATED_STATUSES : PUBLIC_STATUSES;
        var pageable = Pagination.publicPage(page, size);
        var result = (date == null)
                ? repository.findPublic(statuses, ministry, pageable)
                : repository.findPublicByDateRange(statuses, ministry,
                        date.atStartOfDay(), date.plusDays(1).atStartOfDay(), pageable);
        return PageResponse.from(result.map(PolicyBriefingResponse::from));
    }
}
