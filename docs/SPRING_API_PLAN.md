# Spring Boot API 레이어 구현 계획

## 생성할 파일 (43개)

### 수정
- `StockAppApplication.java` — `@EnableCaching` 추가
- `application.yml` — 캐시 TTL, CORS 설정 추가

### 공통 레이어 (`common/`)
- `common/response/ApiResponse.java` — `{ success, data, message }` 공통 래퍼
- `common/response/PageResponse.java` — `{ content, page, size, totalElements, totalPages }`
- `common/exception/ErrorCode.java` — NOT_FOUND, INVALID_PARAM 등 enum
- `common/exception/BusinessException.java` — RuntimeException 상속
- `common/exception/GlobalExceptionHandler.java` — `@RestControllerAdvice`

### 설정 (`config/`)
- `config/SecurityConfig.java` — CSRF off, 전체 허용 (로그인 미구현)
- `config/RedisConfig.java` — RedisTemplate + CacheManager (TTL 도메인별 설정)
- `config/WebConfig.java` — CORS (localhost:5173 + 배포 도메인)

### Company 도메인
- `domain/company/entity/Company.java`
- `domain/company/repository/CompanyRepository.java` — 이름/ticker 검색
- `domain/company/service/CompanyService.java` — Redis 캐시 1h
- `domain/company/controller/CompanyController.java`
- `domain/company/dto/CompanySearchResponse.java`
- `domain/company/dto/CompanyDetailResponse.java`

### Stock 도메인
- `domain/stock/entity/StockPrice.java`
- `domain/stock/repository/StockPriceRepository.java` — 최신가/기간 조회
- `domain/stock/service/StockPriceService.java` — Redis 캐시 15분
- `domain/stock/controller/StockController.java`
- `domain/stock/dto/StockPriceResponse.java` — 최신 OHLCV
- `domain/stock/dto/PriceChartResponse.java` — 기간별 차트 포인트 리스트

### Disclosure 도메인
- `domain/disclosure/entity/Disclosure.java`
- `domain/disclosure/repository/DisclosureRepository.java`
- `domain/disclosure/service/DisclosureService.java` — Redis 캐시 1h
- `domain/disclosure/controller/DisclosureController.java`
- `domain/disclosure/dto/DisclosureResponse.java`

### Financial 도메인
- `domain/financial/entity/FinancialStatement.java`
- `domain/financial/entity/FinancialMetric.java`
- `domain/financial/repository/FinancialStatementRepository.java`
- `domain/financial/repository/FinancialMetricRepository.java` — JpaSpecificationExecutor
- `domain/financial/service/FinancialService.java` — Redis 캐시 6h
- `domain/financial/controller/FinancialController.java`
- `domain/financial/dto/FinancialStatementResponse.java`
- `domain/financial/dto/FinancialMetricResponse.java`

### Economic 도메인
- `domain/economic/entity/EconomicIndicator.java`
- `domain/economic/repository/EconomicIndicatorRepository.java`
- `domain/economic/service/EconomicService.java` — Redis 캐시 24h
- `domain/economic/controller/EconomicController.java`
- `domain/economic/dto/EconomicIndicatorResponse.java`

### Dividend 도메인
- `domain/dividend/entity/Dividend.java`
- `domain/dividend/repository/DividendRepository.java`
- `domain/dividend/service/DividendService.java`
- `domain/dividend/controller/DividendController.java`
- `domain/dividend/dto/DividendResponse.java`

### Screener 도메인
- `domain/screener/spec/FinancialMetricSpec.java` — JPA Specification 동적 조건
- `domain/screener/service/ScreenerService.java`
- `domain/screener/controller/ScreenerController.java`
- `domain/screener/dto/ScreenerRequest.java`
- `domain/screener/dto/ScreenerResponse.java`

---

## API 엔드포인트

| Method | URL | 설명 | 캐시 TTL |
|---|---|---|---|
| GET | `/api/companies/search?q=&market=` | 종목 검색 | 1h |
| GET | `/api/companies/{ticker}` | 기업 상세 | 1h |
| GET | `/api/stocks/{ticker}/price` | 최신 주가 (OHLCV) | 15m |
| GET | `/api/stocks/{ticker}/chart?period=1M\|3M\|6M\|1Y\|3Y` | 차트 데이터 | 15m |
| GET | `/api/disclosures?ticker=&type=&page=&size=` | 종목별 공시 목록 | 1h |
| GET | `/api/disclosures/recent?page=&size=` | 전체 최신 공시 | 1h |
| GET | `/api/financials/{ticker}/statements?year=&reportCode=&fsdiv=` | 재무제표 | 6h |
| GET | `/api/financials/{ticker}/metrics` | PER·PBR·ROE 등 지표 | 6h |
| GET | `/api/economic/indicators` | 경제지표 종류 목록 | 24h |
| GET | `/api/economic/indicators/{statCode}?start=&end=` | 지표 시계열 | 24h |
| GET | `/api/dividends/calendar?year=&month=` | 배당 캘린더 | 24h |
| POST | `/api/screener` | 조건 기반 종목 검색 | - |

---

## 주요 설계 결정

### 공통 응답 포맷
```json
{ "success": true,  "data": { ... } }
{ "success": false, "message": "기업을 찾을 수 없습니다" }
```

### 캐싱 전략
Spring Cache + Redis. `@Cacheable` 어노테이션으로 도메인별 TTL 분리.

### 스크리너 동적 쿼리
`JPA Specification<FinancialMetric>` 패턴 사용.
`ScreenerRequest`의 각 필드가 `null`이면 해당 조건을 자동으로 제외.

```java
// ScreenerRequest 예시
{
  "market": "KOSPI",
  "perMax": 15.0,
  "roeMin": 10.0,
  "dividendYieldMin": 2.0,
  "sortBy": "per",
  "sortDir": "asc",
  "page": 0,
  "size": 20
}
```

### Security
로그인 미구현이므로 CSRF 비활성화, 모든 요청 허용.
JWT 의존성은 pom.xml에 있지만 현재는 사용하지 않음.

### JPA 엔티티 매핑
Spring Boot 기본 네이밍 전략(`camelCase` → `snake_case`)으로 대부분 자동 매핑.
`isActive` 등 boolean 필드는 `@Column(name = "is_active")` 명시.

---

## 구현 순서

1. 디렉토리 일괄 생성
2. `common/` + `config/` (공통 레이어)
3. Entity 전체 (병렬)
4. Repository 전체 (병렬)
5. DTO + Service + Controller (도메인별 병렬)
6. `application.yml` 캐시 설정 추가
7. `StockAppApplication.java` `@EnableCaching` 추가
8. 빌드 확인 (`./mvnw compile`)
