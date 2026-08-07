-- 수집 실패 연속 횟수 — 알림이 임계치에서 딱 한 번만 울리도록 하는 카운터.
--
-- 정책브리핑 RSS 가 폐지됐을 때 파이프라인이 "0건 수집"을 성공으로 기록해
-- 36일간 아무도 몰랐다. 실패를 실패로 남기고 외부로 알리기 위한 상태값이다.
--
-- 0 = 마지막 실행 성공. 컬렉터의 record_sync() 가 갱신한다.
ALTER TABLE sync_status ADD COLUMN consecutive_failures INTEGER NOT NULL DEFAULT 0;
