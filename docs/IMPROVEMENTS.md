# 개선 과제 목록

작성일: 2026-07-20 · 기준 커밋: `5ae6249` (develop)

코드베이스 전수 점검 결과. 각 항목은 실제 파일·라인을 확인해 작성했다.
완료 시 체크박스를 채우고, 해결된 항목은 커밋 해시를 남긴다.

---

## 1. 지금 고쳐야 할 것 (버그·취약점)

### 🔴 공개 API에 페이징 상한이 없음 — 홈서버 다운 벡터

- [x] **해결** (`common/util/Pagination.java` 신설) — page/size 정규화 헬퍼로 통일.
  공개 API는 `publicPage()`(size ≤ 50), 관리자 API는 `adminPage()`(size ≤ 100).
  `DisclosureService`·`PolicyBriefingService`·`ScreenerService`·`PostService`(공개) +
  `AdminGuideService`·`AdminPostService`·`AdminBriefingService`(관리자) 전부 적용.
  기존에 서비스마다 흩어져 있던 인라인 클램프(`Math.min(Math.max(...))`)도 이 헬퍼로 흡수.
- [ ] ~~**위치**: `backend/.../disclosure/controller/DisclosureController.java:21-31`,
  `backend/.../screener/dto/ScreenerRequest.java`~~

`page`/`size`를 검증 없이 `PageRequest.of()`에 그대로 넘긴다.

| 요청 | 결과 |
|---|---|
| `GET /api/disclosures/recent?size=1000000` | 인증 없이 전 공시 테이블을 메모리 적재 |
| `GET /api/disclosures/recent?page=-1` | `IllegalArgumentException` → 500 (400이어야 정상) |
| `GET /api/disclosures/recent?size=0` | 위와 동일 |
| `POST /api/screener {"size": 999999}` | 위와 동일 |

`PostService.java:31`에는 이미 클램프가 있다 — 이 패턴을 나머지에 적용하거나
전역 설정으로 한 번에 막는다.

```java
// PostService.java:31 — 이미 적용된 패턴
int safeSize = Math.min(Math.max(size, 1), 50);
```

```yaml
# 또는 application.yml 전역 설정
spring:
  data:
    web:
      pageable:
        max-page-size: 100
        default-page-size: 20
```

> 16GB 노트북 운영이라 우선순위 1순위. 인증 없이 외부에서 트리거 가능하다.

---

### 🔴 스크리너 `sortBy` 미검증 → 500

- [x] **해결** (`ScreenerService.java`) — `FinancialMetric` 실제 프로퍼티명으로 구성한
  `SORTABLE` 화이트리스트를 추가. 목록 밖 값이 오면 기본값 `per`로 폴백해 500 대신 정상 응답.
- [ ] ~~**위치**: `backend/.../screener/service/ScreenerService.java:29-31`~~

`request.getSortBy()`를 `Sort.by()`에 바로 넣는다. 존재하지 않는 프로퍼티명이 오면
`PropertyReferenceException` → 500. (SQL 인젝션은 아님 — JPA가 프로퍼티명을 검증한다.)

```java
private static final Set<String> SORTABLE =
        Set.of("per", "pbr", "roe", "roa", "dividendYield", "marketCap", "debtRatio");

String sortBy = SORTABLE.contains(request.getSortBy()) ? request.getSortBy() : "per";
```

---

### 🟡 `@Valid` / Bean Validation 미사용

- [x] **해결** — `ScreenerController.screen()`의 `@RequestBody`에 `@Valid` 부착.
  `ScreenerRequest`의 `page`에 `@Min(0)`, `size`에 `@Min(1) @Max(50)` 추가.
  잘못된 값은 이제 `MethodArgumentNotValidException` → 400(필드별 메시지)으로 응답한다.
  (서비스단 `Pagination` 클램프는 그대로 남겨 방어 심층화.)

---

### 🟡 `GlobalExceptionHandler`에 400 계열 핸들러 부족

- [x] **해결** (`GlobalExceptionHandler.java`) — 아래 3종 핸들러 추가. 모두 400 + `log.warn`
  으로 처리해 catch-all(500 + `log.error`) 오염을 막는다.
  - `MethodArgumentTypeMismatchException` — 타입 안 맞는 쿼리 파라미터
  - `HttpMessageNotReadableException` — 깨진 JSON 본문
  - `IllegalArgumentException` — `PageRequest.of()` 등에서 발생

---

### 🟡 `REACTION_IP_SALT` 기본값이 저장소에 공개

