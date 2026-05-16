-- =====================================================
-- 1. 기업 기본정보
-- =====================================================
CREATE TABLE companies (
    id              BIGSERIAL PRIMARY KEY,
    corp_code       VARCHAR(8)   UNIQUE NOT NULL,   -- DART 기업코드
    ticker          VARCHAR(10)  UNIQUE,             -- 종목코드 (상장사만 존재)
    company_name    VARCHAR(100) NOT NULL,
    company_name_en VARCHAR(100),
    market          VARCHAR(10),                     -- KOSPI, KOSDAQ, KONEX
    sector          VARCHAR(50),                     -- 업종 (KRX 분류)
    industry        VARCHAR(100),                    -- 세부 업종
    ceo_name        VARCHAR(50),
    listing_date    DATE,
    fiscal_month    SMALLINT,                        -- 결산월 (12월 결산이면 12)
    homepage        VARCHAR(200),
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);

-- =====================================================
-- 2. 주가 (일별 OHLCV)
-- =====================================================
CREATE TABLE stock_prices (
    id            BIGSERIAL PRIMARY KEY,
    company_id    BIGINT   NOT NULL REFERENCES companies(id),
    trade_date    DATE     NOT NULL,
    open_price    BIGINT,
    high_price    BIGINT,
    low_price     BIGINT,
    close_price   BIGINT   NOT NULL,
    volume        BIGINT,
    market_cap    BIGINT,
    created_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE (company_id, trade_date)
);

CREATE INDEX idx_stock_prices_company_date ON stock_prices (company_id, trade_date DESC);

