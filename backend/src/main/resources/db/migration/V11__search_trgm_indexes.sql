-- 종목/공시 검색은 선행 와일드카드 LIKE('%q%')라 B-tree 인덱스를 못 타고 항상 풀스캔이었다.
-- 공시(disclosures)는 계속 누적되므로 시간이 갈수록 느려진다. pg_trgm(트라이그램) GIN 인덱스로
-- 부분 문자열 LIKE 를 인덱스로 처리한다.
--
-- 쿼리가 LOWER(col) LIKE LOWER('%q%') 형태이므로, 플래너가 반드시 인덱스를 쓰도록
-- 동일한 lower(col) 표현식 인덱스로 만든다. (CompanyRepository.search /
-- DisclosureRepository.findAllRecent 의 WHERE 절과 표현식이 일치해야 한다.)
--
-- pg_trgm 은 PostgreSQL 13+ 에서 trusted extension 이라 DB 소유자(stockapp)가 설치할 수 있다.
-- CONCURRENTLY 는 Flyway 트랜잭션 안에서 못 쓰므로 일반 CREATE INDEX 사용(기동 시 짧은 락 감수).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 종목 검색: 기업명 + 종목코드 (둘 다 OR 로 묶여 있어 양쪽 모두 인덱스가 있어야 풀스캔을 피한다)
CREATE INDEX idx_companies_name_trgm
    ON companies USING gin (lower(company_name) gin_trgm_ops);
CREATE INDEX idx_companies_ticker_trgm
    ON companies USING gin (lower(ticker) gin_trgm_ops);

-- 공시 검색: 보고서명 (누적 테이블이라 가장 이득이 큰 인덱스)
CREATE INDEX idx_disclosures_report_name_trgm
    ON disclosures USING gin (lower(report_name) gin_trgm_ops);
