# 배포 가이드 (윈도우 홈서버 + Docker Desktop + Cloudflare Tunnel)

집에 있는 **윈도우 노트북 1대**를 홈서버로 두고, **Docker Desktop**으로 전체 스택
(PostgreSQL · Redis · Spring Boot · React/nginx · Python Collector)을 올린 뒤,
**Cloudflare Tunnel**로 외부에 공개하는 방식이다.

> 이 방식의 핵심: **포트포워딩 · 공인 IP · 직접 TLS 인증서 발급이 전부 불필요**하다.
> 공유기에 인바운드 포트를 단 하나도 열지 않는다.

> 로컬 개발 기동은 [README.md](../README.md#빠른-시작-docker) 참고. 이 문서는 **공개 배포** 전용.

---

## 0. 아키텍처 개요

```
   [사용자 브라우저]
        │  https://jipyo.example.com
        ▼
 ╔════════════════════════════════╗
 ║       Cloudflare 엣지망         ║   ← DNS + TLS 인증서 자동 + CDN + DDoS 방어
 ╚════════════════════════════════╝
        ▲
        │  ⬆ 터널은 "노트북이 먼저 밖으로" 연 아웃바운드 연결
        │     (Cloudflare가 집으로 들어오는 게 아님)
        │
 ┌───── 집 공유기(라우터) ──────────────────────┐
 │  인바운드 포트 개방: 0개 ✅                   │
 │                                              │
 │   ┌──── 윈도우 서버 노트북 ───────────────┐  │
 │   │                                       │  │
 │   │  [cloudflared.exe] ← 윈도우 서비스     │  │
 │   │        │  localhost:3000 으로 연결     │  │
 │   │        ▼                              │  │
 │   │  ┌ Docker Desktop (WSL2) ──────────┐  │  │
 │   │  │ [frontend nginx :3000→80]       │  │  │
 │   │  │        │ /api/ 프록시            │  │  │
 │   │  │        ▼                        │  │  │
 │   │  │ [backend :8080]                 │  │  │
 │   │  │     │         │                 │  │  │
 │   │  │     ▼         ▼                 │  │  │
 │   │  │ [postgres]  [redis] ← 내부망 전용│  │  │
 │   │  │ [collector-daemon] 자동 수집     │  │  │
 │   │  │ [dozzle 127.0.0.1:8081] 로그뷰어 │  │  │
 │   │  └─────────────────────────────────┘  │  │
 │   └───────────────────────────────────────┘  │
 └──────────────────────────────────────────────┘
```

- **외부에 여는 포트: 없음.** cloudflared가 Cloudflare로 아웃바운드 연결만 맺는다.
- TLS는 Cloudflare가 종단·발급·갱신을 모두 처리한다 (Caddy/Let's Encrypt 불필요).
- 터널 라우팅(어느 도메인 → `localhost:3000`)은 **Cloudflare 대시보드에서 관리**한다(노트북에 config 파일 없음 = remotely-managed tunnel).
- PostgreSQL·Redis·Dozzle은 외부는 물론 LAN에도 노출하지 않는다.

---

## 1. 사전 준비

| 항목 | 내용 |
|---|---|
| 서버 | 윈도우 10/11 노트북 · RAM 8GB 이상 권장(재무제표 배치 시 메모리 사용) · WSL2 활성화 |
| Docker | Docker Desktop for Windows (WSL2 백엔드) |
| 도메인 | Cloudflare에 등록된 도메인 1개 (예: `jipyo.example.com`) — A 레코드/공인 IP 불필요 |
| 터널 | `cloudflared` (winget 설치) |
| API 키 | DART([opendart.fss.or.kr](https://opendart.fss.or.kr)) · ECOS([ecos.bok.or.kr](https://ecos.bok.or.kr)) |

### Docker Desktop 설치 (PowerShell)

```powershell
winget install --id Docker.DockerDesktop
```

설치 후 Docker Desktop을 한 번 실행해 WSL2 통합을 활성화한다.
이후 `docker` / `docker compose` 명령은 PowerShell 또는 WSL 셸에서 동일하게 동작한다.

---

## 2. 코드 배치 & 환경 변수

```powershell
git clone <레포 URL> stock_app
cd stock_app
```

### `.env` 작성 (⚠ 운영용 비밀번호로 교체 필수)

`.env.example`을 복사하고, **DB 비밀번호와 JWT 시크릿을 강한 랜덤값으로 교체**한다.

```powershell
Copy-Item .env.example .env

# 강한 랜덤 값 생성 (각각 한 번씩 실행해 결과를 .env에 붙여넣기)
$b = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)   # → DB_PASSWORD
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)   # → JWT_SECRET
```

최종 `.env` 예시:

```env
DART_API_KEY=발급받은_DART_키
ECOS_API_KEY=발급받은_ECOS_키
DB_NAME=stockapp
DB_USERNAME=stockapp
DB_PASSWORD=<위에서 생성한 값>
JWT_SECRET=<위에서 생성한 값>
```

> `.env`는 `.gitignore`에 포함되어 커밋되지 않는다. 노트북에만 두고 절대 공개 저장소에 올리지 말 것.

### 광고/법적 페이지 placeholder 교체 (AdSense 신청 시 필수)

배포 전 아래 두 파일 상단 상수를 실제 값으로 채운다.

- [frontend/src/pages/PrivacyPolicyPage.tsx](../frontend/src/pages/PrivacyPolicyPage.tsx) — `OPERATOR`, `SITE_DOMAIN`, `CONTACT_EMAIL`, `EFFECTIVE_DATE`
- [frontend/src/pages/TermsPage.tsx](../frontend/src/pages/TermsPage.tsx) — `OPERATOR`, `CONTACT_EMAIL`, `EFFECTIVE_DATE`

---

## 3. 빌드 & 기동

```powershell
# 인프라 + 백엔드 + 프론트 + 자동 데몬 + 로그뷰어 기동
docker compose up -d --build

# 기동 확인
docker compose ps
```

Flyway 마이그레이션은 backend 컨테이너 기동 시 자동 적용된다.

### 초기 데이터 적재 (최초 1회)

```powershell
# 기본 데이터: 기업코드 + KOSPI/KOSDAQ + 경제지표 10년 + 최근 공시 + 직전 영업일 주가 (~30초)
docker compose --profile init up collector-init

# 재무제표 + PER/PBR/ROE 등 메트릭 (~30분, DART 5,000+ 콜)
docker compose --profile init run --rm collector-init --weekly
```

이후 갱신은 `collector-daemon`이 자동 수행한다
(매일 16:30 KST `--daily` / 일요일 02:00 `--weekly` / 매시간 100대 통계지표 / 3시간마다 정책브리핑 RSS).

---

## 4. Cloudflare Tunnel 연결 (HTTPS 자동)

프론트는 컨테이너 안에서 `localhost:3000`(평문 HTTP)으로만 서빙된다.
여기에 외부 공인 포트를 여는 대신, **Cloudflare Tunnel**로 안전하게 노출한다.

### 4-1. cloudflared 설치

```powershell
winget install --id Cloudflare.cloudflared
```

### 4-2. 대시보드에서 터널 생성 (remotely-managed)

1. [Cloudflare Zero Trust 대시보드](https://one.dash.cloudflare.com) → **Networks → Tunnels → Create a tunnel**
2. 커넥터 종류: **Cloudflared** 선택 → 터널 이름 입력 후 저장
3. 화면에 표시되는 **윈도우용 설치 명령의 토큰**을 복사한다.

### 4-3. 윈도우 서비스로 등록 (자동 기동)

복사한 토큰으로 cloudflared를 **윈도우 서비스**로 등록한다. 서비스라 부팅 시 자동으로 올라온다.

```powershell
cloudflared service install <복사한_토큰>
```

### 4-4. 공개 호스트네임 라우팅

대시보드의 해당 터널 → **Public Hostname → Add a public hostname**:

| 항목 | 값 |
|---|---|
| Subdomain / Domain | `jipyo` / `example.com` (본인 도메인) |
| Service Type | `HTTP` |
| URL | `localhost:3000` |

저장하면 Cloudflare가 **DNS 레코드와 TLS 인증서를 자동 생성**한다.
잠시 후 `https://jipyo.example.com` 접속 확인.

> 라우팅·도메인 설정은 전부 대시보드에 저장된다(remotely-managed). 노트북의 `~/.cloudflared`에는 config 파일이 없는 게 정상이다.

### 4-5. 서비스 상태 / 자동기동 확인

```powershell
Get-Service cloudflared | Select-Object Name, Status, StartType
```

- `Status: Running`, `StartType: Automatic` 이면 정상 (재부팅해도 자동 복구).
- `Manual`이면 자동기동으로 전환: `Set-Service cloudflared -StartupType Automatic`

---

## 5. 네트워크 / 보안

Cloudflare Tunnel은 아웃바운드 연결만 쓰므로 **공유기 포트포워딩도, 윈도우 인바운드 방화벽 규칙도 필요 없다.**

- DB(5432)·Redis(6379)는 compose에서 호스트에 노출하지 않으므로 외부/LAN 어디서도 접근 불가.
- backend(8080)는 frontend 컨테이너가 내부망으로 호출하므로 외부 개방 불필요.

### (권장) LAN 노출 제거

기본 `docker-compose.yml`은 frontend `3000:80`, backend `8080:8080`을 호스트의 모든 인터페이스(`0.0.0.0`)에 매핑한다.
→ 같은 와이파이의 다른 기기가 `http://<노트북_LAN_IP>:3000` 으로 직접 접근 가능하다.

cloudflared는 `localhost`로만 붙으면 되므로, LAN 노출이 불필요하면 매핑을 루프백으로 제한한다:

```yaml
  frontend:
    ports:
      - "127.0.0.1:3000:80"   # 0.0.0.0 → 127.0.0.1
  backend:
    ports:
      - "127.0.0.1:8080:8080"
```

```powershell
docker compose up -d frontend backend
```

---

## 6. 무인 운영 (윈도우 노트북 특화)

노트북을 곁에 두고 24시간 굴릴 때 cloudflared 외에 추가로 챙겨야 할 윈도우 설정들.

### 6-1. 절전 / 화면 끄기 비활성

잠들면 도커와 터널이 함께 멈춘다. 전원 연결 상태에서 절대 잠들지 않게 한다.

```powershell
powercfg /change standby-timeout-ac 0    # 절전 안 함
powercfg /change monitor-timeout-ac 0    # 화면 끄기 안 함
```

설정 → 시스템 → 전원 → **덮개를 닫을 때: 아무 것도 안 함** 도 함께 설정(노트북 덮고 운영 시).

### 6-2. ⚠ 무인 재부팅 후 Docker 자동 복구

가장 흔한 함정: **cloudflared는 윈도우 서비스라 로그인 없이도 부팅 시 뜨지만, Docker Desktop은 "사용자 로그인" 후에야 뜬다.**
윈도우 업데이트가 새벽에 자동 재부팅하면 → 터널은 살아나는데 컨테이너는 죽은 채 → **사이트가 502로 응답**한다.

해결: **무인 자동 로그인 + Docker 자동 시작**을 함께 켠다.

1. 자동 로그인: `Win+R` → `netplwiz` → 계정 선택 → "사용자 이름과 암호를 입력해야…" 체크 해제 → 비번 입력
2. Docker Desktop → Settings → General → **Start Docker Desktop when you sign in** 체크
3. (compose의 모든 서비스는 `restart: unless-stopped`라 Docker만 뜨면 컨테이너는 자동 복구됨)

### 6-3. 윈도우 업데이트 활성 시간

설정 → Windows Update → 고급 옵션 → **활성 시간**을 운영 시간대로 넓게 잡아 자동 재부팅 시점을 사용량 적은 새벽으로 유도한다.

---

## 7. 로그 & 모니터링

Dozzle은 `127.0.0.1:8081`에만 바인딩되어 외부에서 접근 불가. **서버 노트북에서 직접** 브라우저로 본다.

```
http://localhost:8081
```

> 다른 기기에서 보고 싶으면 Cloudflare Tunnel에 Public Hostname을 하나 더 추가하고
> **Cloudflare Access**로 보호(이메일 인증)하는 방식을 권장. 그냥 외부에 열지는 말 것.

CLI로도 확인 가능:

```powershell
docker compose logs -f backend            # 백엔드 실시간 로그
docker compose logs -f collector-daemon   # 수집 데몬 로그
docker compose ps                         # 컨테이너 상태
```

### 영속 로그 파일 (재빌드해도 보존)

`docker compose logs` / Dozzle은 컨테이너 수명에 묶여 있어 `up -d --build`로 컨테이너를 재생성하면 사라진다.
이를 막기 위해 backend·collector는 stdout과 **별도로 호스트의 `./logs` 디렉토리에 회전 로그 파일**을 남긴다.

| 파일 | 출처 | 회전 정책 |
|---|---|---|
| `logs/backend.log` | Spring Boot (logback) | 일별 회전 / **30일(1달)** 보관 / 총 1GB 상한 |
| `logs/collector.log` | Python Collector | 매일 자정 회전 / **30일(1달)** 보관 |

```powershell
Get-Content logs\backend.log -Tail 100 -Wait   # 실시간 추적 (tail -f 대응)
```

> `./logs`는 `docker-compose.yml`에서 `./logs:/logs`로 바인드마운트된다. 재빌드·`docker compose down` 후에도 보존되며 `.gitignore` 대상이다.

데이터 갱신 상태는 앱 대시보드의 Sync Status 카드(`/` 페이지) 또는 `GET /api/status/sync`로도 확인 가능.

---

## 8. 운영

### 코드 업데이트 재배포

```powershell
git pull
docker compose up -d --build      # 변경된 이미지만 재빌드 후 교체
```

> 컬렉터 코드만 바꿨다면 `docker compose up -d --build collector-daemon` 처럼 서비스 지정 가능.

### DB 백업 / 복구

```powershell
# 백업
docker compose exec -T postgres pg_dump -U stockapp stockapp > "backup_$(Get-Date -Format yyyy-MM-dd).sql"

# 복구
Get-Content backup_2026-06-15.sql | docker compose exec -T postgres psql -U stockapp stockapp
```

`pgdata`는 named volume이라 `docker compose down`으로 컨테이너를 내려도 데이터는 보존된다
(`docker compose down -v`는 볼륨까지 삭제하므로 주의).

### 재시작 / 중지

```powershell
docker compose restart backend    # 특정 서비스 재시작
docker compose down               # 전체 중지 (데이터 보존)
docker compose up -d              # 재기동
```

### 터널 관리

```powershell
Restart-Service cloudflared       # 터널 재시작
Get-Service cloudflared           # 상태 확인
```

라우팅·도메인 변경은 노트북이 아니라 **Cloudflare Zero Trust 대시보드 → Networks → Tunnels**에서 한다.

---

## 9. 배포 전 체크리스트

- [ ] `.env`의 `DB_PASSWORD`·`JWT_SECRET`를 강한 랜덤값으로 교체했는가
- [ ] `.env`가 커밋되지 않았는지 확인 (`git status`)
- [ ] Cloudflare 터널이 윈도우 서비스로 등록되고 `StartType: Automatic`인가
- [ ] 대시보드 Public Hostname이 `localhost:3000`으로 연결돼 HTTPS 접속이 되는가
- [ ] 절전/화면 끄기 비활성(`powercfg`) 적용했는가
- [ ] 무인 자동 로그인 + Docker Desktop 자동 시작을 켰는가 (재부팅 복구)
- [ ] (권장) frontend/backend 포트를 `127.0.0.1`로 제한해 LAN 노출을 막았는가
- [ ] 초기 데이터 적재(`--init` + `--weekly`) 완료했는가
- [ ] Privacy/Terms 페이지의 placeholder(`OPERATOR`·`SITE_DOMAIN` 등) 교체했는가

### (선택) AdSense 신청

배포·HTTPS 완료 후:
1. [Google AdSense](https://adsense.google.com) 사이트 등록 → 소유권 확인 스니펫 삽입
2. 개인정보처리방침(`/privacy`)·이용약관(`/terms`) 페이지가 푸터에서 접근 가능한지 확인 (이미 구현됨)
3. 심사 통과 후 광고 슬롯 코드 삽입
