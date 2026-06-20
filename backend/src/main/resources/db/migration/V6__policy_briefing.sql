-- 정책브리핑(korea.kr) 부처별 RSS — "경제 소식"
-- 공공누리 제1유형(출처표시). 제목·요약·원문링크·부처명만 저장.

CREATE TABLE policy_briefing (
    id            BIGSERIAL     PRIMARY KEY,
    title         VARCHAR(500)  NOT NULL,
    summary       TEXT,
    ministry      VARCHAR(100),
    source        VARCHAR(50),
    link          VARCHAR(1000) NOT NULL,
    published_at  TIMESTAMP,
    collected_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_policy_briefing_link UNIQUE (link)
);

CREATE INDEX idx_policy_briefing_published ON policy_briefing (published_at DESC);
CREATE INDEX idx_policy_briefing_ministry  ON policy_briefing (ministry, published_at DESC);
