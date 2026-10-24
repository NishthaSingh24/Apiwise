package com.apiwise.assertion;

import com.apiwise.assertion.dto.AssertionEvaluationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AssertionEvaluatorTest {

    private AssertionEvaluator evaluator;

    @BeforeEach
    void setUp() {
        evaluator = new AssertionEvaluator();
    }

    @Test
    @DisplayName("Evaluate Status Code assertions")
    void testStatusCodeAssertion() {
        Assertion a1 = Assertion.builder().name("200 OK").assertionType("STATUS_CODE").operator("EQUALS").expectedValue("200").build();
        AssertionEvaluationResult r1 = evaluator.evaluate(a1, 200, 150, Map.of(), "{}");
        assertTrue(r1.isPassed());

        Assertion a2 = Assertion.builder().name("In List 200, 201").assertionType("STATUS_CODE").operator("IN_LIST").expectedValue("200, 201").build();
        AssertionEvaluationResult r2 = evaluator.evaluate(a2, 201, 150, Map.of(), "{}");
        assertTrue(r2.isPassed());

        Assertion a3 = Assertion.builder().name("Fails 400 != 200").assertionType("STATUS_CODE").operator("EQUALS").expectedValue("200").build();
        AssertionEvaluationResult r3 = evaluator.evaluate(a3, 400, 150, Map.of(), "{}");
        assertFalse(r3.isPassed());
    }

    @Test
    @DisplayName("Evaluate Response Time assertions")
    void testResponseTimeAssertion() {
        Assertion a = Assertion.builder().name("Fast").assertionType("RESPONSE_TIME").operator("LESS_THAN").expectedValue("500").build();
        AssertionEvaluationResult passed = evaluator.evaluate(a, 200, 240, Map.of(), "{}");
        assertTrue(passed.isPassed());

        AssertionEvaluationResult failed = evaluator.evaluate(a, 200, 750, Map.of(), "{}");
        assertFalse(failed.isPassed());
    }

    @Test
    @DisplayName("Evaluate JSONPath existence and value assertions")
    void testJsonPathAssertions() {
        String json = """
                {
                  "status": "success",
                  "data": {
                    "id": 42,
                    "name": "APIWise Test",
                    "tags": ["api", "testing"]
                  }
                }
                """;

        // JSON_PATH_EXISTS
        Assertion exists = Assertion.builder().name("Id Exists").assertionType("JSON_PATH_EXISTS").target("$.data.id").operator("EXISTS").build();
        assertTrue(evaluator.evaluate(exists, 200, 100, Map.of(), json).isPassed());

        // JSON_PATH_VALUE
        Assertion valEquals = Assertion.builder().name("Status Success").assertionType("JSON_PATH_VALUE").target("$.status").operator("EQUALS").expectedValue("success").build();
        assertTrue(evaluator.evaluate(valEquals, 200, 100, Map.of(), json).isPassed());

        // JSON_PATH_VALUE Regex
        Assertion regex = Assertion.builder().name("Regex Match").assertionType("JSON_PATH_VALUE").target("$.data.name").operator("MATCHES_REGEX").expectedValue("APIWise.*").build();
        assertTrue(evaluator.evaluate(regex, 200, 100, Map.of(), json).isPassed());
    }

    @Test
    @DisplayName("Evaluate JSON field type assertions")
    void testJsonTypeAssertion() {
        String json = """
                {
                  "name": "APIWise",
                  "count": 100,
                  "active": true,
                  "items": [1, 2, 3]
                }
                """;

        Assertion tStr = Assertion.builder().name("String Type").assertionType("JSON_TYPE").target("$.name").operator("IS_TYPE").expectedValue("string").build();
        assertTrue(evaluator.evaluate(tStr, 200, 100, Map.of(), json).isPassed());

        Assertion tNum = Assertion.builder().name("Number Type").assertionType("JSON_TYPE").target("$.count").operator("IS_TYPE").expectedValue("number").build();
        assertTrue(evaluator.evaluate(tNum, 200, 100, Map.of(), json).isPassed());

        Assertion tBool = Assertion.builder().name("Boolean Type").assertionType("JSON_TYPE").target("$.active").operator("IS_TYPE").expectedValue("boolean").build();
        assertTrue(evaluator.evaluate(tBool, 200, 100, Map.of(), json).isPassed());

        Assertion tArr = Assertion.builder().name("Array Type").assertionType("JSON_TYPE").target("$.items").operator("IS_TYPE").expectedValue("array").build();
        assertTrue(evaluator.evaluate(tArr, 200, 100, Map.of(), json).isPassed());
    }

    @Test
    @DisplayName("Evaluate Array Length assertions")
    void testArrayLengthAssertion() {
        String json = "{\"items\": [\"a\", \"b\", \"c\"]}";

        Assertion a1 = Assertion.builder().name("Len 3").assertionType("ARRAY_LENGTH").target("$.items").operator("EQUALS").expectedValue("3").build();
        assertTrue(evaluator.evaluate(a1, 200, 100, Map.of(), json).isPassed());

        Assertion a2 = Assertion.builder().name("Len > 2").assertionType("ARRAY_LENGTH").target("$.items").operator("GREATER_THAN").expectedValue("2").build();
        assertTrue(evaluator.evaluate(a2, 200, 100, Map.of(), json).isPassed());
    }

    @Test
    @DisplayName("Evaluate Header assertions")
    void testHeaderAssertion() {
        Map<String, List<String>> headers = Map.of(
                "Content-Type", List.of("application/json; charset=utf-8"),
                "X-Api-Version", List.of("1.0")
        );

        Assertion h1 = Assertion.builder().name("Content Type").assertionType("HEADER").target("Content-Type").operator("CONTAINS").expectedValue("application/json").build();
        assertTrue(evaluator.evaluate(h1, 200, 100, headers, "{}").isPassed());

        Assertion h2 = Assertion.builder().name("Header Exists").assertionType("HEADER").target("X-Api-Version").operator("EXISTS").build();
        assertTrue(evaluator.evaluate(h2, 200, 100, headers, "{}").isPassed());
    }

    @Test
    @DisplayName("Evaluate JSON Schema validation assertions")
    void testJsonSchemaAssertion() {
        String schema = """
                {
                  "$schema": "https://json-schema.org/draft/2020-12/schema",
                  "type": "object",
                  "properties": {
                    "id": { "type": "integer" },
                    "title": { "type": "string" }
                  },
                  "required": ["id", "title"]
                }
                """;

        String validJson = "{\"id\": 1, \"title\": \"Buy groceries\"}";
        String invalidJson = "{\"id\": \"not-a-number\", \"title\": 123}";

        Assertion schemaAssertion = Assertion.builder()
                .name("Schema Check")
                .assertionType("JSON_SCHEMA")
                .target("")
                .operator("VALIDATES_SCHEMA")
                .expectedValue(schema)
                .build();

        assertTrue(evaluator.evaluate(schemaAssertion, 200, 100, Map.of(), validJson).isPassed());
        assertFalse(evaluator.evaluate(schemaAssertion, 200, 100, Map.of(), invalidJson).isPassed());
    }
}
