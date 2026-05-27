package com.stockapp.domain.stock.repository;

import com.stockapp.domain.stock.entity.StockPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StockPriceRepository extends JpaRepository<StockPrice, Long> {

    @Query("SELECT sp FROM StockPrice sp WHERE sp.company.ticker = :ticker " +
           "ORDER BY sp.tradeDate DESC LIMIT 1")
    Optional<StockPrice> findLatestByTicker(@Param("ticker") String ticker);
}
