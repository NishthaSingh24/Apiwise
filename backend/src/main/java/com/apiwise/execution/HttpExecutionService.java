package com.apiwise.execution;

import com.apiwise.assertion.Assertion;
import com.apiwise.assertion.AssertionEvaluator;
import com.apiwise.assertion.AssertionRepository;
import com.apiwise.assertion.dto.AssertionEvaluationResult;
import com.apiwise.environment.EnvironmentService;
import com.apiwise.exception.BadRequestException;
import com.apiwise.exception.ResourceNotFoundException;
import com.apiwise.execution.dto.ExecuteRequestPayload;
import com.apiwise.execution.dto.ExecutionResultDto;
import com.apiwise.request.ApiRequest;
import com.apiwise.request.ApiRequestRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Service
public class HttpExecutionService {

    private static final Logger log = LoggerFactory.getLogger(HttpExecutionService.class);

    private final SsrfProtectionService ssrfProtectionService;
    private final EnvironmentService environmentService;
    private final ApiRequestRepository requestRepository;
    private final AssertionRepository assertionRepository;
    private final AssertionEvaluator assertionEvaluator;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final HttpClient httpClient;
    private final long timeoutMs;
    private final long maxResponseSizeBytes;

    public HttpExecutionService(
            SsrfProtectionService ssrfProtectionService,
            EnvironmentService environmentService,
            ApiRequestRepository requestRepository,
            AssertionRepository assertionRepository,
            AssertionEvaluator assertionEvaluator,
            @Value("${apiwise.security.request-timeout-ms:30000}") long timeoutMs,
            @Value("${apiwise.security.max-response-size-bytes:10485760}") long maxResponseSizeBytes) {
        this.ssrfProtectionService = ssrfProtectionService;
        this.environmentService = environmentService;
        this.requestRepository = requestRepository;
        this.assertionRepository = assertionRepository;
        this.assertionEvaluator = assertionEvaluator;
        this.timeoutMs = timeoutMs;
        this.maxResponseSizeBytes = maxResponseSizeBytes;

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(15000))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    public ExecutionResultDto executeSavedRequest(UUID requestId, UUID environmentId) {
        ApiRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApiRequest", "id", requestId));

        Map<String, String> variables = environmentService.resolveDecryptedVariables(environmentId);
        List<Assertion> assertions = assertionRepository.findByApiRequestIdOrderByOrderIndexAscCreatedAtAsc(requestId);

        return execute(
                req.getMethod(),
                req.getUrl(),
                req.getQueryParams(),
                req.getHeaders(),
                req.getAuthConfig(),
                req.getBodyType(),
                req.getBodyContent(),
                variables,
                assertions
        );
    }

    public ExecutionResultDto executeAdHoc(ExecuteRequestPayload payload) {
        Map<String, String> variables = environmentService.resolveDecryptedVariables(payload.getEnvironmentId());
        return execute(
                payload.getMethod(),
                payload.getUrl(),
                payload.getQueryParams(),
                payload.getHeaders(),
                payload.getAuthConfig(),
                payload.getBodyType(),
                payload.getBodyContent(),
                variables,
                Collections.emptyList()
        );
    }

