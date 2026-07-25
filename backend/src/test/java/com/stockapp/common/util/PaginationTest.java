package com.stockapp.common.util;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import static org.assertj.core.api.Assertions.assertThat;

class PaginationTest {

    @Test
    void publicPageClampsOversizedRequestToMax() {
        // 인증 없이 들어오는 size=1000000 이 그대로 통과하면 대용량 조회 OOM 벡터가 된다.
        assertThat(Pagination.publicPage(0, 1_000_000).getPageSize())
                .isEqualTo(Pagination.MAX_PUBLIC_SIZE);
    }

    @Test
    void publicPageRaisesNonPositiveSizeToOne() {
        // size=0 / 음수는 PageRequest.of 에서 IllegalArgumentException(→500) 을 던지므로 1 로 올린다.
        assertThat(Pagination.publicPage(0, 0).getPageSize()).isEqualTo(1);
        assertThat(Pagination.publicPage(0, -5).getPageSize()).isEqualTo(1);
    }

    @Test
    void negativePageBecomesZero() {
        assertThat(Pagination.publicPage(-3, 20).getPageNumber()).isEqualTo(0);
    }

    @Test
    void validValuesPassThroughUnchanged() {
        PageRequest page = Pagination.publicPage(2, 30);
        assertThat(page.getPageNumber()).isEqualTo(2);
        assertThat(page.getPageSize()).isEqualTo(30);
    }

    @Test
    void adminPageAllowsLargerCeilingThanPublic() {
        assertThat(Pagination.adminPage(0, 100).getPageSize()).isEqualTo(100);
        assertThat(Pagination.adminPage(0, 1_000).getPageSize())
                .isEqualTo(Pagination.MAX_ADMIN_SIZE);
    }

    @Test
    void sortIsPreservedOnPublicPage() {
        Sort sort = Sort.by(Sort.Direction.DESC, "per");
        assertThat(Pagination.publicPage(0, 20, sort).getSort()).isEqualTo(sort);
    }
}
