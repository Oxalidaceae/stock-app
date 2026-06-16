package com.stockapp.domain.macro.service;

import com.stockapp.domain.macro.dto.MacroKeystatResponse;
import com.stockapp.domain.macro.repository.MacroKeystatHistoryRepository;
import com.stockapp.domain.macro.repository.MacroKeystatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MacroKeystatService {

    private final MacroKeystatRepository repository;
    private final MacroKeystatHistoryRepository historyRepository;

    public List<MacroKeystatResponse> getAll() {
        Map<String, String[]> previousByKey = loadPreviousValues();

        return repository.findAllOrdered().stream()
                .map(m -> {
                    String[] prev = previousByKey.get(key(m.getClassName(), m.getKeystatName()));
                    return prev != null
                            ? MacroKeystatResponse.withChange(m, prev[0], prev[1])
                            : MacroKeystatResponse.from(m);
                })
                .toList();
    }

    /**
     * 지표별 직전 시점(history 2번째 행)의 value/cycle 을 반환.
     * history 가 1건뿐이면(현재 cycle 과 동일) 비교 대상이 없으므로 변화 없음으로 처리.
     */
    private Map<String, String[]> loadPreviousValues() {
        Map<String, List<Object[]>> grouped = new LinkedHashMap<>();
        for (Object[] row : historyRepository.findLatestTwoPerKeystat()) {
            String k = key((String) row[0], (String) row[1]);
            grouped.computeIfAbsent(k, x -> new ArrayList<>()).add(row);
        }

        Map<String, String[]> result = new HashMap<>();
        for (Map.Entry<String, List<Object[]>> e : grouped.entrySet()) {
            List<Object[]> rows = e.getValue();
            if (rows.size() >= 2) {
                Object[] previous = rows.get(1);
                result.put(e.getKey(), new String[]{(String) previous[2], (String) previous[3]});
            }
        }
        return result;
    }

    private String key(String className, String keystatName) {
        return className + "::" + keystatName;
    }
}
