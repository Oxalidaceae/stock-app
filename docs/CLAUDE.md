# Stock App — Claude Agent Guide

## 프로젝트 개요

대한민국 상장 기업의 투자 정보를 종합적으로 제공하는 블룸버그 터미널 스타일의 웹 서비스.
주가, DART 공시/재무제표, 한국은행 경제지표, 종목 스크리너, 포트폴리오 트래킹 기능을 제공한다.

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 백엔드 | Spring Boot 3.3, Java 21, Maven |
| 프론트엔드 | React 18, TypeScript, Vite |
| 데이터 수집 | Python 3.11+, FinanceDataReader |
| 주 DB | PostgreSQL 16 |
| 캐시 | Redis 7 |

---

## 프로젝트 구조

```
stock_app/
├── backend/                  # Spring Boot API 서버
│   └── src/main/java/com/stockapp/
│       ├── StockAppApplication.java
│       ├── domain/           # 도메인별 패키지 (entity, repository, service, controller)
│       │   ├── stock/
│       │   ├── disclosure/   # DART 공시
│       │   ├── financial/    # 재무제표
│       │   ├── economic/     # 경제지표
│       │   ├── portfolio/
│       │   └── screener/
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
│   ├── ecos/                 # 한국은행 경제지표 수집
│   ├── market/               # 주가 수집 (FinanceDataReader)
│   ├── config.py             # 환경변수 설정
│   └── main.py               # 스케줄러 진입점
│
└── docs/                     # 문서
    └── CLAUDE.md             # 이 파일
```

---

## 데이터 흐름

```
[DART API] [ECOS API] [FinanceDataReader]
      ↓          ↓              ↓
  [ Python Collector — 주기적 수집/저장 ]
             ↓
        [PostgreSQL]  ←→  [Redis 캐시]
             ↓
     [ Spring Boot REST API ]
             ↓
         [ React 프론트 ]
```

- **주가**: FinanceDataReader → Redis(15분 캐시) → Spring API 응답
- **공시**: DART API → PostgreSQL → Spring API 응답
- **경제지표**: ECOS API → PostgreSQL → Spring API 응답

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
- 주요 통계표 코드 (`collector/ecos/ecos_collector.py`의 `STAT_CODES` 참고):
  - `722Y001` — 한국은행 기준금리
  - `111Y002` — GDP 성장률
  - `901Y009` — 소비자물가지수(CPI)
  - `731Y001` — 원/달러 환율

### FinanceDataReader
- Python 라이브러리, 무료, 15~20분 지연
- `fdr.DataReader("005930")` — 삼성전자 주가
- `fdr.StockListing("KOSPI")` — KOSPI 전체 종목 목록
- collector/market/stock_collector.py에서 사용

---

## 환경 변수

`collector/.env` (`.env.example` 참고):
```
DART_API_KEY=...
ECOS_API_KEY=...
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stockapp
DB_USERNAME=stockapp
DB_PASSWORD=stockapp
REDIS_HOST=localhost
REDIS_PORT=6379
```

`backend/src/main/resources/application.yml` — Spring 환경변수 동일하게 필요.

---

## 주요 기능 목록

| 기능 | 상태 | 담당 |
|---|---|---|
| 주가 조회 (15분 지연) | TODO | collector/market + Spring |
| DART 공시 목록/상세 | TODO | collector/dart + Spring |
| 재무제표 (연/분기) | TODO | collector/dart + Spring |
| 한국은행 경제지표 | TODO | collector/ecos + Spring |
| 종목 스크리너 | TODO | Spring + React |
| 동종업계 비교 | TODO | Spring + React |
| 배당 캘린더 | TODO | Spring + React |
| 포트폴리오 트래킹 | TODO | Spring + React |

---

## 코딩 컨벤션

### Backend (Java)
- 패키지 구조: `com.stockapp.domain.{도메인}.{layer}` (예: `com.stockapp.domain.stock.service`)
- API 응답은 `ApiResponse<T>` 공통 래퍼 사용
- 예외는 `GlobalExceptionHandler`에서 일괄 처리
- 서비스 레이어에서 Redis 캐시 우선 조회 → 없으면 DB 조회

### Frontend (TypeScript)
- 서버 상태: React Query (`@tanstack/react-query`)
- 클라이언트 상태: Zustand
- 차트: Recharts (재무/경제지표), lightweight-charts (주가 캔들차트)
- 블룸버그 터미널 스타일: 다크 테마, 모노스페이스 폰트, 정보 밀도 높은 레이아웃

### Python Collector
- 각 수집기는 독립 실행 가능하도록 작성
- DB 저장 실패 시 로그 남기고 계속 진행 (수집 중단 방지)
- Redis 캐시 TTL: 주가 15분, 공시 목록 1시간, 경제지표 24시간

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

## 주의사항

- FinanceDataReader는 Python 전용이므로 Spring에서 직접 호출 불가 → collector가 DB/Redis에 저장한 데이터를 Spring이 읽는 구조
- DART API 기업코드(corp_code)는 종목코드(ticker)와 다름 → 초기 실행 시 `corpCode.xml` 다운로드하여 매핑 테이블 구축 필요
- 실시간 주가 재배포는 법적 라이선스 필요 → 현재는 15~20분 지연 데이터만 제공
