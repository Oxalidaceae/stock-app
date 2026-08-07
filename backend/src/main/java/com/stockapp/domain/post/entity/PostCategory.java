package com.stockapp.domain.post.entity;

/**
 * 게시글 분류.
 *
 * 화면에 보이는 한글 라벨은 프런트가 들고 있다(PostStatus 와 같은 방식) — API 는
 * enum 이름만 주고받는다. 값을 늘릴 때는 마이그레이션의 CHECK 제약(V14)과
 * frontend/src/lib/postCategory.ts 를 함께 고쳐야 한다.
 */
public enum PostCategory {

    /** 데이터·운영에 관한 알림 — 이용 안내, 출처 변경, 점검. */
    NOTICE,

    /** 기능 추가·변경 내역. */
    UPDATE,

    /** 데이터를 다루며 남기는 기록·이야기. */
    NOTE
}
