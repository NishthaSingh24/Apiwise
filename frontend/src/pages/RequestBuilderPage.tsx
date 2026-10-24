import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestService, projectService, collectionService } from '../services/appServices';
import {
  QueryParam,
  RequestHeader,
  AuthConfig,
  ExecutionResult,
  Project,
  Collection,
  ApiRequest,
} from '../types';
import {
  Send,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  Clock,
  HardDrive,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code2,
  ShieldAlert,
  Play,
  Share2,
} from 'lucide-react';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const RequestBuilderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestIdParam = searchParams.get('requestId');
  const navigate = useNavigate();
  const { activeWorkspace, activeEnvironment } = useAuth();

  // Request State
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://httpbin.org/get');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'auth' | 'body'>('params');

  // Query Params & Headers
  const [queryParams, setQueryParams] = useState<QueryParam[]>([
    { key: '', value: '', description: '', enabled: true },
  ]);
  const [headers, setHeaders] = useState<RequestHeader[]>([
    { key: 'Accept', value: 'application/json', description: '', enabled: true },
    { key: '', value: '', description: '', enabled: true },
  ]);

  // Auth Config
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    type: 'NONE',
    token: '',
    username: '',
    password: '',
    key: '',
    value: '',
    addTo: 'HEADER',
  });

  // Body
  const [bodyType, setBodyType] = useState<'NONE' | 'JSON' | 'FORM_URLENCODED' | 'RAW_TEXT'>('NONE');
  const [bodyContent, setBodyContent] = useState('{\n  "name": "APIWise Test",\n  "active": true\n}');

  // Execution & Response State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'assertions'>('body');
  const [isRawResponse, setIsRawResponse] = useState(false);
  const [copied, setCopied] = useState(false);

  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [requestName, setRequestName] = useState('New API Request');
  const [requestDesc, setRequestDesc] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadedRequest, setLoadedRequest] = useState<ApiRequest | null>(null);

  // Load existing request if requested
  useEffect(() => {
    if (!requestIdParam) return;

    const loadReq = async () => {
      try {
        const req = await requestService.get(requestIdParam);
        setLoadedRequest(req);
        setRequestName(req.name);
        setRequestDesc(req.description || '');
        setMethod(req.method);
        setUrl(req.url);
        setBodyType(req.bodyType);
        setBodyContent(req.bodyContent || '');

        try {
          const parsedParams = JSON.parse(req.queryParams);
          if (Array.isArray(parsedParams) && parsedParams.length > 0) {
            setQueryParams([...parsedParams, { key: '', value: '', description: '', enabled: true }]);
          }
        } catch {}

        try {
          const parsedHeaders = JSON.parse(req.headers);
          if (Array.isArray(parsedHeaders) && parsedHeaders.length > 0) {
            setHeaders([...parsedHeaders, { key: '', value: '', description: '', enabled: true }]);
          }
        } catch {}

        try {
          const parsedAuth = JSON.parse(req.authConfig);
          if (parsedAuth && parsedAuth.type) {
            setAuthConfig(parsedAuth);
          }
        } catch {}
      } catch (err: any) {
        console.error('Failed to load request:', err);
      }
    };
    loadReq();
  }, [requestIdParam]);

  // Load projects when opening save modal
  useEffect(() => {
    if (!activeWorkspace || !showSaveModal) return;
    const fetchProjects = async () => {
      try {
        const projs = await projectService.list(activeWorkspace.id);
        setProjects(projs);
        if (projs.length > 0) {
          setSelectedProjectId(projs[0].id);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    fetchProjects();
  }, [activeWorkspace?.id, showSaveModal]);

  // Load collections when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchCols = async () => {
      try {
        const cols = await collectionService.list(selectedProjectId);
        setCollections(cols);
        if (cols.length > 0) {
          setSelectedCollectionId(cols[0].id);
        }
      } catch (err) {
        console.error('Failed to load collections:', err);
      }
    };
    fetchCols();
  }, [selectedProjectId]);

  const handleSend = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    const cleanParams = queryParams.filter((p) => p.key.trim() !== '');
    const cleanHeaders = headers.filter((h) => h.key.trim() !== '');

    try {
      let res: ExecutionResult;
      if (loadedRequest && loadedRequest.id === requestIdParam) {
        // Update first then execute
        await requestService.update(loadedRequest.id, {
          name: requestName,
          method,
          url,
          queryParams: JSON.stringify(cleanParams),
          headers: JSON.stringify(cleanHeaders),
          authConfig: JSON.stringify(authConfig),
          bodyType,
          bodyContent,
        });
        res = await requestService.executeSaved(loadedRequest.id, activeEnvironment?.id);
      } else {
        // Execute Ad-hoc
        res = await requestService.executeAdHoc({
          environmentId: activeEnvironment?.id,
          method,
          url,
          queryParams: JSON.stringify(cleanParams),
          headers: JSON.stringify(cleanHeaders),
          authConfig: JSON.stringify(authConfig),
          bodyType,
          bodyContent,
        });
      }
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({
        method,
        executedUrl: url,
        statusCode: 0,
        statusText: 'Client / Network Error',
        durationMs: 0,
        sizeBytes: 0,
        headers: {},
        body: '',
        contentType: 'text/plain',
        isError: true,
        errorMessage: err.message || 'Execution failed',
        assertionResults: [],
        totalAssertions: 0,
        passedAssertions: 0,
        failedAssertions: 0,
        allPassed: false,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollectionId) {
      alert('Please create or select a collection first');
      return;
    }

    const cleanParams = queryParams.filter((p) => p.key.trim() !== '');
    const cleanHeaders = headers.filter((h) => h.key.trim() !== '');

    setIsSaving(true);
    try {
      if (loadedRequest) {
        const updated = await requestService.update(loadedRequest.id, {
          name: requestName,
          description: requestDesc,
          method,
          url,
          queryParams: JSON.stringify(cleanParams),
          headers: JSON.stringify(cleanHeaders),
          authConfig: JSON.stringify(authConfig),
          bodyType,
          bodyContent,
        });
        setLoadedRequest(updated);
      } else {
        const created = await requestService.create(selectedCollectionId, {
          name: requestName,
          description: requestDesc,
          method,
          url,
          queryParams: JSON.stringify(cleanParams),
          headers: JSON.stringify(cleanHeaders),
          authConfig: JSON.stringify(authConfig),
          bodyType,
          bodyContent,
        });
        setLoadedRequest(created);
        navigate(`/request-builder?requestId=${created.id}`, { replace: true });
      }
      setShowSaveModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save request');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (executionResult?.body) {
      navigator.clipboard.writeText(executionResult.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatJsonBody = () => {
    try {
      const parsed = JSON.parse(bodyContent);
      setBodyContent(JSON.stringify(parsed, null, 2));
    } catch (e) {
      alert('Invalid JSON syntax');
    }
  };

  const getMethodColor = (m: string) => {
    switch (m) {
      case 'GET':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'POST':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'PUT':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'PATCH':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'DELETE':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-950 overflow-hidden">
      {/* Top Request Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center space-x-2 flex-1 max-w-4xl">
          {/* Method Selector */}
          <div className="relative">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-mono border focus:outline-none cursor-pointer ${getMethodColor(
                method
              )}`}
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white font-mono">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* URL Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/v1/users or {{baseUrl}}/get"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {url.includes('{{') && (
              <span className="absolute right-2.5 top-2 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">
                Variables Active
              </span>
            )}
          </div>

          {/* Send Action */}
          <button
            onClick={handleSend}
            disabled={isExecuting}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow disabled:opacity-50 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isExecuting ? 'Sending...' : 'Send'}</span>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-2">
          {loadedRequest && (
            <button
              onClick={() => navigate(`/test-builder?requestId=${loadedRequest.id}`)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Assertions ({loadedRequest.assertionCount || 0})</span>
            </button>
          )}

          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-300" />
            <span>{loadedRequest ? 'Save' : 'Save As'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split (Top: Configuration / Bottom: Response) */}
      <div className="flex-1 grid grid-rows-2 overflow-hidden">
        {/* Top Half: Request Configuration */}
        <div className="flex flex-col border-b border-slate-800 overflow-hidden">
          {/* Config Tabs */}
          <div className="flex items-center px-4 bg-slate-900/30 border-b border-slate-800/80 text-xs font-medium space-x-4">
            <button
              onClick={() => setActiveTab('params')}
              className={`py-2.5 border-b-2 transition-colors ${
                activeTab === 'params'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Params ({queryParams.filter((p) => p.key).length})
            </button>
            <button
              onClick={() => setActiveTab('headers')}
              className={`py-2.5 border-b-2 transition-colors ${
                activeTab === 'headers'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Headers ({headers.filter((h) => h.key).length})
            </button>
            <button
              onClick={() => setActiveTab('auth')}
              className={`py-2.5 border-b-2 transition-colors ${
                activeTab === 'auth'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Authorization {authConfig.type !== 'NONE' && '•'}
            </button>
            <button
              onClick={() => setActiveTab('body')}
              className={`py-2.5 border-b-2 transition-colors ${
                activeTab === 'body'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Body {bodyType !== 'NONE' && `(${bodyType})`}
            </button>
          </div>

          {/* Config Tab Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Params Tab */}
            {activeTab === 'params' && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 grid grid-cols-12 gap-2 pb-1 border-b border-slate-800">
                  <span className="col-span-1 text-center">Active</span>
                  <span className="col-span-4">Key</span>
                  <span className="col-span-4">Value</span>
                  <span className="col-span-2">Description</span>
                  <span className="col-span-1 text-right">Delete</span>
                </div>
                {queryParams.map((param, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 text-center">
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        onChange={(e) => {
                          const updated = [...queryParams];
                          updated[index].enabled = e.target.checked;
                          setQueryParams(updated);
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="key"
                      value={param.key}
                      onChange={(e) => {
                        const updated = [...queryParams];
                        updated[index].key = e.target.value;
                        if (index === queryParams.length - 1 && e.target.value) {
                          updated.push({ key: '', value: '', description: '', enabled: true });
                        }
                        setQueryParams(updated);
                      }}
                      className="col-span-4 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={param.value}
                      onChange={(e) => {
                        const updated = [...queryParams];
                        updated[index].value = e.target.value;
                        setQueryParams(updated);
                      }}
                      className="col-span-4 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="description"
                      value={param.description || ''}
                      onChange={(e) => {
                        const updated = [...queryParams];
                        updated[index].description = e.target.value;
                        setQueryParams(updated);
                      }}
                      className="col-span-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="col-span-1 text-right">
                      {queryParams.length > 1 && index < queryParams.length - 1 && (
                        <button
                          onClick={() => setQueryParams(queryParams.filter((_, i) => i !== index))}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Headers Tab */}
            {activeTab === 'headers' && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 grid grid-cols-12 gap-2 pb-1 border-b border-slate-800">
                  <span className="col-span-1 text-center">Active</span>
                  <span className="col-span-5">Header Name</span>
                  <span className="col-span-5">Header Value</span>
                  <span className="col-span-1 text-right">Delete</span>
                </div>
                {headers.map((header, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 text-center">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) => {
                          const updated = [...headers];
                          updated[index].enabled = e.target.checked;
                          setHeaders(updated);
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Content-Type, Authorization"
                      value={header.key}
                      onChange={(e) => {
                        const updated = [...headers];
                        updated[index].key = e.target.value;
                        if (index === headers.length - 1 && e.target.value) {
                          updated.push({ key: '', value: '', description: '', enabled: true });
                        }
                        setHeaders(updated);
                      }}
                      className="col-span-5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={header.value}
                      onChange={(e) => {
                        const updated = [...headers];
                        updated[index].value = e.target.value;
                        setHeaders(updated);
                      }}
                      className="col-span-5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="col-span-1 text-right">
                      {headers.length > 1 && index < headers.length - 1 && (
                        <button
                          onClick={() => setHeaders(headers.filter((_, i) => i !== index))}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Auth Tab */}
            {activeTab === 'auth' && (
              <div className="max-w-xl space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Authentication Type
                  </label>
                  <select
                    value={authConfig.type}
                    onChange={(e) => setAuthConfig({ ...authConfig, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NONE">No Auth</option>
                    <option value="BEARER">Bearer Token</option>
                    <option value="BASIC">Basic Auth (Username / Password)</option>
                    <option value="API_KEY">API Key</option>
                  </select>
                </div>

                {authConfig.type === 'BEARER' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Bearer Token
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. eyJhbGciOi... or {{apiToken}}"
                      value={authConfig.token || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, token: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {authConfig.type === 'BASIC' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={authConfig.username || ''}
                        onChange={(e) => setAuthConfig({ ...authConfig, username: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={authConfig.password || ''}
                        onChange={(e) => setAuthConfig({ ...authConfig, password: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {authConfig.type === 'API_KEY' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Header / Query Key
                      </label>
                      <input
                        type="text"
                        placeholder="X-API-Key"
                        value={authConfig.key || ''}
                        onChange={(e) => setAuthConfig({ ...authConfig, key: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Value</label>
                      <input
                        type="text"
                        placeholder="secret_key_123"
                        value={authConfig.value || ''}
                        onChange={(e) => setAuthConfig({ ...authConfig, value: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Add To</label>
                      <select
                        value={authConfig.addTo || 'HEADER'}
                        onChange={(e) => setAuthConfig({ ...authConfig, addTo: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="HEADER">Header</option>
                        <option value="QUERY">Query Param</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Body Tab */}
            {activeTab === 'body' && (
              <div className="h-full flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs">
                    {(['NONE', 'JSON', 'FORM_URLENCODED', 'RAW_TEXT'] as const).map((type) => (
                      <label key={type} className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="bodyType"
                          value={type}
                          checked={bodyType === type}
                          onChange={() => setBodyType(type)}
                          className="text-indigo-500 bg-slate-900 border-slate-700 focus:ring-0"
                        />
                        <span className={bodyType === type ? 'text-white font-semibold' : 'text-slate-400'}>
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>

                  {bodyType === 'JSON' && (
                    <button
                      type="button"
                      onClick={formatJsonBody}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
                    >
                      Prettify JSON
                    </button>
                  )}
                </div>

                {bodyType !== 'NONE' && (
                  <textarea
                    rows={8}
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    placeholder="Enter request body here..."
                    className="w-full flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Half: Response Panel */}
        <div className="flex flex-col bg-slate-950 overflow-hidden">
          {/* Response Status Bar */}
          <div className="p-2.5 px-4 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                Response
              </span>
              {executionResult && (
                <>
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono font-bold text-xs flex items-center space-x-1 ${
                      executionResult.statusCode >= 200 && executionResult.statusCode < 300
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    <span>{executionResult.statusCode || 'ERR'}</span>
                    <span>{executionResult.statusText}</span>
                  </span>

                  <span className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{executionResult.durationMs} ms</span>
                  </span>

                  <span className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
                    <HardDrive className="w-3 h-3 text-slate-500" />
                    <span>{(executionResult.sizeBytes / 1024).toFixed(1)} KB</span>
                  </span>
                </>
              )}
            </div>

            {/* Response tabs & copy */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => setResponseTab('body')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    responseTab === 'body' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Body
                </button>
                <button
                  onClick={() => setResponseTab('headers')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    responseTab === 'headers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Headers ({executionResult?.headers ? Object.keys(executionResult.headers).length : 0})
                </button>
                <button
                  onClick={() => setResponseTab('assertions')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    responseTab === 'assertions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Assertions ({executionResult?.totalAssertions || 0})
                </button>
              </div>

              {responseTab === 'body' && (
                <button
                  onClick={() => setIsRawResponse(!isRawResponse)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                >
                  {isRawResponse ? 'Raw' : 'Pretty'}
                </button>
              )}

              <button
                onClick={copyToClipboard}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Copy Response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Response Content */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
            {!executionResult && !isExecuting && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <Send className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-400">Ready to Send</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Click 'Send' above to execute request against target endpoint.
                </p>
              </div>
            )}

            {isExecuting && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-xs">Executing request & resolving assertions...</p>
              </div>
            )}

            {executionResult && (
              <>
                {/* Body View */}
                {responseTab === 'body' && (
                  <pre className="text-emerald-300 whitespace-pre-wrap word-break leading-relaxed">
                    {executionResult.isError ? (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-sans">
                        <div className="flex items-center space-x-2 font-bold mb-1">
                          <ShieldAlert className="w-4 h-4" />
                          <span>Request Failed</span>
                        </div>
                        <p className="text-xs">{executionResult.errorMessage}</p>
                      </div>
                    ) : (
                      executionResult.body || '<Empty response body>'
                    )}
                  </pre>
                )}

                {/* Headers View */}
                {responseTab === 'headers' && (
                  <div className="space-y-1">
                    {Object.entries(executionResult.headers).map(([key, vals]) => (
                      <div key={key} className="grid grid-cols-12 gap-2 py-1 border-b border-slate-900 text-xs">
                        <span className="col-span-4 text-indigo-400 font-semibold">{key}</span>
                        <span className="col-span-8 text-slate-300 break-all">{vals.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assertions View */}
                {responseTab === 'assertions' && (
                  <div className="space-y-2 font-sans">
                    {executionResult.assertionResults.length > 0 ? (
                      executionResult.assertionResults.map((ar, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border flex items-start justify-between ${
                            ar.passed
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              {ar.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-400" />
                              )}
                              <span className="font-bold text-xs text-white">{ar.assertionName}</span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/40">
                                {ar.assertionType}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-slate-400 space-x-2 font-mono">
                              <span>Expected: {ar.expectedValue || 'N/A'}</span>
                              <span>•</span>
                              <span>Actual: {ar.actualValue || 'N/A'}</span>
                            </div>
                            {ar.errorMessage && (
                              <p className="text-[11px] text-rose-400 mt-1 font-mono">{ar.errorMessage}</p>
                            )}
                          </div>
                          <span className="text-xs font-bold uppercase font-mono">
                            {ar.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No assertions configured for this request. Open the Test Assertions builder to add automated assertions.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              {loadedRequest ? 'Update Request' : 'Save Request to Collection'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Persist this API request inside your project collection.
            </p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Request Name
                </label>
                <input
                  type="text"
                  required
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {!loadedRequest && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Project
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Collection
                    </label>
                    <select
                      value={selectedCollectionId}
                      onChange={(e) => setSelectedCollectionId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={requestDesc}
                  onChange={(e) => setRequestDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
