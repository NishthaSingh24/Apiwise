import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService, historyService } from '../services/appServices';
import { Analytics, TestRun } from '../types';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  FileDown,
  TrendingUp,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

export const ReportsPage: React.FC = () => {
  const { activeWorkspace } = useAuth();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    const load = async () => {
      setLoading(true);
      try {
        const [stats, runList] = await Promise.all([
          analyticsService.getAnalytics(activeWorkspace.id),
          historyService.listRuns(activeWorkspace.id),
        ]);
        setAnalytics(stats);
        setRuns(runList);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeWorkspace?.id]);

  const handleExportPdf = async (runId: string) => {
    try {
      const blob = await historyService.exportPdf(runId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apiwise-report-${runId.substring(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export PDF');
    }
  };

  const handleExportCsv = async (runId: string) => {
    try {
      const blob = await historyService.exportCsv(runId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apiwise-report-${runId.substring(0, 8)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV');
    }
  };

  const failureData = analytics?.failureBreakdown
    ? Object.entries(analytics.failureBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <span>Quality & Compliance Reports</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical pass trends, SLA latency distribution, and compliance export logs
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs">Total Requests Executed</div>
          <div className="text-2xl font-black text-white mt-1">
            {analytics?.totalRequestsExecuted.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all workspace suites</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs">Reliability Pass Rate</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {analytics?.overallPassRate || 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {analytics?.passedAssertions || 0} assertions passed
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs">Average Response Time</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {analytics?.averageResponseTimeMs || 0} ms
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Global SLA threshold: 500 ms</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs">Completed Test Runs</div>
          <div className="text-2xl font-black text-white mt-1">
            {analytics?.totalRuns || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {analytics?.successfulRuns || 0} zero-error executions
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Execution Pass/Fail Trend</span>
          </h3>
          <div className="h-64 w-full">
            {analytics?.recentTrend && analytics.recentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.recentTrend}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="passedCount"
                    name="Passed"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                  />
                  <Area
                    type="monotone"
                    dataKey="failedCount"
                    name="Failed"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No trend data available.
              </div>
            )}
          </div>
        </div>

        {/* Failure Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Defect & Failure Distribution</span>
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {failureData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={failureData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {failureData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span>Zero assertion defects recorded</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exportable Run Suites List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
            Exportable Run Reports ({runs.length})
          </span>
          <span className="text-slate-500 text-[11px]">Download compliance reports in PDF or CSV format</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {runs.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 text-xs">
              <div className="flex items-center space-x-3">
                {r.status === 'COMPLETED' && r.failedRequests === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-white">{r.collectionName || 'Default Suite'}</div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                    {new Date(r.createdAt).toLocaleString()} • Duration: {r.totalDurationMs} ms • {r.passedRequests}/{r.totalRequests} passed
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExportPdf(r.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-[11px] flex items-center space-x-1.5 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF Report</span>
                </button>
                <button
                  onClick={() => handleExportCsv(r.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-[11px] flex items-center space-x-1.5 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>CSV Data</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
