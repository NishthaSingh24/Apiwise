package com.apiwise.runner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RunCollectionRequest {
    private UUID environmentId;
    @Builder.Default
    private int delayMs = 0;
}
