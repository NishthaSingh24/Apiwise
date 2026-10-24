package com.apiwise.execution.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecuteRequestPayload {
    private UUID environmentId;
    private String method;
    private String url;
    private String queryParams;
    private String headers;
    private String authConfig;
    private String bodyType;
    private String bodyContent;
}
