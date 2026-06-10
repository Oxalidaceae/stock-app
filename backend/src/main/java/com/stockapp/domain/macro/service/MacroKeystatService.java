package com.stockapp.domain.macro.service;

import com.stockapp.domain.macro.dto.MacroKeystatResponse;
import com.stockapp.domain.macro.repository.MacroKeystatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MacroKeystatService {

    private final MacroKeystatRepository repository;

    public List<MacroKeystatResponse> getAll() {
        return repository.findAllOrdered().stream()
                .map(MacroKeystatResponse::from)
                .toList();
    }
}
