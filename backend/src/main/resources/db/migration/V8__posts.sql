-- 관리자 작성 게시판(게시글) + 로그인 없는 따봉/비추 반응

CREATE TABLE post (
    id            BIGSERIAL    PRIMARY KEY,
    title         VARCHAR(500) NOT NULL,
    content       TEXT         NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    like_count    INT          NOT NULL DEFAULT 0,
    dislike_count INT          NOT NULL DEFAULT 0,
    author_id     BIGINT       REFERENCES app_users(id),
    published_at  TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_post_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

CREATE INDEX idx_post_status_published ON post (status, published_at DESC);

-- 로그인 없이 누르는 반응. voter_id = 브라우저 localStorage 에 저장한 익명 식별자(UUID).
-- (post_id, voter_id) 유일 제약으로 한 브라우저당 한 표만 유지하고, 재요청 시 취소/전환한다.
CREATE TABLE post_reaction (
    id         BIGSERIAL    PRIMARY KEY,
    post_id    BIGINT       NOT NULL REFERENCES post(id) ON DELETE CASCADE,
    voter_id   VARCHAR(100) NOT NULL,
    type       VARCHAR(10)  NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_post_reaction UNIQUE (post_id, voter_id),
    CONSTRAINT ck_post_reaction_type CHECK (type IN ('LIKE', 'DISLIKE'))
);
