# 배포 가이드 (단일 VM + Docker Compose)

클라우드 VM 1대에 전체 스택(PostgreSQL · Redis · Spring Boot · React/nginx · Python Collector)을
`docker compose`로 올리고, 앞단에 HTTPS 리버스 프록시를 두는 방식이다.

> 로컬 개발 기동은 [README.md](../README.md#빠른-시작-docker) 참고. 이 문서는 **공개 배포** 전용.

---

## 0. 아키텍처 개요

```
        인터넷 (HTTPS :443)
              │
        [ Caddy / Cloudflare ]   ← TLS 종단
              │ HTTP
        [ frontend (nginx :80) ] ← SPA 서빙 + /api/ 프록시
              │ (docker 내부망)
        [ backend (:8080) ] ── [ postgres ] ── [ redis ]
              ▲
        [ collector-daemon ] ── 매시간/매일/주간 자동 수집
        [ dozzle (127.0.0.1:8081) ] ← 로그 뷰어 (SSH 터널 전용)
```

- 외부에 열리는 포트: **443(HTTPS), 80(HTTP→리다이렉트), 22(SSH)** 뿐.
- PostgreSQL·Redis·Dozzle은 호스트/외부에 노출하지 않는다(내부망 또는 localhost 전용).

---

## 1. 사전 준비

| 항목 | 내용 |
|---|---|
| VM | vCPU 2 / RAM 4GB 이상 권장 (재무제표 배치 시 메모리 사용) · Ubuntu 22.04 LTS 기준 |
| 도메인 | A 레코드를 VM 공인 IP로 연결 (예: `stockapp.example.com`) |
| API 키 | DART([opendart.fss.or.kr](https://opendart.fss.or.kr)) · ECOS([ecos.bok.or.kr](https://ecos.bok.or.kr)) |

### Docker 설치 (Ubuntu)

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # 재로그인 후 sudo 없이 docker 사용
```

---

## 2. 코드 배치 & 환경 변수

```bash
git clone <레포 URL> stock_app
cd stock_app
```

### `.env` 작성 (⚠ 운영용 비밀번호로 교체 필수)

`.env.example`을 복사하고, **DB 비밀번호와 JWT 시크릿을 강한 랜덤값으로 교체**한다.

```bash
cp .env.example .env

# 강한 랜덤 값 생성 (각각 한 번씩 실행해 결과를 .env에 붙여넣기)
openssl rand -base64 32   # → DB_PASSWORD
openssl rand -base64 32   # → JWT_SECRET
```

최종 `.env` 예시:

```env
DART_API_KEY=발급받은_DART_키
ECOS_API_KEY=발급받은_ECOS_키
DB_NAME=stockapp
DB_USERNAME=stockapp
DB_PASSWORD=<openssl로 생성한 값>
JWT_SECRET=<openssl로 생성한 값>
```

> `.env`는 `.gitignore`에 포함되어 커밋되지 않는다. VM에만 두고 절대 공개 저장소에 올리지 말 것.

### 광고/법적 페이지 placeholder 교체 (AdSense 신청 시 필수)

배포 전 아래 두 파일 상단 상수를 실제 값으로 채운다.

- [frontend/src/pages/PrivacyPolicyPage.tsx](../frontend/src/pages/PrivacyPolicyPage.tsx) — `OPERATOR`, `SITE_DOMAIN`, `CONTACT_EMAIL`, `EFFECTIVE_DATE`
- [frontend/src/pages/TermsPage.tsx](../frontend/src/pages/TermsPage.tsx) — `OPERATOR`, `CONTACT_EMAIL`, `EFFECTIVE_DATE`

---

## 3. 빌드 & 기동

```bash
# 인프라 + 백엔드 + 프론트 + 자동 데몬 + 로그뷰어 기동
docker compose up -d --build

# 기동 확인
docker compose ps
```

Flyway 마이그레이션은 backend 컨테이너 기동 시 자동 적용된다.

### 초기 데이터 적재 (최초 1회)

```bash
# 기본 데이터: 기업코드 + KOSPI/KOSDAQ + 경제지표 10년 + 최근 공시 + 직전 영업일 주가 (~30초)
docker compose --profile init up collector-init

# 재무제표 + PER/PBR/ROE 등 메트릭 (~30분, DART 5,000+ 콜)
docker compose --profile init run --rm collector-init --weekly
```

이후 갱신은 `collector-daemon`이 자동 수행한다 (매시간 100대 지표 / 매일 16:30 / 일요일 02:00).

---

## 4. HTTPS / 리버스 프록시

frontend 컨테이너는 `3000:80`으로 평문 HTTP만 서빙하므로, 앞단에 TLS 종단을 둔다.
둘 중 하나를 선택한다.

### 옵션 A — Caddy (권장, 자동 Let's Encrypt)

`docker-compose.yml`에 Caddy 서비스를 추가:

```yaml
  caddy:
    image: caddy:2-alpine
    container_name: stockapp-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - frontend

# volumes: 섹션에 추가
#   caddy_data:
#   caddy_config:
```

프로젝트 루트에 `Caddyfile` 생성 (도메인만 본인 것으로 교체):

```
stockapp.example.com {
    reverse_proxy frontend:80
}
```

```bash
docker compose up -d caddy
```

→ Caddy가 자동으로 인증서를 발급/갱신한다. `https://stockapp.example.com` 접속 확인.
이 경우 frontend의 `3000:80` 호스트 매핑은 제거해도 된다(Caddy가 내부망으로 접근).

### 옵션 B — Cloudflare 프록시

1. Cloudflare에 도메인 등록 → A 레코드를 VM IP로, **프록시 ON(주황 구름)**.
2. SSL/TLS 모드: **Full** (오리진에도 TLS) 또는 최소 **Flexible**.
3. VM에서는 frontend `3000:80`을 그대로 두되, 방화벽에서 Cloudflare IP만 80 허용하거나 옵션 A의 Caddy와 병행.

> 권장: **옵션 A(Caddy)**. 설정이 단순하고 오리진까지 종단간 TLS가 보장된다.

---

## 5. 방화벽

DB/Redis 포트는 이미 compose에서 호스트에 노출하지 않으므로, 외부엔 22/80/443만 연다.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (→HTTPS 리다이렉트)
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

> backend(`8080`)는 frontend 컨테이너가 내부망으로 호출하므로 외부 개방 불필요.
> 디버깅용으로 호스트 매핑이 남아 있다면 ufw가 외부 접근을 차단한다.

---

## 6. 로그 & 모니터링

Dozzle은 `127.0.0.1:8081`에만 바인딩되어 외부에서 직접 접근 불가. **SSH 터널**로 본다.

```bash
# 로컬 PC에서
ssh -L 8081:localhost:8081 <user>@<VM_IP>
# 터널 유지한 채 브라우저에서 http://localhost:8081
```

CLI로 직접 볼 수도 있다:

```bash
docker compose logs -f backend            # 백엔드 실시간 로그
docker compose logs -f collector-daemon   # 수집 데몬 로그
docker compose ps                         # 컨테이너 상태
```

데이터 갱신 상태는 앱 대시보드의 Sync Status 카드(`/` 페이지) 또는 `GET /api/status/sync`로도 확인 가능.

---

## 7. 운영

### 코드 업데이트 재배포

```bash
git pull
docker compose up -d --build      # 변경된 이미지만 재빌드 후 교체
```

> 컬렉터 코드만 바꿨다면 `docker compose up -d --build collector-daemon` 처럼 서비스 지정 가능.

### DB 백업 / 복구

```bash
# 백업
docker compose exec -T postgres pg_dump -U stockapp stockapp > backup_$(date +%F).sql

# 복구
cat backup_2026-06-15.sql | docker compose exec -T postgres psql -U stockapp stockapp
```

`pgdata`는 named volume이라 `docker compose down`으로 컨테이너를 내려도 데이터는 보존된다
(`docker compose down -v`는 볼륨까지 삭제하므로 주의).

### 재시작 / 중지

```bash
docker compose restart backend    # 특정 서비스 재시작
docker compose down               # 전체 중지 (데이터 보존)
docker compose up -d              # 재기동
```

---

## 8. 배포 전 체크리스트

- [ ] `.env`의 `DB_PASSWORD`·`JWT_SECRET`를 강한 랜덤값으로 교체했는가
- [ ] `.env`가 커밋되지 않았는지 확인 (`git status`)
- [ ] 도메인 A 레코드가 VM IP를 가리키는가
- [ ] HTTPS 동작 확인 (옵션 A 또는 B)
- [ ] 방화벽으로 22/80/443만 열려 있는가 (`sudo ufw status`)
- [ ] 초기 데이터 적재(`--init` + `--weekly`) 완료했는가
- [ ] Privacy/Terms 페이지의 placeholder(`OPERATOR`·`SITE_DOMAIN` 등) 교체했는가
- [ ] 로깅 레벨이 `INFO`인가 (`.env`에 `LOG_LEVEL` 미설정 시 기본 INFO)

### (선택) AdSense 신청

배포·HTTPS 완료 후:
1. [Google AdSense](https://adsense.google.com) 사이트 등록 → 소유권 확인 스니펫 삽입
2. 개인정보처리방침(`/privacy`)·이용약관(`/terms`) 페이지가 푸터에서 접근 가능한지 확인 (이미 구현됨)
3. 심사 통과 후 광고 슬롯 코드 삽입
