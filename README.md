# Stock App

대한민국 상장 기업의 투자 정보를 종합적으로 제공하는 블룸버그 터미널 스타일 웹 서비스.

DART 공시·재무제표, 한국은행 경제지표, 주가 데이터를 한 곳에서 조회하고 종목 스크리너와 배당 캘린더를 제공한다.

---

## 주요 기능

- **주가 조회** — KOSPI/KOSDAQ 전 종목 주가 (15~20분 지연, FinanceDataReader)
- **DART 공시** — 정기공시·주요사항보고 실시간 수집 및 열람
- **재무제표** — 연간·분기별 재무제표 및 PER·PBR·ROE 등 핵심 지표
- **경제지표** — 한국은행 기준금리, GDP 성장률, CPI, 환율 등 6종
- **종목 스크리너** — 재무지표 조건 기반 종목 필터링
- **배당 캘린더** — 배당기준일·지급일·수익률 조회
- **포트폴리오 트래킹** *(예정)* — 보유 종목 등록 및 수익률 계산
- **공시 알림** *(예정)* — 관심 종목 신규 공시 알림

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 백엔드 | Spring Boot 3.3, Java 21, Maven |
| 프론트엔드 | React 18, TypeScript, Vite |
| 데이터 수집 | Python 3.11, FinanceDataReader |
| 주 데이터베이스 | PostgreSQL 16 (Flyway 마이그레이션) |
| 캐시 | Redis 7 |

---

## 프로젝트 구조

```
stock_app/
├── backend/          # Spring Boot API 서버
├── frontend/         # React SPA
├── collector/        # Python 데이터 수집 파이프라인
└── docs/
    └── CLAUDE.md     # AI 에이전트용 프로젝트 가이드
```

### 데이터 흐름

```
[DART API]  [ECOS API]  [FinanceDataReader]
      ↓           ↓              ↓
   [ Python Collector — 주기적 수집/저장 ]
              ↓
         [PostgreSQL]  ←→  [Redis 캐시]
              ↓
      [ Spring Boot REST API ]
              ↓
         [ React 프론트 ]
```

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Java 21
- Python 3.11+
- Node.js 20+
- Docker

### 1. 인프라 실행

```bash
docker run -d --name postgres \
  -e POSTGRES_DB=stockapp \
  -e POSTGRES_USER=stockapp \
  -e POSTGRES_PASSWORD=stockapp \
  -p 5432:5432 postgres:16

docker run -d --name redis -p 6379:6379 redis:7
```

### 2. Python Collector

```bash
cd collector
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # DART_API_KEY, ECOS_API_KEY 입력

# 초기 데이터 전체 적재 (최초 1회)
python main.py --init

# 이후 스케줄러 데몬 실행
python main.py --daemon
```

**Collector CLI 옵션**

| 옵션 | 설명 |
|---|---|
| `--init` | 기업코드·종목목록·경제지표 10년치 전체 적재 |
| `--daily` | 주가·공시·경제지표 즉시 갱신 |
| `--weekly` | 재무제표 배치 즉시 실행 |
| `--backfill --ticker 005930 --start 2020-01-01` | 특정 종목 과거 주가 백필 |
| `--daemon` | 스케줄러 데몬 (평일 16:30 일별, 일요일 02:00 주간) |

### 3. Spring Boot 백엔드

```bash
cd backend
./mvnw spring-boot:run
```

`application-local.yml`을 생성해 API 키와 DB 비밀번호를 오버라이드한다 (`.gitignore` 적용됨):

```yaml
app:
  dart:
    api-key: 발급받은_DART_키
  ecos:
    api-key: 발급받은_ECOS_키
```

### 4. React 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

---

## 외부 API 키 발급

| API | 발급처 | 비용 |
|---|---|---|
| DART Open API | https://opendart.fss.or.kr | 무료 |
| 한국은행 ECOS | https://ecos.bok.or.kr | 무료 |

---

## 데이터베이스 스키마

Flyway로 버전 관리. 마이그레이션 파일: `backend/src/main/resources/db/migration/`

| 테이블 | 설명 |
|---|---|
| `companies` | 기업 기본정보 (DART corp_code ↔ 종목코드 매핑 포함) |
| `stock_prices` | 일별 주가 OHLCV |
| `disclosures` | DART 공시 목록 |
| `financial_statements` | 재무제표 계정별 원본 |
| `financial_metrics` | PER·PBR·ROE 등 계산 지표 (스크리너용) |
| `economic_indicators` | 한국은행 ECOS 경제지표 |
| `dividends` | 배당 정보 |

---

## 배포

| 컴포넌트 | 플랫폼 |
|---|---|
| React 프론트엔드 | Cloudflare Pages |
| Spring Boot + Python Collector | Railway / Fly.io |
| PostgreSQL | Supabase |
| Redis | Upstash |
