package com.apiwise.assertion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssertionDto {
    private UUID id;
    private UUID apiRequestId;
    private String name;
    private String assertionType;
    private String target;
    private String operator;
    private String expectedValue;
    private boolean enabled;
    private int orderIndex;
    private Instant createdAt;
    private Instant updatedAt;
}
