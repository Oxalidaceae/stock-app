package com.stockapp.domain.macro.repository;

import com.stockapp.domain.macro.entity.MacroKeystat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MacroKeystatRepository extends JpaRepository<MacroKeystat, Long> {

    @Query("SELECT m FROM MacroKeystat m ORDER BY m.sortOrder ASC")
    List<MacroKeystat> findAllOrdered();
}
