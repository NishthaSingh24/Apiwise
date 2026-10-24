import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  projectService,
  collectionService,
  requestService,
} from '../services/appServices';
import { Project, Collection, ApiRequest } from '../types';
import {
  FolderGit2,
  Folder,
  Plus,
  PlayCircle,
  Copy,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Send,
  MoreVertical,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const { activeWorkspace } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showProjModal, setShowProjModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');

  const [showColModal, setShowColModal] = useState(false);
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [colParentId, setColParentId] = useState<string>('');

  const loadProjects = async () => {
    if (!activeWorkspace) return;
    try {
      const projs = await projectService.list(activeWorkspace.id);
      setProjects(projs);
      if (projs.length > 0 && !selectedProject) {
        setSelectedProject(projs[0]);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadCollections = async (projId: string) => {
    try {
      const cols = await collectionService.list(projId);
      setCollections(cols);
      if (cols.length > 0 && !selectedCollection) {
        setSelectedCollection(cols[0]);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  };

  const loadRequests = async (colId: string) => {
    setLoading(true);
    try {
      const reqs = await requestService.list(colId);
      setRequests(reqs);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [activeWorkspace?.id]);

  useEffect(() => {
    if (selectedProject) {
      loadCollections(selectedProject.id);
    } else {
      setCollections([]);
      setSelectedCollection(null);
    }
  }, [selectedProject?.id]);

  useEffect(() => {
    if (selectedCollection) {
      loadRequests(selectedCollection.id);
    } else {
      setRequests([]);
    }
  }, [selectedCollection?.id]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !projName.trim()) return;
    try {
      const created = await projectService.create(activeWorkspace.id, {
        name: projName.trim(),
        description: projDesc.trim(),
      });
      await loadProjects();
      setSelectedProject(created);
      setShowProjModal(false);
      setProjName('');
      setProjDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !colName.trim()) return;
    try {
      const created = await collectionService.create(selectedProject.id, {
        name: colName.trim(),
        description: colDesc.trim(),
        parentId: colParentId || undefined,
      });
      await loadCollections(selectedProject.id);
      setSelectedCollection(created);
      setShowColModal(false);
      setColName('');
      setColDesc('');
      setColParentId('');
    } catch (err: any) {
      alert(err.message || 'Failed to create collection');
    }
  };

  const handleDuplicateRequest = async (requestId: string) => {
    try {
      await requestService.duplicate(requestId);
      if (selectedCollection) {
        loadRequests(selectedCollection.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate request');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
      await requestService.delete(requestId);
      if (selectedCollection) {
        loadRequests(selectedCollection.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete request');
    }
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
    <div className="flex h-[calc(100vh-3.5rem)] bg-slate-950 overflow-hidden">
      {/* Col 1: Projects sidebar */}
      <div className="w-64 border-r border-slate-800 flex flex-col justify-between bg-slate-900/30">
        <div>
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Projects
            </span>
            <button
              onClick={() => setShowProjModal(true)}
              className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30"
              title="Add Project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  selectedProject?.id === p.id
                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="truncate">{p.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {p.collectionCount || 0} col
                </span>
              </button>
            ))}

            {projects.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                No projects found. Create your first project to organize collections.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Col 2: Collections Tree within Project */}
      <div className="w-72 border-r border-slate-800 flex flex-col justify-between bg-slate-900/20">
        <div>
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 truncate">
              {selectedProject ? selectedProject.name : 'Collections'}
            </span>
            {selectedProject && (
              <button
                onClick={() => setShowColModal(true)}
                className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30"
                title="Add Collection / Folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {collections.map((col) => (
              <div key={col.id}>
                <button
                  onClick={() => setSelectedCollection(col)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    selectedCollection?.id === col.id
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center space-x-2 truncate">
                    <Folder className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="truncate">{col.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {col.requestCount || 0} req
                  </span>
                </button>

                {/* Sub-collections / Folders */}
                {col.children && col.children.length > 0 && (
                  <div className="pl-4 mt-1 space-y-1">
                    {col.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setSelectedCollection(child)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          selectedCollection?.id === child.id
                            ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                        }`}
                      >
                        <span className="flex items-center space-x-1.5 truncate">
                          <span className="text-slate-600">↳</span>
                          <span className="truncate">{child.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {child.requestCount || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {collections.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                No collections in this project.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Col 3: Requests in Collection */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {selectedCollection ? (
          <>
            <div className="p-3 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-indigo-400" />
                  <span>{selectedCollection.name}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedCollection.description || 'Collection requests and automated test suites'}
                </p>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => navigate(`/runner?collectionId=${selectedCollection.id}`)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glow-success transition-all cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Run Entire Collection</span>
                </button>

                <button
                  onClick={() => navigate('/request-builder')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Request</span>
                </button>
              </div>
            </div>

            {/* Requests Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs">Loading requests...</div>
              ) : requests.length > 0 ? (
                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-2xl overflow-hidden glass-panel">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-900/60 transition-colors group"
                    >
                      <div
                        onClick={() => navigate(`/request-builder?requestId=${req.id}`)}
                        className="flex items-center space-x-3 flex-1 cursor-pointer"
                      >
                        <span className={getMethodBadge(req.method)}>{req.method}</span>
                        <div>
                          <div className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors">
                            {req.name}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5 truncate max-w-md">
                            {req.url}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => navigate(`/test-builder?requestId=${req.id}`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-indigo-300 transition-colors"
                        >
                          {req.assertionCount || 0} assertions
                        </button>

                        <button
                          onClick={() => handleDuplicateRequest(req.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Duplicate Request"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 text-xs">
                  <p className="font-semibold text-slate-400">No requests in this collection yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click 'New Request' above to open the Request Builder and save endpoints.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Select a project and collection from the left sidebar to view requests.
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Auth Service"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Collection Modal */}
      {showColModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">New Collection or Folder</h3>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Users API, Onboarding Flow"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Parent Folder (Optional)
                </label>
                <select
                  value={colParentId}
                  onChange={(e) => setColParentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None (Root Collection)</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowColModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
