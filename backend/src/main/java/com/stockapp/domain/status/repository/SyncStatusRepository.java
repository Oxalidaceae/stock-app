package com.stockapp.domain.status.repository;

import com.stockapp.domain.status.entity.SyncStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyncStatusRepository extends JpaRepository<SyncStatus, String> {
}
