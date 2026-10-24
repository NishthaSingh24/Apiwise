package com.apiwise.ai;

import com.apiwise.ai.dto.*;
import com.apiwise.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI Assistant", description = "AI-assisted test generation, negative tests, and test failure explanations")
public class AiController {

    private final AiService aiService;

    @PostMapping("/generate-assertions")
    @Operation(summary = "Generate draft assertions from API request and response")
    public ResponseEntity<ApiResponse<List<AiAssertionSuggestionDto>>> generateAssertions(
            @RequestBody AiGenerateAssertionsRequest request) {
        List<AiAssertionSuggestionDto> suggestions = aiService.generateAssertions(request);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }

    @PostMapping("/suggest-negative-tests")
    @Operation(summary = "Generate negative testing scenarios for boundary and error testing")
    public ResponseEntity<ApiResponse<List<AiNegativeTestScenarioDto>>> suggestNegativeTests(
            @RequestBody AiGenerateAssertionsRequest request) {
        List<AiNegativeTestScenarioDto> suggestions = aiService.suggestNegativeTests(request);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }

    @PostMapping("/explain-failure")
    @Operation(summary = "Explain assertion failure and recommend fixes")
    public ResponseEntity<ApiResponse<AiExplanationDto>> explainFailure(
            @RequestBody AiExplainFailureRequest request) {
        AiExplanationDto explanation = aiService.explainFailure(request);
        return ResponseEntity.ok(ApiResponse.success(explanation));
    }
}
