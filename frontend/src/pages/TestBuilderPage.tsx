import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  requestService,
  assertionService,
  aiService,
  projectService,
  collectionService,
} from '../services/appServices';
import {
  Assertion,
  AssertionType,
  AssertionOperator,
  ApiRequest,
  Project,
  Collection,
  ExecutionResult,
  AiAssertionSuggestion,
} from '../types';
import {
  ShieldCheck,
  Plus,
  Play,
  Sparkles,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  HelpCircle,
  Check,
} from 'lucide-react';

const ASSERTION_TYPES: { type: AssertionType; label: string; desc: string }[] = [
  { type: 'STATUS_CODE', label: 'HTTP Status Code', desc: 'Verify HTTP status code (200, 201, 400, in list)' },
  { type: 'RESPONSE_TIME', label: 'Response Latency', desc: 'Ensure endpoint responds within SLA duration (ms)' },
  { type: 'JSON_PATH_EXISTS', label: 'JSONPath Existence', desc: 'Verify key/path exists or does not exist in body' },
  { type: 'JSON_PATH_VALUE', label: 'JSONPath Value Comparison', desc: 'Compare value at path using equals, regex, or contains' },
  { type: 'JSON_TYPE', label: 'JSON Field Type', desc: 'Assert field is string, number, boolean, array, or object' },
  { type: 'ARRAY_LENGTH', label: 'Array Length Check', desc: 'Assert count of elements in a JSON array' },
  { type: 'HEADER', label: 'Response Header', desc: 'Assert presence or value of response header' },
  { type: 'JSON_SCHEMA', label: 'JSON Schema Validation', desc: 'Validate complete response body against JSON Schema' },
];

