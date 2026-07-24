package com.stockapp.common.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

/**
 * page/size 정규화 — {@link PageRequest#of} 에 넘기기 전에 반드시 거친다.
 *
 * <p>공개 API 의 page/size 는 인증 없이 외부에서 그대로 들어오므로, 검증 없이 넘기면
 * 두 가지가 터진다:
 * <ul>
 *   <li>{@code page=-1} · {@code size=0} → {@code IllegalArgumentException} → 500
 *       (클라이언트 잘못인데 서버 오류로 기록된다)</li>
 *   <li>{@code size=1000000} → 테이블 전체를 메모리에 적재 (인증 불필요한 OOM 벡터)</li>
 * </ul>
 */
public final class Pagination {

    /** 공개 API 한 페이지 최대 건수. 프론트가 실제로 요청하는 최대치는 30(경제 소식). */
    public static final int MAX_PUBLIC_SIZE = 50;

    /** 관리자 API 한 페이지 최대 건수. */
    public static final int MAX_ADMIN_SIZE = 100;

    private Pagination() {
    }

    /** 공개 API 용 — size 를 [1, {@value #MAX_PUBLIC_SIZE}] 로 클램프. */
    public static PageRequest publicPage(int page, int size) {
        return PageRequest.of(safePage(page), safeSize(size, MAX_PUBLIC_SIZE));
    }

    /** 공개 API 용 (정렬 포함). */
    public static PageRequest publicPage(int page, int size, Sort sort) {
        return PageRequest.of(safePage(page), safeSize(size, MAX_PUBLIC_SIZE), sort);
    }

    /** 관리자 API 용 — size 를 [1, {@value #MAX_ADMIN_SIZE}] 로 클램프. */
    public static PageRequest adminPage(int page, int size) {
        return PageRequest.of(safePage(page), safeSize(size, MAX_ADMIN_SIZE));
    }

    static int safePage(int page) {
        return Math.max(page, 0);
    }

    static int safeSize(int size, int maxSize) {
        return Math.min(Math.max(size, 1), maxSize);
    }
}
