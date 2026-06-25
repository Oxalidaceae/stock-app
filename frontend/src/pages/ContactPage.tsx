const CONTACT_EMAIL = 'jipyopage@gmail.com'

export default function ContactPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">문의하기</h1>
        <p className="page-subtitle">서비스 이용, 데이터 오류, 출처 및 개인정보 관련 문의</p>
      </div>

      <div className="card" style={{ maxWidth: 760, padding: 'var(--space-xl)' }}>
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>이메일 문의</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.9, marginBottom: 'var(--space-md)' }}>
            아래 이메일로 문의 내용을 보내주세요. 데이터 오류를 신고할 때는 확인한 페이지 주소,
            종목코드 또는 지표명, 확인 시점을 함께 적어주시면 검토에 도움이 됩니다.
          </p>
          <a
            className="btn btn-primary"
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[Jipyo 문의] ')}`}
          >
            {CONTACT_EMAIL}
          </a>
        </section>

        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>문의 가능한 내용</h2>
          <ul
            style={{
              paddingLeft: '1.2rem',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              lineHeight: 1.9,
            }}
          >
            <li>기업·주가·공시·재무·경제지표 데이터 오류 신고</li>
            <li>서비스 기능 오류 및 이용 불편 제보</li>
            <li>콘텐츠 출처, 저작권 및 정정 요청</li>
            <li>개인정보 처리와 광고 관련 문의</li>
            <li>서비스 개선 제안 및 기타 운영 문의</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>안내</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.8 }}>
            Jipyo는 개별 종목의 투자 판단, 수익 보장 또는 매수·매도 시점에 관한 상담을 제공하지 않습니다.
            문의 과정에서 계좌번호, 비밀번호, 인증번호 등 민감한 개인정보를 보내지 마세요.
          </p>
        </section>
      </div>
    </>
  )
}
