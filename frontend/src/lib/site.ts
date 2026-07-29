/**
 * 사이트 정체성 상수 — 저자 표기, 구조화 데이터(JSON-LD), 소개/편집 방침 페이지가
 * 같은 값을 쓰도록 한 곳에 모은다.
 *
 * 금융 정보는 Google 이 가장 엄격한 기준(YMYL)을 적용하는 분야라 "누가 썼는지"가
 * 평가 요소다. 아래 값은 실제 운영 주체와 일치해야 하며, 사실이 아닌 경력·자격을
 * 적으면 오히려 감점 요인이 된다.
 *
 * 빌드 타임 프리렌더(scripts/prerender-meta.mjs)에도 같은 값이 복제되어 있으니
 * 바꿀 때 함께 수정할 것.
 */

export const SITE_NAME = 'Jipyo (지표)'
export const SITE_ORIGIN = 'https://jipyo.net'
export const CONTACT_EMAIL = 'jipyopage@gmail.com'

/** 가이드 아티클에 저자가 지정되지 않았을 때 표시할 편집 주체. */
export const EDITORIAL_NAME = 'Jipyo 편집팀'

/** 편집 방침 섹션 앵커 (가이드 글 하단에서 링크). */
export const EDITORIAL_ANCHOR = '/about#editorial'

/**
 * 운영자 실명(또는 사업자명). 비워 두면 소개 페이지의 운영 정보에서 해당 줄이
 * 표시되지 않는다.
 *
 * TODO(운영자 확인 필요): 금융 정보 사이트는 "누가 운영하고 누가 쓰는가"가
 * 신뢰도 평가에 직접 들어간다. 공개해도 괜찮은 실명이나 사업자명을 넣는 쪽이
 * 익명 운영보다 유리하다. 사실이 아닌 값은 넣지 말 것.
 */
export const OPERATOR_NAME = ''

/** 서비스 개시 시점 — 개인정보처리방침 시행일과 같은 기준. */
export const SERVICE_SINCE = '2026년 6월'
