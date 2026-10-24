package com.apiwise.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiExplanationDto {
    private String explanation;
    private String rootCause;
    private String recommendedFix;
    private boolean isAiGenerated;
}
