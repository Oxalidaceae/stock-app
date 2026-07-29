// 빌드 후 실행: 정적 경로마다 고유한 <head> 메타(title·description·OG·canonical)와
// JS 없이도 읽히는 <body> 본문을 가진 dist/<route>/index.html 을 생성한다.
//
// SPA 는 원본 HTML 이 <div id="root"></div> 뿐이라, 크롤러가 첫 크롤에서 볼 수 있는
// 텍스트와 내부 링크가 0 이다. 그 상태로는 사이트 전체가 "발견됨 - 현재 색인이
// 생성되지 않음" 으로 밀리므로, 최소한의 제목·설명·전체 메뉴 링크를 정적으로 심는다.
// (createRoot 는 마운트 시 컨테이너를 비우므로 React 가 뜨면 이 내용은 교체된다.)
//
// 가이드 상세(/guide/<slug>)는 DB 기반이라 API 를 읽어 본문까지 정적 생성한다.
// API 가 안 뜬 상태의 빌드에서는 건너뛰고 경고만 남긴다 — 그 경우 nginx 가
// canonical 없는 app-shell.html 로 폴백하고 usePageMeta 가 런타임에 메타를 채운다.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const ORIGIN = 'https://jipyo.net'
/** 가이드 본문을 읽어올 API 오리진. 로컬 빌드에서는 PRERENDER_API_ORIGIN 으로 덮어쓴다. */
const API_ORIGIN = process.env.PRERENDER_API_ORIGIN || ORIGIN
const SUFFIX = ' | Jipyo (지표)'

// 경로별 메타. '/' 는 dist/index.html 을 덮어쓴다.
// heading 은 정적 본문의 <h1> — title 에서 사이트명 접미사를 뺀 형태.
// navLabel 은 메뉴에 쓸 짧은 이름(없으면 heading 을 그대로 쓴다).
const ROUTES = [
  {
    path: '/',
    title: 'Jipyo (지표) — 한국 주식·공시·거시지표',
    heading: '한국 주식·공시·거시지표를 한 곳에서',
    navLabel: '홈',
    description: '한국 상장기업의 DART 공시·재무제표, 한국은행 거시지표, KOSPI/KOSDAQ 주가를 한 곳에서.',
  },
  {
    path: '/disclosures',
    title: `DART 공시 — 한국 상장기업 전자공시${SUFFIX}`,
    heading: 'DART 공시',
    description: '금융감독원 DART 기반 한국 상장기업의 최신 공시·정정·주요사항 보고를 한눈에 확인하세요.',
  },
  {
    path: '/economic',
    title: `경제지표 — 금리·환율·물가 등 주요 지표${SUFFIX}`,
    heading: '경제지표',
    description: '한국은행 ECOS 기반 기준금리·환율·물가 등 핵심 경제지표를 한 곳에서 확인하세요.',
  },
  {
    path: '/macro',
    title: `거시경제 — 국내 거시지표 추이${SUFFIX}`,
    heading: '거시경제',
    description: 'GDP·금리·환율 등 국내 거시경제 지표의 추이를 차트로 살펴보세요.',
  },
  {
    path: '/news',
    title: `경제 소식 — 대한민국 정책브리핑 경제 뉴스${SUFFIX}`,
    heading: '경제 소식',
    description: '대한민국 정책브리핑(공공누리) RSS 기반 최신 경제·정책 소식을 모아 제공합니다.',
  },
  {
    path: '/screener',
    title: `종목 스크리너 — 재무 조건별 주식 검색${SUFFIX}`,
    heading: '종목 스크리너',
    description: '재무 지표 조건으로 KOSPI·KOSDAQ 상장 종목을 필터링하고 발굴하세요.',
  },
  {
    path: '/compare',
    title: `종목 비교 — 여러 기업 재무·주가 비교${SUFFIX}`,
    heading: '종목 비교',
    description: '관심 있는 여러 종목의 재무제표와 주가를 나란히 비교해 보세요.',
  },
  {
    path: '/guide',
    title: `투자 가이드 — 지표·공시·거시경제 쉽게 읽기${SUFFIX}`,
    heading: '투자 가이드',
    description: 'PER·PBR·ROE 같은 재무지표부터 DART 공시, 기준금리·환율까지. 투자 정보를 스스로 해석하는 데 필요한 기초를 Jipyo가 직접 정리했습니다.',
  },
  {
    path: '/board',
    title: `게시판 — Jipyo 소식과 이야기${SUFFIX}`,
    heading: '게시판',
    description: 'Jipyo 운영진이 전하는 공지, 업데이트 소식과 투자 관련 이야기를 모은 게시판입니다.',
  },
  {
    path: '/about',
    title: `Jipyo 소개 — 서비스 목적과 데이터 출처${SUFFIX}`,
    heading: 'Jipyo 소개',
    description: 'Jipyo(지표)의 서비스 목적, 제공 기능, 데이터 출처와 운영 원칙을 안내합니다.',
  },
  {
    path: '/contact',
    title: `문의하기 — 데이터 오류·서비스 이용 문의${SUFFIX}`,
    heading: '문의하기',
    description: 'Jipyo(지표) 서비스 이용, 데이터 오류, 출처, 개인정보 및 광고 관련 문의 방법을 안내합니다.',
  },
  {
    path: '/privacy',
    title: `개인정보처리방침${SUFFIX}`,
    heading: '개인정보처리방침',
    description: 'Jipyo(지표) 개인정보처리방침 — 수집 항목, 이용 목적, 쿠키 및 제3자 광고 안내.',
  },
  {
    path: '/terms',
    title: `이용약관 및 면책조항${SUFFIX}`,
    heading: '이용약관 및 면책조항',
    description: 'Jipyo(지표) 이용약관 및 투자 정보 면책조항 안내.',
  },
]

