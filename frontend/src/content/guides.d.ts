// guides.js(런타임 공유 데이터)의 타입 선언.
// 페이지 컴포넌트는 이 선언으로 타입을 받고, 실제 값은 guides.js 에서 온다.

export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'note'; text: string }

export interface GuideRelatedLink {
  to: string
  label: string
}

export interface Guide {
  slug: string
  title: string
  description: string
  tag: string
  body: GuideBlock[]
  related: GuideRelatedLink[]
}

export const GUIDE_UPDATED: string
export const guides: Guide[]
export const guideBySlug: Record<string, Guide | undefined>