- [x] **해결** (`docker-compose.yml`) — `${REACTION_IP_SALT:-jipyo-reaction}` →
  `${REACTION_IP_SALT:?...}`로 변경. `JWT_SECRET`과 동일하게 미설정 시 컨테이너 기동 거부.
  IPv4 전수 계산으로 해시에서 원본 IP를 역산하는 것을 차단한다.
  (로컬 개발은 `application.yml`/`PostController`의 fallback으로 계속 기동 가능 —
  `AUTH_COOKIE_SECURE=false`와 동일한 로컬 예외.)

---

## 2. 구조·품질

### 테스트가 도메인 3개에만 존재

- [~] 백엔드: 36 → **75개 `@Test`** 로 보강. 순수 로직·보안·고위험 코드 우선 커버:
  - `PaginationTest` (6) — 페이징 클램프(보안 수정 회귀 방지)
  - `CacheControlInterceptorTest` (7) — 캐시 헤더 경로 규칙·제외 로직
  - `ScreenerServiceTest` (4) — `sortBy` 화이트리스트 폴백 + 페이징 클램프
  - `FinancialServiceTest` (6) — `Bucket`의 당기/전기 병합 집계(가장 위험했던 로직) + 계정
    매핑(id 우선·name 폴백) + 마진/ROE 파생
  - `GlobalExceptionHandlerTest` (7) — 400 핸들러(타입불일치·깨진JSON·IllegalArg) + 검증·404·500
  - `ClientIpTest` (7) — CF/XFF/remoteAddr 우선순위 + salt 해시 결정성
  - `SitemapServiceTest` (2) — 정적 라우트 + 게시 가이드/글 URL 동적 생성
- [ ] 아직 남음: **컨트롤러·레포지토리·통합 테스트 0개** (context-load 스모크 포함 —
      Testcontainers 필요). 아래도 미검증:
  - `screener/spec/FinancialMetricSpec.java` — 필터 조합(Criteria 컨텍스트 필요 → 통합 테스트)
  - `collector/market/market_pipeline.py` (360줄) — 재무지표 계산
- [ ] 프론트엔드: 테스트 프레임워크 자체가 없음 (vitest 미설치)
- [ ] 컬렉터: 테스트 0개

### CI 없음

- [ ] `.github/` 자체가 없다. push 시 `mvn test` + `tsc -b` + `eslint`만 돌려도
      배포 전 파손을 잡는다.

### 컬렉터-백엔드 계정 매핑 중복

- [ ] **위치**: `backend/.../financial/service/FinancialService.java:33-38`
      ↔ `collector/market/market_pipeline.py`의 `_ACCOUNT_MAP`

IFRS 계정 ID Set이 양쪽에 중복 정의되어 **주석으로만 동기화**되어 있다.
한쪽만 고치면 조용히 어긋난다. DB 테이블이나 공유 JSON으로 추출할 것.

### API 문서 없음

- [ ] springdoc-openapi 미적용. 엔드포인트가 30개 가까운데 정본이 코드뿐이다.

---

## 3. 성능

### 🔴 캐싱이 전면 비활성 — 모든 조회가 PostgreSQL 직타

- [x] **해결(제거 방향)** — Redis 를 스택에서 완전 제거. `NoOpCacheManager`로 무동작이면서
  384MB만 점유하던 순손해를 걷어냈다. 조회 캐시는 앞서 넣은 HTTP `Cache-Control`/`ETag`
  + Cloudflare 엣지가 대신 흡수한다.
  - `docker-compose.yml` — redis 서비스 + backend/collector 의 `REDIS_*` env + `depends_on` 제거
  - `pom.xml` — `spring-boot-starter-data-redis` 제거
  - `RedisConfig.java` 삭제 — `spring.cache.type=none` 이 Spring Boot 기본 `NoOpCacheManager`
    를 제공하므로 `@Cacheable`/`@EnableCaching` 은 그대로 무해하게 동작(5개 서비스 무수정)
  - `application.yml` — `spring.data.redis` + `management.health.redis` 제거
  - `collector/config.py`·`requirements.txt` — 미사용 `REDIS_*` 설정·`redis` 패키지 제거

  > 나중에 실제 캐시가 필요하면 `spring.cache.type` 을 caffeine 등으로 바꾸면 된다
  > (컨테이너 추가 없이 인프로세스 캐시).

### 🟡 HTTP 캐시 헤더가 sitemap에만 있음

- [x] **해결** — `config/CacheControlInterceptor` 신설 + `WebConfig` 등록.
  공개 GET API 에 경로별 `Cache-Control: public` 부여(느린 데이터 10분 / 자주 갱신 60초).
  `ShallowEtagHeaderFilter` 로 `ETag`+조건부 304 도 추가. **캐시에서 제외**: `/api/admin`,
  `/api/auth`, `/api/posts`(요청 IP 기준 `myReaction` 포함 — 공유 캐시 노출 방지),
  `/api/sitemap.xml`(자체 헤더 유지).