/* ── HTML 조립 유틸 ──────────────────────────── */

const escAttr = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const setAttrMeta = (html, key, attr, value) =>
  html.replace(
    new RegExp(`(<meta ${key}="${attr}" content=")[^"]*(")`),
    `$1${escAttr(value)}$2`,
  )

const setCanonical = (html, value) =>
  html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${escAttr(value)}$2`)

/** canonical 링크와 og:url 을 통째로 제거한다(URL 이 특정되지 않는 폴백 셸·404 용). */
const dropUrlMeta = (html) =>
  html
    .replace(/[ \t]*<link rel="canonical" href="[^"]*" \/>\n?/, '')
    .replace(/[ \t]*<meta property="og:url" content="[^"]*" \/>\n?/, '')

const ROOT_MARKER = '<div id="root"></div>'

/** 정적 본문을 #root 안에 심는다. React 가 마운트되면 이 내용은 교체된다. */
const setShellBody = (html, bodyHtml) =>
  html.replace(ROOT_MARKER, `<div id="root">${bodyHtml}</div>`)

/* ── 정적 본문 ───────────────────────────────── */

const S = {
  wrap: 'max-width:820px;margin:0 auto;padding:32px 20px;line-height:1.7',
  brand: 'font-size:0.85rem;margin:0 0 24px',
  h1: 'font-size:1.5rem;margin:0 0 12px',
  lead: 'margin:0 0 28px',
  nav: 'margin-top:32px;padding-top:16px;border-top:1px solid rgba(128,128,128,0.3);font-size:0.85rem',
  navLink: 'margin-right:14px;white-space:nowrap',
  list: 'margin:0 0 28px;padding-left:20px',
}

/** 전체 메뉴 링크 — 크롤러가 사이트맵 없이도 모든 정적 경로를 타고 다닐 수 있게 한다. */
const navHtml = () =>
  `<nav style="${S.nav}" aria-label="주요 메뉴">` +
  ROUTES.map(
    (r) =>
      `<a href="${escAttr(r.path)}" style="${S.navLink}">${escText(r.navLabel || r.heading)}</a>`,
  ).join('') +
  '</nav>'

/** 정적 본문 셸: 브랜드 링크 + 제목 + 설명 + (선택) 추가 마크업 + 전체 메뉴. */
const shellBody = ({ heading, description, extra = '' }) =>
  `<div style="${S.wrap}">` +
  `<p style="${S.brand}"><a href="/">Jipyo (지표)</a></p>` +
  `<h1 style="${S.h1}">${escText(heading)}</h1>` +
  `<p style="${S.lead}">${escText(description)}</p>` +
  extra +
  navHtml() +
  '</div>'

/* ── 마크다운 → 최소 HTML ─────────────────────── */
// 가이드 본문을 크롤러가 읽을 수 있는 형태로 옮기기 위한 최소 변환기.
// 화면 렌더링은 react-markdown 이 담당하므로 여기서는 문단·제목·목록·인용·링크만 다룬다.

function inline(text) {
  return escText(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) =>
      /^(https?:\/\/|\/)/.test(href)
        ? `<a href="${escAttr(href)}">${label}</a>`
        : label,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

function markdownToHtml(markdown) {
  const out = []
  for (const raw of markdown.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const block = raw.trim()
    if (!block) continue

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)

    // 제목 — 페이지 <h1> 은 글 제목이 쓰므로 한 단계씩 내린다.
    const heading = lines.length === 1 && lines[0].match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      const level = Math.min(heading[1].length + 1, 6)
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      continue
    }

    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      const items = lines.map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`)
      out.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    if (lines.every((l) => /^\d+\.\s+/.test(l))) {
      const items = lines.map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`)
      out.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    if (lines.every((l) => l.startsWith('>'))) {
      const quote = lines.map((l) => l.replace(/^>\s?/, '')).join(' ')
      out.push(`<blockquote><p>${inline(quote)}</p></blockquote>`)
      continue
    }

    out.push(`<p>${inline(lines.join(' '))}</p>`)
  }
  return out.join('\n')
}

/* ── 가이드 조회 ─────────────────────────────── */

async function fetchJson(path) {
  const res = await fetch(`${API_ORIGIN}${path}`, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`GET ${path} → HTTP ${res.status}`)
  const body = await res.json()
  if (!body?.success) throw new Error(`GET ${path} → success=false`)
  return body.data
}

/** 게시된 가이드의 상세(본문 포함) 목록. 실패하면 빈 배열 + 경고. */
async function fetchGuides() {
  try {
    const summaries = await fetchJson('/api/guides')
    const guides = []
    for (const summary of summaries ?? []) {
      guides.push(await fetchJson(`/api/guides/${encodeURIComponent(summary.slug)}`))
    }
    return guides
  } catch (err) {
    console.warn(
      `[prerender-meta] 가이드 API(${API_ORIGIN}) 조회 실패 — 가이드 상세 프리렌더를 건너뜁니다: ${err.message}`,
    )
    return []
  }
}

/** 메타 description 길이 정리 (검색결과 스니펫 기준 ~160자). */
const clamp = (s, max = 160) => {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`
}

