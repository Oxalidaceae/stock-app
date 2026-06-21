/**
 * 개인정보처리방침
 *
 * 구성 근거
 *  - 개인정보보호법 제30조 및 개인정보 처리방침 작성지침(개인정보보호위원회, 2025.4)
 *  - Google AdSense 필수 고지(쿠키·제3자 광고·맞춤 광고 거부 안내)
 *
 * ⚠ 배포 전 [ ] 표시된 placeholder(운영자명·사이트 도메인 등)를 실제 값으로 교체하세요.
 */

import type { ReactNode } from 'react'

const SITE_NAME = 'Jipyo (지표)'
const SITE_DOMAIN = 'https://jipyo.net'
const OPERATOR = 'Jipyo 운영자'
const CONTACT_EMAIL = 'jipyopage@gmail.com'
const EFFECTIVE_DATE = '2026년 6월 21일'

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

export default function PrivacyPolicyPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">개인정보처리방침</h1>
        <p className="page-subtitle">{SITE_NAME} — Privacy Policy</p>
      </div>

      <div className="card" style={{ padding: 'var(--space-xl)', maxWidth: 860 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-xl)' }}>
          {OPERATOR}(이하 ‘운영자’)은(는) 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고
          이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          본 방침은 {SITE_DOMAIN}(이하 ‘사이트’)에 적용됩니다.
        </p>

        <Section no={1} title="수집하는 개인정보의 항목 및 수집 방법">
          본 사이트는 회원가입·로그인 등 별도의 개인정보를 직접 입력받는 기능을 제공하지 않습니다.
          다만 서비스 이용 과정에서 다음의 정보가 자동으로 생성·수집될 수 있습니다.
          <List items={[
            '자동 수집 정보: 접속 IP 주소, 쿠키(cookie), 방문 일시, 서비스 이용 기록, 브라우저 및 OS 종류, 기기 정보',
            <>광고 서비스를 통한 정보: 제3자 광고 사업자(Google 등)가 쿠키를 통해 수집하는 광고 식별 정보 (아래 제4조 참조)</>,
          ]} />
        </Section>

        <Section no={2} title="개인정보의 수집 및 이용 목적">
          수집한 정보는 다음의 목적으로만 이용됩니다.
          <List items={[
            '서비스 제공 및 운영, 접속 빈도 분석 및 통계',
            '서비스 이용 환경 최적화 및 오류·부정 이용 방지',
            '맞춤형 광고 제공 및 광고 효과 측정 (이용자 동의 범위 내)',
          ]} />
        </Section>

        <Section no={3} title="개인정보의 보유 및 이용 기간">
          자동 수집된 접속 로그는 통계 및 보안 목적으로 수집일로부터 최대 1년간 보관 후 파기합니다.
          쿠키는 이용자가 브라우저 설정을 통해 언제든지 삭제할 수 있으며, 관련 법령에서 별도의 보관 기간을 정한 경우 해당 기간을 따릅니다.
        </Section>

        <Section no={4} title="쿠키(Cookie)의 운용 및 제3자 광고">
          <p style={{ marginBottom: 8 }}>
            본 사이트는 이용자에게 맞춤형 서비스 및 광고를 제공하기 위해 쿠키를 사용합니다.
          </p>
          <List items={[
            <>Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 본 사이트 및 다른 웹사이트 방문 기록에 기반한 광고를 게재합니다.</>,
            <>Google의 광고 쿠키(DART 쿠키 등) 사용으로 Google과 그 파트너는 이용자의 방문 기록을 바탕으로 광고를 제공할 수 있습니다.</>,
            <>이용자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-orange)' }}>Google 광고 설정</a>에서 맞춤 광고를 비활성화할 수 있습니다.</>,
            <>그 밖의 제3자 광고 사업자의 쿠키 사용 거부는 <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-orange)' }}>www.aboutads.info</a>에서 설정할 수 있습니다.</>,
            <>쿠키 저장을 원하지 않을 경우, 웹 브라우저 설정(도구 &gt; 인터넷 옵션 &gt; 개인정보)에서 쿠키 허용 여부를 직접 선택할 수 있습니다. 단, 쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.</>,
          ]} />
        </Section>

        <Section no={5} title="개인정보의 제3자 제공 및 처리 위탁">
          운영자는 이용자의 개인정보를 본 방침에서 고지한 범위를 넘어 제3자에게 제공하지 않습니다.
          다만 광고 게재를 위해 아래와 같이 제3자 서비스를 이용하며, 해당 사업자의 개인정보 처리는 각 사업자의 방침을 따릅니다.
          <List items={[
            <>Google AdSense (광고 게재) — <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-orange)' }}>Google의 데이터 처리 방침</a></>,
          ]} />
        </Section>

        <Section no={6} title="정보주체의 권리·의무 및 행사 방법">
          이용자는 언제든지 개인정보 열람·정정·삭제·처리정지를 요구할 수 있으며,
          쿠키 거부 등을 통해 개인정보 수집에 동의하지 않을 권리가 있습니다.
          권리 행사는 아래 개인정보 보호책임자에게 서면, 전자우편 등으로 요청할 수 있습니다.
        </Section>

        <Section no={7} title="개인정보의 안전성 확보 조치">
          운영자는 개인정보의 안전성 확보를 위해 접근 권한 관리, 접속 기록의 보관, 통신 구간 암호화(HTTPS) 등
          관련 법령에 따른 기술적·관리적 보호조치를 시행합니다.
        </Section>

        <Section no={8} title="개인정보 보호책임자">
          개인정보 처리에 관한 문의·불만·피해 구제 등은 아래로 연락 주시기 바랍니다.
          <List items={[
            <>개인정보 보호책임자: {OPERATOR}</>,
            <>연락처(이메일): {CONTACT_EMAIL}</>,
          ]} />
          <p style={{ marginTop: 8 }}>
            기타 개인정보 침해에 대한 신고·상담이 필요한 경우 개인정보침해신고센터(privacy.kisa.or.kr / 국번없이 118),
            개인정보 분쟁조정위원회(kopico.go.kr / 1833-6972) 등에 문의할 수 있습니다.
          </p>
        </Section>

        <Section no={9} title="개인정보처리방침의 변경">
          본 방침은 법령·정책 또는 보안 기술의 변경에 따라 내용이 추가·삭제·수정될 수 있으며,
          변경 시 사이트 공지사항(또는 본 페이지)을 통해 고지합니다.
        </Section>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-md)' }}>
          시행일: {EFFECTIVE_DATE}
        </p>
      </div>
    </>
  )
}