### 🟡 nginx에 gzip·정적 캐시·보안 헤더 전무

- [x] **해결** (`frontend/nginx.conf`) —
  - `gzip on` + 텍스트 계열 `gzip_types` (origin↔edge 구간 압축)
  - `location ^~ /assets/` 에 1년 `immutable` 캐시 (Vite 해시 산출물 전용 —
    루트의 비해시 `favicon.svg` 등은 제외해 교체 시 반영되게 유지)
  - `X-Content-Type-Options: nosniff` + `Referrer-Policy` 서버 레벨 부여.
    nginx `add_header` 상속 규칙상 자체 헤더가 있는 하위 location(`/login`·`/admin`·
    `/404.html`·`/assets/`)에는 재선언해 누락을 막음.

### 🟡 검색 LIKE `%q%` — 인덱스 미사용

- [x] **해결** — `V11__search_trgm_indexes.sql` 추가. `pg_trgm` GIN 인덱스로 부분 문자열
  LIKE 를 인덱스 처리. 쿼리가 `LOWER(col) LIKE ...` 이므로 플래너가 확실히 타도록
  `lower(col)` **표현식 인덱스**로 생성:
  - `companies` — `lower(company_name)`, `lower(ticker)` (검색 OR 양쪽 다 인덱싱해야 풀스캔 회피)
  - `disclosures` — `lower(report_name)` (누적 테이블이라 이득 최대)

  > 주의: `CONCURRENTLY` 는 Flyway 트랜잭션 안에서 못 쓰므로 일반 `CREATE INDEX` 사용
  > (기동 시 짧은 락). `pg_trgm` 은 PG13+ trusted extension 이라 DB 소유자가 설치 가능.

---

## 4. 추가하면 좋을 기능

우선순위 순.

| 기능 | 이유 |
|---|---|
| **JSON-LD 구조화 데이터** | `Article`(가이드)·`Organization`·`FAQPage` 스키마. AdSense 재심사·검색 노출에 직결되고 비용이 가장 싸다. `frontend/scripts/prerender-meta.mjs`가 이미 있으니 확장만 하면 됨 |
| **관심종목 서버 동기화** | `stores/watchlistStore.ts`가 localStorage 전용 → 기기 바꾸면 소실. `portfolio_holdings` 테이블은 V1에 정의만 되어 있는 상태 |
| **배당 캘린더** | `SPRING_API_PLAN.md`에 계획만 있고 `dividends` 테이블조차 없음. DART 배당 공시로 수집 가능하고 개인투자자 검색 수요가 큼 |
| **주가/공시 알림** | `alert_settings` 테이블도 V1에 정의만 되어 있음. 이메일/웹푸시로 재방문율 확보 |
| **재무 히스토리 차트 강화** | 현재 `trend`가 연간 사업보고서 위주. 분기 QoQ·YoY 비교와 동종업계 백분위(percentile)를 붙이면 스크리너 차별화 |
| **데이터 신선도 배지** | `sync_status`를 이미 수집 중인데 UI 노출이 `SyncStatusCard` 한 곳뿐. 종목 상세마다 "주가 기준일 / 재무 기준 분기"를 명시하면 신뢰도와 법적 방어 모두 개선 |
| ~~**컬렉터 실패 알림**~~ | ✅ **해결** — 이 항목이 실제로 터졌다. 정책브리핑 RSS 가 2026-07-01 폐지됐는데 파이프라인이 "0건 수집"을 성공으로 기록해 36일간 아무도 몰랐다. `record_sync()` 가 `consecutive_failures` 를 추적하고 임계치(기본 3회 연속)에서 Discord/Slack 웹훅으로 한 번만 알린다(`COLLECTOR_ALERT_WEBHOOK`). 브리핑 파이프라인은 피드별로 실패를 집계해 `failed`/`partial` 로 기록한다 |
| **CSV/Excel 내보내기** | 스크리너·재무제표. 구현 비용 대비 체감 가치가 높다 |

---

## 권장 착수 순서

1. **페이징 클램프 + `sortBy` 화이트리스트 + 400 예외 핸들러** — 반나절, 가장 실질적인 위험 제거
2. **HTTP 캐시 헤더 + nginx gzip/정적 캐시** — 반나절, Cloudflare가 부하를 대신 받아줌
3. **Redis 캐싱 활성화 또는 컨테이너 제거** — 어느 쪽이든 현 상태가 최악
4. **CI (mvn test + tsc + eslint)** — 이후 모든 변경의 안전망
5. 기능 추가는 JSON-LD → 관심종목 서버 동기화 순