    public ExecutionResultDto execute(
            String method,
            String rawUrl,
            String queryParamsJson,
            String headersJson,
            String authConfigJson,
            String bodyType,
            String rawBodyContent,
            Map<String, String> variables,
            List<Assertion> assertions) {

        long startTime = System.currentTimeMillis();

        if (rawUrl == null || rawUrl.isBlank()) {
            throw new BadRequestException("Request URL is required");
        }

        // 1. Resolve variable interpolations: {{varName}}
        String resolvedUrl = substituteVariables(rawUrl.trim(), variables);
        String resolvedBody = substituteVariables(rawBodyContent, variables);
        String resolvedHeadersJson = substituteVariables(headersJson, variables);
        String resolvedQueryParamsJson = substituteVariables(queryParamsJson, variables);
        String resolvedAuthConfigJson = substituteVariables(authConfigJson, variables);

        // 2. Parse Query Params and append to URL
        resolvedUrl = appendQueryParams(resolvedUrl, resolvedQueryParamsJson);

        // 3. Strict SSRF Protection Check
        ssrfProtectionService.validateUrl(resolvedUrl);

        try {
            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(resolvedUrl))
                    .timeout(Duration.ofMillis(timeoutMs));

            // 4. Setup Headers and Content-Type
            Map<String, String> headerMap = new LinkedHashMap<>();
            headerMap.put("User-Agent", "APIWise/1.0");

            parseHeaders(resolvedHeadersJson, headerMap);

            // 5. Setup Authentication
            applyAuth(resolvedAuthConfigJson, headerMap, reqBuilder);

            // 6. Setup Body
            String finalMethod = method != null ? method.toUpperCase() : "GET";
            setupBodyAndMethod(reqBuilder, finalMethod, bodyType, resolvedBody, headerMap);

            for (Map.Entry<String, String> entry : headerMap.entrySet()) {
                reqBuilder.header(entry.getKey(), entry.getValue());
            }

            HttpRequest request = reqBuilder.build();

            // 7. Execute HTTP Request
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            long durationMs = System.currentTimeMillis() - startTime;

            String responseBody = response.body();
            if (responseBody == null) {
                responseBody = "";
            }

            long sizeBytes = responseBody.getBytes(StandardCharsets.UTF_8).length;
            if (sizeBytes > maxResponseSizeBytes) {
                responseBody = responseBody.substring(0, (int) maxResponseSizeBytes) + "\n... [TRUNCATED DUE TO SIZE LIMIT]";
            }

            Map<String, List<String>> responseHeaders = response.headers().map();
            String contentType = response.headers().firstValue("Content-Type").orElse("text/plain");

            // 8. Evaluate Assertions
            List<AssertionEvaluationResult> assertionResults = new ArrayList<>();
            int passedCount = 0;
            int failedCount = 0;

            if (assertions != null) {
                for (Assertion a : assertions) {
                    if (a.isEnabled()) {
                        AssertionEvaluationResult res = assertionEvaluator.evaluate(
                                a,
                                response.statusCode(),
                                durationMs,
                                responseHeaders,
                                responseBody
                        );
                        assertionResults.add(res);
                        if (res.isPassed()) {
                            passedCount++;
                        } else {
                            failedCount++;
                        }
                    }
                }
            }

            return ExecutionResultDto.builder()
                    .method(finalMethod)
                    .executedUrl(resolvedUrl)
                    .statusCode(response.statusCode())
                    .statusText(getStatusText(response.statusCode()))
                    .durationMs(durationMs)
                    .sizeBytes(sizeBytes)
                    .headers(responseHeaders)
                    .body(responseBody)
                    .contentType(contentType)
                    .isError(false)
                    .assertionResults(assertionResults)
                    .totalAssertions(assertionResults.size())
                    .passedAssertions(passedCount)
                    .failedAssertions(failedCount)
                    .allPassed(failedCount == 0)
                    .build();

        } catch (Exception ex) {
            long durationMs = System.currentTimeMillis() - startTime;
            log.warn("Execution network/transport error for URL [{}]: {}", resolvedUrl, ex.getMessage());

            return ExecutionResultDto.builder()
                    .method(method != null ? method.toUpperCase() : "GET")
                    .executedUrl(resolvedUrl)
                    .statusCode(0)
                    .statusText("Network / Transport Error")
                    .durationMs(durationMs)
                    .sizeBytes(0)
                    .headers(Collections.emptyMap())
                    .body("")
                    .isError(true)
                    .errorMessage(ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName())
                    .assertionResults(Collections.emptyList())
                    .totalAssertions(0)
                    .passedAssertions(0)
                    .failedAssertions(0)
                    .allPassed(false)
                    .build();
        }
    }

    private String substituteVariables(String input, Map<String, String> variables) {
        if (input == null || variables == null || variables.isEmpty()) {
            return input;
        }
        String result = input;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            if (result.contains(placeholder)) {
                result = result.replace(placeholder, entry.getValue());
            }
        }
        return result;
    }

    private String appendQueryParams(String url, String queryParamsJson) {
        if (queryParamsJson == null || queryParamsJson.isBlank() || queryParamsJson.equals("[]")) {
            return url;
        }

        try {
            List<Map<String, Object>> params = objectMapper.readValue(queryParamsJson, new TypeReference<>() {});
            StringBuilder sb = new StringBuilder(url);
            boolean first = !url.contains("?");

            for (Map<String, Object> p : params) {
                Boolean enabled = (Boolean) p.getOrDefault("enabled", true);
                String key = (String) p.get("key");
                String value = (String) p.getOrDefault("value", "");

                if (Boolean.TRUE.equals(enabled) && key != null && !key.isBlank()) {
                    sb.append(first ? "?" : "&");
                    first = false;
                    sb.append(URLEncoder.encode(key, StandardCharsets.UTF_8));
                    sb.append("=");
                    sb.append(URLEncoder.encode(value, StandardCharsets.UTF_8));
                }
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("Failed to parse query params JSON: {}", e.getMessage());
            return url;
        }
    }

    private void parseHeaders(String headersJson, Map<String, String> headerMap) {
        if (headersJson == null || headersJson.isBlank() || headersJson.equals("[]")) {
            return;
        }

        try {
            List<Map<String, Object>> headers = objectMapper.readValue(headersJson, new TypeReference<>() {});
            for (Map<String, Object> h : headers) {
                Boolean enabled = (Boolean) h.getOrDefault("enabled", true);
                String key = (String) h.get("key");
                String value = (String) h.getOrDefault("value", "");

                if (Boolean.TRUE.equals(enabled) && key != null && !key.isBlank()) {
                    headerMap.put(key.trim(), value != null ? value : "");
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse headers JSON: {}", e.getMessage());
        }
    }

    private void applyAuth(String authConfigJson, Map<String, String> headerMap, HttpRequest.Builder reqBuilder) {
        if (authConfigJson == null || authConfigJson.isBlank() || authConfigJson.equals("{}")) {
            return;
        }

        try {
            Map<String, Object> auth = objectMapper.readValue(authConfigJson, new TypeReference<>() {});
            String type = (String) auth.getOrDefault("type", "NONE");

            switch (type.toUpperCase()) {
                case "BEARER" -> {
                    String token = (String) auth.get("token");
                    if (token != null && !token.isBlank()) {
                        headerMap.put("Authorization", "Bearer " + token.trim());
                    }
                }
                case "BASIC" -> {
                    String user = (String) auth.getOrDefault("username", "");
                    String pass = (String) auth.getOrDefault("password", "");
                    String credentials = user + ":" + pass;
                    String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
                    headerMap.put("Authorization", "Basic " + encoded);
                }
                case "API_KEY" -> {
                    String key = (String) auth.get("key");
                    String value = (String) auth.get("value");
                    String addTo = (String) auth.getOrDefault("addTo", "HEADER");
                    if (key != null && !key.isBlank() && value != null) {
                        if ("HEADER".equalsIgnoreCase(addTo)) {
                            headerMap.put(key.trim(), value);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse authConfig JSON: {}", e.getMessage());
        }
    }

    private void setupBodyAndMethod(
            HttpRequest.Builder reqBuilder,
            String method,
            String bodyType,
            String bodyContent,
            Map<String, String> headerMap) {

        if (List.of("GET", "DELETE", "HEAD", "OPTIONS").contains(method) &&
                (bodyType == null || bodyType.equalsIgnoreCase("NONE") || bodyContent == null || bodyContent.isBlank())) {
            reqBuilder.method(method, HttpRequest.BodyPublishers.noBody());
            return;
        }

        String content = bodyContent != null ? bodyContent : "";
        HttpRequest.BodyPublisher publisher = HttpRequest.BodyPublishers.ofString(content, StandardCharsets.UTF_8);

        if ("JSON".equalsIgnoreCase(bodyType)) {
            headerMap.putIfAbsent("Content-Type", "application/json");
        } else if ("FORM_URLENCODED".equalsIgnoreCase(bodyType)) {
            headerMap.putIfAbsent("Content-Type", "application/x-www-form-urlencoded");
        } else if ("RAW_TEXT".equalsIgnoreCase(bodyType)) {
            headerMap.putIfAbsent("Content-Type", "text/plain");
        }

        reqBuilder.method(method, publisher);
    }

    private String getStatusText(int code) {
        return switch (code) {
            case 200 -> "OK";
            case 201 -> "Created";
            case 202 -> "Accepted";
            case 204 -> "No Content";
            case 400 -> "Bad Request";
            case 401 -> "Unauthorized";
            case 403 -> "Forbidden";
            case 404 -> "Not Found";
            case 405 -> "Method Not Allowed";
            case 409 -> "Conflict";
            case 422 -> "Unprocessable Entity";
            case 429 -> "Too Many Requests";
            case 500 -> "Internal Server Error";
            case 502 -> "Bad Gateway";
            case 503 -> "Service Unavailable";
            case 504 -> "Gateway Timeout";
            default -> code >= 200 && code < 300 ? "Success" : (code >= 400 && code < 500 ? "Client Error" : "Server Error");
        };
    }
}
