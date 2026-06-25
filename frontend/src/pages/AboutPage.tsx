import { Link } from 'react-router-dom'

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
    name: '대한민국 정책브리핑',
    description: '공공누리 자료의 출처와 원문 링크를 표시하여 경제·금융 정책 소식을 소개합니다.',
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

        <section>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>운영 원칙</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.9 }}>
            Jipyo는 특정 종목의 매수·매도를 권유하거나 투자자문을 제공하지 않습니다.
            정보의 오류, 출처 표기 또는 서비스 이용에 관한 의견은{' '}
            <Link to="/contact" style={{ color: 'var(--accent-orange)' }}>문의하기</Link> 페이지에서 알려주세요.
          </p>
        </section>
      </div>
    </>
  )
}
