-- 투자 가이드(관리자 편집형 아티클). 본문은 마크다운.

CREATE TABLE guide (
    id           BIGSERIAL    PRIMARY KEY,
    slug         VARCHAR(200) NOT NULL,
    title        VARCHAR(500) NOT NULL,
    summary      TEXT,
    tag          VARCHAR(100),
    content      TEXT         NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    author_id    BIGINT       REFERENCES app_users(id),
    published_at TIMESTAMP,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_guide_slug UNIQUE (slug),
    CONSTRAINT ck_guide_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

CREATE INDEX idx_guide_status_published ON guide (status, published_at DESC);
