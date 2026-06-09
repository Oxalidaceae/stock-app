package com.stockapp.domain.status.service;

import com.stockapp.domain.status.dto.SyncStatusResponse;
import com.stockapp.domain.status.repository.SyncStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyncStatusService {

    private final SyncStatusRepository repository;

    public List<SyncStatusResponse> getAll() {
        return repository.findAll().stream()
                .map(SyncStatusResponse::from)
                .toList();
    }
}
