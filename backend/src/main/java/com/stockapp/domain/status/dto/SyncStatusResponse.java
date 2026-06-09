package com.stockapp.domain.status.dto;

import com.stockapp.domain.status.entity.SyncStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class SyncStatusResponse {
    private final String jobName;
    private final LocalDateTime lastRunAt;
    private final String status;
    private final Integer records;
    private final Integer durationMs;
    private final String message;

    public static SyncStatusResponse from(SyncStatus s) {
        return new SyncStatusResponse(
                s.getJobName(),
                s.getLastRunAt(),
                s.getStatus(),
                s.getRecords(),
                s.getDurationMs(),
                s.getMessage()
        );
    }
}
