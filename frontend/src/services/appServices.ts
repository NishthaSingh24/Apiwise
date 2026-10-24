import { api } from './api';
import {
  AuthResponse,
  User,
  Workspace,
  WorkspaceMember,
  Project,
  Collection,
  ApiRequest,
  Environment,
  Assertion,
  ExecutionResult,
  TestRun,
  Analytics,
  OpenApiPreview,
  AiAssertionSuggestion,
  AiNegativeTestScenario,
  AiExplanation,
} from '../types';

export const authService = {
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  register: (data: { fullName: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
};

export const workspaceService = {
  list: () => api.get<Workspace[]>('/workspaces'),
  get: (id: string) => api.get<Workspace>(`/workspaces/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post<Workspace>('/workspaces', data),
  update: (id: string, data: { name: string; description?: string }) =>
    api.put<Workspace>(`/workspaces/${id}`, data),
  delete: (id: string) => api.delete<void>(`/workspaces/${id}`),
  getMembers: (workspaceId: string) =>
    api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
  addMember: (workspaceId: string, email: string, role: string) =>
    api.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, { email, role }),
  removeMember: (workspaceId: string, memberId: string) =>
    api.delete<void>(`/workspaces/${workspaceId}/members/${memberId}`),
};

export const projectService = {
  list: (workspaceId: string) =>
    api.get<Project[]>(`/workspaces/${workspaceId}/projects`),
  create: (workspaceId: string, data: { name: string; description?: string }) =>
    api.post<Project>(`/workspaces/${workspaceId}/projects`, data),
  update: (workspaceId: string, projectId: string, data: { name: string; description?: string }) =>
    api.put<Project>(`/workspaces/${workspaceId}/projects/${projectId}`, data),
  delete: (workspaceId: string, projectId: string) =>
    api.delete<void>(`/workspaces/${workspaceId}/projects/${projectId}`),
};

export const collectionService = {
  list: (projectId: string) =>
    api.get<Collection[]>(`/projects/${projectId}/collections`),
  get: (projectId: string, id: string) =>
    api.get<Collection>(`/projects/${projectId}/collections/${id}`),
  create: (projectId: string, data: { name: string; description?: string; parentId?: string; orderIndex?: number }) =>
    api.post<Collection>(`/projects/${projectId}/collections`, data),
  update: (projectId: string, id: string, data: { name: string; description?: string; parentId?: string; orderIndex?: number }) =>
    api.put<Collection>(`/projects/${projectId}/collections/${id}`, data),
  delete: (projectId: string, id: string) =>
    api.delete<void>(`/projects/${projectId}/collections/${id}`),
};

export const requestService = {
  list: (collectionId: string) =>
    api.get<ApiRequest[]>(`/collections/${collectionId}/requests`),
  get: (id: string) => api.get<ApiRequest>(`/requests/${id}`),
  create: (collectionId: string, data: Partial<ApiRequest>) =>
    api.post<ApiRequest>(`/collections/${collectionId}/requests`, data),
  update: (id: string, data: Partial<ApiRequest>) =>
    api.put<ApiRequest>(`/requests/${id}`, data),
  duplicate: (id: string) =>
    api.post<ApiRequest>(`/requests/${id}/duplicate`),
  delete: (id: string) => api.delete<void>(`/requests/${id}`),
  executeSaved: (id: string, environmentId?: string) =>
    api.post<ExecutionResult>(`/requests/${id}/execute${environmentId ? `?environmentId=${environmentId}` : ''}`),
  executeAdHoc: (data: any) =>
    api.post<ExecutionResult>('/requests/execute-ad-hoc', data),
};

export const environmentService = {
  list: (workspaceId: string) =>
    api.get<Environment[]>(`/workspaces/${workspaceId}/environments`),
  get: (workspaceId: string, id: string) =>
    api.get<Environment>(`/workspaces/${workspaceId}/environments/${id}`),
  create: (workspaceId: string, data: { name: string; isDefault: boolean; variables: any[] }) =>
    api.post<Environment>(`/workspaces/${workspaceId}/environments`, data),
  update: (workspaceId: string, id: string, data: { name: string; isDefault: boolean; variables: any[] }) =>
    api.put<Environment>(`/workspaces/${workspaceId}/environments/${id}`, data),
  delete: (workspaceId: string, id: string) =>
    api.delete<void>(`/workspaces/${workspaceId}/environments/${id}`),
};

export const assertionService = {
  list: (requestId: string) =>
    api.get<Assertion[]>(`/requests/${requestId}/assertions`),
  create: (requestId: string, data: Partial<Assertion>) =>
    api.post<Assertion>(`/requests/${requestId}/assertions`, data),
  update: (requestId: string, id: string, data: Partial<Assertion>) =>
    api.put<Assertion>(`/requests/${requestId}/assertions/${id}`, data),
  delete: (requestId: string, id: string) =>
    api.delete<void>(`/requests/${requestId}/assertions/${id}`),
};

export const runnerService = {
  runCollection: (collectionId: string, data?: { environmentId?: string; delayMs?: number }) =>
    api.post<TestRun>(`/collections/${collectionId}/run`, data || {}),
};

export const historyService = {
  listRuns: (workspaceId: string) =>
    api.get<TestRun[]>(`/workspaces/${workspaceId}/runs`),
  getRunDetails: (runId: string) =>
    api.get<TestRun>(`/runs/${runId}`),
  exportPdf: (runId: string) =>
    api.downloadBlob(`/runs/${runId}/export/pdf`),
  exportCsv: (runId: string) =>
    api.downloadBlob(`/runs/${runId}/export/csv`),
};

export const analyticsService = {
  getAnalytics: (workspaceId: string) =>
    api.get<Analytics>(`/workspaces/${workspaceId}/analytics`),
};

export const openApiService = {
  preview: (workspaceId: string, data: { specContent?: string; specUrl?: string }) =>
    api.post<OpenApiPreview>(`/workspaces/${workspaceId}/openapi/preview`, data),
  importEndpoints: (workspaceId: string, data: any) =>
    api.post<Collection>(`/workspaces/${workspaceId}/openapi/import`, data),
};

export const aiService = {
  generateAssertions: (data: { method: string; url: string; statusCode: number; responseHeaders?: string; responseBody?: string }) =>
    api.post<AiAssertionSuggestion[]>('/ai/generate-assertions', data),
  suggestNegativeTests: (data: { method: string; url: string; statusCode?: number; responseHeaders?: string; responseBody?: string }) =>
    api.post<AiNegativeTestScenario[]>('/ai/suggest-negative-tests', data),
  explainFailure: (data: { requestName: string; method: string; url: string; statusCode: number; responseBody?: string; assertionName: string; assertionType?: string; target?: string; expected: string; actual: string; errorMessage?: string }) =>
    api.post<AiExplanation>('/ai/explain-failure', data),
};
