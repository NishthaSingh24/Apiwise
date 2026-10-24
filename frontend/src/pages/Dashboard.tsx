import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService, historyService } from '../services/appServices';
import { Analytics, TestRun } from '../types';
import {
  Send,
  PlayCircle,
  FileCode2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Activity,
  Zap,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
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
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  const { activeWorkspace } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentRuns, setRecentRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [stats, runs] = await Promise.all([
          analyticsService.getAnalytics(activeWorkspace.id),
          historyService.listRuns(activeWorkspace.id),
        ]);
        setAnalytics(stats);
        setRecentRuns(runs.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeWorkspace?.id]);

  if (!activeWorkspace) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400 text-sm">Please select or create a workspace to view dashboard.</p>
      </div>
    );
  }

  const failureData = analytics?.failureBreakdown
    ? Object.entries(analytics.failureBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center space-x-2">
            <span>Workspace Overview</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-medium">
              {activeWorkspace.name}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time test suite telemetry, assertion reliability, and latency distribution
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => navigate('/request-builder')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>New Request</span>
          </button>
          <button
            onClick={() => navigate('/runner')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-all"
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Run Collection</span>
          </button>
          <button
            onClick={() => navigate('/openapi')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-all"
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Import Spec</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Pass Reliability</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black tracking-tight text-white">
            {analytics ? `${analytics.overallPassRate}%` : '0%'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
            <span className="text-emerald-400 font-semibold">{analytics?.passedAssertions || 0}</span>
            <span>of {analytics?.totalAssertions || 0} assertions passed</span>
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Total Executed */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Requests Executed</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black tracking-tight text-white">
            {analytics ? analytics.totalRequestsExecuted.toLocaleString() : '0'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {analytics?.totalRuns || 0} test runs in workspace
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Avg Latency */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Avg Response Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black tracking-tight text-white">
            {analytics ? `${analytics.averageResponseTimeMs} ms` : '0 ms'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Target SLA: &lt; 500 ms
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Test Runs Completed */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Test Suites</span>
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black tracking-tight text-white">
            {analytics ? analytics.totalRuns.toLocaleString() : '0'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {analytics ? `${analytics.successfulRuns} fully successful` : '0 successful'}
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runs Trend (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Test Execution Trend (Last 7 Days)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Daily volume of completed test runs and pass/fail distributions
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics?.recentTrend && analytics.recentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.recentTrend}>
                  <defs>
                    <linearGradient id="passedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="passedCount"
                    name="Passed Runs"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#passedGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="failedCount"
                    name="Failed Runs"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#failedGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No execution trend data yet. Run collections to populate trend metrics.
              </div>
            )}
          </div>
        </div>

        {/* Failure Breakdown (1 col) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Assertion Failures by Type</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Breakdown of failed assertion categories
            </p>
          </div>

          {failureData.length > 0 ? (
            <div className="space-y-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={failureData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
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
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {failureData.map((f, i) => (
                  <div key={f.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-2 text-slate-300">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="font-mono text-[11px]">{f.name}</span>
                    </span>
                    <span className="font-bold text-slate-200">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-xs font-semibold text-slate-300">Zero Assertion Failures</p>
              <p className="text-[11px] text-slate-500 mt-1">
                All evaluated test assertions in this workspace are passing cleanly!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Test Runs Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Recent Test Runs</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Persisted execution records from database
            </p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>View All History</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRuns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Collection</th>
                  <th className="pb-2">Environment</th>
                  <th className="pb-2">Requests</th>
                  <th className="pb-2">Assertions</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Triggered By</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          run.status === 'COMPLETED' && run.failedRequests === 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {run.status === 'COMPLETED' && run.failedRequests === 0 ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{run.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-200">
                      {run.collectionName || 'Default Collection'}
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {run.environmentName || 'Default'}
                    </td>
                    <td className="py-2.5 text-slate-300 font-mono">
                      <span className="text-emerald-400">{run.passedRequests}</span>
                      <span className="text-slate-600">/</span>
                      <span>{run.totalRequests}</span>
                    </td>
                    <td className="py-2.5 text-slate-300 font-mono">
                      <span className="text-emerald-400">{run.passedAssertions}</span>
                      <span className="text-slate-600">/</span>
                      <span>{run.totalAssertions}</span>
                    </td>
                    <td className="py-2.5 text-slate-400 font-mono">
                      {run.totalDurationMs} ms
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {run.triggeredByName}
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        to={`/history/${run.id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No test runs recorded yet in this workspace. Execute an ad-hoc request or run a collection to generate reports.
          </div>
        )}
      </div>
    </div>
  );
};
