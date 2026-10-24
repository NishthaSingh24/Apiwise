import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { historyService } from '../services/appServices';
import { TestRun } from '../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileDown,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const ExecutionHistoryPage: React.FC = () => {
  const { activeWorkspace } = useAuth();
  const navigate = useNavigate();

  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'FAILED'>('ALL');

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchRuns = async () => {
      setLoading(true);
      try {
        const list = await historyService.listRuns(activeWorkspace.id);
        setRuns(list);
      } catch (err) {
        console.error('Failed to load runs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
  }, [activeWorkspace?.id]);

  const filteredRuns = runs.filter((r) => {
    if (filter === 'COMPLETED') return r.status === 'COMPLETED' && r.failedRequests === 0;
    if (filter === 'FAILED') return r.status === 'FAILED' || r.failedRequests > 0;
    return true;
  });

  const handleExportPdf = async (runId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleExportCsv = async (runId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Execution History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persisted test execution runs, status records, and downloadable compliance reports
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filter === 'ALL'
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            All Runs ({runs.length})
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filter === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => setFilter('FAILED')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filter === 'FAILED'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Runs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading history...</div>
        ) : filteredRuns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="p-3 pl-4">Status</th>
                  <th className="p-3">Collection / Suite</th>
                  <th className="p-3">Environment</th>
                  <th className="p-3">Requests</th>
                  <th className="p-3">Assertions</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3 text-right pr-4">Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRuns.map((run) => {
                  const isPassed = run.status === 'COMPLETED' && run.failedRequests === 0;
                  return (
                    <tr
                      key={run.id}
                      onClick={() => navigate(`/history/${run.id}`)}
                      className="hover:bg-slate-900/50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 pl-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPassed
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{run.status}</span>
                        </span>
                      </td>

                      <td className="p-3 font-semibold text-white">
                        {run.collectionName || 'Default Collection'}
                      </td>

                      <td className="p-3 text-slate-400 font-mono">
                        {run.environmentName || 'Default'}
                      </td>

                      <td className="p-3 font-mono">
                        <span className="text-emerald-400 font-bold">{run.passedRequests}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-slate-300">{run.totalRequests}</span>
                      </td>

                      <td className="p-3 font-mono">
                        <span className="text-emerald-400 font-bold">{run.passedAssertions}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-slate-300">{run.totalAssertions}</span>
                      </td>

                      <td className="p-3 text-slate-400 font-mono">
                        {run.totalDurationMs} ms
                      </td>

                      <td className="p-3 text-slate-400">
                        {new Date(run.createdAt).toLocaleString()}
                      </td>

                      <td className="p-3 text-right pr-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => handleExportPdf(run.id, e)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors"
                            title="Export PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleExportCsv(run.id, e)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="Export CSV"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-slate-400 hover:text-white p-1">
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-slate-500">
            No past test runs found. Execute a collection run from the Collection Runner.
          </div>
        )}
      </div>
    </div>
  );
};
