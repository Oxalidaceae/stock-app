# Jipyo (지표)

대한민국 상장 기업의 투자 정보를 종합적으로 제공하는 블룸버그 터미널 스타일 웹 서비스.

DART 공시·재무제표, 한국은행 경제지표, KOSPI/KOSDAQ 주가를 한 곳에서 조회하고, 재무지표 기반 종목 스크리너를 제공한다.

**운영 중인 서비스: <https://jipyo.net>**

---

## 주요 기능

- **종목 검색** — 키보드 화살표 네비게이션 + Enter로 빠른 진입
- **종목 상세** — 가격, 재무지표(PER·PBR·ROE 등), 최근 공시
- **외부 차트 링크** — TradingView·네이버 금융으로 깊은 차트 조회 (자체 차트 미운영)
- **DART 공시** — 검색·날짜별 그룹·5영업일 보관, 5영업일 이전은 DART 직링크
- **재무제표** — 분기·연간 데이터에서 PER/PBR/PSR/ROE/ROA 등 자동 계산
- **경제지표** — 한국은행 기준금리·실질 GDP·CPI·원달러 환율·M2·경상수지 (10년치)
- **거시 100대 통계지표** — 한국은행 주요 통계 100선 (매시간 갱신)
- **경제 소식** — 부처 보도자료 RSS 기반 경제 뉴스 (매시간 갱신)
- **종목 스크리너** — 재무지표·시장·시총 조건 기반 필터링
- **경제 소식 편집** — 관리자가 RSS 기사를 선별하고 자체 요약을 작성한 뒤 공개
- **투자 가이드** — 재무지표·공시·거시경제 해설 아티클, 관리자가 마크다운으로 작성·편집
- **게시판** — 관리자 공지·소식, 분류(공지·업데이트·기록)별 보기, 로그인 없는 추천/비추천 반응(IP 해시 기준 게시글당 1표)
- **지표 해석** — 종목 상세에서 PER·PBR·ROE 등 실제 값에 따른 자동 해석 + 가이드 연결
- **동적 sitemap** — 게시된 가이드·게시글을 백엔드가 DB에서 읽어 sitemap.xml 자동 생성

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 백엔드 | Spring Boot 3.3, Java 17, Maven, Spring Data JPA, Flyway, Spring Security + JWT(JJWT), Actuator, Lombok |
| 프론트엔드 | React 19, TypeScript, Vite, React Router 7, TanStack Query, Zustand, Recharts, Axios, react-markdown |
| 데이터 수집 | Python 3.11, FinanceDataReader, SQLAlchemy, pandas, requests, feedparser, schedule |
| 데이터베이스 | PostgreSQL 16 |
| 캐시 | 애플리케이션 캐시 없음(`NoOpCacheManager`) — HTTP `Cache-Control`/`ETag` + Cloudflare 엣지로 흡수 |
| 인프라 | Docker Compose, nginx(프론트 서빙·API 프록시), Cloudflare Tunnel(외부 공개), Dozzle(로그 뷰어) |

---

## 프로젝트 구조

```
stock_app/
├── backend/             # Spring Boot REST API
│   └── src/main/resources/db/migration/   # Flyway SQL
├── frontend/            # React SPA (nginx 서빙)
├── collector/           # Python 데이터 수집 파이프라인
│   ├── dart/            # DART OpenAPI 클라이언트
│   ├── ecos/            # 한국은행 ECOS (경제지표 + 100대 통계지표)
│   ├── market/          # 주가·재무지표 (FinanceDataReader)
│   ├── rss/             # 부처 보도자료 RSS (경제 소식)
│   ├── db/              # DB 연결·세션
│   └── scripts/         # 진단 스크립트 (probe_*.py, list_ecos_keystats.py)
├── scripts/             # 운영 스크립트 — DB 자동 백업 루프·수동 백업·복구
├── docs/                # DEPLOY.md(배포)·CLAUDE.md(에이전트 가이드)·IMPROVEMENTS.md(개선 과제)·SPRING_API_PLAN.md(API 설계 메모)
└── docker-compose.yml   # 전체 스택 (backup 서비스가 매일 DB 자동 백업)
```

### 데이터 흐름

```
[DART]   [ECOS]   [FinanceDataReader (KRX)]   [부처 보도자료 RSS]
   ↓        ↓              ↓                        ↓
   [ Python Collector — 매시간 스태거(공시·경제지표·재무지표·100대지표·경제소식) · 주가 장마감후 16:00 · 재무제표 원본 매주 일요일 02:00 ]
              ↓
         [ PostgreSQL ]
              ↓
      [ Spring Boot REST API ]
              ↓
         [ React 프론트 ]
```

