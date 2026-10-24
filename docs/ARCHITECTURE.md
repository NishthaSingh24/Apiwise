# APIWise — Architecture Specification

## Overview

APIWise is a modern developer platform for API testing, automation, and assertions. It is structured as a **Modular Monolith** with clear architectural boundaries.

```
                      ┌──────────────────────────────────────┐
                      │    React + TypeScript + Tailwind     │
                      │         (Vite SPA Frontend)          │
                      └──────────────────┬───────────────────┘
                                         │  HTTPS / REST (/api/v1)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │     Spring Security + JWT Filter     │
                      └──────────────────┬───────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        ▼                                ▼                                ▼
┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
│  Workspace   │                 │ HTTP Engine  │                 │ Test Runner  │
│  & Projects  │                 │  & SSRF Guard│                 │ & Assertions │
└───────┬──────┘                 └───────┬──────┘                 └───────┬──────┘
        │                                │                                │
        ▼                                ▼                                ▼
┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
│   OpenAPI    │                 │   Reports    │                 │ AI Assistant │
│   Importer   │                 │ (PDF & CSV)  │                 │  (LLM/Rules) │
└───────┬──────┘                 └───────┬──────┘                 └───────┬──────┘
        │                                │                                │
        └────────────────────────────────┼────────────────────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │        Spring Data JPA Hibernate     │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │      PostgreSQL 16+ with Flyway      │
                      └──────────────────────────────────────┘
```

## Backend Package Structure

```
com.apiwise
├── config           # WebConfig, CORS, Springdoc OpenAPI documentation
├── security         # UserPrincipal, CustomUserDetailsService, JwtTokenProvider, JwtAuthFilter, WorkspaceSecurity
├── common           # ApiResponse<T>, EncryptionService (AES-256-GCM)
├── exception        # ApiException, GlobalExceptionHandler, ResourceNotFound, SsrfException
├── user             # User, UserRepository, AuthService, AuthController
├── workspace        # Workspace, WorkspaceMember, WorkspaceService, WorkspaceController
├── project          # Project, ProjectRepository, ProjectService, ProjectController
├── collection       # Collection, CollectionRepository, CollectionService, CollectionController
├── request          # ApiRequest, ApiRequestRepository, ApiRequestService, ApiRequestController
├── environment      # Environment, EnvironmentVariable, EnvironmentService, EnvironmentController
├── execution        # HttpExecutionService, SsrfProtectionService, ExecutionController
├── assertion        # Assertion, AssertionEvaluator (8 categories), AssertionService, AssertionController
├── runner           # CollectionRunnerService, RunnerController
├── history          # TestRun, TestRunItem, AssertionResult, HistoryController
├── report           # ReportService (OpenPDF & Commons CSV), ReportController
├── analytics        # AnalyticsService, AnalyticsController
├── openapi          # OpenApiImportService, OpenApiImportController
└── ai               # AiService (LLM + Heuristic rule generator), AiController
```

## Outbound Security & SSRF Protection Flow

1. Request URL is evaluated and variables `{{name}}` are substituted.
2. `SsrfProtectionService.validateUrl(url)`:
   - Validates URI syntax and restricts scheme to `http` or `https`.
   - Performs pre-flight DNS resolution via `InetAddress.getAllByName(host)`.
   - Iterates through all resolved IP addresses.
   - Throws `SsrfException` if any address is loopback, RFC 1918 private, link-local, multicast, or cloud metadata (`169.254.169.254`).
3. Outbound request is executed via `java.net.http.HttpClient` with strict connection and request timeouts.
