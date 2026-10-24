export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  ownerName: string;
  userRole: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: WorkspaceRole;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  collectionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  description: string;
  orderIndex: number;
  requestCount: number;
  children: Collection[];
  createdAt: string;
  updatedAt: string;
}

export interface QueryParam {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface RequestHeader {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface AuthConfig {
  type: 'NONE' | 'BEARER' | 'BASIC' | 'API_KEY';
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  value?: string;
  addTo?: 'HEADER' | 'QUERY';
}

export interface ApiRequest {
  id: string;
  collectionId: string;
  name: string;
  description?: string;
  method: string;
  url: string;
  queryParams: string; // JSON string of QueryParam[]
  headers: string; // JSON string of RequestHeader[]
  authConfig: string; // JSON string of AuthConfig
  bodyType: 'NONE' | 'JSON' | 'FORM_URLENCODED' | 'RAW_TEXT';
  bodyContent?: string;
  orderIndex: number;
  assertionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentVariable {
  id?: string;
  key: string;
  value: string;
  isSecret: boolean;
  enabled: boolean;
}

export interface Environment {
  id: string;
  workspaceId: string;
  name: string;
  isDefault: boolean;
  variables: EnvironmentVariable[];
  createdAt: string;
  updatedAt: string;
}

export type AssertionType =
  | 'STATUS_CODE'
  | 'RESPONSE_TIME'
  | 'JSON_PATH_EXISTS'
  | 'JSON_PATH_VALUE'
  | 'JSON_TYPE'
  | 'ARRAY_LENGTH'
  | 'HEADER'
  | 'JSON_SCHEMA';

export type AssertionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'MATCHES_REGEX'
  | 'EXISTS'
  | 'NOT_EXISTS'
  | 'IS_TYPE'
  | 'IN_LIST'
  | 'VALIDATES_SCHEMA';

export interface Assertion {
  id: string;
  apiRequestId: string;
  name: string;
  assertionType: AssertionType;
  target?: string;
  operator: AssertionOperator;
  expectedValue?: string;
  enabled: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssertionEvaluationResult {
  assertionId?: string;
  assertionName: string;
  assertionType: string;
  target?: string;
  operator: string;
  expectedValue?: string;
  actualValue?: string;
  passed: boolean;
  errorMessage?: string;
}

export interface ExecutionResult {
  method: string;
  executedUrl: string;
  statusCode: number;
  statusText: string;
  durationMs: number;
  sizeBytes: number;
  headers: Record<string, string[]>;
  body: string;
  contentType: string;
  isError: boolean;
  errorMessage?: string;
  assertionResults: AssertionEvaluationResult[];
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  allPassed: boolean;
}

export interface TestRunItem {
  id: string;
  apiRequestId?: string;
  requestName: string;
  method: string;
  executedUrl: string;
  statusCode?: number;
  responseTimeMs?: number;
  responseSizeBytes?: number;
  requestHeaders?: string;
  responseHeaders?: string;
  responseBody?: string;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  errorMessage?: string;
  assertionResults: AssertionEvaluationResult[];
  executedAt: string;
}

export interface TestRun {
  id: string;
  workspaceId: string;
  projectId?: string;
  projectName?: string;
  collectionId?: string;
  collectionName?: string;
  environmentId?: string;
  environmentName?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalRequests: number;
  passedRequests: number;
  failedRequests: number;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  totalDurationMs: number;
  triggeredByName: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  items: TestRunItem[];
}

export interface RunTrendPoint {
  date: string;
  runsCount: number;
  passedCount: number;
  failedCount: number;
}

export interface Analytics {
  totalRuns: number;
  successfulRuns: number;
  totalRequestsExecuted: number;
  totalAssertions: number;
  passedAssertions: number;
  overallPassRate: number;
  averageResponseTimeMs: number;
  recentTrend: RunTrendPoint[];
  failureBreakdown: Record<string, number>;
}

export interface OpenApiEndpoint {
  id: string;
  method: string;
  path: string;
  summary?: string;
  description?: string;
  tags: string[];
  queryParams: string;
  headers: string;
  bodyType: string;
  exampleBody?: string;
  responseCodes: string[];
}

export interface OpenApiPreview {
  title?: string;
  version?: string;
  description?: string;
  servers: string[];
  endpoints: OpenApiEndpoint[];
}

export interface AiAssertionSuggestion {
  name: string;
  assertionType: AssertionType;
  target?: string;
  operator: AssertionOperator;
  expectedValue?: string;
  reasoning?: string;
}

export interface AiNegativeTestScenario {
  name: string;
  description: string;
  modifiedMethod: string;
  modifiedUrl: string;
  modifiedHeaders: string;
  modifiedBody?: string;
  expectedStatus: number;
  reasoning: string;
}

export interface AiExplanation {
  explanation: string;
  rootCause: string;
  recommendedFix: string;
  isAiGenerated: boolean;
}
