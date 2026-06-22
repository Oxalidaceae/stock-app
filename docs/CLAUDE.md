# Jipyo (지표) — Claude Agent Guide

## 프로젝트 개요

대한민국 상장 기업의 투자 정보를 종합적으로 제공하는 블룸버그 터미널 스타일의 웹 서비스.
주가, DART 공시/재무제표, 한국은행 경제지표·거시 100대 통계지표, 경제 소식(정책브리핑), 종목 스크리너 기능을 제공한다.

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 백엔드 | Spring Boot 3.3, Java 21, Maven, Flyway |
| 프론트엔드 | React 19, TypeScript, Vite, React Router, TanStack Query |
| 데이터 수집 | Python 3.11+, FinanceDataReader |
| 주 DB | PostgreSQL 16 |
| 캐시 | Redis 7 (현재 `NoOpCacheManager`로 캐싱 비활성) |

---

## 프로젝트 구조

```
stock_app/
├── backend/                  # Spring Boot API 서버
│   └── src/main/java/com/stockapp/
│       ├── StockAppApplication.java
│       ├── domain/           # 도메인별 패키지 (entity, repository, service, controller)
│       │   ├── company/      # 기업 기본정보·검색
│       │   ├── stock/        # 주가
│       │   ├── disclosure/   # DART 공시
│       │   ├── financial/    # 재무제표·재무지표
│       │   ├── economic/     # 경제지표 (ECOS)
│       │   ├── macro/        # 거시 100대 통계지표
│       │   ├── briefing/     # 정책브리핑 (경제 소식)
│       │   ├── screener/     # 종목 스크리너
│       │   └── status/       # 데이터 수집 상태
│       ├── common/           # 공통 유틸, 예외처리, 응답 포맷
│       └── config/           # Spring 설정 (Security, Redis, WebSocket 등)
│
├── frontend/                 # React SPA
│   └── src/
│       ├── pages/            # 라우트별 페이지
│       ├── components/       # 재사용 컴포넌트
│       ├── hooks/            # React Query 훅
│       ├── stores/           # Zustand 전역 상태
│       ├── api/              # Axios API 클라이언트
│       └── types/            # TypeScript 타입 정의
│
├── collector/                # Python 데이터 수집 서비스
│   ├── dart/                 # DART 공시/재무제표 수집
│   ├── ecos/                 # 한국은행 경제지표 + 100대 통계지표 수집
│   ├── market/               # 주가/재무지표 수집 (FinanceDataReader)
│   ├── rss/                  # 정책브리핑 RSS (경제 소식) 수집
│   ├── db/                   # DB 연결·세션
│   ├── scripts/              # 진단 스크립트 (probe_*.py)
│   ├── config.py             # 환경변수 설정
│   └── main.py               # 스케줄러 진입점
│
└── docs/                     # 문서
    └── CLAUDE.md             # 이 파일
```

---

## 데이터 흐름

```
[DART API] [ECOS API] [FinanceDataReader] [정책브리핑 RSS]
      ↓          ↓             ↓                 ↓
  [ Python Collector — 주기적 수집/저장 ]
             ↓
        [PostgreSQL]
             ↓
     [ Spring Boot REST API ]
             ↓
         [ React 프론트 ]
```

- **주가**: FinanceDataReader → PostgreSQL → Spring API 응답
- **공시**: DART API → PostgreSQL → Spring API 응답
- **경제지표**: ECOS API → PostgreSQL → Spring API 응답
- **경제 소식**: 정책브리핑 RSS → PostgreSQL → Spring API 응답

> Redis 의존성·설정은 있으나 현재 `NoOpCacheManager`라 캐싱은 비활성. 모든 조회는 PostgreSQL 직접 조회.

---

## 외부 API

### DART Open API
- 발급: https://opendart.fss.or.kr
- 주요 엔드포인트:
  - `GET /api/list.json` — 공시 목록
  - `GET /api/fnlttSinglAcntAll.json` — 재무제표 (단일/연결)
  - `GET /api/company.json` — 기업 기본정보
  - `GET /api/corpCode.xml` — 전체 기업코드 ZIP (종목코드↔DART코드 매핑)
- 일 10,000건 호출 제한

### 한국은행 ECOS API
- 발급: https://ecos.bok.or.kr
- URL 형식: `{BASE_URL}/StatisticSearch/{API_KEY}/json/kr/1/100/{통계표코드}/{주기}/{시작}/{종료}/{항목코드}`
- 실제 수집 지표 (`collector/ecos/ecos_pipeline.py` 참고):
  - `722Y001` — 한국은행 기준금리
  - `200Y108` — 실질 GDP (계절조정, 분기)
  - `901Y009` — 소비자물가지수(CPI)
  - `731Y003` — 원/달러 환율 (일별 종가)
  - `161Y005` — 통화량 M2 (평잔, 계절조정)
  - `301Y017` — 경상수지 (계절조정)

### FinanceDataReader
- Python 라이브러리, 무료, 15~20분 지연
- `fdr.DataReader("005930")` — 삼성전자 주가
- `fdr.StockListing("KOSPI")` — KOSPI 전체 종목 목록
- collector/market/stock_collector.py에서 사용

---

## 환경 변수

Docker 구동 시에는 **루트 `.env`** (`.env.example` 참고)가 정본이며, docker-compose가 각 서비스에 주입한다. 컨테이너 내부에서는 호스트가 docker 네트워크 이름(`postgres`, `redis`)으로 바뀐다.

