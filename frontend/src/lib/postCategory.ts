/**
 * 게시글 분류의 화면 표기.
 *
 * API 는 enum 이름(NOTICE·UPDATE·NOTE)만 주고받고 한글 라벨은 여기서만 정한다.
 * 게시판 목록·상세·관리자 편집기가 같은 값을 쓰도록 한 곳에 모아 둔다.
 *
 * 값을 늘릴 때는 백엔드 PostCategory enum 과 마이그레이션의 CHECK 제약(V14)도
 * 함께 고쳐야 한다.
 */
import type { PostCategory } from '../types/api'

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  NOTICE: '공지',
  UPDATE: '업데이트',
  NOTE: '기록',
}

/** 필터·셀렉트에 노출할 순서. */
export const CATEGORY_ORDER: PostCategory[] = ['NOTICE', 'UPDATE', 'NOTE']

/** 알 수 없는 값이 와도 화면이 비지 않게 원문을 그대로 돌려준다. */
export const categoryLabel = (value: string | null | undefined): string =>
  (value && CATEGORY_LABELS[value as PostCategory]) || value || ''
