# Jipyo 프론트엔드

React 19 + TypeScript + Vite SPA. 빌드 결과물은 nginx 컨테이너가 서빙하고, `/api` 는 같은 nginx 가 백엔드로 프록시한다.

전체 스택 기동(Docker)과 프로젝트 개요는 [루트 README](../README.md) 참고. 이 문서는 프론트엔드만 다룬다.

---

## 개발

```bash
npm install
npm run dev     # http://localhost:5173
```

Vite dev 서버가 `/api` 요청을 `http://localhost:8080` 으로 프록시한다(`vite.config.ts`). 백엔드를 따로 띄워야 하며, 방법은 [루트 README의 "로컬 개발 (Docker 없이)"](../README.md#로컬-개발-docker-없이) 참고.

| 명령 | 설명 |
|---|---|
| `npm run dev` | Vite dev 서버 (HMR) |
| `npm run build` | `tsc -b` → `vite build` → `scripts/prerender-meta.mjs` |
| `npm run lint` | ESLint |
| `npm run preview` | 빌드 결과물 로컬 서빙 |

자동화 테스트는 없다. 타입 검증은 빌드의 `tsc -b` 단계가 담당한다.

---

## 빌드와 prerender

`npm run build` 의 마지막 단계인 `scripts/prerender-meta.mjs` 는 정적 경로마다 고유한 `<head>` 메타(title·description·OG·canonical)와 JS 없이도 읽히는 본문을 가진 `dist/<route>/index.html` 을 생성한다. SPA 원본 HTML 은 `<div id="root">` 뿐이라 크롤러가 첫 크롤에서 볼 텍스트가 없고, 그대로 두면 색인이 되지 않기 때문이다.

가이드 상세(`/guide/<slug>`)는 DB 기반이라 이 단계가 **API 를 호출해** 본문까지 정적 생성한다. 로컬 빌드에서는 API 오리진을 넘겨야 한다:

```bash
PRERENDER_API_ORIGIN=http://localhost:8080 npm run build
```

생략하면 운영 도메인(`https://jipyo.net`)을 보고, 응답이 없으면 경고만 남기고 건너뛴다. 그 경우 nginx 가 `app-shell.html` 로 폴백하고 `usePageMeta` 가 런타임에 메타를 채운다.

---

## 구조

```
src/
├── api/          # axios 클라이언트 + 엔드포인트 정의
├── hooks/        # TanStack Query 훅 (도메인별 use*.ts)
├── pages/        # 라우트 단위 페이지
├── components/   # 공용 UI
├── stores/       # Zustand (검색·테마·관심종목)
├── lib/          # 순수 로직 (지표 해석·게시글 분류·사이트 상수)
└── types/        # API 응답 타입
scripts/          # prerender-meta.mjs (빌드 후 실행)
nginx.conf        # 컨테이너 서빙 설정 — SPA 폴백·/api 프록시·캐시 헤더
public/           # robots.txt·og-image.png 등 정적 자산
```

---

## nginx (컨테이너 서빙)

`nginx.conf` 가 처리하는 것:

- `/api/` → `backend:8080` 프록시, `/sitemap.xml` → 백엔드가 DB 에서 생성하는 동적 sitemap 프록시
- 유효한 SPA 라우트 목록에 한해 prerender 된 `dist/<route>/index.html` 을 먼저 찾고, 없으면 `app-shell.html` 로 폴백 (목록에 없는 경로는 실제 404)
- `/login`·`/admin` 은 색인 대상이 아니라 별도 location 에서 `app-shell.html` 을 직접 서빙 + `X-Robots-Tag: noindex, nofollow`
- `/assets/` 는 빌드마다 파일명 해시가 바뀌므로 1년 immutable 캐시. HTML 셸에는 이 헤더가 붙지 않아 배포하면 바로 반영된다

`app-shell.html` 은 `internal` 이라 외부에서 직접 요청할 수 없다(색인될 별도 URL 이 생기지 않는다). 폴백에 홈 `index.html` 을 쓰지 않는 이유 등 각 규칙의 배경은 `nginx.conf` 주석에 적혀 있다.
