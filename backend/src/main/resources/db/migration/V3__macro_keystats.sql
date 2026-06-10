-- 한국은행 100대 통계지표 (KeyStatisticList API) 스냅샷 저장.
-- 매시간 collector daemon 이 ECOS 에서 받아 upsert.
CREATE TABLE macro_keystats (
    id            BIGSERIAL    PRIMARY KEY,
    class_name    VARCHAR(50)  NOT NULL,    -- 시장금리, 환율, 통화량, 성장률 ...
    keystat_name  VARCHAR(100) NOT NULL,    -- 한국은행 기준금리, 원/달러 환율(종가) 등
    value         VARCHAR(50),              -- ECOS 가 문자열로 주므로 그대로
    unit          VARCHAR(20),              -- %, 십억원, 원, 지수 등
    cycle         VARCHAR(20),              -- 데이터 시점 (예: 20260608, 202604, 2026Q1)
    sort_order    INTEGER,                  -- ECOS 응답 순서 — 표시 순서 유지용
    updated_at    TIMESTAMP    DEFAULT NOW(),
    UNIQUE (class_name, keystat_name)
);

CREATE INDEX idx_macro_keystats_class ON macro_keystats (class_name, sort_order);
