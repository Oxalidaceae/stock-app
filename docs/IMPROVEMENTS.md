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

- [ ] 백엔드: 9개 클래스 / 36개 `@Test` — guide·post·auth·jwt·webconfig만.
      **컨트롤러·레포지토리·통합 테스트 0개**
- [ ] 프론트엔드: 테스트 프레임워크 자체가 없음 (vitest 미설치)
- [ ] 컬렉터: 테스트 0개

회귀가 가장 잦을 곳이 전부 미검증이다:

- `screener/spec/FinancialMetricSpec.java` — 필터 조합 로직
- `financial/service/FinancialService.java:88-128` — `Bucket`의 당기/전기 병합 집계.
  테스트 없이 손대기 특히 위험한 코드
- `collector/market/market_pipeline.py` (360줄) — 재무지표 계산

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

- [ ] **위치**: `backend/.../config/RedisConfig.java`

`NoOpCacheManager`라 `@Cacheable`이 전부 무동작이다. 그런데 **Redis 컨테이너는 384MB를
점유하며 돌고 있고**, actuator health까지 붙어 있다. RAM이 빠듯한 서버에서 순수 손해.

기존 주석의 원인("GenericJackson2JsonRedisSerializer 폴리모픽 직렬화 이슈") 해법:

- `GenericJackson2JsonRedisSerializer` 대신 **DTO별 `Jackson2JsonRedisSerializer`** 사용, 또는
- `ObjectMapper`에 `JavaTimeModule` 등록 +
  `activateDefaultTyping(LaissezFaireSubTypeValidator.instance, NON_FINAL)`

하루 1회 갱신되는 데이터(재무지표·경제지표·100대지표)라 캐시 히트율이 극단적으로 높을 영역이다.

> 캐시를 켤 계획이 없다면 최소한 redis 컨테이너와 `management.health.redis`를 내려
> 384MB를 회수할 것. 어느 쪽이든 **지금 상태가 최악**이다.

### 🟡 HTTP 캐시 헤더가 sitemap에만 있음

- [ ] **위치**: 각 도메인 컨트롤러 (`SitemapController`만 `CacheControl` 적용됨)

주가는 15~20분 지연, 경제지표는 시간 단위, 가이드는 사실상 정적이다.
`Cache-Control: public, max-age=…` + `ETag`만 붙여도 Cloudflare 엣지가 대부분 흡수한다.
**애플리케이션 캐싱이 없는 현 구조에서 가장 저렴한 개선.**

### 🟡 nginx에 gzip·정적 캐시·보안 헤더 전무

- [ ] **위치**: `frontend/nginx.conf`

```nginx
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
gzip_min_length 1024;

# Vite 해시 파일명이라 immutable 이 안전
location ~* \.(js|css|svg|woff2)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}

add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

Cloudflare가 gzip을 대신 해주긴 하지만 origin↔edge 구간은 여전히 비압축이다.

### 🟡 검색 LIKE `%q%` — 인덱스 미사용

- [ ] **위치**: `CompanyRepository.search()` (`:15-21`),
      `DisclosureRepository.findAllRecent()` (`:22-30`)

선행 와일드카드라 항상 풀스캔. 기업 ~2,800건은 괜찮지만
**공시는 누적되므로 시간이 갈수록 느려진다.**

```sql
-- 신규 Flyway 마이그레이션 (V11__)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_disclosures_report_name_trgm
    ON disclosures USING gin (report_name gin_trgm_ops);
CREATE INDEX idx_companies_name_trgm
    ON companies USING gin (company_name gin_trgm_ops);
```

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
| **컬렉터 실패 알림** | 현재 실패는 로그에만 남는다. Dozzle을 매일 보지 않으면 며칠간 데이터가 멈춘 것을 모른다. Discord/텔레그램 웹훅 한 줄이면 해결 |
| **CSV/Excel 내보내기** | 스크리너·재무제표. 구현 비용 대비 체감 가치가 높다 |

---

## 권장 착수 순서

1. **페이징 클램프 + `sortBy` 화이트리스트 + 400 예외 핸들러** — 반나절, 가장 실질적인 위험 제거
2. **HTTP 캐시 헤더 + nginx gzip/정적 캐시** — 반나절, Cloudflare가 부하를 대신 받아줌
3. **Redis 캐싱 활성화 또는 컨테이너 제거** — 어느 쪽이든 현 상태가 최악
4. **CI (mvn test + tsc + eslint)** — 이후 모든 변경의 안전망
5. 기능 추가는 JSON-LD → 관심종목 서버 동기화 순
