# APIWise — Comprehensive Engineering Rationale & "Explanation of the Whys"

This document provides a thorough explanation of **every technical decision, architectural pattern, security control, and engineering trade-off** made during the design and implementation of **APIWise — Intelligent API Testing and Automation Platform**.

---

## 1. System Architecture: Why a Modular Monolith?

### The Decision
APIWise is engineered as a clean **Modular Monolith** in Spring Boot 3.3.4 (Java 21) rather than a distributed microservices cluster or a single unstructured script.

### The "Whys"
1. **Domain Cohesion & Data Locality**: An API testing platform repeatedly binds API requests, environment variables, assertions, test runs, and analytics. Splitting these into multiple microservices would introduce distributed network latency, distributed transactions (two-phase commits or saga orchestrators), serialization overhead, and network partition risks for operations that are inherently transactional.
2. **Atomic Execution & Persistence**: When a collection of 50 API requests runs, recording the `TestRun`, each `TestRunItem`, and dozens of `AssertionResult` records benefits tremendously from PostgreSQL local transactional integrity.
3. **Operational Simplicity & Deployment**: A modular monolith packages into a single lean container (`backend/Dockerfile`), starts in seconds, and can be deployed on a single node or horizontally scaled behind a load balancer without needing service meshes (Istio), Consul, or distributed tracing infrastructure.
4. **Clean Domain Boundaries**: Packages (`auth`, `workspace`, `project`, `collection`, `request`, `environment`, `execution`, `assertion`, `runner`, `openapi`, `history`, `report`, `analytics`, `ai`) are strictly decoupled through domain service interfaces and DTOs.

---

## 2. Java 21 & Spring Boot 3.3.x: Why This Runtime?

### The "Whys"
1. **Long-Term Support (LTS) & Enterprise Stability**: Java 21 is the current premier LTS version, providing modern language constructs (Records, Pattern Matching, Switch expressions, enhanced HTTP APIs).
2. **Virtual Thread & Concurrency Readiness**: Java 21 lays the foundation for high-concurrency non-blocking collection executions.
3. **Jakarta EE 10 Alignment**: Spring Boot 3.x uses modern `jakarta.*` packages for JPA and validation, eliminating obsolete `javax.*` baggage.
4. **Spring Security 6.x**: Provides method-level security with `@PreAuthorize`, stateless security filter chains, and standardized CORS configurations.

---

## 3. Database & Persistence: Why PostgreSQL, Flyway, and JSONB?

### The "Whys"
1. **PostgreSQL as Primary Store**:
   - Offers world-class ACID compliance, transactional DDL, native UUID support, and sophisticated indexing.
   - High performance for analytical aggregation queries (e.g. computing average response times, pass rates, and failure breakdowns across hundreds of thousands of test items).
2. **Flyway Migration (`V1__init_schema.sql`)**:
   - Ensures that database schema evolution is version-controlled, auditable, and reproducible across every developer workstation, automated CI/CD pipeline, and Docker Compose deployment.
   - Eliminates dangerous Hibernate automatic schema generation (`ddl-auto: update`) in production.
3. **UUIDs for Primary Keys**:
   - Multi-tenant applications that use sequential integers (`1, 2, 3...`) are vulnerable to ID enumeration and scraping attacks. UUIDs ensure globally unique, unguessable identifiers for workspaces, collections, requests, and test runs.
4. **Structured JSONB Columns**:
   - HTTP query parameters, custom headers, and authentication configurations are dynamic key-value structures.
   - Storing them in PostgreSQL `jsonb` columns avoids bloated Entity-Attribute-Value (EAV) tables while still allowing querying and schema validation.
5. **Cascading Deletes (`ON DELETE CASCADE`)**:
   - Deleting a collection or workspace automatically cleans up child requests, assertions, and test runs, ensuring zero orphaned records in the database.

---

## 4. Security Architecture: Why SSRF Defense, AES-256-GCM, and Stateless JWT?

### Why Server-Side Request Forgery (SSRF) Protection?
In any developer tool where users can enter arbitrary URLs or import OpenAPI URLs, the backend makes outbound HTTP requests on behalf of the user. Without protection, an attacker could instruct APIWise to query internal infrastructure:
- Cloud metadata services: `http://169.254.169.254/latest/meta-data` (AWS) or `http://metadata.google.internal` (GCP) to steal IAM credentials.
- Loopback services: `http://localhost:5432`, `http://127.0.0.1:8080/actuator`.
- Private intranet subnets: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.

**Our Implementation (`SsrfProtectionService`)**:
- Validates the URI scheme strictly to `http` or `https`.
- Performs pre-flight DNS resolution using `InetAddress.getAllByName(host)`.
- Validates all resolved IP addresses: rejects loopback, private RFC 1918, link-local, multicast, and cloud metadata addresses.
- Re-validates redirect URLs to prevent open redirect bypasses.

### Why AES-256-GCM Encryption for Environment Variables?
- Many API suites require sensitive API keys, bearer tokens, or database passwords in environment variables.
- Storing these in plaintext in PostgreSQL exposes credentials to any database snapshot, dump, or administrator.
- `EncryptionService` encrypts variables flagged as `isSecret` using AES-256-GCM with a unique 12-byte initialization vector (IV) and 128-bit authentication tag.
- Secrets are masked with `••••••••` in frontend API responses and decrypted strictly in memory at the moment of HTTP request dispatch.

### Why Stateless JWT Authentication?
- Short-lived JSON Web Tokens (JJWT 0.12.6) provide tamper-proof cryptographic signatures with HMAC-SHA256.
- The server does not maintain server-side session state, eliminating memory leaks and session clustering issues.
- Passwords are encrypted with BCrypt (strength 10), preventing rainbow table attacks.

---

