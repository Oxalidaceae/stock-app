package com.stockapp.domain.guide.service;

import com.stockapp.common.exception.BusinessException;
import com.stockapp.common.exception.ErrorCode;
import com.stockapp.domain.guide.dto.GuideRequest;
import com.stockapp.domain.guide.entity.Guide;
import com.stockapp.domain.guide.entity.GuideStatus;
import com.stockapp.domain.guide.repository.GuideRepository;
import com.stockapp.domain.user.entity.AppUser;
import com.stockapp.domain.user.entity.UserRole;
import com.stockapp.domain.user.repository.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminGuideServiceTest {

    private GuideRepository guideRepository;
    private AppUserRepository userRepository;
    private AdminGuideService adminGuideService;

    @BeforeEach
    void setUp() {
        guideRepository = mock(GuideRepository.class);
        userRepository = mock(AppUserRepository.class);
        adminGuideService = new AdminGuideService(guideRepository, userRepository);
    }

    private GuideRequest request(String slug) {
        GuideRequest request = new GuideRequest();
        request.setSlug(slug);
        request.setTitle("제목");
        request.setSummary("요약");
        request.setTag("분류");
        request.setContent("본문");
        request.setStatus(GuideStatus.PUBLISHED);
        return request;
    }

    private Guide guideWithId(String slug, long id) {
        Guide guide = Guide.create(slug, "제목", null, null, "본문", GuideStatus.PUBLISHED, null);
        ReflectionTestUtils.setField(guide, "id", id);
        return guide;
    }

    @Test
    void createSavesGuide() {
        when(guideRepository.existsBySlug("new-guide")).thenReturn(false);
        when(userRepository.findById(1L))
                .thenReturn(Optional.of(AppUser.create("admin", "hash", UserRole.ADMIN)));
        when(guideRepository.save(any(Guide.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = adminGuideService.create(request("new-guide"), 1L);

        assertThat(response.getSlug()).isEqualTo("new-guide");
        assertThat(response.getStatus()).isEqualTo("PUBLISHED");
        assertThat(response.getAuthorName()).isEqualTo("admin");
    }

    @Test
    void createRejectsDuplicateSlug() {
        when(guideRepository.existsBySlug("taken")).thenReturn(true);

        assertThatThrownBy(() -> adminGuideService.create(request("taken"), 1L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_PARAMETER);
    }

    @Test
    void updateRejectsSlugOwnedByAnotherGuide() {
        Guide target = guideWithId("mine", 1L);
        Guide other = guideWithId("taken", 2L);
        when(guideRepository.findById(1L)).thenReturn(Optional.of(target));
        when(guideRepository.findBySlug("taken")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> adminGuideService.update(1L, request("taken")))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_PARAMETER);
    }

    @Test
    void updateAllowsKeepingOwnSlug() {
        Guide target = guideWithId("mine", 1L);
        when(guideRepository.findById(1L)).thenReturn(Optional.of(target));
        when(guideRepository.findBySlug("mine")).thenReturn(Optional.of(target));

        var response = adminGuideService.update(1L, request("mine"));

        assertThat(response.getSlug()).isEqualTo("mine");
        assertThat(response.getSummary()).isEqualTo("요약");
    }

    @Test
    void deleteFailsWhenGuideMissing() {
        when(guideRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminGuideService.delete(9L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_FOUND);
    }
}
