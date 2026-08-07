import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  CONTACT_EMAIL,
  EDITORIAL_NAME,
  OPERATOR_NAME,
  SERVICE_SINCE,
  SITE_ORIGIN,
} from '../lib/site'

/**
 * 콘텐츠 제작·검수 절차. 실제 운영과 일치해야 하는 대외 약속이다.
 * (AdSense·검색 품질 평가에서 "누가 어떤 기준으로 만드는가"를 확인하는 근거가 된다.)
 */
const editorialPolicy: [string, string][] = [
  [
    '아티클은 직접 작성합니다',
    `투자 가이드의 모든 글은 ${EDITORIAL_NAME}이 직접 작성합니다. 외부 기고나 홍보성 원고는 게재하지 않으며, 각 글에 작성 주체와 게시일·최종 수정일을 표시합니다.`,
  ],
  [
    '경제 소식은 골라서 요약합니다',
    '각 부처가 발표하는 보도자료 가운데 투자자가 알아 둘 만한 건을 선별해 Jipyo가 자체 요약을 붙이고 관련 지표를 연결합니다. 원문 발췌를 그대로 옮겨 싣지 않으며, 발표 전문은 항상 원문 링크로 안내합니다.',
  ],
  [
    '수치는 원본에서 계산합니다',
    'PER·PBR·ROE 같은 지표는 DART 재무제표 원본에서 계산하며, 화면마다 데이터 출처와 기준 시점을 표시해 이용자가 원문을 직접 확인할 수 있게 합니다.',
  ],
  [
    '오류는 확인 후 정정합니다',
    `데이터나 서술의 오류를 알려 주시면 원본과 대조해 확인한 뒤 정정하고, 해당 글의 수정일을 갱신합니다. 제보는 ${CONTACT_EMAIL} 으로 받습니다.`,
  ],
  [
    '광고와 콘텐츠는 분리합니다',
    '사이트 운영비는 광고로 충당하며, 광고는 콘텐츠와 구분되는 영역에 표시합니다. 광고주가 아티클의 주제나 서술에 관여하지 않습니다.',
  ],
  [
    '투자 자문이 아닙니다',
    'Jipyo는 투자 판단에 필요한 정보를 정리해 보여줄 뿐, 특정 종목의 매수·매도를 권유하거나 수익을 보장하지 않습니다. 투자 판단과 그 결과의 책임은 이용자 본인에게 있습니다.',
  ],
]

const operatorInfo: [string, ReactNode][] = [
  ['서비스명', 'Jipyo (지표)'],
  ['사이트', SITE_ORIGIN.replace(/^https?:\/\//, '')],
  ...(OPERATOR_NAME ? ([['운영자', OPERATOR_NAME]] as [string, ReactNode][]) : []),
  ['콘텐츠 작성', EDITORIAL_NAME],
  ['운영 시작', SERVICE_SINCE],
  ['문의', <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--accent-orange)' }}>{CONTACT_EMAIL}</a>],
]

const dataSources = [
  {
    name: '금융감독원 DART',
    description: '상장기업 공시와 재무제표를 수집해 종목 상세, 재무 추이, 스크리너에 활용합니다.',
  },
  {
    name: '한국은행 ECOS',
    description: '금리·환율·물가·통화량 등 주요 경제지표와 100대 통계지표를 제공합니다.',
  },
  {
    name: 'FinanceDataReader',
    description: 'KOSPI·KOSDAQ 종목의 일별 주가와 시가총액 데이터를 제공합니다.',
  },
  {
    name: '재정경제부·금융위원회 보도자료',
    description: '각 부처 누리집이 제공하는 보도자료 피드에서 제목과 원문 링크를 받아, 출처를 표시하고 경제·금융 정책 소식을 소개합니다.',
  },
]

export default function AboutPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Jipyo 소개</h1>
        <p className="page-subtitle">흩어진 국내 주식·공시·경제 데이터를 한 곳에서 확인하는 정보 서비스</p>
      </div>

      <div className="card" style={{ maxWidth: 920, padding: 'var(--space-xl)' }}>
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>서비스 목적</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.9 }}>
            Jipyo(지표)는 여러 공공·시장 데이터 출처에 흩어진 정보를 한 화면에서 비교하고
            살펴볼 수 있도록 정리하는 서비스입니다. 기업 공시, 재무지표, 주가와 거시경제
            지표를 연결해 사용자가 투자 조사의 출발점을 빠르게 찾을 수 있도록 돕습니다.
          </p>
        </section>

        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>제공하는 기능</h2>
          <div className="grid-2">
            {[
              ['기업 분석', '종목별 주가, 재무지표, 연간 실적 추이와 최근 공시를 함께 확인합니다.'],
              ['종목 탐색', 'PER·PBR·ROE·부채비율 등의 조건으로 상장 종목을 검색하고 비교합니다.'],
              ['경제지표', '한국은행 통계를 차트와 핵심 지표 카드로 정리해 변화 흐름을 보여줍니다.'],
              ['투자 가이드', '재무지표·공시·거시경제를 해설하는 아티클을 직접 작성해 제공합니다.'],
              ['게시판', '공지와 소식을 전하며, 로그인 없이 추천·비추천으로 의견을 남길 수 있습니다.'],
              ['데이터 투명성', '각 화면에 데이터 출처와 갱신 기준을 표시하고 원문 확인 경로를 제공합니다.'],
            ].map(([title, description]) => (
              <div
                key={title}
                style={{
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-lg)',
                }}
              >
                <h3 style={{ fontSize: '0.9rem', marginBottom: 8, color: 'var(--accent-orange)' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.7 }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>데이터 출처와 가공 원칙</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {dataSources.map((source) => (
              <div key={source.name}>
                <h3 style={{ fontSize: '0.88rem', marginBottom: 4 }}>{source.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.7 }}>
                  {source.description}
                </p>
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.7, marginTop: 'var(--space-lg)' }}>
            원천 데이터는 수집 시점, 기관 정정 또는 시장 상황에 따라 변경될 수 있습니다.
            Jipyo는 출처를 명확히 표시하고 최신 상태를 유지하기 위해 데이터를 정기적으로 갱신합니다.
          </p>
        </section>

        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>운영 원칙</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.9 }}>
            Jipyo는 특정 종목의 매수·매도를 권유하거나 투자자문을 제공하지 않습니다.
            정보의 오류, 출처 표기 또는 서비스 이용에 관한 의견은{' '}
            <Link to="/contact" style={{ color: 'var(--accent-orange)' }}>문의하기</Link> 페이지에서 알려주세요.
          </p>
        </section>

        {/*
          편집 방침 — 가이드 아티클 하단에서 이 앵커(/about#editorial)로 링크한다.
          누가 어떤 절차로 콘텐츠를 만드는지 밝히는 섹션으로, 금융 정보 사이트의
          신뢰도 평가에서 직접 참조된다. 아래 항목은 대외 약속이므로 실제 운영과
          어긋나면 수정할 것.
        */}
        <section id="editorial" style={{ marginBottom: 'var(--space-xl)', scrollMarginTop: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>편집 방침</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {editorialPolicy.map(([title, description]) => (
              <div key={title}>
                <h3 style={{ fontSize: '0.88rem', marginBottom: 4 }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.7 }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>운영 정보</h2>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '8px var(--space-lg)',
              margin: 0,
              fontSize: '0.85rem',
              lineHeight: 1.7,
            }}
          >
            {operatorInfo.map(([label, value]) => (
              <Fragment key={label}>
                <dt style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</dt>
                <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{value}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
      </div>
    </>
  )
}
