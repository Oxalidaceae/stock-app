package com.stockapp.domain.macro.repository;

import com.stockapp.domain.macro.entity.MacroKeystatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MacroKeystatHistoryRepository extends JpaRepository<MacroKeystatHistory, Long> {

    /**
     * 지표별 최근 2개 시점(cycle)을 반환한다.
     * 첫 번째가 최신, 두 번째가 직전 — 전기대비 변화율 계산용.
     */
    @Query(value = """
            SELECT class_name, keystat_name, value, cycle, recorded_at
            FROM (
                SELECT class_name, keystat_name, value, cycle, recorded_at,
                       ROW_NUMBER() OVER (PARTITION BY class_name, keystat_name ORDER BY recorded_at DESC) AS rn
                FROM macro_keystat_history
            ) ranked
            WHERE rn <= 2
            ORDER BY class_name, keystat_name, recorded_at DESC
            """, nativeQuery = true)
    List<Object[]> findLatestTwoPerKeystat();
}