-- =====================================================
-- 3. DART 공시
-- =====================================================
CREATE TABLE disclosures (
    id               BIGSERIAL PRIMARY KEY,
    company_id       BIGINT       REFERENCES companies(id),
    rcept_no         VARCHAR(14)  UNIQUE NOT NULL,   -- DART 접수번호
    report_name      VARCHAR(200) NOT NULL,
    disclosure_type  VARCHAR(50),                    -- 정기공시 / 주요사항보고 / 발행공시 등
    rcept_date       DATE         NOT NULL,
    submitter        VARCHAR(100),                   -- 제출인
    dart_url         VARCHAR(300),
    created_at       TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_disclosures_company_date ON disclosures (company_id, rcept_date DESC);
CREATE INDEX idx_disclosures_date         ON disclosures (rcept_date DESC);

-- =====================================================
-- 4. 재무제표 (DART 계정별 원본)
-- =====================================================
CREATE TABLE financial_statements (
    id               BIGSERIAL PRIMARY KEY,
    company_id       BIGINT      NOT NULL REFERENCES companies(id),
    fiscal_year      SMALLINT    NOT NULL,
    report_code      VARCHAR(5)  NOT NULL,  -- 11011=사업보고서, 11012=반기, 11013=1분기, 11014=3분기
    fs_div           VARCHAR(3)  NOT NULL,  -- CFS=연결재무제표, OFS=개별재무제표
    account_id       VARCHAR(50),           -- DART 계정과목 ID
    account_name     VARCHAR(100) NOT NULL,
    current_amount   BIGINT,                -- 당기 금액
    previous_amount  BIGINT,                -- 전기 금액
    currency         VARCHAR(10)  DEFAULT 'KRW',
    created_at       TIMESTAMP    DEFAULT NOW(),
    UNIQUE (company_id, fiscal_year, report_code, fs_div, account_id)
);

CREATE INDEX idx_financial_statements_company_year ON financial_statements (company_id, fiscal_year DESC);

-- =====================================================
-- 5. 재무지표 (계산값 — 스크리너, 비교 분석용)
-- =====================================================
CREATE TABLE financial_metrics (
    id                BIGSERIAL PRIMARY KEY,
    company_id        BIGINT       NOT NULL REFERENCES companies(id),
    base_date         DATE         NOT NULL,   -- 주가 기준일
    fiscal_year       SMALLINT,
    report_code       VARCHAR(5),
    -- 밸류에이션
    per               DECIMAL(10,2),           -- 주가수익비율
    pbr               DECIMAL(10,2),           -- 주가순자산비율
    psr               DECIMAL(10,2),           -- 주가매출비율
    ev_ebitda         DECIMAL(10,2),
    -- 수익성
    roe               DECIMAL(10,2),           -- 자기자본이익률
    roa               DECIMAL(10,2),           -- 총자산이익률
    operating_margin  DECIMAL(10,2),           -- 영업이익률
    net_margin        DECIMAL(10,2),           -- 순이익률
    -- 안전성
    debt_ratio        DECIMAL(10,2),           -- 부채비율
    current_ratio     DECIMAL(10,2),           -- 유동비율
    -- 배당
    dividend_yield    DECIMAL(6,2),            -- 배당수익률
    dps               BIGINT,                  -- 주당배당금
    -- 주당 지표
    eps               BIGINT,                  -- 주당순이익
    bps               BIGINT,                  -- 주당순자산
    -- 절대 규모 (원)
    revenue           BIGINT,
    operating_income  BIGINT,
    net_income        BIGINT,
    total_assets      BIGINT,
    total_equity      BIGINT,
    created_at        TIMESTAMP    DEFAULT NOW(),
    UNIQUE (company_id, base_date)
);

CREATE INDEX idx_financial_metrics_company      ON financial_metrics (company_id, base_date DESC);
CREATE INDEX idx_financial_metrics_per          ON financial_metrics (per)          WHERE per IS NOT NULL;
CREATE INDEX idx_financial_metrics_pbr          ON financial_metrics (pbr)          WHERE pbr IS NOT NULL;
CREATE INDEX idx_financial_metrics_roe          ON financial_metrics (roe)          WHERE roe IS NOT NULL;
CREATE INDEX idx_financial_metrics_div_yield    ON financial_metrics (dividend_yield) WHERE dividend_yield IS NOT NULL;

-- =====================================================
-- 6. 한국은행 경제지표
-- =====================================================
CREATE TABLE economic_indicators (
    id           BIGSERIAL PRIMARY KEY,
    stat_code    VARCHAR(10)  NOT NULL,   -- ECOS 통계표 코드
    stat_name    VARCHAR(100) NOT NULL,   -- 통계명 (예: 한국은행 기준금리)
    item_code    VARCHAR(50)  NOT NULL,   -- 항목 코드
    item_name    VARCHAR(200) NOT NULL,   -- 항목명
    period       VARCHAR(10)  NOT NULL,   -- 기간 (202401, 2024 등)
    period_type  CHAR(1)      NOT NULL,   -- A=연, Q=분기, M=월, D=일
    value        DECIMAL(20,4),
    unit         VARCHAR(20),
    created_at   TIMESTAMP    DEFAULT NOW(),
    UNIQUE (stat_code, item_code, period)
);

CREATE INDEX idx_economic_indicators_stat_period ON economic_indicators (stat_code, period DESC);

-- =====================================================
-- [미래 기능] 로그인 구현 시 추가할 테이블
-- =====================================================

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(200),
    nickname      VARCHAR(50),
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- 종목별 메모
CREATE TABLE stock_memos (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id  BIGINT      NOT NULL REFERENCES companies(id),
    content     TEXT        NOT NULL,
    created_at  TIMESTAMP   DEFAULT NOW(),
    updated_at  TIMESTAMP   DEFAULT NOW()
);

-- 포트폴리오 보유 종목
CREATE TABLE portfolio_holdings (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id      BIGINT      NOT NULL REFERENCES companies(id),
    quantity        INTEGER     NOT NULL,
    purchase_price  BIGINT      NOT NULL,   -- 평균 매수가 (원)
    purchase_date   DATE,
    memo            VARCHAR(500),
    created_at      TIMESTAMP   DEFAULT NOW(),
    updated_at      TIMESTAMP   DEFAULT NOW()
);

-- 공시/가격 알림 설정
CREATE TABLE alert_settings (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id    BIGINT      NOT NULL REFERENCES companies(id),
    alert_type    VARCHAR(20) NOT NULL,   -- DISCLOSURE, PRICE_ABOVE, PRICE_BELOW
    threshold     BIGINT,                 -- 가격 알림의 경우 기준가
    is_active     BOOLEAN     DEFAULT TRUE,
    created_at    TIMESTAMP   DEFAULT NOW()
);