```
DART_API_KEY=...
ECOS_API_KEY=...
DB_NAME=stockapp
DB_USERNAME=stockapp
DB_PASSWORD=stockapp
JWT_SECRET=...
# docker 내부: DB_HOST=postgres / REDIS_HOST=redis
# 로컬 개발(컨테이너 밖): DB_HOST=localhost / REDIS_HOST=localhost
```

`backend/src/main/resources/application.yml` — Spring도 동일 환경변수를 사용.

---

## 주요 기능 목록

| 기능 | 상태 | 담당 |
|---|---|---|
| 주가 조회 (15~20분 지연) | ✅ 구현 | collector/market + Spring(stock) |
| DART 공시 목록/상세 | ✅ 구현 | collector/dart + Spring(disclosure) |
| 재무제표 (연/분기) | ✅ 구현 | collector/dart + Spring(financial) |
| 한국은행 경제지표 | ✅ 구현 | collector/ecos + Spring(economic) |
| 거시 100대 통계지표 | ✅ 구현 | collector/ecos + Spring(macro) |
| 경제 소식 (정책브리핑) | ✅ 구현 | collector/rss + Spring(briefing) |
| 종목 스크리너 | ✅ 구현 | Spring(screener) + React |
| 동종업계 비교 | 미구현 | — |
| 배당 캘린더 | 미구현 (계획만, SPRING_API_PLAN.md) | — |
| 포트폴리오 트래킹 | 미구현 (테이블만 정의) | — |

---

## 코딩 컨벤션

### Backend (Java)
- 패키지 구조: `com.stockapp.domain.{도메인}.{layer}` (예: `com.stockapp.domain.stock.service`)
- API 응답은 `ApiResponse<T>` 공통 래퍼 사용
- 예외는 `GlobalExceptionHandler`에서 일괄 처리
- 캐싱은 현재 비활성(`NoOpCacheManager`) — 서비스는 PostgreSQL을 직접 조회. `@Cacheable`은 향후 Redis 캐시 매니저 교체 시 동작

### Frontend (TypeScript)
- 서버 상태: React Query (`@tanstack/react-query`)
- 클라이언트 상태: Zustand
- 차트: Recharts (재무/경제지표). 자체 주가 캔들차트는 미운영 — 종목 상세에서 TradingView·네이버 금융 직링크 제공
- 블룸버그 터미널 스타일: 다크 테마, 모노스페이스 폰트, 정보 밀도 높은 레이아웃

### Python Collector
- 각 수집기는 독립 실행 가능하도록 작성
- DB 저장 실패 시 로그 남기고 계속 진행 (수집 중단 방지)
- 데몬 스케줄: 매일 16:30 `--daily` · 일 02:00 `--weekly` · 매시간 100대 지표 · 3시간마다 RSS

---

## 로컬 개발 환경 설정

```bash
# PostgreSQL & Redis (Docker)
docker run -d --name postgres -e POSTGRES_DB=stockapp -e POSTGRES_USER=stockapp -e POSTGRES_PASSWORD=stockapp -p 5432:5432 postgres:16
docker run -d --name redis -p 6379:6379 redis:7

# Python collector
cd collector
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # API 키 입력 후
python main.py

# Spring backend
cd backend
./mvnw spring-boot:run

# React frontend
cd frontend
npm run dev
```

---

## DB 스키마

마이그레이션 파일: `backend/src/main/resources/db/migration/` (`V1`~`V6`)
Flyway가 Spring Boot 시작 시 자동 실행.

| 테이블 | 설명 |
|---|---|
| `companies` | 기업 기본정보 (corp_code, ticker, 업종 등) |
| `stock_prices` | 일별 주가 OHLCV |
| `disclosures` | DART 공시 목록 |
| `financial_statements` | DART 재무제표 계정별 원본 |
| `financial_metrics` | 계산된 재무지표 (PER, PBR, ROE 등) — 스크리너용 |
| `economic_indicators` | 한국은행 ECOS 경제지표 |
| `macro_keystats` | 거시 100대 통계지표 (매시간 갱신) |
| `macro_keystat_history` | 100대 통계지표 이력 |
| `policy_briefing` | 정책브리핑 RSS (경제 소식) |
| `sync_status` | 데이터 수집 상태 추적 |
| `users` | 회원 (V1에 정의, 로그인 미구현) |
| `stock_memos` | 종목별 메모 (V1에 정의, 미사용) |
| `portfolio_holdings` | 포트폴리오 보유 종목 (V1에 정의, 미사용) |
| `alert_settings` | 공시/가격 알림 설정 (V1에 정의, 미사용) |

> `dividends` 테이블은 계획(SPRING_API_PLAN.md)에만 있고 실제 마이그레이션에는 없음.

**핵심 관계:**
- `companies.corp_code` ↔ DART 기업코드 (종목코드 ticker와 다름)
- `financial_metrics`는 collector가 `financial_statements` + `stock_prices`를 조합해 주기적으로 계산
- `stock_prices`, `disclosures`는 collector가 수집하여 직접 INSERT

---

## 주의사항

- FinanceDataReader는 Python 전용이므로 Spring에서 직접 호출 불가 → collector가 PostgreSQL에 저장한 데이터를 Spring이 읽는 구조
- DART API 기업코드(corp_code)는 종목코드(ticker)와 다름 → 초기 실행 시 `corpCode.xml` 다운로드하여 매핑 테이블 구축 필요
- 실시간 주가 재배포는 법적 라이선스 필요 → 현재는 15~20분 지연 데이터만 제공
- DB 스키마 변경 시 반드시 Flyway 마이그레이션 파일(V2__, V3__...) 추가 — `ddl-auto: none`이므로 직접 수정 불가