/* ── 생성 ────────────────────────────────────── */

const template = readFileSync(resolve(DIST, 'index.html'), 'utf8')
if (!template.includes(ROOT_MARKER)) {
  throw new Error(
    `[prerender-meta] dist/index.html 에서 ${ROOT_MARKER} 를 찾지 못했습니다. ` +
      'vite build 직후의 깨끗한 dist 인지 확인하세요.',
  )
}

/** 공통: head 메타를 채운 HTML 을 만든다. url 이 없으면 canonical 을 제거한다. */
function buildPage({ title, description, url, bodyHtml }) {
  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escText(title)}</title>`)
  html = setAttrMeta(html, 'name', 'description', description)
  html = setAttrMeta(html, 'property', 'og:title', title)
  html = setAttrMeta(html, 'property', 'og:description', description)
  html = setAttrMeta(html, 'name', 'twitter:title', title)
  html = setAttrMeta(html, 'name', 'twitter:description', description)
  if (url) {
    html = setAttrMeta(html, 'property', 'og:url', url)
    html = setCanonical(html, url)
  } else {
    html = dropUrlMeta(html)
  }
  return setShellBody(html, bodyHtml)
}

const write = (routePath, html) => {
  const outDir = routePath === '/' ? DIST : resolve(DIST, `.${routePath}`)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'index.html'), html)
}

const guides = await fetchGuides()

// 가이드 목록 페이지에는 각 글로 가는 링크를 정적으로 심어, 크롤러가 사이트맵 없이도
// 가이드 상세를 발견할 수 있게 한다.
const guideListExtra = guides.length
  ? `<ul style="${S.list}">` +
    guides
      .map(
        (g) =>
          `<li><a href="/guide/${escAttr(g.slug)}">${escText(g.title)}</a>` +
          (g.summary ? ` — ${escText(clamp(g.summary, 120))}` : '') +
          '</li>',
      )
      .join('') +
    '</ul>'
  : ''

for (const route of ROUTES) {
  const url = `${ORIGIN}${route.path}`
  write(
    route.path,
    buildPage({
      title: route.title,
      description: route.description,
      url,
      bodyHtml: shellBody({
        heading: route.heading,
        description: route.description,
        extra: route.path === '/guide' ? guideListExtra : '',
      }),
    }),
  )
}

// 가이드 상세 — 제목·설명·canonical 을 글마다 정확히 박고 본문까지 정적으로 내려준다.
// (관리자가 글을 수정하면 재빌드 전까지 이 정적 본문은 옛 내용이지만, 크롤러가
//  렌더링한 결과는 API 최신본이라 색인은 최신 내용으로 정정된다.)
for (const guide of guides) {
  const title = `${guide.title}${SUFFIX}`
  const description = clamp(guide.summary || guide.content)
  write(
    `/guide/${guide.slug}`,
    buildPage({
      title,
      description,
      url: `${ORIGIN}/guide/${guide.slug}`,
      bodyHtml: shellBody({
        heading: guide.title,
        description: guide.summary || '',
        extra: `<article>${markdownToHtml(guide.content)}</article>`,
      }),
    }),
  )
}

// 동적 경로(/stock/*, /board/*, 아직 프리렌더되지 않은 신규 /guide/*) 폴백 셸.
// canonical 을 두지 않는 것이 핵심 — 홈 index.html 로 폴백하면 이 경로들이 전부
// canonical="https://jipyo.net/" 을 달고 나가 홈의 중복으로 취급된다.
// noindex 도 두지 않는다 (크롤러는 렌더 전 원본 HTML 의 noindex 를 그대로 따르므로,
// 여기 박으면 종목·게시글 페이지가 통째로 색인에서 빠진다).
writeFileSync(
  resolve(DIST, 'app-shell.html'),
  buildPage({
    title: 'Jipyo (지표) — 한국 주식·공시·거시지표',
    description: '한국 상장기업의 DART 공시·재무제표, 한국은행 거시지표, KOSPI/KOSDAQ 주가를 한 곳에서.',
    url: null,
    bodyHtml: shellBody({
      heading: 'Jipyo (지표)',
      description: '한국 상장기업의 DART 공시·재무제표, 한국은행 거시지표, KOSPI/KOSDAQ 주가를 한 곳에서.',
    }),
  }),
)

// 404 페이지: nginx 가 존재하지 않는 경로에 HTTP 404 와 함께 내려주는 정적 셸.
// JS 미실행 크롤러도 색인하지 않도록 noindex 를 박아 두고, SPA 가 부팅되면
// "*" 라우트가 NotFoundPage 를 렌더한다. canonical 은 두지 않는다.
{
  const title = `페이지를 찾을 수 없습니다${SUFFIX}`
  const description = '요청하신 페이지를 찾을 수 없습니다.'
  let html = buildPage({
    title,
    description,
    url: null,
    bodyHtml: shellBody({ heading: '페이지를 찾을 수 없습니다', description }),
  })
  html = html.replace(
    /([ \t]*)(<title>)/,
    '$1<meta name="robots" content="noindex, nofollow" />\n$1$2',
  )
  writeFileSync(resolve(DIST, '404.html'), html)
}

console.log(
  `[prerender-meta] 정적 경로 ${ROUTES.length}개 + 가이드 상세 ${guides.length}개 ` +
    '+ app-shell.html + 404.html 생성 완료',
)
