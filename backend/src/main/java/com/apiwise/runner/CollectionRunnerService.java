package com.apiwise.runner;

import com.apiwise.assertion.Assertion;
import com.apiwise.assertion.AssertionRepository;
import com.apiwise.assertion.dto.AssertionEvaluationResult;
import com.apiwise.collection.Collection;
import com.apiwise.collection.CollectionRepository;
import com.apiwise.environment.Environment;
import com.apiwise.environment.EnvironmentRepository;
import com.apiwise.environment.EnvironmentService;
import com.apiwise.exception.BadRequestException;
import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.execution.HttpExecutionService;
import com.apiwise.execution.dto.ExecutionResultDto;
import com.apiwise.history.*;
import com.apiwise.history.dto.AssertionResultDto;
import com.apiwise.history.dto.TestRunDto;
import com.apiwise.history.dto.TestRunItemDto;
import com.apiwise.request.ApiRequest;
import com.apiwise.request.ApiRequestRepository;
import com.apiwise.runner.dto.RunCollectionRequest;
import com.apiwise.user.User;
import com.apiwise.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionRunnerService {

    private static final Logger log = LoggerFactory.getLogger(CollectionRunnerService.class);

    private final CollectionRepository collectionRepository;
    private final ApiRequestRepository requestRepository;
    private final AssertionRepository assertionRepository;
    private final EnvironmentRepository environmentRepository;
    private final EnvironmentService environmentService;
    private final UserRepository userRepository;
    private final TestRunRepository testRunRepository;
    private final TestRunItemRepository testRunItemRepository;
    private final AssertionResultRepository assertionResultRepository;
    private final HttpExecutionService httpExecutionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public TestRunDto runCollection(UUID collectionId, RunCollectionRequest runRequest, UUID userId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", "id", collectionId));

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        Environment environment = null;
        UUID envId = runRequest != null ? runRequest.getEnvironmentId() : null;
        if (envId != null) {
            environment = environmentRepository.findById(envId).orElse(null);
        } else {
            environment = environmentRepository.findByWorkspaceIdAndIsDefaultTrue(collection.getProject().getWorkspace().getId()).orElse(null);
        }

        // Collect all requests in collection and its sub-collections
        List<ApiRequest> requestsToRun = collectAllRequests(collection);
        if (requestsToRun.isEmpty()) {
            throw new BadRequestException("Collection has no requests to execute");
        }

        long overallStartTime = System.currentTimeMillis();

        TestRun testRun = TestRun.builder()
                .workspace(collection.getProject().getWorkspace())
                .project(collection.getProject())
                .collection(collection)
                .environment(environment)
                .status("RUNNING")
                .totalRequests(requestsToRun.size())
                .passedRequests(0)
                .failedRequests(0)
                .totalAssertions(0)
                .passedAssertions(0)
                .failedAssertions(0)
                .triggeredBy(user)
                .startedAt(Instant.now())
                .build();
        testRun = testRunRepository.save(testRun);

        Map<String, String> resolvedVariables = environmentService.resolveDecryptedVariables(environment != null ? environment.getId() : null);

        int totalRequests = requestsToRun.size();
        int passedRequests = 0;
        int failedRequests = 0;
        int totalAssertions = 0;
        int passedAssertions = 0;
        int failedAssertions = 0;

        List<TestRunItemDto> itemDtos = new ArrayList<>();

        for (ApiRequest req : requestsToRun) {
            List<Assertion> assertions = assertionRepository.findByApiRequestIdOrderByOrderIndexAscCreatedAtAsc(req.getId());

            ExecutionResultDto execResult = httpExecutionService.execute(
                    req.getMethod(),
                    req.getUrl(),
                    req.getQueryParams(),
                    req.getHeaders(),
                    req.getAuthConfig(),
                    req.getBodyType(),
                    req.getBodyContent(),
                    resolvedVariables,
                    assertions
            );

            boolean itemPassed = !execResult.isError() && execResult.isAllPassed();
            if (itemPassed) {
                passedRequests++;
            } else {
                failedRequests++;
            }

            totalAssertions += execResult.getTotalAssertions();
            passedAssertions += execResult.getPassedAssertions();
            failedAssertions += execResult.getFailedAssertions();

            String responseHeadersJson = "{}";
            try {
                responseHeadersJson = objectMapper.writeValueAsString(execResult.getHeaders());
            } catch (Exception ignored) {}

            TestRunItem runItem = TestRunItem.builder()
                    .testRun(testRun)
                    .apiRequest(req)
                    .requestName(req.getName())
                    .method(execResult.getMethod())
                    .executedUrl(execResult.getExecutedUrl())
                    .statusCode(execResult.getStatusCode())
                    .responseTimeMs(execResult.getDurationMs())
                    .responseSizeBytes(execResult.getSizeBytes())
                    .requestHeaders(req.getHeaders())
                    .responseHeaders(responseHeadersJson)
                    .responseBody(execResult.getBody())
                    .status(itemPassed ? "PASSED" : (execResult.isError() ? "ERROR" : "FAILED"))
                    .errorMessage(execResult.getErrorMessage())
                    .build();
            runItem = testRunItemRepository.save(runItem);

            List<AssertionResultDto> assertionDtos = new ArrayList<>();
            for (AssertionEvaluationResult ar : execResult.getAssertionResults()) {
                Assertion assertionEntity = null;
                if (ar.getAssertionId() != null) {
                    assertionEntity = assertionRepository.findById(ar.getAssertionId()).orElse(null);
                }

                AssertionResult assertionResult = AssertionResult.builder()
                        .testRunItem(runItem)
                        .assertion(assertionEntity)
                        .assertionName(ar.getAssertionName())
                        .assertionType(ar.getAssertionType())
                        .target(ar.getTarget())
                        .operator(ar.getOperator())
                        .expectedValue(ar.getExpectedValue())
                        .actualValue(ar.getActualValue())
                        .passed(ar.isPassed())
                        .errorMessage(ar.getErrorMessage())
                        .build();
                assertionResult = assertionResultRepository.save(assertionResult);

                assertionDtos.add(AssertionResultDto.builder()
                        .id(assertionResult.getId())
                        .assertionId(ar.getAssertionId())
                        .assertionName(ar.getAssertionName())
                        .assertionType(ar.getAssertionType())
                        .target(ar.getTarget())
                        .operator(ar.getOperator())
                        .expectedValue(ar.getExpectedValue())
                        .actualValue(ar.getActualValue())
                        .passed(ar.isPassed())
                        .errorMessage(ar.getErrorMessage())
                        .build());
            }

            itemDtos.add(TestRunItemDto.builder()
                    .id(runItem.getId())
                    .apiRequestId(req.getId())
                    .requestName(runItem.getRequestName())
                    .method(runItem.getMethod())
                    .executedUrl(runItem.getExecutedUrl())
                    .statusCode(runItem.getStatusCode())
                    .responseTimeMs(runItem.getResponseTimeMs())
                    .responseSizeBytes(runItem.getResponseSizeBytes())
                    .requestHeaders(runItem.getRequestHeaders())
                    .responseHeaders(runItem.getResponseHeaders())
                    .responseBody(runItem.getResponseBody())
                    .status(runItem.getStatus())
                    .errorMessage(runItem.getErrorMessage())
                    .assertionResults(assertionDtos)
                    .executedAt(runItem.getExecutedAt())
                    .build());

            if (runRequest != null && runRequest.getDelayMs() > 0) {
                try {
                    Thread.sleep(runRequest.getDelayMs());
                } catch (InterruptedException ignored) {}
            }
        }

        long totalDurationMs = System.currentTimeMillis() - overallStartTime;

        testRun.setStatus(failedRequests == 0 ? "COMPLETED" : "FAILED");
        testRun.setPassedRequests(passedRequests);
        testRun.setFailedRequests(failedRequests);
        testRun.setTotalAssertions(totalAssertions);
        testRun.setPassedAssertions(passedAssertions);
        testRun.setFailedAssertions(failedAssertions);
        testRun.setTotalDurationMs(totalDurationMs);
        testRun.setCompletedAt(Instant.now());
        testRun = testRunRepository.save(testRun);

        return toDto(testRun, itemDtos);
    }

    private List<ApiRequest> collectAllRequests(Collection collection) {
        List<ApiRequest> list = new ArrayList<>(requestRepository.findByCollectionIdOrderByOrderIndexAscCreatedAtAsc(collection.getId()));
        List<Collection> subCollections = collectionRepository.findByParentIdOrderByOrderIndexAscCreatedAtAsc(collection.getId());
        for (Collection sub : subCollections) {
            list.addAll(collectAllRequests(sub));
        }
        return list;
    }

    private TestRunDto toDto(TestRun tr, List<TestRunItemDto> items) {
        return TestRunDto.builder()
                .id(tr.getId())
                .workspaceId(tr.getWorkspace().getId())
                .projectId(tr.getProject() != null ? tr.getProject().getId() : null)
                .projectName(tr.getProject() != null ? tr.getProject().getName() : null)
                .collectionId(tr.getCollection() != null ? tr.getCollection().getId() : null)
                .collectionName(tr.getCollection() != null ? tr.getCollection().getName() : null)
                .environmentId(tr.getEnvironment() != null ? tr.getEnvironment().getId() : null)
                .environmentName(tr.getEnvironment() != null ? tr.getEnvironment().getName() : null)
                .status(tr.getStatus())
                .totalRequests(tr.getTotalRequests())
                .passedRequests(tr.getPassedRequests())
                .failedRequests(tr.getFailedRequests())
                .totalAssertions(tr.getTotalAssertions())
                .passedAssertions(tr.getPassedAssertions())
                .failedAssertions(tr.getFailedAssertions())
                .totalDurationMs(tr.getTotalDurationMs())
                .triggeredByName(tr.getTriggeredBy() != null ? tr.getTriggeredBy().getFullName() : "Anonymous")
                .startedAt(tr.getStartedAt())
                .completedAt(tr.getCompletedAt())
                .createdAt(tr.getCreatedAt())
                .items(items)
                .build();
    }
}
