/**
 * 이용약관 및 면책조항
 *
 * 금융정보 제공 서비스의 핵심 면책(투자 권유 아님 / 정확성 미보증 / 투자 책임은 본인)과
 * 데이터 출처·저작권 고지를 담습니다. AdSense 심사 시 콘텐츠 신뢰도 요건 보강에도 기여합니다.
 *
 * ⚠ 배포 전 [ ] 표시된 placeholder를 실제 값으로 교체하세요.
 */

import type { ReactNode } from 'react'

const SITE_NAME = 'Jipyo (지표)'
const OPERATOR = 'Jipyo 운영자'
const CONTACT_EMAIL = 'jipyopage@gmail.com'
const EFFECTIVE_DATE = '2026년 6월 17일'

function Section({ no, title, children }: { no: number; title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--space-xl)' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
        제{no}조 ({title})
      </h2>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  )
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ol style={{ margin: '4px 0 0', paddingLeft: '1.2em', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ol>
  )
}

export default function TermsPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">이용약관 및 면책조항</h1>
        <p className="page-subtitle">{SITE_NAME} — Terms of Service &amp; Disclaimer</p>
      </div>

      <div className="card" style={{ padding: 'var(--space-xl)', maxWidth: 860 }}>
        {/* 투자 면책 — 가장 중요하므로 상단 강조 */}
        <div
          style={{
            border: '1px solid var(--accent-orange-dim)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md) var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
          }}
        >
          <strong style={{ color: 'var(--accent-orange)' }}>⚠ 투자 유의 안내</strong><br />
          본 사이트가 제공하는 모든 정보는 투자 참고용이며, 특정 종목의 매수·매도 등
          <strong> 투자 권유나 자문에 해당하지 않습니다.</strong> 모든 투자 판단과 그 결과에 대한 책임은
          이용자 본인에게 있습니다.
        </div>

        <Section no={1} title="목적">
          본 약관은 {OPERATOR}(이하 ‘운영자’)이 제공하는 {SITE_NAME}(이하 ‘서비스’)의 이용과 관련하여
          운영자와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
        </Section>

        <Section no={2} title="서비스의 내용">
          본 서비스는 공개된 기업 공시·재무 정보, 거시경제 지표, 주가 데이터 등을 수집·가공하여
          제공하는 정보 제공 서비스입니다. 서비스는 다음의 외부 출처 데이터를 활용합니다.
          <List items={[
            '기업 공시 및 재무제표: 금융감독원 전자공시시스템(DART)',
            '거시·경제 통계: 한국은행 경제통계시스템(ECOS)',
            '주가 데이터: FinanceDataReader',
            '정책 발표·보도자료(경제 소식): 대한민국 정책브리핑(korea.kr) — 공공누리 제1유형',
          ]} />
          <p style={{ marginTop: 8 }}>
            주가 등 일부 데이터는 실시간이 아니며 약 15분 지연되거나 일 단위로 갱신될 수 있습니다.
          </p>
        </Section>

        <Section no={3} title="정보의 정확성 및 면책">
          <List items={[
            '운영자는 제공되는 정보의 정확성·완전성·적시성을 보장하기 위해 노력하나, 이를 보증하지 않습니다.',
            '외부 데이터 출처의 오류, 지연, 중단으로 인한 정보의 부정확성에 대해 운영자는 책임을 지지 않습니다.',
            '본 서비스의 정보를 근거로 한 투자 등 의사결정의 결과에 대해 운영자는 어떠한 법적 책임도 부담하지 않습니다.',
            '천재지변, 서버 장애, 외부 API 중단 등 불가항력으로 인한 서비스 중단에 대해 운영자는 책임을 지지 않습니다.',
          ]} />
        </Section>

        <Section no={4} title="저작권 및 데이터 출처">
          서비스에 게시된 가공 콘텐츠의 저작권은 운영자에게 있으며, 원천 데이터의 권리는 각 출처 기관(DART·한국은행·정책브리핑 등)에
          귀속됩니다. 경제 소식 등 정책브리핑 자료는 「공공누리 제1유형(출처표시)」 조건에 따라 출처를 표시하여 제공하며,
          제목·요약 및 원문 링크만 게시하고 기사 전문은 원문(해당 기관)에서 확인하도록 합니다.
          이용자는 출처를 명시하지 않고 데이터를 무단으로 복제·배포·상업적으로 이용할 수 없습니다.
        </Section>

        <Section no={5} title="광고의 게재">
          본 서비스는 운영 유지를 위해 Google AdSense 등 제3자 광고를 게재할 수 있습니다.
          광고를 통한 쿠키 사용 및 개인정보 처리에 관한 사항은 <a href="/privacy" style={{ color: 'var(--accent-orange)' }}>개인정보처리방침</a>을 따릅니다.
        </Section>

        <Section no={6} title="약관의 변경">
          본 약관은 관련 법령을 위배하지 않는 범위에서 변경될 수 있으며, 변경 시 사이트를 통해 공지합니다.
          문의 사항은 {CONTACT_EMAIL}로 연락 주시기 바랍니다.
        </Section>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-md)' }}>
          시행일: {EFFECTIVE_DATE}
        </p>
      </div>
    </>
  )
}
