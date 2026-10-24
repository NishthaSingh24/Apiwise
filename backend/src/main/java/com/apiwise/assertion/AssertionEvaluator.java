package com.apiwise.assertion;

import com.apiwise.assertion.dto.AssertionEvaluationResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.Configuration;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.Option;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Pattern;

@Component
public class AssertionEvaluator {

    private static final Logger log = LoggerFactory.getLogger(AssertionEvaluator.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Configuration jsonPathConfig = Configuration.defaultConfiguration()
            .addOptions(Option.DEFAULT_PATH_LEAF_TO_NULL, Option.SUPPRESS_EXCEPTIONS);

    public AssertionEvaluationResult evaluate(
            Assertion assertion,
            int statusCode,
            long responseTimeMs,
            Map<String, List<String>> headers,
            String responseBody) {

        String type = assertion.getAssertionType().toUpperCase();
        String op = assertion.getOperator() != null ? assertion.getOperator().toUpperCase() : "EQUALS";
        String target = assertion.getTarget();
        String expected = assertion.getExpectedValue() != null ? assertion.getExpectedValue().trim() : "";

        boolean passed = false;
        String actual = null;
        String errorMessage = null;

        try {
            switch (type) {
                case "STATUS_CODE" -> {
                    actual = String.valueOf(statusCode);
                    passed = evaluateNumericOrList(statusCode, op, expected);
                    if (!passed) {
                        errorMessage = String.format("Expected status %s %s, but got %d", op, expected, statusCode);
                    }
                }
                case "RESPONSE_TIME" -> {
                    actual = responseTimeMs + " ms";
                    long expectedTime = Long.parseLong(expected.replaceAll("[^0-9]", ""));
                    if (op.equals("LESS_THAN")) {
                        passed = responseTimeMs <= expectedTime;
                    } else if (op.equals("GREATER_THAN")) {
                        passed = responseTimeMs >= expectedTime;
                    } else {
                        passed = responseTimeMs == expectedTime;
                    }
                    if (!passed) {
                        errorMessage = String.format("Expected response time %s %d ms, but took %d ms", op, expectedTime, responseTimeMs);
                    }
                }
                case "HEADER" -> {
                    String headerName = target != null ? target.trim() : "";
                    List<String> values = getHeaderValuesCaseInsensitive(headers, headerName);
                    actual = values.isEmpty() ? null : String.join(", ", values);

                    if (op.equals("EXISTS")) {
                        passed = !values.isEmpty();
                    } else if (op.equals("NOT_EXISTS")) {
                        passed = values.isEmpty();
                    } else if (op.equals("CONTAINS")) {
                        passed = actual != null && actual.toLowerCase().contains(expected.toLowerCase());
                    } else {
                        passed = actual != null && actual.equalsIgnoreCase(expected);
                    }
                    if (!passed) {
                        errorMessage = String.format("Header '%s' assertion failed. Actual: '%s', Expected: '%s'", headerName, actual, expected);
                    }
                }
                case "JSON_PATH_EXISTS" -> {
                    Object val = extractJsonPath(responseBody, target);
                    passed = op.equals("NOT_EXISTS") ? (val == null) : (val != null);
                    actual = val != null ? String.valueOf(val) : "<null/not found>";
                    if (!passed) {
                        errorMessage = String.format("Path '%s' %s check failed", target, op);
                    }
                }
                case "JSON_PATH_VALUE" -> {
                    Object val = extractJsonPath(responseBody, target);
                    actual = val != null ? String.valueOf(val) : "<null>";
                    passed = evaluateStringComparison(actual, op, expected);
                    if (!passed) {
                        errorMessage = String.format("Value at '%s' did not match. Actual: '%s', Expected: %s '%s'", target, actual, op, expected);
                    }
                }
                case "JSON_TYPE" -> {
                    Object val = extractJsonPath(responseBody, target);
                    String actualType = determineJsonType(val);
                    actual = actualType;
                    passed = actualType.equalsIgnoreCase(expected);
                    if (!passed) {
                        errorMessage = String.format("Field '%s' expected type '%s', but was '%s'", target, expected, actualType);
                    }
                }
                case "ARRAY_LENGTH" -> {
                    Object val = extractJsonPath(responseBody, target);
                    if (val instanceof List<?> list) {
                        int len = list.size();
                        actual = String.valueOf(len);
                        int expLen = Integer.parseInt(expected);
                        if (op.equals("GREATER_THAN")) {
                            passed = len > expLen;
                        } else if (op.equals("LESS_THAN")) {
                            passed = len < expLen;
                        } else {
                            passed = len == expLen;
                        }
                    } else {
                        actual = val != null ? "Not an array (" + val.getClass().getSimpleName() + ")" : "<null>";
                        passed = false;
                        errorMessage = "Target is not a valid JSON array: " + target;
                    }
                    if (!passed && errorMessage == null) {
                        errorMessage = String.format("Array length at '%s' was %s, expected %s %s", target, actual, op, expected);
                    }
                }
                case "JSON_SCHEMA" -> {
                    JsonSchemaFactory factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012);
                    JsonSchema schema = factory.getSchema(expected);
                    JsonNode jsonNode = objectMapper.readTree(responseBody);
                    Set<ValidationMessage> errors = schema.validate(jsonNode);
                    if (errors.isEmpty()) {
                        passed = true;
                        actual = "Valid according to schema";
                    } else {
                        passed = false;
                        actual = errors.size() + " schema error(s)";
                        errorMessage = "Schema validation failed: " + errors.iterator().next().getMessage();
                    }
                }
                default -> {
                    passed = false;
                    errorMessage = "Unsupported assertion type: " + type;
                }
            }
        } catch (Exception ex) {
            log.warn("Error evaluating assertion '{}': {}", assertion.getName(), ex.getMessage());
            passed = false;
            errorMessage = "Evaluation error: " + ex.getMessage();
        }

        return AssertionEvaluationResult.builder()
                .assertionId(assertion.getId())
                .assertionName(assertion.getName())
                .assertionType(assertion.getAssertionType())
                .target(target)
                .operator(op)
                .expectedValue(expected)
                .actualValue(actual)
                .passed(passed)
                .errorMessage(errorMessage)
                .build();
    }

