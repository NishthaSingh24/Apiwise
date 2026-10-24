package com.apiwise.history.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestRunItemDto {
    private UUID id;
    private UUID apiRequestId;
    private String requestName;
    private String method;
    private String executedUrl;
    private Integer statusCode;
    private Long responseTimeMs;
    private Long responseSizeBytes;
    private String requestHeaders;
    private String responseHeaders;
    private String responseBody;
    private String status;
    private String errorMessage;
    @Builder.Default
    private List<AssertionResultDto> assertionResults = new ArrayList<>();
    private Instant executedAt;
}
