package com.apiwise.assertion;

import com.apiwise.assertion.dto.AssertionDto;
import com.apiwise.assertion.dto.SaveAssertionRequest;
import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.request.ApiRequest;
import com.apiwise.request.ApiRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssertionService {

    private final AssertionRepository assertionRepository;
    private final ApiRequestRepository requestRepository;

    @Transactional(readOnly = true)
    public List<AssertionDto> getRequestAssertions(UUID requestId) {
        return assertionRepository.findByApiRequestIdOrderByOrderIndexAscCreatedAtAsc(requestId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AssertionDto createAssertion(UUID requestId, SaveAssertionRequest request) {
        ApiRequest apiRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApiRequest", "id", requestId));

        Assertion assertion = Assertion.builder()
                .apiRequest(apiRequest)
                .name(request.getName().trim())
                .assertionType(request.getAssertionType().toUpperCase())
                .target(request.getTarget())
                .operator(request.getOperator().toUpperCase())
                .expectedValue(request.getExpectedValue())
                .enabled(request.isEnabled())
                .orderIndex(request.getOrderIndex())
                .build();
        assertion = assertionRepository.save(assertion);

        return toDto(assertion);
    }

    @Transactional
    public AssertionDto updateAssertion(UUID requestId, UUID assertionId, SaveAssertionRequest request) {
        Assertion assertion = assertionRepository.findByIdAndApiRequestId(assertionId, requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Assertion", "id", assertionId));

        assertion.setName(request.getName().trim());
        assertion.setAssertionType(request.getAssertionType().toUpperCase());
        assertion.setTarget(request.getTarget());
        assertion.setOperator(request.getOperator().toUpperCase());
        assertion.setExpectedValue(request.getExpectedValue());
        assertion.setEnabled(request.isEnabled());
        assertion.setOrderIndex(request.getOrderIndex());

        assertion = assertionRepository.save(assertion);
        return toDto(assertion);
    }

    @Transactional
    public void deleteAssertion(UUID requestId, UUID assertionId) {
        Assertion assertion = assertionRepository.findByIdAndApiRequestId(assertionId, requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Assertion", "id", assertionId));
        assertionRepository.delete(assertion);
    }

    private AssertionDto toDto(Assertion a) {
        return AssertionDto.builder()
                .id(a.getId())
                .apiRequestId(a.getApiRequest().getId())
                .name(a.getName())
                .assertionType(a.getAssertionType())
                .target(a.getTarget())
                .operator(a.getOperator())
                .expectedValue(a.getExpectedValue())
                .enabled(a.isEnabled())
                .orderIndex(a.getOrderIndex())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
