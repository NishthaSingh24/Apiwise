package com.apiwise.ai;

import com.apiwise.ai.dto.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final boolean enabled;
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiService(
            @Value("${apiwise.ai.enabled:false}") boolean enabled,
            @Value("${apiwise.ai.api-key:}") String apiKey,
            @Value("${apiwise.ai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${apiwise.ai.model:gpt-4o-mini}") String model) {
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
    }

    public List<AiAssertionSuggestionDto> generateAssertions(AiGenerateAssertionsRequest request) {
        if (enabled && apiKey != null && !apiKey.isBlank()) {
            try {
                return callLlmForAssertions(request);
            } catch (Exception ex) {
                log.warn("LLM assertion generation failed ({}), falling back to intelligent heuristics", ex.getMessage());
            }
        }
        return generateHeuristicAssertions(request);
    }

    public List<AiNegativeTestScenarioDto> suggestNegativeTests(AiGenerateAssertionsRequest request) {
        List<AiNegativeTestScenarioDto> list = new ArrayList<>();

        list.add(AiNegativeTestScenarioDto.builder()
                .name("Unauthorized Request (Missing Token)")
                .description("Verify that the API rejects requests without Authorization header")
                .modifiedMethod(request.getMethod())
                .modifiedUrl(request.getUrl())
                .modifiedHeaders("[]")
                .modifiedBody(request.getResponseBody())
                .expectedStatus(401)
                .reasoning("APIs must enforce authentication and return 401 Unauthorized when tokens are missing.")
                .build());

        list.add(AiNegativeTestScenarioDto.builder()
                .name("Resource Not Found (Invalid ID)")
                .description("Request a non-existent UUID or identifier in path")
                .modifiedMethod("GET")
                .modifiedUrl(request.getUrl() + "/99999999-9999-9999-9999-999999999999")
                .modifiedHeaders(request.getResponseHeaders())
                .modifiedBody(null)
                .expectedStatus(404)
                .reasoning("Non-existent resource queries should return 404 Not Found rather than 500 error.")
                .build());

        list.add(AiNegativeTestScenarioDto.builder()
                .name("Malformed Payload (Invalid JSON)")
                .description("Send broken JSON to ensure robust error handling")
                .modifiedMethod(request.getMethod().equalsIgnoreCase("GET") ? "POST" : request.getMethod())
                .modifiedUrl(request.getUrl())
                .modifiedHeaders("[{\"key\":\"Content-Type\",\"value\":\"application/json\",\"enabled\":true}]")
                .modifiedBody("{ \"invalid_syntax\": true, ")
                .expectedStatus(400)
                .reasoning("The API parser should intercept unparseable payloads and respond with 400 Bad Request.")
                .build());

        return list;
    }

    public AiExplanationDto explainFailure(AiExplainFailureRequest request) {
        String explanation;
        String rootCause;
        String recommendedFix;

        if (request.getAssertionType() != null && request.getAssertionType().equalsIgnoreCase("STATUS_CODE")) {
            explanation = String.format("The endpoint returned HTTP %d, but the test expected status %s.", request.getStatusCode(), request.getExpected());
            rootCause = request.getStatusCode() == 404
                    ? "The requested resource path does not exist on the target server."
                    : (request.getStatusCode() == 401 || request.getStatusCode() == 403
                    ? "Authentication credentials or permissions were invalid or expired."
                    : (request.getStatusCode() >= 500
                    ? "Internal server error occurred on the remote server."
                    : "Status code mismatch."));
            recommendedFix = "Verify that the target URL, authentication token, and request payload match the API specification.";
        } else if (request.getAssertionType() != null && request.getAssertionType().equalsIgnoreCase("RESPONSE_TIME")) {
            explanation = String.format("Request took %s, exceeding the assertion limit of %s.", request.getActual(), request.getExpected());
            rootCause = "High network latency, backend database slowness, or unoptimized server processing.";
            recommendedFix = "Investigate slow database queries, enable response caching, or increase the assertion threshold for heavy queries.";
        } else {
            explanation = String.format("Assertion '%s' failed. Expected: '%s', Actual: '%s'. Details: %s",
                    request.getAssertionName(), request.getExpected(), request.getActual(),
                    request.getErrorMessage() != null ? request.getErrorMessage() : "Value mismatch");
            rootCause = "The response body structure or property value changed or did not match the expected pattern.";
            recommendedFix = "Inspect the response body JSON to verify if the property name, nesting path, or value format has changed.";
        }

        return AiExplanationDto.builder()
                .explanation(explanation)
                .rootCause(rootCause)
                .recommendedFix(recommendedFix)
                .isAiGenerated(enabled && apiKey != null && !apiKey.isBlank())
                .build();
    }

    private List<AiAssertionSuggestionDto> generateHeuristicAssertions(AiGenerateAssertionsRequest request) {
        List<AiAssertionSuggestionDto> list = new ArrayList<>();

        int status = request.getStatusCode() != null ? request.getStatusCode() : 200;
        list.add(AiAssertionSuggestionDto.builder()
                .name("Status Code is " + status)
                .assertionType("STATUS_CODE")
                .target("")
                .operator("EQUALS")
                .expectedValue(String.valueOf(status))
                .reasoning("Verifies HTTP response code matches the expected " + status + " status.")
                .build());

        list.add(AiAssertionSuggestionDto.builder()
                .name("Response Time < 2000ms")
                .assertionType("RESPONSE_TIME")
                .target("")
                .operator("LESS_THAN")
                .expectedValue("2000")
                .reasoning("Ensures endpoint responds within acceptable performance threshold (< 2 seconds).")
                .build());

        if (request.getResponseBody() != null && !request.getResponseBody().isBlank()) {
            try {
                JsonNode root = objectMapper.readTree(request.getResponseBody());
                if (root.isObject()) {
                    Iterator<Map.Entry<String, JsonNode>> fields = root.fields();
                    int count = 0;
                    while (fields.hasNext() && count < 4) {
                        Map.Entry<String, JsonNode> field = fields.next();
                        String fieldName = field.getKey();
                        JsonNode valNode = field.getValue();

                        list.add(AiAssertionSuggestionDto.builder()
                                .name("Verify '" + fieldName + "' exists in response")
                                .assertionType("JSON_PATH_EXISTS")
                                .target("$." + fieldName)
                                .operator("EXISTS")
                                .expectedValue("")
                                .reasoning("Validates schema contract includes property '" + fieldName + "'.")
                                .build());

                        if (valNode.isValueNode()) {
                            list.add(AiAssertionSuggestionDto.builder()
                                    .name("Verify '" + fieldName + "' value")
                                    .assertionType("JSON_PATH_VALUE")
                                    .target("$." + fieldName)
                                    .operator("EQUALS")
                                    .expectedValue(valNode.asText())
                                    .reasoning("Validates that field '" + fieldName + "' contains the expected value.")
                                    .build());
                        } else if (valNode.isArray()) {
                            list.add(AiAssertionSuggestionDto.builder()
                                    .name("Verify '" + fieldName + "' is an array")
                                    .assertionType("JSON_TYPE")
                                    .target("$." + fieldName)
                                    .operator("IS_TYPE")
                                    .expectedValue("array")
                                    .reasoning("Ensures '" + fieldName + "' is returned as a JSON array.")
                                    .build());
                        }
                        count++;
                    }
                } else if (root.isArray()) {
                    list.add(AiAssertionSuggestionDto.builder()
                            .name("Response is non-empty array")
                            .assertionType("ARRAY_LENGTH")
                            .target("$")
                            .operator("GREATER_THAN")
                            .expectedValue("0")
                            .reasoning("Ensures root response array contains records.")
                            .build());
                }
            } catch (Exception ignored) {}
        }

        return list;
    }

    private List<AiAssertionSuggestionDto> callLlmForAssertions(AiGenerateAssertionsRequest request) {
        try {
            String prompt = String.format("""
                    Analyze this API response and generate 3 to 5 automated assertions in JSON format.
                    Method: %s
                    URL: %s
                    Status Code: %d
                    Response Body:
                    %s
                    
                    Return ONLY a JSON array of objects with keys:
                    [{"name":"...", "assertionType":"STATUS_CODE|RESPONSE_TIME|JSON_PATH_EXISTS|JSON_PATH_VALUE|JSON_TYPE|ARRAY_LENGTH|HEADER", "target":"...", "operator":"EQUALS|LESS_THAN|GREATER_THAN|EXISTS|IS_TYPE", "expectedValue":"...", "reasoning":"..."}]
                    """,
                    request.getMethod(), request.getUrl(), request.getStatusCode() != null ? request.getStatusCode() : 200,
                    request.getResponseBody() != null && request.getResponseBody().length() > 2000 ? request.getResponseBody().substring(0, 2000) : request.getResponseBody());

            Map<String, Object> reqBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", "You are an automated API testing engineer. Return only valid JSON array."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "temperature", 0.2
            );

            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl.replaceAll("/+$", "") + "/chat/completions"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(reqBody)))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String content = root.path("choices").path(0).path("message").path("content").asText();
                if (content.contains("[") && content.contains("]")) {
                    content = content.substring(content.indexOf("["), content.lastIndexOf("]") + 1);
                    List<AiAssertionSuggestionDto> suggestions = objectMapper.readValue(
                            content,
                            objectMapper.getTypeFactory().constructCollectionType(List.class, AiAssertionSuggestionDto.class)
                    );
                    if (!suggestions.isEmpty()) {
                        return suggestions;
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Error calling LLM provider: {}", ex.getMessage());
        }
        return generateHeuristicAssertions(request);
    }
}
