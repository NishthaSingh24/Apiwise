package com.apiwise.environment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvironmentVariableDto {
    private UUID id;
    private String key;
    private String value;
    private boolean isSecret;
    private boolean enabled;
}
