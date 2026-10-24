import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { openApiService, projectService } from '../services/appServices';
import { OpenApiPreview, Project } from '../types';
import {
  FileCode2,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const OpenApiImportPage: React.FC = () => {
  const { activeWorkspace } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'content' | 'url'>('content');
  const [specContent, setSpecContent] = useState('');
  const [specUrl, setSpecUrl] = useState('');
  const [baseUrlOverride, setBaseUrlOverride] = useState('');

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<OpenApiPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<Set<string>>(new Set());

  // Import Destination
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('Imported OpenAPI Collection');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) return;
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
  }, [activeWorkspace?.id]);

  const handlePreview = async () => {
    if (!activeWorkspace) return;
    setError(null);
    setIsLoadingPreview(true);
    setPreview(null);
    try {
      const res = await openApiService.preview(activeWorkspace.id, {
        specContent: mode === 'content' ? specContent : undefined,
        specUrl: mode === 'url' ? specUrl : undefined,
      });
      setPreview(res);
      setSelectedEndpointIds(new Set(res.endpoints.map((e) => e.id)));
      if (res.title) {
        setNewCollectionName(`API — ${res.title}`);
      }
      if (res.servers.length > 0) {
        setBaseUrlOverride(res.servers[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse OpenAPI specification');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSelectAll = () => {
    if (!preview) return;
    if (selectedEndpointIds.size === preview.endpoints.length) {
      setSelectedEndpointIds(new Set());
    } else {
      setSelectedEndpointIds(new Set(preview.endpoints.map((e) => e.id)));
    }
  };

  const handleImport = async () => {
    if (!activeWorkspace || !selectedProjectId || !preview) return;
    setIsImporting(true);
    try {
      await openApiService.importEndpoints(activeWorkspace.id, {
        projectId: selectedProjectId,
        collectionName: newCollectionName.trim(),
        specContent: mode === 'content' ? specContent : undefined,
        specUrl: mode === 'url' ? specUrl : undefined,
        baseUrl: baseUrlOverride.trim(),
        selectedEndpointIds: Array.from(selectedEndpointIds),
      });
      navigate('/collections');
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const sampleSpec = `openapi: 3.0.0
info:
  title: User Account Service API
  version: 1.0.0
  description: Core microservice for users and authorization
servers:
  - url: https://api.example.com/v1
paths:
  /users:
    get:
      summary: Retrieve list of users
      responses:
        '200':
          description: OK
    post:
      summary: Register a new user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                email:
                  type: string
      responses:
        '201':
          description: Created
  /users/{userId}:
    get:
      summary: Get user profile details
      responses:
        '200':
          description: OK
    delete:
      summary: Remove user account
      responses:
        '204':
          description: No Content`;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <FileCode2 className="w-5 h-5 text-indigo-400" />
          <span>OpenAPI 3.x Specification Import</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Import specifications from raw JSON/YAML or secure URLs. Endpoints are automatically converted into saved requests with schema assertions.
        </p>
      </div>

      {/* Input Selector Card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-3 text-xs font-semibold">
          <button
            onClick={() => setMode('content')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              mode === 'content'
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Raw JSON or YAML Content
          </button>
          <button
            onClick={() => setMode('url')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              mode === 'url'
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Specification URL (Protected by SSRF Guard)
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'content' ? (
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
              <span>Paste OpenAPI 3.x specification</span>
              <button
                type="button"
                onClick={() => setSpecContent(sampleSpec)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Insert Sample Specification
              </button>
            </div>
            <textarea
              rows={8}
              value={specContent}
              onChange={(e) => setSpecContent(e.target.value)}
              placeholder="openapi: 3.0.0..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Specification URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="url"
                value={specUrl}
                onChange={(e) => setSpecUrl(e.target.value)}
                placeholder="https://petstore.swagger.io/v2/swagger.json"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Outbound destinations are strictly validated against SSRF protection policies.</span>
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handlePreview}
            disabled={isLoadingPreview || (mode === 'content' ? !specContent : !specUrl)}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isLoadingPreview ? 'Validating & Parsing...' : 'Analyze & Preview'}</span>
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">{preview.title || 'Untitled Spec'}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-mono">
                  v{preview.version || '1.0.0'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{preview.description}</p>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
              <span>{preview.endpoints.length} endpoints found</span>
              <span>•</span>
              <span className="text-indigo-400 font-semibold">{selectedEndpointIds.size} selected</span>
            </div>
          </div>

          {/* Import Destination Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Target Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                New Collection Name
              </label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Base URL / Variable
              </label>
              <input
                type="text"
                value={baseUrlOverride}
                onChange={(e) => setBaseUrlOverride(e.target.value)}
                placeholder="{{baseUrl}}"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Endpoints Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs pb-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {selectedEndpointIds.size === preview.endpoints.length
                  ? 'Deselect All'
                  : 'Select All Endpoints'}
              </button>
              <span className="text-slate-500 text-[11px]">
                Each selected endpoint will include default 200 OK assertion
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl max-h-72 overflow-y-auto">
              {preview.endpoints.map((ep) => {
                const isSelected = selectedEndpointIds.has(ep.id);
                return (
                  <div
                    key={ep.id}
                    onClick={() => {
                      const next = new Set(selectedEndpointIds);
                      if (next.has(ep.id)) next.delete(ep.id);
                      else next.add(ep.id);
                      setSelectedEndpointIds(next);
                    }}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-600/10' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                      />
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                          ep.method === 'GET'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ep.method === 'POST'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : ep.method === 'DELETE'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs text-white">{ep.path}</span>
                      <span className="text-xs text-slate-400 truncate max-w-xs">{ep.summary}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                      {ep.responseCodes.map((code) => (
                        <span key={code} className="px-1.5 py-0.2 rounded bg-slate-800">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Import Action Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleImport}
              disabled={isImporting || selectedEndpointIds.size === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-glow disabled:opacity-50 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>{isImporting ? 'Importing Endpoints...' : `Import ${selectedEndpointIds.size} Endpoints`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