## 5. HTTP Execution Engine: Why Java's Native HTTP Client?

### The "Whys"
1. **Zero External Dependency Overhead**: `java.net.http.HttpClient` is built directly into Java 21, avoiding external libraries that require ongoing CVE patching.
2. **Exact Latency Measurement**: Measures round-trip duration with millisecond precision, accurately capturing connection, DNS, TLS handshake, and response body download time.
3. **Separate Error Handling**: Distinguishes between HTTP application errors (e.g., status 400, 500) and transport/network errors (e.g., DNS timeout, connection refused), ensuring accurate test reporting.
4. **Variable Substitution**: Resolves `{{variableName}}` placeholders in URLs, query parameters, headers, authentication configs, and request bodies before dispatching the request.

---

## 6. Automated Test Assertions: Why the 8 Distinct Categories?

APIWise provides 8 distinct assertion categories to eliminate the need for writing custom script code:
1. **`STATUS_CODE`**: Verifies HTTP response codes (`EQUALS`, `NOT_EQUALS`, `LESS_THAN`, `IN_LIST`). Essential for contract verification.
2. **`RESPONSE_TIME`**: Enforces latency SLAs (`LESS_THAN`, `GREATER_THAN` in ms).
3. **`JSON_PATH_EXISTS`**: Uses Jayway JSONPath to verify field presence without caring about the value.
4. **`JSON_PATH_VALUE`**: Compares exact values, substring contains, or regex patterns at specific JSON paths.
5. **`JSON_TYPE`**: Verifies dynamic typing (e.g. confirming that an ID is a `number` or that `items` is an `array`), catching breaking API contract changes.
6. **`ARRAY_LENGTH`**: Verifies pagination or collection size constraints.
7. **`HEADER`**: Checks response headers (e.g. `Content-Type: application/json`, `Cache-Control`).
8. **`JSON_SCHEMA`**: Uses NetworkNT JSON Schema Validator (Draft 2020-12) to validate complex nested JSON responses against formal schemas.

---

## 7. OpenAPI 3.x Import: Why Full Interactive Discovery?

### The "Whys"
- Manual endpoint creation is tedious and error-prone.
- Our `OpenApiImportService` parses JSON/YAML specifications or fetches from secure URLs, extracts all paths, HTTP methods, summaries, parameters, request body schemas, and response definitions.
- Generates sample JSON payloads automatically from schema property types.
- Provides an interactive preview with multi-select checkboxes so users can choose exactly which endpoints to import into their collections.
- Automatically generates a baseline `200 OK` status assertion for every imported endpoint.

---

## 8. AI Assistant: Why a Hybrid Resilient Architecture?

### The "Whys"
1. **Guaranteed Offline Reliability**: Relying solely on an external LLM API means that without credentials or internet access, the platform would crash or fail.
2. **Rule-Based Heuristic Fallback**: If `OPENAI_API_KEY` is not provided, our `AiService` automatically switches to an intelligent local heuristic engine:
   - Analyzes response JSON structures, detects field names, scalar types, array counts, and latency to generate valid assertions.
   - Generates realistic negative test scenarios (missing tokens, malformed payloads, non-existent resource IDs).
   - Generates structured root cause and recommended fixes for failed tests.
3. **Strict Schema Validation**: All AI suggestions are validated against allowed enum types (`STATUS_CODE`, `JSON_PATH_VALUE`, etc.). AI output is **never** executed as arbitrary code, maintaining application security.

---

## 9. Frontend Architecture: Why React, Vite, TypeScript, and Tailwind?

### The "Whys"
1. **Vite**: Provides instant Hot Module Replacement (HMR) and optimized Rollup production bundling (built in < 1 minute).
2. **TypeScript**: Provides compile-time type safety across all domain models, eliminating runtime `undefined` errors.
3. **Tailwind CSS + Custom Theme**: Dark-mode-first developer tool aesthetic inspired by tools like Postman, Insomnia, and Raycast, featuring glassmorphism cards, glowing status badges, and typography tuned for code inspection.
4. **TanStack React Query**: Manages asynchronous server state, automatic caching, and re-validation.
5. **Recharts**: Renders SVG-based interactive trend charts and pie charts for dashboard analytics.

---

## 10. Summary of Architectural Achievements

| Requirement | Implementation Solution | Core Benefit |
| :--- | :--- | :--- |
| **Authentication** | BCrypt + JJWT 0.12.x + Custom UserDetailsService | Stateless, tamper-proof, scalable authentication |
| **Authorization** | WorkspaceRole hierarchy (OWNER > ADMIN > MEMBER > VIEWER) | Granular multi-tenant resource access control |
| **Database Migrations** | Flyway `V1__init_schema.sql` on PostgreSQL | Version-controlled, idempotent schema deployment |
| **Secret Encryption** | AES-256-GCM `EncryptionService` | Zero plaintext secrets in database snapshots |
| **SSRF Defense** | `SsrfProtectionService` pre-flight DNS & IP range filtering | Blocks access to loopback, internal subnets, and cloud metadata |
| **HTTP Engine** | Java 21 `HttpClient` + template substitution | Low overhead, nanosecond timing, accurate payload sizing |
| **Assertions** | 8 categories + Jayway JSONPath + NetworkNT Schema | 100% codeless test automation |
| **Collection Runner** | Sequential runner + database persistence + delay control | Reproducible test suite execution with persistent history |
| **OpenAPI Import** | Swagger Parser v3 + schema mock payload generation | Rapid specification onboarding |
| **Reports** | OpenPDF (PDF tables/badges) + Commons CSV | Formatted compliance exports |
| **Dashboard** | Real aggregated SQL metrics + Recharts | Zero mock data in production |
| **AI Assistant** | Hybrid LLM + intelligent rule heuristic fallback | 100% uptime with zero external dependencies |
