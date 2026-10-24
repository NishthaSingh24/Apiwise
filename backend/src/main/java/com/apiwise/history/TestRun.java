package com.apiwise.history;

import com.apiwise.collection.Collection;
import com.apiwise.environment.Environment;
import com.apiwise.project.Project;
import com.apiwise.user.User;
import com.apiwise.workspace.Workspace;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "test_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collection_id")
    private Collection collection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "environment_id")
    private Environment environment;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "total_requests", nullable = false)
    @Builder.Default
    private int totalRequests = 0;

    @Column(name = "passed_requests", nullable = false)
    @Builder.Default
    private int passedRequests = 0;

    @Column(name = "failed_requests", nullable = false)
    @Builder.Default
    private int failedRequests = 0;

    @Column(name = "total_assertions", nullable = false)
    @Builder.Default
    private int totalAssertions = 0;

    @Column(name = "passed_assertions", nullable = false)
    @Builder.Default
    private int passedAssertions = 0;

    @Column(name = "failed_assertions", nullable = false)
    @Builder.Default
    private int failedAssertions = 0;

    @Column(name = "total_duration_ms", nullable = false)
    @Builder.Default
    private long totalDurationMs = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by")
    private User triggeredBy;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "testRun", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TestRunItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
