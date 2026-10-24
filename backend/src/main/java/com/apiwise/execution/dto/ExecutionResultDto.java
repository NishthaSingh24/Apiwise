package com.apiwise.execution.dto;

import com.apiwise.assertion.dto.AssertionEvaluationResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResultDto {
    private String method;
    private String executedUrl;
    private int statusCode;
    private String statusText;
    private long durationMs;
    private long sizeBytes;
    private Map<String, List<String>> headers;
    private String body;
    private String contentType;
    private boolean isError;
    private String errorMessage;
    @Builder.Default
    private List<AssertionEvaluationResult> assertionResults = new ArrayList<>();
    private int totalAssertions;
    private int passedAssertions;
    private int failedAssertions;
    private boolean allPassed;
}
