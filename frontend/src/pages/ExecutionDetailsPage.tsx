import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { historyService, aiService } from '../services/appServices';
import { TestRun, TestRunItem, AiExplanation } from '../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileDown,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  HardDrive,
  ShieldAlert,
} from 'lucide-react';

export const ExecutionDetailsPage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();

  const [run, setRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // AI Explanation Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null);
  const [targetItemForAi, setTargetItemForAi] = useState<TestRunItem | null>(null);

  useEffect(() => {
    if (!runId) return;
    const fetchRun = async () => {
      setLoading(true);
      try {
        const data = await historyService.getRunDetails(runId);
        setRun(data);
      } catch (err: any) {
        alert(err.message || 'Failed to load run details');
      } finally {
        setLoading(false);
      }
    };
    fetchRun();
  }, [runId]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedItems(next);
  };

  const handleExportPdf = async () => {
    if (!runId) return;
    try {
      const blob = await historyService.exportPdf(runId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apiwise-run-${runId.substring(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export PDF');
    }
  };

  const handleExportCsv = async () => {
    if (!runId) return;
    try {
      const blob = await historyService.exportCsv(runId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apiwise-run-${runId.substring(0, 8)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV');
    }
  };

  const handleExplainFailure = async (item: TestRunItem) => {
    setTargetItemForAi(item);
    setShowAiModal(true);
    setAiLoading(true);
    setAiExplanation(null);

    const firstFailedAssertion = item.assertionResults?.find((ar) => !ar.passed);

    try {
      const res = await aiService.explainFailure({
        requestName: item.requestName,
        method: item.method,
        url: item.executedUrl,
        statusCode: item.statusCode || 0,
        responseBody: item.responseBody || '',
        assertionName: firstFailedAssertion?.assertionName || 'HTTP Status Failure',
        assertionType: firstFailedAssertion?.assertionType || 'STATUS_CODE',
        target: firstFailedAssertion?.target || '',
        expected: firstFailedAssertion?.expectedValue || '200',
        actual: firstFailedAssertion?.actualValue || String(item.statusCode || '0'),
        errorMessage: firstFailedAssertion?.errorMessage || item.errorMessage || 'Failure',
      });
      setAiExplanation(res);
    } catch (err: any) {
      alert(err.message || 'Failed to generate explanation');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading execution details...</div>;
  }

  if (!run) {
    return <div className="p-8 text-center text-xs text-slate-400">Run report not found.</div>;
  }

  const isPassed = run.status === 'COMPLETED' && run.failedRequests === 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/history')}
        className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Execution History</span>
      </button>

      {/* Main Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {isPassed ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-rose-400" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black text-white">{run.collectionName || 'Test Run'}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isPassed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {run.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Run ID: {run.id} • Environment: {run.environmentName || 'Default'} • {new Date(run.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleExportPdf}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <FileDown className="w-4 h-4 text-indigo-400" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Quick metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-[10px] uppercase text-slate-500">Duration</div>
            <div className="text-base font-bold text-white mt-0.5">{run.totalDurationMs} ms</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-[10px] uppercase text-slate-500">Requests</div>
            <div className="text-base font-bold text-white mt-0.5">
              <span className="text-emerald-400">{run.passedRequests}</span>
              <span className="text-slate-600"> / </span>
              <span>{run.totalRequests}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-[10px] uppercase text-slate-500">Assertions</div>
            <div className="text-base font-bold text-white mt-0.5">
              <span className="text-emerald-400">{run.passedAssertions}</span>
              <span className="text-slate-600"> / </span>
              <span>{run.totalAssertions}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-[10px] uppercase text-slate-500">Pass Rate</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {run.totalAssertions > 0
                ? `${((run.passedAssertions * 100) / run.totalAssertions).toFixed(1)}%`
                : '100%'}
            </div>
          </div>
        </div>
      </div>

      {/* Requests Breakdown Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
            Executed Endpoints ({run.items.length})
          </span>
          <span className="text-slate-500 text-[11px]">Click an item to expand assertions & response details</span>
        </div>

        {run.items.map((item) => {
          const isExpanded = expandedItems.has(item.id);
          const isItemPassed = item.status === 'PASSED';

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

                  {isItemPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}

                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-indigo-400">
                    {item.method}
                  </span>

                  <span className="text-xs font-semibold text-white truncate">{item.requestName}</span>

                  <span className="text-[11px] font-mono text-slate-500 truncate max-w-sm hidden md:inline">
                    {item.executedUrl}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono">
                  {!isItemPassed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExplainFailure(item);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 font-sans text-[11px] font-semibold flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>AI Explain</span>
                    </button>
                  )}

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
                      isItemPassed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 pt-0 pl-11 bg-slate-950/40 space-y-3 text-xs">
                  {/* Assertions results */}
                  {item.assertionResults && item.assertionResults.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Evaluated Assertions ({item.assertionResults.length})
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

                  {/* Response Body */}
                  {item.responseBody && (
                    <div className="pt-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Response Body
                      </div>
                      <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
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

      {/* AI Explanation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">AI Failure Diagnosis</h3>
            </div>

            {aiLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                <p>Analyzing error stack, assertions, and HTTP response...</p>
              </div>
            ) : aiExplanation ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-bold text-slate-300 uppercase text-[10px]">What Happened</div>
                  <p className="text-slate-200 mt-0.5 leading-relaxed">{aiExplanation.explanation}</p>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <div className="font-bold uppercase text-[10px] text-rose-400">Root Cause</div>
                  <p className="mt-0.5">{aiExplanation.rootCause}</p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
                  <div className="font-bold uppercase text-[10px] text-indigo-400">Recommended Fix</div>
                  <p className="mt-0.5">{aiExplanation.recommendedFix}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Could not generate explanation.</p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
