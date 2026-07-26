# 배포 가이드 (윈도우 홈서버 + Docker Desktop + Cloudflare Tunnel)

집에 있는 **윈도우 노트북 1대**를 홈서버로 두고, **Docker Desktop**으로 전체 스택
(PostgreSQL · Spring Boot · React/nginx · Python Collector)을 올린 뒤,
**Cloudflare Tunnel**로 외부에 공개하는 방식이다.

> 이 방식의 핵심: **포트포워딩 · 공인 IP · 직접 TLS 인증서 발급이 전부 불필요**하다.
> 공유기에 인바운드 포트를 단 하나도 열지 않는다.

> 로컬 개발 기동은 [README.md](../README.md#빠른-시작-docker) 참고. 이 문서는 **공개 배포** 전용.

> **1~9장은 윈도우 기준이다.** 리눅스 서버(Proxmox VM 등)로 옮기려면
> → [10장. 리눅스 서버로 이관](#10-리눅스-서버로-이관-proxmox-vm--ubuntu)

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
 │   │  │ [postgres] ← 내부망 전용          │  │  │
 │   │  │ [collector-daemon] 자동 수집     │  │  │
 │   │  │ [dozzle 127.0.0.1:8081] 로그뷰어 │  │  │
 │   │  └─────────────────────────────────┘  │  │
 │   └───────────────────────────────────────┘  │
 └──────────────────────────────────────────────┘
```

- **외부에 여는 포트: 없음.** cloudflared가 Cloudflare로 아웃바운드 연결만 맺는다.
- TLS는 Cloudflare가 종단·발급·갱신을 모두 처리한다 (Caddy/Let's Encrypt 불필요).
- 터널 라우팅(어느 도메인 → `localhost:3000`)은 **Cloudflare 대시보드에서 관리**한다(노트북에 config 파일 없음 = remotely-managed tunnel).
- PostgreSQL·Dozzle은 외부는 물론 LAN에도 노출하지 않는다.

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
ADMIN_USERNAME=<관리자 아이디>
ADMIN_PASSWORD=<12자 이상의 강한 비밀번호>
AUTH_COOKIE_SECURE=true
```

> `.env`는 `.gitignore`에 포함되어 커밋되지 않는다. 노트북에만 두고 절대 공개 저장소에 올리지 말 것.

`ADMIN_USERNAME`과 `ADMIN_PASSWORD`는 최초 관리자 계정 생성에 사용된다.
이미 같은 아이디가 존재하면 재시작해도 비밀번호를 덮어쓰지 않는다.
배포 후 `https://jipyo.net/login`에서 로그인하고 `/admin`의 **기사 편집** 탭에서
수집된 정책브리핑 기사에 자체 요약을 작성한 뒤 게시한다.

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
(매시간 스태거: :00 공시 · :20 경제지표 · :30 재무지표 · :40 100대 통계지표 · :50 경제소식 / 주가 16:00 / 재무제표 원본은 일요일 02:00).

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

- DB(5432)는 compose에서 호스트에 노출하지 않으므로 외부/LAN 어디서도 접근 불가.
- backend(8080)는 frontend 컨테이너가 내부망으로 호출하므로 외부 개방 불필요.

### LAN 노출 차단

기본 `docker-compose.yml`은 frontend와 backend 포트를 루프백으로만 노출한다.
cloudflared는 `localhost`로 접근하므로 LAN 또는 외부에 직접 포트를 개방할 필요가 없다.

```yaml
  frontend:
    ports:
      - "127.0.0.1:3000:80"
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

관리자가 직접 쓴 콘텐츠(투자 가이드·게시글·경제소식 요약)는 **DB 볼륨에만** 있으므로
정기 백업이 필수다. 백업은 **docker-compose 의 `backup` 서비스가 자동 수행**한다
(별도 스케줄러 등록 불필요).

**설정** — `.env` 에서 (미지정 시 매일 04시 KST, `./backups`, 14일 보관):

```env
# 디스크 고장 대비 오프사이트 보관: 클라우드 동기화 폴더로 지정 권장
BACKUP_DIR=C:/Users/<사용자>/OneDrive/jipyo-backups
BACKUP_HOUR=4
BACKUP_KEEP_DAYS=14
```

**확인:**

```powershell
docker compose up -d backup                 # (전체 up -d 시 자동 포함)
Get-Content .\backups\backup.log -Tail 10   # 백업 이력 (OK/FAIL)

# 즉시 1회 백업 테스트
docker compose run --rm -e RUN_ON_START=true backup
```

**복구 (⚠ 기존 데이터 덮어씀):**

```powershell
docker compose stop backend
.\scripts\restore-db.ps1 -File .\backups\jipyo_2026-07-06_040000.dump
docker compose start backend
```

> 백업은 custom format(`pg_dump -Fc`, 압축) → 복구는 `pg_restore`(restore-db.ps1). 상세: `scripts/README.md`.

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

### 메모리 관리 (램 사용량이 계속 오를 때 · WSL2)

**증상:** 며칠(2~3일) 지나면 윈도우 램 사용량이 99%까지 차고, 재부팅하거나 `wsl --shutdown` 하면 회복됐다가 또 천천히 차오른다.

**원인:** Docker Desktop은 모든 컨테이너를 **WSL2 리눅스 VM 하나**(작업 관리자의 `Vmmem` / `vmmemWSL`) 안에서 돌린다. 이 VM은 메모리를 늘리기만 하고(특히 리눅스 page cache) **윈도우로 잘 반환하지 않으며**, `.wslconfig`로 상한을 안 걸면 호스트 RAM의 상당 부분을 점유해 결국 99%에 도달한다. 컨테이너가 멀쩡해도 발생하는 WSL2 특유의 동작이다.

**어느 쪽인지 확인:**

```powershell
# 작업 관리자(세부 정보)의 Vmmem/vmmemWSL 메모리 vs 실제 컨테이너 합계 비교
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"
docker ps -a --format "table {{.Names}}\t{{.Status}}"   # 잦은 재시작(OOM) 흔적
```

- `Vmmem`은 거대한데 `docker stats` 합계는 작다 → **WSL2 캐시 미반환** → 아래 ①
- 특정 컨테이너(특히 backend JVM)가 압도적 → **컨테이너 누수** → ②로 한도에 부딪혀 OOM 재시작되며 로그에 남음

**① WSL2 VM 상한 + 자동 회수 (핵심 · 윈도우11 16GB 기준).** 서버의 `C:\Users\<사용자명>\.wslconfig`:

```ini
[wsl2]
memory=10GB                 # VM 하드 캡 — 윈도우11에 ~5GB 남김 (RAM 다르면 호스트−5GB로 조정)
swap=2GB
processors=4                # 코어 수에 맞게 (줄 삭제 = 전체 코어 사용)

[experimental]
autoMemoryReclaim=gradual   # 유휴/캐시 메모리를 윈도우로 능동 반환 (핵심)
sparseVhd=true              # 디스크 VHD 자동 축소
```

```powershell
wsl --update          # autoMemoryReclaim 지원하려면 최신 WSL 필요
wsl --shutdown        # (Docker Desktop 완전 종료 후) — 이후 Docker Desktop 재실행
```

`memory=` 하드 캡 덕에 VM이 아무리 새도 호스트가 99%에 닿지 못하고, `autoMemoryReclaim`이 평상시 사용량을 그보다 낮게 유지한다.

**② 컨테이너별 메모리 상한 + JVM 힙 캡 (이미 적용됨).** VM 안에서 한 컨테이너가 폭주해 형제를 OOM시키는 걸 막는 방어선. `docker-compose.yml`의 각 서비스 `mem_limit`(postgres 2g · backend 2g · frontend 128m · collector-daemon 1.5g · dozzle 128m)과 `backend/Dockerfile`의 `-Xmx1280m`(힙 명시 캡 — WSL2 cgroup v2에서 JVM 자동 감지가 VM 전체 RAM을 읽는 문제 회피)이 함께 동작한다. 한 컨테이너가 폭주하면 자기 한도에서 OOM 재시작되어 로그에 남으므로 **진범이 자동 특정**된다.

> ①(`.wslconfig`)을 먼저 적용하는 것을 권장. 그래도 특정 컨테이너가 계속 한도에 부딪히면 그 컨테이너의 누수를 추적한다.

---

## 9. 배포 전 체크리스트

- [ ] `.env`의 `DB_PASSWORD`·`JWT_SECRET`를 강한 랜덤값으로 교체했는가
- [ ] `ADMIN_USERNAME`·`ADMIN_PASSWORD`를 설정하고 관리자 로그인을 확인했는가
- [ ] 운영 환경의 `AUTH_COOKIE_SECURE=true`를 확인했는가
- [ ] `.env`가 커밋되지 않았는지 확인 (`git status`)
- [ ] Cloudflare 터널이 윈도우 서비스로 등록되고 `StartType: Automatic`인가
- [ ] 대시보드 Public Hostname이 `localhost:3000`으로 연결돼 HTTPS 접속이 되는가
- [ ] 절전/화면 끄기 비활성(`powercfg`) 적용했는가
- [ ] 무인 자동 로그인 + Docker Desktop 자동 시작을 켰는가 (재부팅 복구)
- [ ] `.wslconfig`로 WSL2 메모리 상한·`autoMemoryReclaim`을 설정했는가 (램 99% 방지 — 8장 "메모리 관리")
- [ ] frontend/backend 포트가 `127.0.0.1`로 제한되어 있는가
- [ ] 초기 데이터 적재(`--init` + `--weekly`) 완료했는가
- [ ] Privacy/Terms 페이지의 placeholder(`OPERATOR`·`SITE_DOMAIN` 등) 교체했는가

### (선택) AdSense 신청

배포·HTTPS 완료 후:
1. [Google AdSense](https://adsense.google.com) 사이트 등록 → 소유권 확인 스니펫 삽입
2. 개인정보처리방침(`/privacy`)·이용약관(`/terms`) 페이지가 푸터에서 접근 가능한지 확인 (이미 구현됨)
3. 심사 통과 후 광고 슬롯 코드 삽입

---

## 10. 리눅스 서버로 이관 (Proxmox VM + Ubuntu)

윈도우 홈서버에서 **Proxmox VM 위의 Ubuntu**로 옮기는 절차. 애플리케이션 코드는 그대로이고,
바뀌는 것은 **호스트 OS · cloudflared 실행 방식 · 운영 스크립트**뿐이다.

```
   [ 기존 ]                              [ 이관 후 ]

 윈도우 노트북                          Proxmox 호스트
  ├ cloudflared.exe (윈도우 서비스)       └ VM (Ubuntu 24.04)
  └ Docker Desktop (WSL2)                    └ Docker (systemd)
      ├ frontend  :3000 ──┐                      ├ frontend
      ├ backend           │ localhost            ├ backend
      ├ postgres          │ 로 연결               ├ postgres
      ├ collector-daemon  │                      ├ collector-daemon
      ├ backup            │                      ├ backup
      └ dozzle ───────────┘                      ├ dozzle
                                                 └ cloudflared  ← 컨테이너로 흡수
```

**리눅스로 옮겨서 없어지는 문제**

| 윈도우에서 겪던 것 | 리눅스에서 |
|---|---|
| WSL2가 메모리를 반환 안 해 램 99% (8장) | 없음. `.wslconfig` 불필요 |
| Docker Desktop이 **사용자 로그인 후에야** 기동 (6-2) | `systemctl enable docker` 로 부팅 시 기동 |
| cloudflared는 뜨는데 Docker는 안 떠서 502 | cloudflared도 같은 compose 안 → 순서 문제 자체가 소멸 |
| 윈도우 업데이트 자동 재부팅 | `unattended-upgrades` 는 재부팅 안 함(기본값) |

---

### 10-1. VM 생성 (Proxmox)

**LXC(CT)가 아니라 VM으로 만든다.** LXC 안에서 Docker를 돌리려면 `nesting=1`·cgroup 위임·
AppArmor 예외를 열어야 하는데, DB가 들어가는 서버에서 격리를 얇게 만들 이유가 없다.

| 항목 | 값 | 이유 |
|---|---|---|
| OS | Ubuntu Server 24.04 LTS | — |
| vCPU | 4 | 재무제표 배치·maven 빌드 |
| RAM | **10GB** (최소 8GB) | `mem_limit` 합계 6GB + 게스트 OS + 빌드 여유 |
| 디스크 | 64GB, virtio-scsi, **Discard/SSD emulation 켜기** | 삭제 블록 반환 |
| **Ballooning** | **끄기** (min = max) | 풍선이 메모리를 회수하면 postgres 캐시가 날아간다 |
| Guest Agent | 설치 | 정상 종료·IP 표시 |

```bash
sudo apt update && sudo apt install -y qemu-guest-agent && sudo systemctl enable --now qemu-guest-agent
```

---

### 10-2. Ubuntu 초기 설정

**sudo 계정** (설치 마법사에서 만들었으면 이미 sudo 그룹이다 — `groups` 로 확인)

```bash
adduser junsu              # 홈 디렉터리·셸까지 만들어 준다 (useradd 아님)
usermod -aG sudo junsu     # -a 를 빠뜨리면 기존 그룹이 전부 날아간다
```
그룹 변경은 **새 로그인 세션부터** 적용된다.

**SSH 키 → 그다음 하드닝** (순서 중요)

```bash
# 클라이언트에서
ssh-copy-id junsu@<VM_IP>
ssh junsu@<VM_IP>          # 키로 들어가지는지 반드시 먼저 확인
```
```bash
# 확인된 뒤에 VM 에서
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
EOF
sudo systemctl restart ssh
```

> ⚠ 키 접속을 확인하기 **전에** `PasswordAuthentication no` 를 켜면 못 들어간다.
> Proxmox 웹UI 콘솔로는 들어갈 수 있으니 완전히 잠기진 않지만, 겪을 이유는 없다.
>
> ⚠ 윈도우에서 `scp` 로 덤프를 보낼 예정이라면 **하드닝 전에** 윈도우 쪽 공개키도 등록해 둘 것.
> 윈도우엔 `ssh-copy-id` 가 없어 수동으로 붙여야 한다:
> ```powershell
> type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh junsu@<VM_IP> "cat >> ~/.ssh/authorized_keys"
> ```

**Docker**

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker junsu      # sudo 없이 docker 명령 (재로그인 필요)
sudo systemctl enable --now docker # ★ 부팅 시 자동 기동
```

> `docker` 그룹은 사실상 root 권한과 같다(컨테이너로 호스트 파일시스템을 통째로 마운트할 수 있음).
> 이 VM 은 앱 전용 단일 목적이라 실무상 문제없지만 알고 쓸 것.

**노트북을 서버로 쓰는 경우** — 뚜껑 닫아도 안 자게:
```bash
sudo sed -i 's/^#\?HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo systemctl restart systemd-logind
```

---

### 10-3. 코드 배치

```bash
cd ~
git clone https://github.com/Oxalidaceae/stock-app.git stock_app
cd stock_app
git checkout main            # ★ 구 서버와 같은 브랜치로
mkdir -p logs backups        # ★ 둘 다 .gitignore 라 클론에 없다
```

**브랜치는 구 서버와 같은 것을 쓴다.** VM 이관 자체가 변수(호스트 OS·도커·DB 복원)인데
코드까지 바꾸면 문제가 생겼을 때 환경 탓인지 코드 탓인지 분리가 안 된다.
새 코드 배포는 이관 검증이 끝난 **별개의 작업**으로 한다.

```powershell
# 구 서버에서 브랜치 확인
git rev-parse --abbrev-ref HEAD; git log --oneline -1
```

> `logs/` · `backups/` 를 미리 만들지 않으면 docker 가 bind mount 하면서 **root 소유로 생성**해
> 이후 로그 정리에 계속 sudo 가 필요해진다.

---

### 10-4. `.env` — 새로 만들지 말고 구 서버 것을 가져온다

`.env` 는 git 에 없다. `.env.example` 을 복사해 채우는 방식은 **세 군데가 조용히 잘못 동작**한다.

| 변수 | 주의 |
|---|---|
| `REACTION_IP_SALT` | **반드시 구 서버 값.** 바뀌면 기존 `post_reaction` 의 IP 해시와 어긋나 중복 반응 차단이 그 행들에 한해 풀린다. 구 서버 `.env` 에 **없었다면** `application.yml` 기본값으로 돌던 것이므로 `REACTION_IP_SALT=jipyo-reaction` 으로 넣는다 |
| `ADMIN_PASSWORD` | **새 값을 넣어도 반영되지 않는다.** `AdminAccountInitializer` 는 같은 username 이 이미 있으면 그냥 return 한다. 덤프 복원으로 `app_users` 가 살아나므로 실제 비밀번호는 구 서버 것 그대로다 → **구 서버 관리자 비밀번호를 알고 있는지 먼저 확인** |
| `APP_CORS_ALLOWED_ORIGINS` | `.env.example` 의 `https://your-domain.com` 을 그대로 두면 API 호출이 전부 CORS 차단된다 → `https://jipyo.net,https://www.jipyo.net` |
| `JWT_SECRET` | 새 랜덤값 OK (기존 로그인 세션만 끊김). `.env.example` placeholder 는 블록리스트에 있어 기동을 거부하므로 반드시 교체 |
| `DB_PASSWORD` | **자유롭게 바꿔도 된다.** 새 `pgdata` 볼륨이 이 값으로 초기화되고, `pg_dump -Fc` 덤프에는 role 비밀번호가 없다 |
| `DB_NAME` / `DB_USERNAME` | `stockapp` 그대로. 복원 명령이 이 이름을 쓴다 |

```powershell
# 구 서버 .env 를 그대로 가져오는 쪽이 안전하다
scp .\.env junsu@<VM_IP>:/home/junsu/stock_app/.env
```

가져온 뒤 VM 에서 이 네 줄만 손보면 된다:

```env
BACKUP_DIR=/home/junsu/jipyo-backups     # 윈도우 경로 → 리눅스 경로
AUTH_COOKIE_SECURE=true                  # 확인
COMPOSE_PROFILES=tunnel                  # 새로 추가 (cloudflared 서비스 활성화)
TUNNEL_TOKEN=eyJhIjoi...                 # 새로 추가
```

```bash
chmod 600 .env                # 비밀·API 키가 들어 있다
mkdir -p ~/jipyo-backups      # BACKUP_DIR 을 미리 만들어야 root 소유로 안 생긴다
openssl rand -base64 48       # JWT_SECRET / DB_PASSWORD 생성용
```

---

### 10-5. DB 이관 (⚠ 재수집으로 대체 불가)

`guide`(직접 쓴 아티클) · `post` · `post_reaction` · `app_users` · `policy_briefing` 편집분은
**collector 재수집으로 되살릴 수 없다.** 반드시 덤프를 옮긴다.

**① 구 서버 — 쓰기 정지 후 최종 덤프**

```powershell
docker compose stop collector-daemon backend
docker compose exec postgres pg_dump -U stockapp -Fc -f /tmp/final.dump stockapp
docker cp stockapp-postgres:/tmp/final.dump .\backups\jipyo_final.dump
```

> ⚠ **PowerShell 에서 `docker exec ... pg_dump > file.dump` 처럼 리다이렉션·파이프를 쓰면 안 된다.**
> PowerShell 이 출력을 텍스트로 재인코딩해 바이너리 덤프가 깨진다.
> 반드시 컨테이너 안에 파일로 쓴 뒤 `docker cp` 로 꺼낸다.
> (WSL bash 의 파이프는 안전하므로 `... | ssh junsu@VM 'cat > ~/jipyo_final.dump'` 도 가능)

**② 전송 — 절대경로로**

```powershell
scp .\backups\jipyo_final.dump junsu@<VM_IP>:/home/junsu/
```

> ⚠ 목적지를 `:~/` 로 쓰지 말 것. OpenSSH 9.x 의 scp 는 내부적으로 SFTP 를 쓰는데 버전 조합에 따라
> `~` 를 확장하지 않아 **`~` 라는 이름의 디렉터리**(`/home/junsu/~/`)가 생긴다.
> 이미 그렇게 됐다면: `mv ~/'~'/jipyo_final.dump ~/ && rmdir ~/'~'` (따옴표 필수)

**③ 무결성 검증** — 1바이트만 깨져도 복원이 중간에 멈춘다.

```powershell
Get-FileHash -Algorithm SHA256 .\backups\jipyo_final.dump    # 윈도우
```
```bash
sha256sum ~/jipyo_final.dump                                 # VM — 값이 같아야 한다
```

**④ 복원 — postgres 만 먼저 띄우고, 복원한 뒤에 backend 를 올린다**

```bash
cd ~/stock_app
docker compose up -d postgres                    # 빈 DB 초기화
./scripts/restore-db.sh ~/jipyo_final.dump       # TOC 검증 후 pg_restore
docker compose up -d                             # 나머지 전체 (cloudflared 포함)
```

**이 순서여야 하는 이유**: 덤프에 `flyway_schema_history` 가 같이 들어 있다. 복원 **후에**
backend 를 띄우면 Flyway 가 기존 이력을 읽고 필요한 마이그레이션만 이어서 적용한다.
backend 를 먼저 띄우면 Flyway 가 스키마를 만든 뒤 복원이 그걸 다시 덮어쓰는 순서가 된다.

> 구 서버보다 새 코드가 앞서 있으면(예: V10 → V11) 첫 기동에서 그 차이만큼 마이그레이션이
> 자동 적용된다. 정상 동작이지만 인덱스 생성이 섞이면 첫 기동이 몇 분 걸릴 수 있으니
> `docker compose logs -f backend` 로 Flyway 로그를 확인할 것.

---

### 10-6. Cloudflare Tunnel 전환

**① 구 서버 터널 정지** (관리자 PowerShell)

```powershell
Stop-Service cloudflared
Set-Service cloudflared -StartupType Disabled    # ★ 재부팅으로 되살아나지 않게
```

> ⚠ **같은 토큰을 두 대에서 동시에 돌리면** Cloudflare 가 둘 다 유효한 커넥터로 보고 트래픽을
> 나눠 보낸다. 절반의 사용자가 옛 DB 를 보게 되므로 **반드시 구 서버를 먼저 끈다.**
> 대시보드 Zero Trust → Networks → Tunnels 에서 커넥터 목록이 비었는지 확인.

**② 대시보드 라우팅 변경**

Public hostname 의 Service 를 `http://localhost:3000` → **`http://frontend:80`** 으로 바꾼다.
cloudflared 가 같은 compose 네트워크 안에 있으므로 서비스 이름으로 직접 붙는다.

**③ 새 VM 에서 기동** — `.env` 에 `COMPOSE_PROFILES=tunnel` 이 있으면 자동 포함된다.

```bash
docker compose up -d
docker compose ps                        # cloudflared 가 목록에 있어야 한다
docker compose logs -f cloudflared       # "Registered tunnel connection" 확인
```

> `cloudflared` 는 `profiles: [tunnel]` 로 감싸 두었다. 로컬 개발에서 `docker compose up` 할 때
> 터널이 같이 뜨는 것을 막기 위함이다. 토큰은 `command` 가 아닌 환경변수로 준다 —
> `command` 에 넣으면 `docker ps` 출력에 토큰이 그대로 노출된다.

---

### 10-7. 검증 & 롤백

```bash
docker compose ps                                    # 모든 서비스 Up
curl -I http://localhost:3000                        # 프런트 단독 점검
curl -s http://localhost:8080/api/companies | head   # 백엔드 단독 점검
docker compose logs backend | grep -i flyway         # 마이그레이션 정상 적용
```

브라우저에서:
- [ ] `https://jipyo.net` HTTPS 정상 (인증서 경고 없음)
- [ ] 종목 검색·상세·스크리너 동작 (= DB 복원 성공)
- [ ] **`/guide` 아티클이 다 보이는가** (= 재수집 불가 데이터 이관 확인)
- [ ] 게시판 글·따봉 수가 이전과 같은가
- [ ] `/login` 관리자 로그인 성공 (= `app_users` 복원 + 비밀번호 확인)
- [ ] 관리자 화면에서 글 작성/수정 가능

**롤백**: 구 서버 스택을 지우지 않았다면 되돌리기는 두 단계다.
```powershell
Set-Service cloudflared -StartupType Automatic
Start-Service cloudflared
```
대시보드 Service 를 `http://localhost:3000` 으로 되돌리고, 새 VM 의 cloudflared 는 정지한다.
**구 서버는 새 VM 이 며칠 정상 동작하는 것을 확인한 뒤에 정리한다.**
Proxmox 스냅샷을 이관 직전·직후에 각각 찍어 두면 VM 쪽 롤백도 즉시 가능하다.

---

### 10-8. 운영 명령 대응표

| 목적 | 윈도우 (1~9장) | 리눅스 |
|---|---|---|
| 백업 1회 | `.\scripts\backup-db.ps1` | `./scripts/backup-db.sh` |
| 복구 | `.\scripts\restore-db.ps1 -File <f>` | `./scripts/restore-db.sh <f>` |
| 백업 이력 | `Get-Content .\backups\backup.log -Tail 10` | `tail -n 10 ./backups/backup.log` |
| 터널 재시작 | `Restart-Service cloudflared` | `docker compose restart cloudflared` |
| 터널 상태 | `Get-Service cloudflared` | `docker compose logs -f cloudflared` |
| 부팅 자동 기동 | 자동 로그인 + Docker Desktop 설정 | `sudo systemctl enable docker` |
| 로그뷰어 접속 | `ssh -L 8081:localhost:8081 …` | 동일 |
| 메모리 확인 | 작업 관리자 / `.wslconfig` | `docker stats` · `free -h` (`.wslconfig` 불필요) |

`docker compose` 명령(`up -d` · `logs -f` · `restart` · `--profile init run` 등)은 양쪽이 동일하다.

**리눅스에서 추가로 챙길 것**

```bash
sudo apt install -y unattended-upgrades      # 보안 패치 자동 (재부팅은 안 함)
sudo chown -R junsu:junsu ~/stock_app/logs   # 컨테이너가 root 로 쓴 로그 정리용
docker system prune -a --filter "until=720h" # 오래된 이미지 정리 (재배포 누적)
```

`backend/Dockerfile` 의 `-Xmx1280m` 하드코딩은 WSL2 의 cgroup 오탐 회피용이지만,
네이티브 리눅스에서도 정확한 값이므로 **그대로 둔다.**

---

### 10-9. 이관 체크리스트

- [ ] VM: Ballooning 끄고 RAM 10GB, 디스크 Discard 켬, guest agent 설치
- [ ] `sudo systemctl enable docker` (부팅 자동 기동)
- [ ] SSH 키 접속 확인 **후** 비밀번호·root 로그인 차단
- [ ] 구 서버와 **같은 브랜치**로 clone, `logs/`·`backups/` 미리 생성
- [ ] `.env` 를 구 서버에서 복사 (`.env.example` 새로 채우지 않기), `chmod 600`
- [ ] `REACTION_IP_SALT` 가 구 서버와 동일한가 (없었으면 `jipyo-reaction`)
- [ ] 구 서버 관리자 비밀번호를 알고 있는가 (`.env` 로는 못 바꾼다)
- [ ] `APP_CORS_ALLOWED_ORIGINS` 가 실제 도메인인가
- [ ] 덤프 `sha256sum` 이 양쪽 동일한가
- [ ] postgres → 복원 → 나머지 순서로 기동했는가
- [ ] 구 서버 cloudflared 를 **정지 + StartupType Disabled** 했는가
- [ ] 대시보드 Service 를 `http://frontend:80` 으로 바꿨는가
- [ ] `/guide`·게시판·관리자 로그인까지 확인했는가
- [ ] 새 서버에서 백업이 도는가 (`docker compose logs backup`, 다음 날 `backups/` 확인)
- [ ] 구 서버는 며칠 지켜본 뒤 정리 (`cloudflared service uninstall`)
