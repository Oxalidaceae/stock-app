-- 한국은행 100대 통계지표 히스토리 누적.
-- macro_keystats 는 최신 스냅샷만 upsert 되어 과거값이 남지 않으므로,
-- cycle(데이터 시점)이 바뀔 때마다 새 행을 추가해 시계열을 쌓는다.
-- 추후 차트·전기대비 변화율 계산에 사용.
CREATE TABLE macro_keystat_history (
    id            BIGSERIAL    PRIMARY KEY,
    class_name    VARCHAR(50)  NOT NULL,
    keystat_name  VARCHAR(100) NOT NULL,
    value         VARCHAR(50),
    unit          VARCHAR(20),
    cycle         VARCHAR(20),              -- 데이터 시점 (예: 20260608, 202604, 2026Q1)
    recorded_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 지표별 최신 히스토리 조회용 (전기대비 변화율 계산)
CREATE INDEX idx_macro_keystat_history_lookup
    ON macro_keystat_history (class_name, keystat_name, recorded_at DESC);