    private boolean evaluateNumericOrList(int actual, String op, String expected) {
        if (op.equals("IN_LIST")) {
            String[] parts = expected.split(",");
            for (String p : parts) {
                if (p.trim().equals(String.valueOf(actual))) {
                    return true;
                }
            }
            return false;
        }

        try {
            int exp = Integer.parseInt(expected);
            return switch (op) {
                case "EQUALS" -> actual == exp;
                case "NOT_EQUALS" -> actual != exp;
                case "LESS_THAN" -> actual < exp;
                case "GREATER_THAN" -> actual > exp;
                default -> false;
            };
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private boolean evaluateStringComparison(String actual, String op, String expected) {
        if (actual == null) return false;
        return switch (op) {
            case "EQUALS" -> actual.equals(expected);
            case "NOT_EQUALS" -> !actual.equals(expected);
            case "CONTAINS" -> actual.contains(expected);
            case "NOT_CONTAINS" -> !actual.contains(expected);
            case "MATCHES_REGEX" -> Pattern.compile(expected).matcher(actual).find();
            case "GREATER_THAN" -> {
                try {
                    yield Double.parseDouble(actual) > Double.parseDouble(expected);
                } catch (Exception e) {
                    yield actual.compareTo(expected) > 0;
                }
            }
            case "LESS_THAN" -> {
                try {
                    yield Double.parseDouble(actual) < Double.parseDouble(expected);
                } catch (Exception e) {
                    yield actual.compareTo(expected) < 0;
                }
            }
            default -> false;
        };
    }

    private Object extractJsonPath(String responseBody, String path) {
        if (responseBody == null || responseBody.isBlank() || path == null || path.isBlank()) {
            return null;
        }
        return JsonPath.using(jsonPathConfig).parse(responseBody).read(path);
    }

    private String determineJsonType(Object val) {
        if (val == null) return "null";
        if (val instanceof String) return "string";
        if (val instanceof Number) return "number";
        if (val instanceof Boolean) return "boolean";
        if (val instanceof List) return "array";
        if (val instanceof Map) return "object";
        return val.getClass().getSimpleName().toLowerCase();
    }

    private List<String> getHeaderValuesCaseInsensitive(Map<String, List<String>> headers, String name) {
        if (headers == null || name == null) return Collections.emptyList();
        for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) {
                return entry.getValue();
            }
        }
        return Collections.emptyList();
    }
}
