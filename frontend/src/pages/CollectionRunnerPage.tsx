import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  projectService,
  collectionService,
  runnerService,
  historyService,
} from '../services/appServices';
import { Collection, Project, TestRun, TestRunItem } from '../types';
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  FileDown,
  Layers,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

export const CollectionRunnerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const collectionIdParam = searchParams.get('collectionId');
  const navigate = useNavigate();
  const { activeWorkspace, environments, activeEnvironment } = useAuth();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collectionIdParam || '');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>(activeEnvironment?.id || '');
  const [delayMs, setDelayMs] = useState<number>(0);

  const [isRunning, setIsRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load collections
  useEffect(() => {
    if (!activeWorkspace) return;
    const load = async () => {
      try {
        const projs = await projectService.list(activeWorkspace.id);
        const colList: Collection[] = [];
        for (const p of projs) {
          const cols = await collectionService.list(p.id);
          colList.push(...cols);
        }
        setCollections(colList);
        if (!selectedCollectionId && colList.length > 0) {
          setSelectedCollectionId(colList[0].id);
        }
      } catch (err) {
        console.error('Failed to load collections:', err);
      }
    };
    load();
  }, [activeWorkspace?.id]);

  useEffect(() => {
    if (activeEnvironment) {
      setSelectedEnvironmentId(activeEnvironment.id);
    }
  }, [activeEnvironment?.id]);

  const handleStartRun = async () => {
    if (!selectedCollectionId) {
      alert('Please select a collection to run');
      return;
    }

    setIsRunning(true);
    setCurrentRun(null);
    setExpandedItems(new Set());

    try {
      const result = await runnerService.runCollection(selectedCollectionId, {
        environmentId: selectedEnvironmentId || undefined,
        delayMs: delayMs || 0,
      });
      setCurrentRun(result);
    } catch (err: any) {
      alert(err.message || 'Collection execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportPdf = async () => {
    if (!currentRun) return;
    try {
      const blob = await historyService.exportPdf(currentRun.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apiwise-run-${currentRun.id.substring(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export PDF');
    }
  };

  const handleExportCsv = async () => {
    if (!currentRun) return;
    try {
      const blob = await historyService.exportCsv(currentRun.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apiwise-run-${currentRun.id.substring(0, 8)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV');
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedItems(next);
  };

  const getMethodBadge = (m: string) => {
    const base = 'px-1.5 py-0.5 rounded text-[10px] font-bold font-mono';
    switch (m) {
      case 'GET':
        return `${base} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`;
      case 'POST':
        return `${base} bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`;
      case 'PUT':
        return `${base} bg-amber-500/10 text-amber-400 border border-amber-500/20`;
      case 'PATCH':
        return `${base} bg-cyan-500/10 text-cyan-400 border border-cyan-500/20`;
      case 'DELETE':
        return `${base} bg-rose-500/10 text-rose-400 border border-rose-500/20`;
      default:
        return `${base} bg-slate-500/10 text-slate-400`;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
              <PlayCircle className="w-5 h-5 text-emerald-400" />
              <span>Automated Collection Runner</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute test suites sequentially, validate assertions, and generate exportable reports
            </p>
          </div>

          {currentRun && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportPdf}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Target Collection
            </label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.requestCount || 0} reqs)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Environment
            </label>
            <select
              value={selectedEnvironmentId}
              onChange={(e) => setSelectedEnvironmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">No Environment (Globals)</option>
              {environments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} {e.isDefault && '(Default)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Delay Between Requests (ms)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={delayMs}
              onChange={(e) => setDelayMs(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleStartRun}
              disabled={isRunning || !selectedCollectionId}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-success disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{isRunning ? 'Running Collection...' : 'Start Run'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress or Execution Results */}
      {isRunning && (
        <div className="glass-panel p-8 rounded-2xl text-center space-y-3 border border-slate-800 animate-pulse">
          <RotateCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-white">Running Test Suite</h3>
          <p className="text-xs text-slate-400">
            Evaluating requests, checking environment variables, and verifying assertions...
          </p>
        </div>
      )}

      {currentRun && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              currentRun.status === 'COMPLETED'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <div className="flex items-center space-x-3">
              {currentRun.status === 'COMPLETED' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-400" />
              )}
              <div>
                <h2 className="text-base font-extrabold text-white">
                  {currentRun.status === 'COMPLETED' ? 'Collection Run Succeeded' : 'Collection Run Failed'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Executed {currentRun.totalRequests} requests in {currentRun.totalDurationMs} ms
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs font-mono">
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Requests</div>
                <div className="text-sm font-bold text-white">
                  <span className="text-emerald-400">{currentRun.passedRequests}</span>
                  <span className="text-slate-600">/</span>
                  <span>{currentRun.totalRequests}</span>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[10px] uppercase">Assertions</div>
                <div className="text-sm font-bold text-white">
                  <span className="text-emerald-400">{currentRun.passedAssertions}</span>
                  <span className="text-slate-600">/</span>
                  <span>{currentRun.totalAssertions}</span>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[10px] uppercase">Pass Rate</div>
                <div className="text-sm font-bold text-emerald-400">
                  {currentRun.totalAssertions > 0
                    ? `${((currentRun.passedAssertions * 100) / currentRun.totalAssertions).toFixed(1)}%`
                    : '100%'}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Request Items */}
          <div className="glass-panel rounded-2xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
            {currentRun.items.map((item, index) => {
              const isExpanded = expandedItems.has(item.id);
              const isPassed = item.status === 'PASSED';

              return (
                <div key={item.id} className="transition-colors">
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/50"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <button className="text-slate-500">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}

                      <span className={getMethodBadge(item.method)}>{item.method}</span>

                      <span className="text-xs font-semibold text-white truncate">{item.requestName}</span>

                      <span className="text-[11px] font-mono text-slate-500 truncate max-w-sm hidden md:inline">
                        {item.executedUrl}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <span
                        className={`font-bold ${
                          item.statusCode && item.statusCode >= 200 && item.statusCode < 300
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.statusCode || 'ERR'}
                      </span>

                      <span className="text-slate-400">{item.responseTimeMs || 0} ms</span>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isPassed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Item Details */}
                  {isExpanded && (
                    <div className="p-4 pt-0 pl-11 bg-slate-950/40 space-y-3 text-xs">
                      {/* Assertions results */}
                      {item.assertionResults && item.assertionResults.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Assertion Results ({item.assertionResults.length})
                          </div>
                          {item.assertionResults.map((ar, i) => (
                            <div
                              key={i}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                ar.passed
                                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                              }`}
                            >
                              <div>
                                <span className="font-semibold text-white">{ar.assertionName}</span>
                                <span className="text-[10px] uppercase font-mono px-1 py-0.2 ml-2 rounded bg-slate-800 text-slate-400">
                                  {ar.assertionType}
                                </span>
                                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  Expected: {ar.expectedValue || 'N/A'} • Actual: {ar.actualValue || 'N/A'}
                                </div>
                                {ar.errorMessage && (
                                  <div className="text-[11px] text-rose-400 mt-1 font-mono">{ar.errorMessage}</div>
                                )}
                              </div>
                              <span className="font-bold text-[10px] uppercase font-mono">
                                {ar.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Response Body preview */}
                      {item.responseBody && (
                        <div className="pt-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Response Body Preview
                          </div>
                          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                            {item.responseBody}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
