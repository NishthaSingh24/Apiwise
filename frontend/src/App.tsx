import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { RequestBuilderPage } from './pages/RequestBuilderPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { TestBuilderPage } from './pages/TestBuilderPage';
import { CollectionRunnerPage } from './pages/CollectionRunnerPage';
import { OpenApiImportPage } from './pages/OpenApiImportPage';
import { EnvironmentsPage } from './pages/EnvironmentsPage';
import { ExecutionHistoryPage } from './pages/ExecutionHistoryPage';
import { ExecutionDetailsPage } from './pages/ExecutionDetailsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('APIWise ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-base font-bold">APIWise Application Notice</h2>
            </div>
            <p className="text-xs text-slate-400">
              A client-side initialization issue occurred. Clearing local browser cache usually fixes this immediately.
            </p>
            {this.state.error && (
              <div className="p-3 bg-black/50 border border-slate-800 rounded-xl font-mono text-[11px] text-rose-300 break-all">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all cursor-pointer"
              >
                Clear Cache & Restart App
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span>Initializing APIWise session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/request-builder" element={<RequestBuilderPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/test-builder" element={<TestBuilderPage />} />
            <Route path="/runner" element={<CollectionRunnerPage />} />
            <Route path="/openapi" element={<OpenApiImportPage />} />
            <Route path="/environments" element={<EnvironmentsPage />} />
            <Route path="/history" element={<ExecutionHistoryPage />} />
            <Route path="/history/:runId" element={<ExecutionDetailsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
