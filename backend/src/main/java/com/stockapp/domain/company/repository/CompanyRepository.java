package com.stockapp.domain.company.repository;

import com.stockapp.domain.company.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByTicker(String ticker);

    @Query("SELECT c FROM Company c WHERE c.isActive = true AND " +
           "(LOWER(c.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.ticker) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:market IS NULL OR c.market = :market) " +
           "ORDER BY c.companyName")
    List<Company> search(@Param("query") String query, @Param("market") String market);

    Optional<Company> findByCorpCode(String corpCode);
}