---

## 빠른 시작 (Docker)

### 1. 사전 준비

- Docker Desktop 또는 Docker Engine + Compose v2
- DART OpenAPI 키 ([opendart.fss.or.kr](https://opendart.fss.or.kr) 가입 후 발급)
- ECOS OpenAPI 키 ([ecos.bok.or.kr](https://ecos.bok.or.kr) 가입 후 발급)

### 2. `.env` 작성

프로젝트 루트에 `.env` 파일:

```env
DART_API_KEY=발급받은_DART_키
ECOS_API_KEY=발급받은_ECOS_키
DB_NAME=stockapp
DB_USERNAME=stockapp
DB_PASSWORD=stockapp
JWT_SECRET=32바이트_이상의_긴_랜덤_문자열
ADMIN_USERNAME=관리자_아이디
ADMIN_PASSWORD=12자_이상의_강한_비밀번호
AUTH_COOKIE_SECURE=false
```

`AUTH_COOKIE_SECURE=false`는 로컬 HTTP 개발용이다. HTTPS로 운영할 때는 반드시 `true`로 설정한다.
최초 기동 시 `ADMIN_USERNAME` 계정이 `ADMIN` 권한으로 생성되며 비밀번호는 BCrypt로 해시되어 저장된다.

### 3. 인프라 + 백엔드 + 프론트 + 자동 데몬 기동

```bash
docker compose up -d
```

→ 6개 컨테이너 기동:
- `postgres`, `backend`, `frontend`, **`collector-daemon`** (자동 갱신), `backup` (매일 DB 백업), `dozzle` (로그 뷰어)
- 프로파일로 감싼 서비스는 기본 기동에서 빠진다:
  - `collector-init` — `init` 프로파일 (초기 적재 시 수동 실행)
  - `cloudflared` — `tunnel` 프로파일 (운영 서버에서만. `.env`에 `COMPOSE_PROFILES=tunnel` + `TUNNEL_TOKEN` 필요)

### 4. 초기 데이터 적재 (최초 1회)

```bash
# 기본 데이터: 기업코드, KOSPI/KOSDAQ, 경제지표 10년, 최근 공시, 직전 영업일 주가 (~30초)
docker compose --profile init up collector-init

# 재무제표 + PER/PBR/ROE 등 메트릭 (~30분, DART 5,000+ 콜)
docker compose --profile init run --rm collector-init --weekly
```

### 5. 접속

- 프론트엔드: <http://localhost:3000>
- 백엔드 API: <http://localhost:8080/api>
- 관리자 로그인: <http://localhost:3000/login>

---

## 로컬 개발 (Docker 없이)

코드를 고치며 HMR·디버거를 쓰려면 DB만 컨테이너로 띄우고 백엔드·프론트는 호스트에서 직접 실행한다.

### 1. DB만 기동 (호스트 포트 개방 필요)

`docker-compose.yml`의 postgres는 기본적으로 호스트 포트를 열지 않는다(도커 내부망 전용). 호스트에서 백엔드를 돌리려면 해당 줄의 주석을 먼저 해제한다:

```yaml
  postgres:
    ...
    ports: ["127.0.0.1:5432:5432"]
```

```bash
docker compose up -d postgres
```

### 2. 백엔드 (터미널 1)

```bash
cd backend
JWT_SECRET=로컬용_32자_이상_랜덤값 \
ADMIN_USERNAME=admin ADMIN_PASSWORD=로컬_관리자_비밀번호 \
AUTH_COOKIE_SECURE=false \
LOG_DIR=./logs \
./mvnw spring-boot:run
```

- `JWT_SECRET`은 필수다. 미설정 시 `application.yml`의 fallback 값이 쓰이는데, `JwtTokenService`가 "저장소에 공개된 기본값"이라며 기동을 거부한다.
- `AUTH_COOKIE_SECURE=false`가 없으면 HTTP인 로컬에서 로그인 쿠키가 브라우저에 저장되지 않아 관리자 로그인이 안 된다.
- `LOG_DIR`을 안 주면 컨테이너 기준 경로인 `/logs`에 로그 파일을 쓰려다 실패한다.
- DB·API 키 등 나머지는 `application.yml`의 기본값(`localhost:5432`, `stockapp`)을 그대로 쓴다. DART/ECOS 키는 백엔드가 아니라 collector가 쓰므로 API 서버만 띄울 땐 없어도 된다.

### 3. 프론트엔드 (터미널 2)

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

Vite dev 서버가 `/api` 요청을 `http://localhost:8080`으로 프록시한다(`vite.config.ts`). 백엔드 CORS 허용 목록에 `http://localhost:5173`이 기본 포함돼 있다.

### 4. 프로덕션 빌드 확인

```bash
cd frontend
PRERENDER_API_ORIGIN=http://localhost:8080 npm run build
```

`npm run build`는 `tsc -b` → `vite build` → `scripts/prerender-meta.mjs` 순으로 돈다. 마지막 단계가 가이드 본문을 API에서 읽어 정적 HTML을 생성하므로, 로컬 빌드에서는 `PRERENDER_API_ORIGIN`으로 로컬 백엔드를 가리켜야 한다(생략하면 운영 도메인을 보고, API가 없으면 경고만 남기고 건너뛴다).

### 테스트

```bash
cd backend
./mvnw test              # 전체 (17개 클래스 81개 테스트)
./mvnw test -Dtest=ScreenerServiceTest   # 단일 클래스
```

전부 Mockito 기반 단위 테스트라 DB도 Spring 컨텍스트도 필요 없다. 프론트엔드는 자동화 테스트가 없고 `npm run lint`(ESLint)와 `tsc -b`(빌드 시 타입 체크)만 있다.

---

## Collector CLI 옵션

```bash
# 데몬 컨테이너 안에서 ad-hoc 실행:
docker compose run --rm collector-daemon <옵션>
```

| 옵션 | 설명 |
|---|---|
| `--init` | 기업코드 + 시장정보 + 경제지표(10년) + 최근 공시 + 직전 영업일 주가 |
| `--daily` | 일별 주가 + 공시 + 경제지표 갱신 |
| `--weekly` | 분기/연간 재무제표 배치 + 재무지표 계산 (~30분) |
| `--ecos` | 경제지표만 갱신 |
| `--rss` | 경제 소식(부처 보도자료 RSS) 갱신 |
| `--backfill --ticker 005930 --start 2020-01-01` | 특정 종목 과거 주가 백필 |
| `--daemon` | 스케줄러 (매시간 스태거: :00 공시·:20 경제지표·:30 재무지표·:40 100대지표·:50 경제소식 / 주가 매일 16:00 / 재무제표 원본은 매주 일요일 02:00에 `--weekly`) |
| `--test-alert` | 수집 실패 알림 웹훅 설정 확인 (테스트 메시지 1건 발송) |

### 진단 스크립트 (`collector/scripts/`)

```bash
# ECOS 통계 코드 찾기 (깨진 지표 복구용)
docker compose run --rm --entrypoint python collector-daemon scripts/probe_ecos.py

# DART 재무제표 호출 진단 (대형주 5개 × 6보고서)
docker compose run --rm --entrypoint python collector-daemon scripts/probe_dart_financials.py

# 단일 회사 sync 추적
docker compose run --rm --entrypoint python collector-daemon scripts/probe_single_financial.py

# ECOS 100대 통계지표 카테고리별 목록 출력
docker compose run --rm --entrypoint python collector-daemon scripts/list_ecos_keystats.py
```

---

## 외부 API

| API | 발급처 | 일일 한도 |
|---|---|---|
| DART OpenAPI | <https://opendart.fss.or.kr> | 10,000 콜 |
| 한국은행 ECOS | <https://ecos.bok.or.kr> | 10,000 콜 |
| FinanceDataReader | KRX 스크래핑 (무인증) | 명시적 제한 없음 (예의 호출) |

---

## 데이터베이스

Flyway로 버전 관리. 마이그레이션 파일: `backend/src/main/resources/db/migration/`

| 테이블 | 설명 |
|---|---|
| `companies` | 기업 기본정보 (DART corp_code ↔ 종목코드 매핑) |
| `stock_prices` | 일별 주가 OHLCV + 시총 |
| `disclosures` | DART 공시 (최근 5영업일만 보관) |
| `financial_statements` | DART 재무제표 계정별 원본 |
| `financial_metrics` | PER·PBR·ROE 등 계산 지표 (스크리너용) |
| `economic_indicators` | 한국은행 ECOS 시계열 |
| `macro_keystats` | 거시 100대 통계지표 최신 스냅샷 (매시간 갱신) |
| `macro_keystat_history` | 100대 통계지표 히스토리 (전기대비 변화율·차트용) |
| `policy_briefing` | 부처 보도자료 RSS + 관리자 편집분 (경제 소식) |
| `app_users` | 자체 로그인 계정 (`ADMIN`/`USER`, BCrypt 해시) |
| `post` | 게시판 글 (분류 `NOTICE`/`UPDATE`/`NOTE`, 상태 `DRAFT`/`PUBLISHED`/`ARCHIVED`) |
| `post_reaction` | 게시글 추천/비추천 (IP 해시 기준 게시글당 1표) |
| `guide` | 투자 가이드 아티클 (마크다운 본문, slug 기반 URL) |
| `sync_status` | 데이터 수집 상태 추적 (연속 실패 시 알림 판단) |

> V1 스키마에 남아 있는 `users`·`portfolio_holdings`·`stock_memos`·`alert_settings`는 현재 어느 코드도 참조하지 않는 잔재다.

---

## 트러블슈팅

### Flyway 체크섬 미스매치

이미 적용된 V1 마이그레이션 파일을 수정한 경우 발생.

```bash
docker compose down -v   # 볼륨까지 제거 (dev 한정)
docker compose up -d
```

또는 Flyway `repair` 명령. 운영에서는 V2, V3... 형태로 새 마이그레이션을 추가할 것.

### Docker 네트워크 충돌 ("network ... not found")

옛 컨테이너가 사라진 네트워크 ID를 참조하는 상태.

```bash
docker rm -f stockapp-collector-init
docker network prune -f
docker compose up -d
```

### 컬렉터 코드 변경이 반영되지 않음

빌드 캐시 때문. 항상 빌드 명시:

```bash
docker compose build collector-daemon
docker compose up -d collector-daemon
```

또는 `--no-cache`로 완전 재빌드.

### 데몬 스케줄이 한국시간 아닌 UTC로 동작

`docker-compose.yml`의 collector 서비스에 `TZ: Asia/Seoul` 환경 변수가 설정되어 있어야 함.

확인:
```bash
docker exec stockapp-collector-daemon date
```

---

## 알려진 제한

- **차트**: 자체 차트 미운영 (TradingView 무료 위젯이 KRX 종목 미지원 + 자체 캔들 차트는 외부 차트 도구 대비 빈약). 종목 상세 페이지에서 TradingView·네이버 금융 직링크 제공.
- **애플리케이션 캐시 없음**: Redis 는 제거됨(직렬화 이슈로 비활성 상태였고 384MB만 점유). 조회 캐시는 HTTP `Cache-Control`/`ETag` + Cloudflare 엣지가 대신 흡수한다. `@Cacheable`/`@EnableCaching` 은 남겨 뒀으나 `spring.cache.type=none`(`NoOpCacheManager`)이라 무동작 — 나중에 caffeine 등으로 교체 가능.
- **--init이 재무제표는 수집 안 함**: DART API 한도 + 시간(30분) 부담 때문. `--weekly`로 별도 실행 필요.
- **재무제표 첫 적재 시점**: 새해 분기보고서는 회사별 제출 시기가 달라 적재 누락 가능. 사업보고서(11011)는 3월말 제출 후 안정적.

---

## 배포

운영 서버는 **Proxmox VM(Ubuntu) + Docker**이고, **Cloudflare Tunnel**(`cloudflared` 컨테이너)로 외부에 공개한다.
포트포워딩·공인 IP·직접 TLS 발급이 필요 없다 — 공유기에 인바운드 포트를 하나도 열지 않는다.

```bash
docker compose up -d --build                      # 전체 기동 (터널 포함)
docker compose --profile init up collector-init   # 초기 데이터 적재
```

터널은 `.env`에 `COMPOSE_PROFILES=tunnel`과 `TUNNEL_TOKEN`이 있어야 함께 기동한다.
같은 토큰을 두 서버에서 동시에 돌리면 트래픽이 양쪽으로 분배되므로, 서버를 옮길 때는 이전 서버를 먼저 내려야 한다.

상세 절차(환경 변수·Cloudflare Tunnel·무인 운영·백업·체크리스트)는 **[docs/DEPLOY.md](docs/DEPLOY.md)** 참고.
초기에는 윈도우 노트북 + Docker Desktop 구성이었고 지금은 리눅스로 이관한 상태라, DEPLOY.md는 1~9장이 윈도우 기준이고 **[10장](docs/DEPLOY.md)** 이 리눅스 이관·운영을 다룬다.
