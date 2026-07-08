-- 따봉/비추 중복 방지 기준을 voterId(브라우저 위조 가능) → IP 해시로 전환.
-- 한 IP 당 게시글별 1표만 유지해 voterId 갈아끼우기 조작을 차단한다.

ALTER TABLE post_reaction ADD COLUMN voter_ip_hash VARCHAR(64);

-- IP 해시가 없는 기존 반응은 초기화하고, 게시글 집계도 정합을 맞춘다.
-- (신규 기능이라 실제 반응 수 미미 → 리셋 영향 작음)
DELETE FROM post_reaction;
UPDATE post SET like_count = 0, dislike_count = 0;

ALTER TABLE post_reaction ALTER COLUMN voter_ip_hash SET NOT NULL;
ALTER TABLE post_reaction ALTER COLUMN voter_id DROP NOT NULL;

-- 중복 방지 기준 교체: (post_id, voter_id) → (post_id, voter_ip_hash)
ALTER TABLE post_reaction DROP CONSTRAINT uq_post_reaction;
ALTER TABLE post_reaction ADD CONSTRAINT uq_post_reaction UNIQUE (post_id, voter_ip_hash);
