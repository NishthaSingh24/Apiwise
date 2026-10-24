package com.apiwise.environment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnvironmentVariableRepository extends JpaRepository<EnvironmentVariable, UUID> {
    List<EnvironmentVariable> findByEnvironmentIdOrderByKeyAsc(UUID environmentId);
    Optional<EnvironmentVariable> findByEnvironmentIdAndKey(UUID environmentId, String key);
    void deleteByEnvironmentId(UUID environmentId);
}
