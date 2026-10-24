package com.apiwise.history.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssertionResultDto {
    private UUID id;
    private UUID assertionId;
    private String assertionName;
    private String assertionType;
    private String target;
    private String operator;
    private String expectedValue;
    private String actualValue;
    private boolean passed;
    private String errorMessage;
}
