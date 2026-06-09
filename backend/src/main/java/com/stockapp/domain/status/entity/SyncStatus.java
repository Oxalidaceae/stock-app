package com.stockapp.domain.status.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sync_status")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SyncStatus {

    @Id
    @Column(name = "job_name", length = 50)
    private String jobName;

    @Column(name = "last_run_at", nullable = false)
    private LocalDateTime lastRunAt;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "records")
    private Integer records;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "message")
    private String message;
}
