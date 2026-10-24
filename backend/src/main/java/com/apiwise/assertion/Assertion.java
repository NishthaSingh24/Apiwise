package com.apiwise.assertion;

import com.apiwise.request.ApiRequest;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assertions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assertion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_request_id", nullable = false)
    private ApiRequest apiRequest;

    @Column(nullable = false)
    private String name;

    @Column(name = "assertion_type", nullable = false, length = 50)
    private String assertionType;

    @Column
    private String target;

    @Column(nullable = false, length = 50)
    private String operator;

    @Column(name = "expected_value", columnDefinition = "TEXT")
    private String expectedValue;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private int orderIndex = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