export const TestBuilderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestIdParam = searchParams.get('requestId');
  const navigate = useNavigate();
  const { activeWorkspace, activeEnvironment } = useAuth();

  const [selectedRequestId, setSelectedRequestId] = useState<string>(requestIdParam || '');
  const [availableRequests, setAvailableRequests] = useState<ApiRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<ApiRequest | null>(null);

  const [assertions, setAssertions] = useState<Assertion[]>([]);
  const [loading, setLoading] = useState(false);

  // Execution & Live Assertion Check
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Add Assertion Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [assertionType, setAssertionType] = useState<AssertionType>('STATUS_CODE');
  const [target, setTarget] = useState('');
  const [operator, setOperator] = useState<AssertionOperator>('EQUALS');
  const [expectedValue, setExpectedValue] = useState('200');

  // AI Assistant Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiAssertionSuggestion[]>([]);
  const [selectedAiSuggestions, setSelectedAiSuggestions] = useState<Set<number>>(new Set());

  // Load all requests across collections for dropdown
  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchAllReqs = async () => {
      try {
        const projs = await projectService.list(activeWorkspace.id);
        const reqList: ApiRequest[] = [];
        for (const p of projs) {
          const cols = await collectionService.list(p.id);
          for (const c of cols) {
            const reqs = await requestService.list(c.id);
            reqList.push(...reqs);
          }
        }
        setAvailableRequests(reqList);
        if (!selectedRequestId && reqList.length > 0) {
          setSelectedRequestId(reqList[0].id);
        }
      } catch (err) {
        console.error('Failed to load available requests:', err);
      }
    };
    fetchAllReqs();
  }, [activeWorkspace?.id]);

  // Load assertions for selected request
  useEffect(() => {
    if (!selectedRequestId) {
      setAssertions([]);
      setCurrentRequest(null);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [req, list] = await Promise.all([
          requestService.get(selectedRequestId),
          assertionService.list(selectedRequestId),
        ]);
        setCurrentRequest(req);
        setAssertions(list);
      } catch (err) {
        console.error('Failed to load assertions:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedRequestId]);

  const handleCreateSampleRequest = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      // 1. Get or create project
      let projs = await projectService.list(activeWorkspace.id);
      let proj = projs[0];
      if (!proj) {
        proj = await projectService.create(activeWorkspace.id, {
          name: 'Quickstart API Project',
          description: 'Getting started sample APIs and test suites',
        });
      }
      // 2. Get or create collection
      let cols = await collectionService.list(proj.id);
      let col = cols[0];
      if (!col) {
        col = await collectionService.create(proj.id, {
          name: 'Demo Endpoints',
          description: 'Sample collection for automated testing',
        });
      }
      // 3. Create sample request
      const newReq = await requestService.create(col.id, {
        name: 'Get Sample JSON',
        method: 'GET',
        url: 'https://httpbin.org/json',
        headers: '[{"key":"Accept","value":"application/json","enabled":true}]',
        queryParams: '[]',
        authConfig: '{}',
        bodyType: 'NONE',
        orderIndex: 0,
      });

      // 4. Update available requests state and select it
      setAvailableRequests([newReq]);
      setSelectedRequestId(newReq.id);
      setCurrentRequest(newReq);
    } catch (err: any) {
      alert(err.message || 'Failed to create sample request');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAssertions = async () => {
    if (!selectedRequestId) {
      alert('Please create or select a saved request first.');
      return;
    }
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const res = await requestService.executeSaved(selectedRequestId, activeEnvironment?.id);
      setExecutionResult(res);
    } catch (err: any) {
      alert(err.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddAssertion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId || !name.trim()) return;

    try {
      await assertionService.create(selectedRequestId, {
        name: name.trim(),
        assertionType,
        target: target.trim(),
        operator,
        expectedValue: expectedValue.trim(),
        enabled: true,
      });
      const updated = await assertionService.list(selectedRequestId);
      setAssertions(updated);
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Failed to create assertion');
    }
  };

  const handleDeleteAssertion = async (id: string) => {
    try {
      await assertionService.delete(selectedRequestId, id);
      setAssertions(assertions.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete assertion');
    }
  };

  const handleToggleEnabled = async (assertion: Assertion) => {
    try {
      await assertionService.update(selectedRequestId, assertion.id, {
        ...assertion,
        enabled: !assertion.enabled,
      });
      setAssertions(
        assertions.map((a) => (a.id === assertion.id ? { ...a, enabled: !a.enabled } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update assertion');
    }
  };

  const resetForm = () => {
    setName('');
    setAssertionType('STATUS_CODE');
    setTarget('');
    setOperator('EQUALS');
    setExpectedValue('200');
  };

  const handleOpenAiModal = async () => {
    setShowAiModal(true);
    setIsAiLoading(true);
    setSelectedAiSuggestions(new Set());
    try {
      let sampleResult = executionResult;
      if (!sampleResult) {
        sampleResult = await requestService.executeSaved(selectedRequestId, activeEnvironment?.id);
        setExecutionResult(sampleResult);
      }

      const suggestions = await aiService.generateAssertions({
        method: sampleResult.method,
        url: sampleResult.executedUrl,
        statusCode: sampleResult.statusCode,
        responseHeaders: JSON.stringify(sampleResult.headers),
        responseBody: sampleResult.body,
      });
      setAiSuggestions(suggestions);
      setSelectedAiSuggestions(new Set(suggestions.map((_, i) => i)));
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI assertions');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiSuggestions = async () => {
    try {
      for (const idx of selectedAiSuggestions) {
        const s = aiSuggestions[idx];
        await assertionService.create(selectedRequestId, {
          name: s.name,
          assertionType: s.assertionType,
          target: s.target,
          operator: s.operator,
          expectedValue: s.expectedValue,
          enabled: true,
        });
      }
      const updated = await assertionService.list(selectedRequestId);
      setAssertions(updated);
      setShowAiModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to apply assertions');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>Automated Test Assertions Builder</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure codeless assertions across status codes, response times, JSONPath expressions, and schemas
          </p>
        </div>

        {/* Request Picker */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedRequestId}
            onChange={(e) => {
              setSelectedRequestId(e.target.value);
              setExecutionResult(null);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 max-w-xs"
          >
            {availableRequests.length === 0 ? (
              <option value="">No requests in workspace</option>
            ) : (
              availableRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.method}] {r.name}
                </option>
              ))
            )}
          </select>

          <button
            onClick={handleRunAssertions}
            disabled={isExecuting}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glow-success disabled:opacity-50 transition-all cursor-pointer"
            title="Execute request and evaluate assertions"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isExecuting ? 'Evaluating...' : 'Run Assertions'}</span>
          </button>

          <button
            onClick={() => {
              if (!selectedRequestId) {
                if (availableRequests.length === 0) {
                  handleCreateSampleRequest();
                } else {
                  alert('Please select a request from the dropdown first.');
                }
                return;
              }
              handleOpenAiModal();
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-glow transition-all cursor-pointer"
            title="AI draft assertions generator"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Draft Assertions</span>
          </button>

          <button
            onClick={() => {
              if (!selectedRequestId) {
                if (availableRequests.length === 0) {
                  handleCreateSampleRequest();
                } else {
                  alert('Please select a request from the dropdown first.');
                }
                return;
              }
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
            title="Add automated test assertion"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Assertion</span>
          </button>
        </div>
      </div>

      {/* No Requests Banner */}
      {availableRequests.length === 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>No Saved Requests in Workspace Yet</span>
            </h4>
            <p className="text-xs text-slate-400">
              Test assertions must be attached to a saved API request. You can create a request in the Request Builder, or click below to generate a sample request right now.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateSampleRequest}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow cursor-pointer whitespace-nowrap"
            >
              {loading ? 'Creating...' : '✨ Quick Create Sample Request'}
            </button>
            <button
              onClick={() => navigate('/request-builder')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer whitespace-nowrap"
            >
              Go to Request Builder
            </button>
          </div>
        </div>
      )}

      {/* Target Request Info Card */}
      {currentRequest && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {currentRequest.method}
            </span>
            <span className="font-semibold text-white">{currentRequest.name}</span>
            <span className="font-mono text-slate-400 truncate max-w-lg">{currentRequest.url}</span>
          </div>
          <button
            onClick={() => navigate(`/request-builder?requestId=${currentRequest.id}`)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Edit in Request Builder →
          </button>
        </div>
      )}

      {/* Live Run Evaluation Banner */}
      {executionResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            executionResult.allPassed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            {executionResult.allPassed ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400" />
            )}
            <div>
              <div className="font-bold text-sm text-white">
                {executionResult.allPassed
                  ? 'All Assertions Passed Successfully!'
                  : `${executionResult.failedAssertions} Assertion(s) Failed`}
              </div>
              <p className="text-xs text-slate-400">
                HTTP {executionResult.statusCode} • Latency {executionResult.durationMs} ms • Evaluated {executionResult.totalAssertions} rule(s)
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="text-emerald-400 font-bold">{executionResult.passedAssertions} passed</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-rose-400 font-bold">{executionResult.failedAssertions} failed</span>
          </div>
        </div>
      )}

      {/* Assertions Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Assertions ({assertions.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Automated assertions evaluate every time this request or its collection is executed
          </span>
        </div>

        {assertions.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {assertions.map((a) => {
              // Match result from live execution if available
              const matchResult = executionResult?.assertionResults.find((r) => r.assertionId === a.id);

              return (
                <div
                  key={a.id}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    !a.enabled ? 'opacity-50 bg-slate-950/40' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={a.enabled}
                      onChange={() => handleToggleEnabled(a)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer"
                      title="Toggle active"
                    />

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">{a.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                          {a.assertionType}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {a.operator}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center space-x-3 text-xs text-slate-400 font-mono">
                        {a.target && <span>Target: <span className="text-slate-300">{a.target}</span></span>}
                        {a.expectedValue && <span>Expected: <span className="text-slate-300">{a.expectedValue}</span></span>}
                      </div>

                      {matchResult && (
                        <div className="mt-1.5 text-xs flex items-center space-x-2">
                          {matchResult.passed ? (
                            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Evaluated: PASSED</span>
                            </span>
                          ) : (
                            <span className="text-rose-400 font-semibold flex items-center space-x-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Failed: {matchResult.errorMessage}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDeleteAssertion(a.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Assertion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-slate-500 space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-400">No assertions configured</p>
            <p className="text-[11px] text-slate-500">
              Click 'Add Assertion' or 'AI Draft Assertions' above to add automated rules.
            </p>
          </div>
        )}
      </div>

      {/* Add Assertion Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">New Test Assertion</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select rule type and specify expected validation criteria.
            </p>

            <form onSubmit={handleAddAssertion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assertion Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Status is 200, User ID is Integer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assertion Type
                </label>
                <select
                  value={assertionType}
                  onChange={(e) => {
                    const newType = e.target.value as AssertionType;
                    setAssertionType(newType);
                    if (newType === 'STATUS_CODE') {
                      setOperator('EQUALS');
                      setExpectedValue('200');
                    } else if (newType === 'RESPONSE_TIME') {
                      setOperator('LESS_THAN');
                      setExpectedValue('1000');
                    } else if (newType === 'JSON_PATH_EXISTS') {
                      setOperator('EXISTS');
                      setTarget('$.data.id');
                    } else if (newType === 'JSON_TYPE') {
                      setOperator('IS_TYPE');
                      setExpectedValue('string');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {ASSERTION_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label} ({t.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Input (for JSONPath, Header) */}
              {['JSON_PATH_EXISTS', 'JSON_PATH_VALUE', 'JSON_TYPE', 'ARRAY_LENGTH', 'HEADER'].includes(
                assertionType
              ) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Expression ({assertionType === 'HEADER' ? 'Header Name' : 'JSONPath e.g. $.data.id'})
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={assertionType === 'HEADER' ? 'Content-Type' : '$.data.id'}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Operator */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Operator</label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="EQUALS">EQUALS</option>
                  <option value="NOT_EQUALS">NOT EQUALS</option>
                  <option value="CONTAINS">CONTAINS</option>
                  <option value="NOT_CONTAINS">NOT CONTAINS</option>
                  <option value="GREATER_THAN">GREATER THAN</option>
                  <option value="LESS_THAN">LESS THAN</option>
                  <option value="MATCHES_REGEX">MATCHES REGEX</option>
                  <option value="EXISTS">EXISTS</option>
                  <option value="NOT_EXISTS">NOT EXISTS</option>
                  <option value="IS_TYPE">IS TYPE</option>
                  <option value="IN_LIST">IN LIST (Comma-separated)</option>
                  <option value="VALIDATES_SCHEMA">VALIDATES JSON SCHEMA</option>
                </select>
              </div>

              {/* Expected Value */}
              {!['EXISTS', 'NOT_EXISTS'].includes(operator) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Expected Value {assertionType === 'JSON_SCHEMA' && '(Valid JSON Schema string)'}
                  </label>
                  {assertionType === 'JSON_SCHEMA' ? (
                    <textarea
                      rows={5}
                      required
                      value={expectedValue}
                      onChange={(e) => setExpectedValue(e.target.value)}
                      placeholder='{ "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object" }'
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. 200, success, string, 1000"
                      value={expectedValue}
                      onChange={(e) => setExpectedValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Save Assertion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">AI-Generated Assertions</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">
                Review & Select
              </span>
            </div>

            <p className="text-xs text-slate-400 my-3">
              The AI analyzed your endpoint's response payload and generated these proposed assertion rules.
              Select which ones you want to save to this request.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isAiLoading ? (
                <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                  <p>Analyzing response schema and generating assertions...</p>
                </div>
              ) : aiSuggestions.length > 0 ? (
                aiSuggestions.map((s, idx) => {
                  const isChecked = selectedAiSuggestions.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        const next = new Set(selectedAiSuggestions);
                        if (next.has(idx)) next.delete(idx);
                        else next.add(idx);
                        setSelectedAiSuggestions(next);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-600/15 border-indigo-500/40 text-slate-200'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                          />
                          <span className="font-bold text-white">{s.name}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-indigo-400">
                            {s.assertionType}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {s.operator} {s.expectedValue}
                        </span>
                      </div>
                      {s.reasoning && (
                        <p className="text-[11px] text-slate-400 mt-1 pl-6">{s.reasoning}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  No suggestions could be generated. Make sure your request returns a valid response first.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-3">
              <span className="text-xs text-slate-400 font-mono">
                {selectedAiSuggestions.size} of {aiSuggestions.length} selected
              </span>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedAiSuggestions.size === 0}
                  onClick={handleApplyAiSuggestions}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                >
                  Apply Selected Assertions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
