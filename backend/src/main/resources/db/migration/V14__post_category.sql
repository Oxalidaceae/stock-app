-- 게시글 분류 — 게시판에서 공지/업데이트/기록을 나눠 볼 수 있게 한다.

-- DEFAULT 는 NOT NULL 컬럼을 기존 테이블에 붙이기 위해 필요하다. 이후 INSERT 는
-- JPA 가 항상 값을 채우므로(PostRequest.category 가 @NotNull) 사실상 안전망이다.
ALTER TABLE post ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'NOTICE';

-- status 와 같은 방식으로 DB 에서도 값을 강제한다 — 애플리케이션을 우회한
-- 직접 INSERT 나 enum 오타를 막는다. 값을 늘릴 때 이 제약도 함께 고칠 것.
ALTER TABLE post ADD CONSTRAINT ck_post_category
    CHECK (category IN ('NOTICE', 'UPDATE', 'NOTE'));
