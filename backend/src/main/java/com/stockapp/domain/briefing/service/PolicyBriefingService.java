package com.stockapp.domain.briefing.service;

import com.stockapp.domain.briefing.dto.BriefingDateResponse;
import com.stockapp.domain.briefing.dto.PolicyBriefingResponse;
import com.stockapp.domain.briefing.entity.EditorialStatus;
import com.stockapp.domain.briefing.repository.PolicyBriefingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolicyBriefingService {

    /** 공개 노출 대상: 해설 게시분 + 원본 수집분. (DRAFT·ARCHIVED는 숨김) */
    private static final List<EditorialStatus> PUBLIC_STATUSES =
            List.of(EditorialStatus.PUBLISHED, EditorialStatus.COLLECTED);

    private final PolicyBriefingRepository repository;

    /** 날짜 탭 — 공개 소식이 있는 날짜와 건수 (최신순). */
    public List<BriefingDateResponse> getDates(String ministry) {
        return repository.findPublicDateCounts(ministry).stream()
                .map(row -> new BriefingDateResponse(
                        ((Date) row[0]).toLocalDate(),
                        ((Number) row[1]).longValue()))
                .toList();
    }

    /** 선택한 날짜의 공개 소식 (해설 게시분 + 수집분, 최신순). */
    public List<PolicyBriefingResponse> getBriefingsByDate(String ministry, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        return repository.findPublicByDateRange(PUBLIC_STATUSES, ministry, start, end).stream()
                .map(PolicyBriefingResponse::from)
                .toList();
    }
}
