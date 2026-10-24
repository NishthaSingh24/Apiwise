# APIWise — Database Specification & Schema

## Entity Relationship Overview

```mermaid
erDiagram
    users ||--o{ workspaces : "owns"
    users ||--o{ workspace_members : "belongs to"
    workspaces ||--o{ workspace_members : "contains"
    workspaces ||--o{ projects : "contains"
    workspaces ||--o{ environments : "contains"
    workspaces ||--o{ test_runs : "records"
    environments ||--o{ environment_variables : "contains"
    projects ||--o{ collections : "organizes"
    collections ||--o{ collections : "parent/folder"
    collections ||--o{ api_requests : "holds"
    api_requests ||--o{ assertions : "validates"
    test_runs ||--o{ test_run_items : "executes"
    test_run_items ||--o{ assertion_results : "evaluates"

    users {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string role
        timestamptz created_at
    }

    workspaces {
        uuid id PK
        string name
        string slug UK
        string description
        uuid owner_id FK
        timestamptz created_at
    }

    api_requests {
        uuid id PK
        uuid collection_id FK
        string name
        string method
        text url
        jsonb query_params
        jsonb headers
        jsonb auth_config
        string body_type
        text body_content
    }

    assertions {
        uuid id PK
        uuid api_request_id FK
        string name
        string assertion_type
        string target
        string operator
        text expected_value
        boolean enabled
    }

    test_runs {
        uuid id PK
        uuid workspace_id FK
        uuid collection_id FK
        string status
        int total_requests
        int passed_requests
        int failed_requests
        int total_assertions
        int passed_assertions
        int failed_assertions
        bigint total_duration_ms
        timestamptz started_at
        timestamptz completed_at
    }
```

## Migration & Tables

1. **`users`**: Stores user authentication credentials and full names. Password hashes generated via BCrypt (strength 10).
2. **`workspaces`**: Multi-tenant workspace partitions.
3. **`workspace_members`**: Membership link with granular roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).
4. **`projects`**: High-level grouping for collections.
5. **`environments`** & **`environment_variables`**: Environment scopes with encrypted secrets (`AES-256-GCM`).
6. **`collections`**: Hierarchical folders for API requests. Supports parent recursion.
7. **`api_requests`**: Saved HTTP request configurations with `jsonb` parameters, headers, and authentication.
8. **`assertions`**: Automated test rules covering 8 assertion types.
9. **`test_runs`**, **`test_run_items`**, **`assertion_results`**: Full persistent execution history and audit telemetry.
