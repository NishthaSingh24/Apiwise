package com.apiwise.history;

import com.apiwise.assertion.Assertion;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "assertion_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssertionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_run_item_id", nullable = false)
    private TestRunItem testRunItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assertion_id")
    private Assertion assertion;

    @Column(name = "assertion_name", nullable = false)
    private String assertionName;

    @Column(name = "assertion_type", nullable = false, length = 50)
    private String assertionType;

    @Column
    private String target;

    @Column(nullable = false, length = 50)
    private String operator;

    @Column(name = "expected_value", columnDefinition = "TEXT")
    private String expectedValue;

    @Column(name = "actual_value", columnDefinition = "TEXT")
    private String actualValue;

    @Column(nullable = false)
    @Builder.Default
    private boolean passed = false;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
