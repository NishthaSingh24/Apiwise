package com.apiwise.request;

import com.apiwise.assertion.Assertion;
import com.apiwise.assertion.AssertionRepository;
import com.apiwise.collection.Collection;
import com.apiwise.collection.CollectionRepository;
import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.request.dto.ApiRequestDto;
import com.apiwise.request.dto.SaveApiRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApiRequestService {

    private final ApiRequestRepository requestRepository;
    private final CollectionRepository collectionRepository;
    private final AssertionRepository assertionRepository;

    @Transactional(readOnly = true)
    public List<ApiRequestDto> getCollectionRequests(UUID collectionId) {
        return requestRepository.findByCollectionIdOrderByOrderIndexAscCreatedAtAsc(collectionId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApiRequestDto getRequest(UUID requestId) {
        ApiRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApiRequest", "id", requestId));
        return toDto(req);
    }

    @Transactional
    public ApiRequestDto createRequest(UUID collectionId, SaveApiRequest req) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", "id", collectionId));

        ApiRequest apiRequest = ApiRequest.builder()
                .collection(collection)
                .name(req.getName().trim())
                .description(req.getDescription())
                .method(req.getMethod().toUpperCase())
                .url(req.getUrl().trim())
                .queryParams(req.getQueryParams() != null ? req.getQueryParams() : "[]")
                .headers(req.getHeaders() != null ? req.getHeaders() : "[]")
                .authConfig(req.getAuthConfig() != null ? req.getAuthConfig() : "{}")
                .bodyType(req.getBodyType() != null ? req.getBodyType() : "NONE")
                .bodyContent(req.getBodyContent())
                .orderIndex(req.getOrderIndex())
                .build();
        apiRequest = requestRepository.save(apiRequest);

        return toDto(apiRequest);
    }

    @Transactional
    public ApiRequestDto updateRequest(UUID requestId, SaveApiRequest req) {
        ApiRequest apiRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApiRequest", "id", requestId));

        apiRequest.setName(req.getName().trim());
        apiRequest.setDescription(req.getDescription());
        apiRequest.setMethod(req.getMethod().toUpperCase());
        apiRequest.setUrl(req.getUrl().trim());
        apiRequest.setQueryParams(req.getQueryParams() != null ? req.getQueryParams() : "[]");
        apiRequest.setHeaders(req.getHeaders() != null ? req.getHeaders() : "[]");
        apiRequest.setAuthConfig(req.getAuthConfig() != null ? req.getAuthConfig() : "{}");
        apiRequest.setBodyType(req.getBodyType() != null ? req.getBodyType() : "NONE");
        apiRequest.setBodyContent(req.getBodyContent());
        apiRequest.setOrderIndex(req.getOrderIndex());

        apiRequest = requestRepository.save(apiRequest);
        return toDto(apiRequest);
    }

    @Transactional
    public ApiRequestDto duplicateRequest(UUID requestId) {
        ApiRequest original = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApiRequest", "id", requestId));

        ApiRequest copy = ApiRequest.builder()
                .collection(original.getCollection())
                .name(original.getName() + " (Copy)")
                .description(original.getDescription())
                .method(original.getMethod())
                .url(original.getUrl())
                .queryParams(original.getQueryParams())
                .headers(original.getHeaders())
                .authConfig(original.getAuthConfig())
                .bodyType(original.getBodyType())
                .bodyContent(original.getBodyContent())
                .orderIndex(original.getOrderIndex() + 1)
                .build();
        copy = requestRepository.save(copy);

        // Copy assertions
        List<Assertion> assertions = assertionRepository.findByApiRequestIdOrderByOrderIndexAscCreatedAtAsc(requestId);
        for (Assertion a : assertions) {
            Assertion copyAssertion = Assertion.builder()
                    .apiRequest(copy)
                    .name(a.getName())
                    .assertionType(a.getAssertionType())
                    .target(a.getTarget())
                    .operator(a.getOperator())
                    .expectedValue(a.getExpectedValue())
                    .enabled(a.isEnabled())
                    .orderIndex(a.getOrderIndex())
                    .build();
            assertionRepository.save(copyAssertion);
        }

        return toDto(copy);
    }

    @Transactional
    public void deleteRequest(UUID requestId) {
        ApiRequest apiRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApiRequest", "id", requestId));
        requestRepository.delete(apiRequest);
    }

    private ApiRequestDto toDto(ApiRequest req) {
        long assertionCount = assertionRepository.countByApiRequestId(req.getId());
        return ApiRequestDto.builder()
                .id(req.getId())
                .collectionId(req.getCollection().getId())
                .name(req.getName())
                .description(req.getDescription())
                .method(req.getMethod())
                .url(req.getUrl())
                .queryParams(req.getQueryParams())
                .headers(req.getHeaders())
                .authConfig(req.getAuthConfig())
                .bodyType(req.getBodyType())
                .bodyContent(req.getBodyContent())
                .orderIndex(req.getOrderIndex())
                .assertionCount(assertionCount)
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }
}
