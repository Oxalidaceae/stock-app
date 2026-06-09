-- 컬렉터 파이프라인 실행 기록 — 대시보드 "마지막 갱신 N분 전" 표시 + 운영 모니터링용.
-- job_name 을 키로 upsert. 새 실행이 시작될 때마다 last_run_at 갱신.
CREATE TABLE sync_status (
    job_name      VARCHAR(50)  PRIMARY KEY,         -- 'disclosures', 'daily_prices', 'ecos', 'keystats', 'financials' 등
    last_run_at   TIMESTAMP    NOT NULL,
    status        VARCHAR(20)  NOT NULL,            -- 'success', 'failed', 'partial'
    records       INTEGER,                          -- 처리한 레코드 수
    duration_ms   INTEGER,                          -- 실행 시간 (ms)
    message       TEXT                              -- 실패 사유 또는 부가 정보
);
