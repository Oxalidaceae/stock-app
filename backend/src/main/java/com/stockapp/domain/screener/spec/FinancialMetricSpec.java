package com.stockapp.domain.screener.spec;

import com.stockapp.domain.financial.entity.FinancialMetric;
import com.stockapp.domain.screener.dto.ScreenerRequest;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class FinancialMetricSpec {

    private FinancialMetricSpec() {
    }

    public static Specification<FinancialMetric> fromRequest(ScreenerRequest request) {
        Specification<FinancialMetric> spec = Specification.where(null);

        if (request.getMarket() != null) {
            spec = spec.and((root, query, cb) -> {
                Join<?, ?> company = root.join("company", JoinType.INNER);
                return cb.equal(company.get("market"), request.getMarket());
            });
        }

        if (request.getPerMin() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("per"), request.getPerMin()));
        }
        if (request.getPerMax() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("per"), request.getPerMax()));
        }

        if (request.getPbrMin() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("pbr"), request.getPbrMin()));
        }
        if (request.getPbrMax() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("pbr"), request.getPbrMax()));
        }

        if (request.getRoeMin() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("roe"), request.getRoeMin()));
        }
        if (request.getRoeMax() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("roe"), request.getRoeMax()));
        }

        if (request.getDividendYieldMin() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("dividendYield"), request.getDividendYieldMin()));
        }

        if (request.getDebtRatioMax() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("debtRatio"), request.getDebtRatioMax()));
        }

        if (request.getOperatingMarginMin() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("operatingMargin"), request.getOperatingMarginMin()));
        }

        return spec;
    }
}
