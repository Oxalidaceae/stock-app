-- 자체 로그인 사용자와 관리자 기사 편집 기능

CREATE TABLE app_users (
    id            BIGSERIAL    PRIMARY KEY,
    username      VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_app_users_username UNIQUE (username),
    CONSTRAINT ck_app_users_role CHECK (role IN ('ADMIN', 'USER'))
);

ALTER TABLE policy_briefing
    ADD COLUMN editor_note        TEXT,
    ADD COLUMN impact_tags        VARCHAR(500),
    ADD COLUMN related_indicators VARCHAR(500),
    ADD COLUMN editorial_status   VARCHAR(20) NOT NULL DEFAULT 'COLLECTED',
    ADD COLUMN reviewed_by        BIGINT REFERENCES app_users(id),
    ADD COLUMN reviewed_at        TIMESTAMP,
    ADD COLUMN updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD CONSTRAINT ck_policy_briefing_editorial_status
        CHECK (editorial_status IN ('COLLECTED', 'DRAFT', 'PUBLISHED', 'ARCHIVED'));

CREATE INDEX idx_policy_briefing_editorial
    ON policy_briefing (editorial_status, published_at DESC);
