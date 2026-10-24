# APIWise — REST API Reference Documentation

**Base URL**: `http://localhost:8080/api/v1`  
**Swagger UI Interactive Explorer**: `http://localhost:8080/swagger-ui.html`  
**OpenAPI Spec Endpoint**: `http://localhost:8080/v3/api-docs`

---

## Table of Contents
1. [Authentication (`/api/v1/auth`)](#1-authentication)
2. [Workspaces (`/api/v1/workspaces`)](#2-workspaces)
3. [Projects (`/api/v1/workspaces/{workspaceId}/projects`)](#3-projects)
4. [Collections (`/api/v1/projects/{projectId}/collections`)](#4-collections)
5. [API Requests (`/api/v1/collections/{collectionId}/requests`)](#5-api-requests)
6. [HTTP Execution Engine (`/api/v1/requests`)](#6-http-execution-engine)
7. [Assertions (`/api/v1/requests/{requestId}/assertions`)](#7-assertions)
8. [Collection Runner & History (`/api/v1`)](#8-collection-runner--history)
9. [Reports & Exports (`/api/v1/runs/{runId}/export`)](#9-reports--exports)
10. [Dashboard Analytics (`/api/v1/workspaces/{workspaceId}/analytics`)](#10-dashboard-analytics)
11. [OpenAPI 3.x Import (`/api/v1/workspaces/{workspaceId}/openapi`)](#11-openapi-3x-import)
12. [Environments & Variables (`/api/v1/workspaces/{workspaceId}/environments`)](#12-environments--variables)
13. [AI Assistant (`/api/v1/ai`)](#13-ai-assistant)

---

## Standard Envelope & Error Format

All API responses return a structured JSON envelope:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-10-24T16:20:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "SSRF Protection Blocked Request: Access to host '169.254.169.254' is prohibited",
  "data": null,
  "timestamp": "2026-10-24T16:20:00Z"
}
```

---

## 1. Authentication

### `POST /api/v1/auth/register`
Creates a new user account, hashes password using BCrypt, generates JWT tokens, and automatically initializes a default personal workspace.

- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMi...",
    "refreshToken": "eyJhbGciOiJIUzUxMi...",
    "tokenType": "Bearer",
    "user": {
      "id": "fc011bb6-d152-4323-8d16-6f354b04b29d",
      "email": "jane@example.com",
      "fullName": "Jane Doe",
      "role": "ROLE_USER"
    }
  }
}
```

### `POST /api/v1/auth/login`
Authenticates user credentials and issues fresh access and refresh tokens.

- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response**: `200 OK`

### `POST /api/v1/auth/refresh`
Exchanges a valid refresh token for a new access token.

- **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzUxMi..."
}
```

---

## 2. Workspaces

All endpoints require `Authorization: Bearer <token>`.

### `GET /api/v1/workspaces`
Lists all workspaces where the authenticated user is an owner, admin, or member.

### `POST /api/v1/workspaces`
Creates a new collaborative workspace.

- **Request Body**:
```json
{
  "name": "Fintech Core Team",
  "description": "Workspace for banking and payment microservices"
}
```

### `GET /api/v1/workspaces/{workspaceId}`
Retrieves workspace details and user's role.

### `POST /api/v1/workspaces/{workspaceId}/members`
Adds a team member to the workspace with role `ADMIN` or `MEMBER`.

- **Request Body**:
```json
{
  "email": "engineer@example.com",
  "role": "MEMBER"
}
```

---

## 3. Projects

### `GET /api/v1/workspaces/{workspaceId}/projects`
Lists all projects belonging to the specified workspace.

### `POST /api/v1/workspaces/{workspaceId}/projects`
Creates a new project.

- **Request Body**:
```json
{
  "name": "Payment Gateway API",
  "description": "Payment authorization and settlement endpoints"
}
```

---

## 4. Collections

### `GET /api/v1/projects/{projectId}/collections`
Retrieves tree of collections and nested sub-folders for the project.

### `POST /api/v1/projects/{projectId}/collections`
Creates a collection or sub-folder (if `parentId` is supplied).

- **Request Body**:
```json
{
  "name": "Checkout Flow",
  "description": "Cart to invoice payment tests",
  "parentId": null,
  "orderIndex": 0
}
```

---

## 5. API Requests

### `GET /api/v1/collections/{collectionId}/requests`
Returns all saved HTTP requests within the collection.

### `POST /api/v1/collections/{collectionId}/requests`
Saves a new HTTP request configuration.

- **Request Body**:
```json
{
  "name": "Get User Details",
  "description": "Fetches profile info",
  "method": "GET",
  "url": "{{baseUrl}}/users/42",
  "queryParams": "[{\"key\":\"detailed\",\"value\":\"true\",\"enabled\":true}]",
  "headers": "[{\"key\":\"Accept\",\"value\":\"application/json\",\"enabled\":true}]",
  "authConfig": "{\"type\":\"BEARER\",\"token\":\"{{apiToken}}\"}",
  "bodyType": "NONE",
  "bodyContent": null,
  "orderIndex": 0
}
```

### `PUT /api/v1/requests/{requestId}`
Updates an existing request configuration.

### `POST /api/v1/requests/{requestId}/duplicate`
Duplicates a request including all of its attached assertions.

### `DELETE /api/v1/requests/{requestId}`
Permanently deletes a saved request and cascades to its assertions.

---

## 6. HTTP Execution Engine

### `POST /api/v1/requests/{requestId}/execute`
Executes a saved request against its resolved URL, evaluates assertions, and logs results.

- **Request Body**:
```json
{
  "environmentId": "f9e4ba35-20ef-4d4c-aedd-228bebf622e6"
}
```

### `POST /api/v1/requests/execute-ad-hoc`
Executes an unsaved request drafted in the Request Builder without persisting it. Protected by SSRF filtering and variable resolution.

- **Request Body**:
```json
{
  "method": "POST",
  "url": "https://httpbin.org/post",
  "queryParams": "[]",
  "headers": "[{\"key\":\"Content-Type\",\"value\":\"application/json\",\"enabled\":true}]",
  "authConfig": "{}",
  "bodyType": "JSON",
  "bodyContent": "{\"item\": \"laptop\", \"qty\": 2}",
  "environmentId": null
}
```

- **Response**:
```json
{
  "success": true,
  "data": {
    "method": "POST",
    "executedUrl": "https://httpbin.org/post",
    "statusCode": 200,
    "statusText": "OK",
    "durationMs": 312,
    "sizeBytes": 540,
    "headers": { "content-type": ["application/json"] },
    "body": "{\n  \"data\": \"{\\\"item\\\": \\\"laptop\\\", \\\"qty\\\": 2}\"\n}",
    "assertionResults": [],
    "totalAssertions": 0,
    "passedAssertions": 0,
    "failedAssertions": 0,
    "allPassed": true,
    "error": false
  }
}
```

---

## 7. Assertions

### `GET /api/v1/requests/{requestId}/assertions`
Lists all assertions attached to the request.

### `POST /api/v1/requests/{requestId}/assertions`
Creates a test assertion.

- **Supported Types & Operators**:
  - `STATUS_CODE`: `EQUALS`, `NOT_EQUALS`, `LESS_THAN`, `GREATER_THAN`
  - `RESPONSE_TIME`: `LESS_THAN`, `GREATER_THAN`
  - `JSON_PATH_EXISTS`: `EXISTS`
  - `JSON_PATH_VALUE`: `EQUALS`, `CONTAINS`, `REGEX_MATCH`
  - `JSON_TYPE`: `IS_TYPE` (`string`, `number`, `boolean`, `array`, `object`)
  - `ARRAY_LENGTH`: `EQUALS`, `GREATER_THAN`, `LESS_THAN`
  - `HEADER`: `EXISTS`, `EQUALS`, `CONTAINS`
  - `JSON_SCHEMA`: `VALID` (Draft-07 / Draft-2020 JSON schema validation)

- **Request Body**:
```json
{
  "name": "Verify order ID is returned",
  "assertionType": "JSON_PATH_EXISTS",
  "target": "$.data.orderId",
  "operator": "EXISTS",
  "expectedValue": "",
  "enabled": true
}
```

---

## 8. Collection Runner & History

### `POST /api/v1/collections/{collectionId}/run`
Executes all requests in a collection sequentially with variable interpolation, assertion evaluation, and complete run persistence.

- **Request Body**:
```json
{
  "environmentId": "f9e4ba35-20ef-4d4c-aedd-228bebf622e6",
  "delayMs": 150
}
```

### `GET /api/v1/workspaces/{workspaceId}/runs`
Retrieves test run history for the workspace with pagination.

### `GET /api/v1/runs/{runId}`
Fetches full execution details including per-request telemetry, request/response headers, response bodies, and assertion failure messages.

---

## 9. Reports & Exports

### `GET /api/v1/runs/{runId}/export/pdf`
Generates a styled, downloadable PDF test report containing execution summary cards, assertion pass rates, and itemized results.

- **Response**: `Content-Type: application/pdf` with header `Content-Disposition: attachment; filename="test-run-{runId}.pdf"`

### `GET /api/v1/runs/{runId}/export/csv`
Generates an audit-ready CSV file detailing every executed request and assertion result.

- **Response**: `Content-Type: text/csv` with header `Content-Disposition: attachment; filename="test-run-{runId}.csv"`

---

## 10. Dashboard Analytics

### `GET /api/v1/workspaces/{workspaceId}/analytics`
Calculates real-time aggregation metrics from persisted test runs:
- Total runs executed
- Overall pass rate percentage
- Average response time in milliseconds
- 7-day chronological run volume trend
- Failure category breakdown

---

## 11. OpenAPI 3.x Import

### `POST /api/v1/workspaces/{workspaceId}/openapi/preview`
Parses raw OpenAPI 3.0/3.1 YAML/JSON text or a URL and returns a structured preview of endpoints, HTTP methods, headers, and response codes. Protected by SSRF validation.

- **Request Body**:
```json
{
  "specContent": "openapi: '3.0.0'...",
  "specUrl": null
}
```

### `POST /api/v1/workspaces/{workspaceId}/openapi/import`
Converts selected endpoints from the preview into saved requests in a target project and collection.

- **Request Body**:
```json
{
  "projectId": "50a00ed1-e054-44b6-bdbb-d21a6b9be6f5",
  "collectionName": "Imported Microservice Endpoints",
  "specContent": "openapi: '3.0.0'...",
  "selectedEndpoints": ["GET /pets", "POST /pets"]
}
```

---

## 12. Environments & Variables

### `GET /api/v1/workspaces/{workspaceId}/environments`
Lists environments (`Development`, `Staging`, `Production`).

### `POST /api/v1/environments/{environmentId}/variables`
Adds an environment variable. If `isSecret` is true, the value is encrypted at rest using AES-256-GCM.

- **Request Body**:
```json
{
  "key": "apiToken",
  "value": "sec_live_9948271829102",
  "isSecret": true,
  "enabled": true
}
```

---

## 13. AI Assistant

### `POST /api/v1/ai/generate-assertions`
Generates intelligent draft assertions based on response payload structure and status code. Includes fallback heuristics when LLM is unconfigured.

- **Request Body**:
```json
{
  "method": "GET",
  "url": "https://api.example.com/products",
  "responseBody": "{\"products\": [{\"id\": 1, \"price\": 29.99}]}",
  "statusCode": 200
}
```

### `POST /api/v1/ai/suggest-negative-tests`
Recommends negative test scenarios (unauthorized tokens, missing required fields, malformed payloads, 404 boundaries).

### `POST /api/v1/ai/explain-failure`
Analyzes failed assertions, diagnoses the root cause (e.g., status code mismatch, missing JSON key, type error), and suggests specific corrective action.
