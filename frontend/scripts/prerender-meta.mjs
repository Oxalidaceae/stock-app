// 빌드 후 실행: 각 정적 경로에 대해 고유한 <head> 메타(title·description·OG)를
// 가진 dist/<route>/index.html 을 생성한다.
// SPA 본문은 동일하지만, JS를 실행하지 않는 크롤러(특히 네이버 Yeti)가
// 경로별로 다른 제목·설명을 읽을 수 있게 해 색인 품질을 높인다.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const ORIGIN = 'https://jipyo.net'

// 경로별 메타. '/' 는 dist/index.html 을 덮어쓴다.
const ROUTES = [
  {
    path: '/',
    title: 'Jipyo (지표) — 한국 주식·공시·거시지표',
    description: '한국 상장기업의 DART 공시·재무제표, 한국은행 거시지표, KOSPI/KOSDAQ 주가를 한 곳에서.',
  },
  {
    path: '/disclosures',
    title: 'DART 공시 — 한국 상장기업 전자공시 | Jipyo (지표)',
    description: '금융감독원 DART 기반 한국 상장기업의 최신 공시·정정·주요사항 보고를 한눈에 확인하세요.',
  },
  {
    path: '/economic',
    title: '경제지표 — 금리·환율·물가 등 주요 지표 | Jipyo (지표)',
    description: '한국은행 ECOS 기반 기준금리·환율·물가 등 핵심 경제지표를 한 곳에서 확인하세요.',
  },
  {
    path: '/macro',
    title: '거시경제 — 국내 거시지표 추이 | Jipyo (지표)',
    description: 'GDP·금리·환율 등 국내 거시경제 지표의 추이를 차트로 살펴보세요.',
  },
  {
    path: '/news',
    title: '경제 소식 — 대한민국 정책브리핑 경제 뉴스 | Jipyo (지표)',
    description: '대한민국 정책브리핑(공공누리) RSS 기반 최신 경제·정책 소식을 모아 제공합니다.',
  },
  {
    path: '/screener',
    title: '종목 스크리너 — 재무 조건별 주식 검색 | Jipyo (지표)',
    description: '재무 지표 조건으로 KOSPI·KOSDAQ 상장 종목을 필터링하고 발굴하세요.',
  },
  {
    path: '/compare',
    title: '종목 비교 — 여러 기업 재무·주가 비교 | Jipyo (지표)',
    description: '관심 있는 여러 종목의 재무제표와 주가를 나란히 비교해 보세요.',
  },
  {
    path: '/about',
    title: 'Jipyo 소개 — 서비스 목적과 데이터 출처 | Jipyo (지표)',
    description: 'Jipyo(지표)의 서비스 목적, 제공 기능, 데이터 출처와 운영 원칙을 안내합니다.',
  },
  {
    path: '/contact',
    title: '문의하기 — 데이터 오류·서비스 이용 문의 | Jipyo (지표)',
    description: 'Jipyo(지표) 서비스 이용, 데이터 오류, 출처, 개인정보 및 광고 관련 문의 방법을 안내합니다.',
  },
  {
    path: '/privacy',
    title: '개인정보처리방침 | Jipyo (지표)',
    description: 'Jipyo(지표) 개인정보처리방침 — 수집 항목, 이용 목적, 쿠키 및 제3자 광고 안내.',
  },
  {
    path: '/terms',
    title: '이용약관 및 면책조항 | Jipyo (지표)',
    description: 'Jipyo(지표) 이용약관 및 투자 정보 면책조항 안내.',
  },
]

const escAttr = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const setAttrMeta = (html, key, attr, value) =>
  html.replace(
    new RegExp(`(<meta ${key}="${attr}" content=")[^"]*(")`),
    `$1${escAttr(value)}$2`,
  )

const setCanonical = (html, value) =>
  html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${escAttr(value)}$2`,
  )

const template = readFileSync(resolve(DIST, 'index.html'), 'utf8')

let count = 0
for (const r of ROUTES) {
  const url = `${ORIGIN}${r.path === '/' ? '/' : r.path}`
  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escText(r.title)}</title>`)
  html = setAttrMeta(html, 'name', 'description', r.description)
  html = setAttrMeta(html, 'property', 'og:title', r.title)
  html = setAttrMeta(html, 'property', 'og:description', r.description)
  html = setAttrMeta(html, 'property', 'og:url', url)
  html = setAttrMeta(html, 'name', 'twitter:title', r.title)
  html = setAttrMeta(html, 'name', 'twitter:description', r.description)
  html = setCanonical(html, url)

  const outDir = r.path === '/' ? DIST : resolve(DIST, `.${r.path}`)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'index.html'), html)
  count++
}

// 404 페이지: nginx 가 존재하지 않는 경로에 HTTP 404 와 함께 내려주는 정적 셸.
// JS 미실행 크롤러도 색인하지 않도록 noindex 를 박아 두고, SPA 가 부팅되면
// "*" 라우트가 NotFoundPage 를 렌더한다. canonical 은 두지 않는다.
{
  const notFoundTitle = '페이지를 찾을 수 없습니다 | Jipyo (지표)'
  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escText(notFoundTitle)}</title>`)
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>\s*/,
    '<meta name="robots" content="noindex, nofollow" />\n    ',
  )
  writeFileSync(resolve(DIST, '404.html'), html)
}

console.log(`[prerender-meta] ${count}개 경로의 정적 메타 HTML + 404.html 생성 완료`)
