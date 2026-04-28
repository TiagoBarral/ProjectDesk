import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cacheState, defaultData, loadRemoteState, loadState, mergeStateByUpdatedAt, normalizeData, saveState } from './lib/storage.js';
import { logger } from './lib/logger.js';
import Modal from './components/Modal.jsx';
import PriorityDashboard from './components/PriorityDashboard.jsx';
import ProjectCard from './components/ProjectCard.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
import SyncStatus from './components/SyncStatus.jsx';

const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2, 9));
const nowIso = () => new Date().toISOString();
const tabs = ['tasks', 'notes', 'files'];

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function projectRouteKey(project, projects) {
  return project.slug || slugify(project.name) || project.id;
}

function resolveProjectByRouteParam(projects, routeParam) {
  if (!routeParam) return null;

  return projects.find((project) => project.slug === routeParam) ||
    projects.find((project) => slugify(project.name) === routeParam) ||
    projects.find((project) => project.id === routeParam) ||
    null;
}

function projectPath(project, projects, tab = 'tasks') {
  return `/projects/${encodeURIComponent(projectRouteKey(project, projects))}/${tab}`;
}

function routeFromLocation() {
  const parts = window.location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'projects' && parts[1]) {
    return { view: 'detail', routeProjectParam: parts[1], activeTab: tabs.includes(parts[2]) ? parts[2] : 'tasks' };
  }
  return { view: 'home', routeProjectParam: null, activeTab: 'tasks' };
}

function routePath({ view, routeProjectParam, activeTab, project, projects }) {
  if (view === 'detail' && project && projects) return projectPath(project, projects, activeTab || 'tasks');
  if (view === 'detail' && routeProjectParam) return `/projects/${encodeURIComponent(routeProjectParam)}/${activeTab || 'tasks'}`;
  return '/';
}

function countTasks(projects = []) {
  return visibleProjects(projects).reduce((total, project) => total + (project.tasks?.length || 0), 0);
}

function visibleProjects(projects = []) {
  return projects
    .filter((project) => !project.deleted_at)
    .map((project) => ({
      ...project,
      tasks: (project.tasks || [])
        .filter((task) => !task.deleted_at)
        .map((task) => ({
          ...task,
          subtasks: (task.subtasks || []).filter((subtask) => !subtask.deleted_at),
        })),
    }));
}

export default function App() {
  const initialRoute = routeFromLocation();
  const [data, setData] = useState(defaultData);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncState, setSyncState] = useState('idle');
  const [view, setView] = useState(initialRoute.view);
  const [routeProjectParam, setRouteProjectParam] = useState(initialRoute.routeProjectParam);
  const [activeTab, setActiveTab] = useState(initialRoute.activeTab);
  const [pendingRoute, setPendingRoute] = useState(null);
  const [modal, setModal] = useState(null);
  const dataRef = useRef(defaultData);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const refreshFromRemote = useCallback(async () => {
    if (isRefreshingRef.current || isInitializing) return null;
    if (!window.navigator.onLine) {
      setSyncState('offline');
      return false;
    }

    isRefreshingRef.current = true;
    setSyncState('syncing');

    try {
      const remoteState = await loadRemoteState({ throwOnError: true });
      if (!remoteState) {
        setSyncState('synced');
        return null;
      }

      const mergedState = mergeStateByUpdatedAt(dataRef.current, normalizeData(remoteState));
      dataRef.current = mergedState;
      setData(mergedState);
      cacheState(mergedState);
      setSyncState('synced');
      return mergedState;
    } catch (error) {
      logger.error('Remote refresh error', error);
      setSyncState('error');
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [isInitializing]);

  useEffect(() => {
    let alive = true;
    async function hydrateState() {
      let usedRemote = false;
      let hydratedState = null;
      try {
        const localState = await loadState();
        if (!alive) return;
        const normalizedLocal = normalizeData(localState);
        hydratedState = normalizedLocal;
        setData(normalizedLocal);

        const remoteState = await loadRemoteState();
        if (!alive) return;

        const normalizedRemote = remoteState ? normalizeData(remoteState) : null;
        const hasRemoteProjects = Boolean(normalizedRemote?.projects?.length);
        const hasRemoteTasks = Boolean(normalizedRemote?.projects?.some((project) => project.tasks?.length));
        if (hasRemoteProjects || hasRemoteTasks) {
          usedRemote = true;
          const mergedState = mergeStateByUpdatedAt(normalizedLocal, normalizedRemote);
          hydratedState = mergedState;
          setData(mergedState);
          cacheState(mergedState);
        }
      } catch (error) {
        logger.error('Hydration error', error);
      } finally {
        if (!alive) return;
        logger.info('hydrate: complete', {
          usedRemote,
          projectCount: hydratedState?.projects?.length || 0,
          taskCount: countTasks(hydratedState?.projects),
        });
        if (hydratedState) {
          dataRef.current = hydratedState;
        }
        setHasHydrated(true);
        setIsInitializing(false);
      }
    }

    hydrateState();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated || isInitializing) return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshFromRemote();
      }
    };
    const refreshOnFocus = () => refreshFromRemote();
    const interval = window.setInterval(() => refreshFromRemote(), 20000);

    refreshFromRemote();
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [hasHydrated, isInitializing, refreshFromRemote]);

  useEffect(() => {
    const handleOffline = () => setSyncState('offline');
    const handleOnline = () => {
      setSyncState('syncing');
      refreshFromRemote();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (!window.navigator.onLine) {
      setSyncState('offline');
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshFromRemote]);

  const projects = useMemo(() => visibleProjects(data.projects), [data.projects]);
  const activeProject = useMemo(
    () => resolveProjectByRouteParam(projects, routeProjectParam),
    [projects, routeProjectParam],
  );
  const pendingRouteProject = useMemo(
    () => pendingRoute ? resolveProjectByRouteParam(projects, pendingRoute.routeProjectParam) : null,
    [projects, pendingRoute],
  );
  const detailProject = activeProject || pendingRouteProject;

  useEffect(() => {
    const onPopState = () => {
      const nextRoute = routeFromLocation();
      setView(nextRoute.view);
      setRouteProjectParam(nextRoute.routeProjectParam);
      setActiveTab(nextRoute.activeTab);
      setPendingRoute(null);
      setModal(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (pendingRoute) return;
    if (!hasHydrated || isInitializing || view !== 'detail' || !routeProjectParam) return;

    const resolvedProject = resolveProjectByRouteParam(projects, routeProjectParam);
    if (!resolvedProject) {
      logger.warn('route: unresolved project route', {
        routeProjectParam,
        path: window.location.pathname,
        projectCount: projects.length,
      });
      window.history.replaceState(null, '', '/');
      setView('home');
      setRouteProjectParam(null);
      setActiveTab('tasks');
    }
  }, [hasHydrated, isInitializing, view, routeProjectParam, projects, pendingRoute]);

  useEffect(() => {
    if (!pendingRoute) return;

    const resolvedProject = resolveProjectByRouteParam(projects, pendingRoute.routeProjectParam);
    if (!resolvedProject) return;

    if (window.location.pathname !== pendingRoute.path) {
      window.history.replaceState(null, '', pendingRoute.path);
    }
    setView('detail');
    setRouteProjectParam(pendingRoute.routeProjectParam);
    setActiveTab(pendingRoute.activeTab || 'tasks');
    setPendingRoute(null);
  }, [projects, pendingRoute]);

  useEffect(() => {
    if (pendingRoute) return;
    if (hasHydrated && view === 'detail' && activeProject) {
      const canonicalPath = projectPath(activeProject, projects, activeTab);
      if (window.location.pathname !== canonicalPath) {
        logger.debug('route: canonicalizing project route', {
          from: window.location.pathname,
          to: canonicalPath,
        });
        window.history.replaceState(null, '', canonicalPath);
        setRouteProjectParam(projectRouteKey(activeProject, projects));
      }
    }
  }, [hasHydrated, view, activeProject, projects, activeTab, pendingRoute]);

  const persist = useCallback((nextState, changed) => {
    const normalized = normalizeData(nextState);
    dataRef.current = normalized;
    setData(normalized);

    if (!hasHydrated || isInitializing) return;

    if (!window.navigator.onLine) {
      setSyncState('offline');
      return;
    }

    setSyncState('syncing');
    saveState(normalized, { changed })
      .then(() => refreshFromRemote())
      .then((refreshResult) => {
        if (refreshResult !== false) setSyncState('synced');
      })
      .catch((error) => {
        logger.error('State persistence error', error);
        setSyncState(window.navigator.onLine ? 'error' : 'offline');
      });
  }, [hasHydrated, isInitializing, refreshFromRemote]);

  const updateData = useCallback((updater, changed) => {
    const nextState = typeof updater === 'function' ? updater(data) : updater;
    persist(nextState, changed);
  }, [data, persist]);

  const updateProject = useCallback((projectId, updater, changed = { projects: [projectId] }, options = {}) => {
    const { markProjectPending = true } = options;
    updateData((current) => ({
      ...current,
      projects: current.projects.map((project) => {
        if (project.id !== projectId) return project;
        const updatedProject = updater(project);
        return {
          ...updatedProject,
          updated_at: nowIso(),
          sync_pending: markProjectPending ? true : Boolean(updatedProject.sync_pending),
        };
      }),
    }), changed);
  }, [updateData]);

  const openModal = useCallback((renderModal) => {
    setModal(() => renderModal);
  }, []);

  const navigate = useCallback((nextRoute) => {
    const path = routePath({ ...nextRoute, projects });
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setView(nextRoute.view);
    setRouteProjectParam(nextRoute.project ? projectRouteKey(nextRoute.project, projects) : nextRoute.routeProjectParam);
    setActiveTab(nextRoute.activeTab || 'tasks');
    setPendingRoute(null);
    setModal(null);
  }, [projects]);

  const openProject = (projectId) => {
    const project = projects.find((item) => item.id === projectId);
    if (project) navigate({ view: 'detail', project, activeTab: 'tasks' });
  };

  const goHome = () => {
    navigate({ view: 'home', routeProjectParam: null, activeTab: 'tasks' });
  };

  const switchTab = (tab) => {
    if (!detailProject || !tabs.includes(tab)) return;
    navigate({ view: 'detail', project: detailProject, activeTab: tab });
  };

  const setFilters = (filters) => {
    updateData((current) => ({ ...current, filters: { ...current.filters, ...filters } }), { projects: [], tasks: [], subtasks: [] });
  };

  const toggleTask = (projectId, taskId) => {
    const timestamp = nowIso();
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done, updated_at: timestamp, sync_pending: true } : task)),
    }), { tasks: [taskId] }, { markProjectPending: false });
  };

  const toggleTaskExpanded = (projectId, taskId, expanded) => {
    const timestamp = nowIso();
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, expanded: expanded ?? !task.expanded, updated_at: timestamp, sync_pending: true } : task)),
    }), { tasks: [taskId] }, { markProjectPending: false });
  };

  const deleteTask = (projectId, taskId) => {
    const timestamp = nowIso();
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => (
        task.id === taskId ? { ...task, deleted_at: timestamp, updated_at: timestamp, sync_pending: true } : task
      )),
    }), { tasks: [taskId] }, { markProjectPending: false });
  };

  const addTask = (projectId, task) => {
    const timestamp = nowIso();
    const taskId = uid();
    updateProject(projectId, (project) => ({
      ...project,
      tasks: [...project.tasks, { id: taskId, text: task.text, priority: task.priority, importance: task.importance, done: false, expanded: false, updated_at: timestamp, deleted_at: null, sync_pending: true, subtasks: [] }],
    }), { tasks: [taskId] }, { markProjectPending: false });
  };

  const updateProjectMeta = (projectId, updates) => {
    const projectUpdates = updates.name ? { ...updates, slug: slugify(updates.name), updated_at: nowIso(), sync_pending: true } : { ...updates, updated_at: nowIso(), sync_pending: true };
    const nextState = normalizeData({
      ...data,
      projects: data.projects.map((project) => (project.id === projectId ? { ...project, ...projectUpdates } : project)),
    });
    const nextProjects = nextState.projects;
    const nextProject = nextProjects.find((project) => project.id === projectId);

    if (view === 'detail' && nextProject && detailProject?.id === projectId) {
      const resolvedNextProject = resolveProjectByRouteParam(nextProjects, nextProject.slug || slugify(nextProject.name) || nextProject.id) || nextProject;
      const nextRouteKey = projectRouteKey(resolvedNextProject, nextProjects);
      const nextPath = projectPath(resolvedNextProject, nextProjects, activeTab);
      setPendingRoute({ path: nextPath, routeProjectParam: nextRouteKey, activeTab });
    }

    persist(nextState, { projects: [projectId] });
  };

  const updateTask = (projectId, taskId, updates) => {
    const timestamp = nowIso();
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, ...updates, updated_at: timestamp, sync_pending: true } : task)),
    }), { tasks: [taskId] }, { markProjectPending: false });
  };

  const toggleSubtask = (projectId, taskId, subtaskId) => {
    const timestamp = nowIso();
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => task.id === taskId ? {
        ...task,
        updated_at: timestamp,
        sync_pending: true,
        subtasks: task.subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, done: !subtask.done, updated_at: timestamp, sync_pending: true } : subtask)),
      } : task),
    }), { tasks: [taskId], subtasks: [subtaskId] }, { markProjectPending: false });
  };

  const addSubtask = (projectId, taskId, text) => {
    if (!text.trim()) return;
    const timestamp = nowIso();
    const subtaskId = uid();
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => task.id === taskId ? {
        ...task,
        expanded: true,
        updated_at: timestamp,
        sync_pending: true,
        subtasks: [...task.subtasks, { id: subtaskId, text: text.trim(), done: false, updated_at: timestamp, deleted_at: null, sync_pending: true }],
      } : task),
    }), { tasks: [taskId], subtasks: [subtaskId] }, { markProjectPending: false });
  };

  const deleteSubtask = (projectId, taskId, subtaskId) => {
    const timestamp = nowIso();
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => task.id === taskId ? {
        ...task,
        updated_at: timestamp,
        sync_pending: true,
        subtasks: task.subtasks.map((subtask) => (
          subtask.id === subtaskId ? { ...subtask, deleted_at: timestamp, updated_at: timestamp, sync_pending: true } : subtask
        )),
      } : task),
    }), { tasks: [taskId], subtasks: [subtaskId] }, { markProjectPending: false });
  };

  const updateSubtask = (projectId, taskId, subtaskId, updates) => {
    const timestamp = nowIso();
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => task.id === taskId ? {
        ...task,
        updated_at: timestamp,
        sync_pending: true,
        subtasks: task.subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, ...updates, updated_at: timestamp, sync_pending: true } : subtask)),
      } : task),
    }), { tasks: [taskId], subtasks: [subtaskId] }, { markProjectPending: false });
  };

  const updateNotes = (projectId, notes) => {
    updateProject(projectId, (project) => ({ ...project, notes, updated_at: nowIso() }));
  };

  const addFiles = (projectId, files) => {
    updateProject(projectId, (project) => ({ ...project, files: [...project.files, ...files] }));
  };

  const deleteFile = (projectId, fileId) => {
    updateProject(projectId, (project) => ({ ...project, files: project.files.filter((file) => file.id !== fileId) }));
  };

  const updateFile = (projectId, fileId, updates) => {
    updateProject(projectId, (project) => ({
      ...project,
      files: project.files.map((file) => (file.id === fileId ? { ...file, ...updates } : file)),
    }));
  };

  const showSaved = () => setSyncState('synced');

  return (
    <>
      {view === 'home' || !detailProject ? (
        <main className="home">
          <PriorityDashboard
            projects={projects}
            filters={data.filters}
            onFiltersChange={setFilters}
            onToggleTask={toggleTask}
          />
          <div className="home-header">
            <h1>My Projects</h1>
            <p>Manage tasks, notes, and files per project</p>
          </div>
          <div className="card-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onOpen={() => openProject(project.id)} />
            ))}
          </div>
        </main>
      ) : (
        <ProjectDetail
          project={detailProject}
          activeTab={activeTab}
          onBack={goHome}
          onTabChange={switchTab}
          onUpdateProject={(updates) => updateProjectMeta(detailProject.id, updates)}
          onToggleTask={(taskId) => toggleTask(detailProject.id, taskId)}
          onToggleTaskExpanded={(taskId, expanded) => toggleTaskExpanded(detailProject.id, taskId, expanded)}
          onDeleteTask={(taskId) => deleteTask(detailProject.id, taskId)}
          onAddTask={(task) => addTask(detailProject.id, task)}
          onUpdateTask={(taskId, updates) => updateTask(detailProject.id, taskId, updates)}
          onToggleSubtask={(taskId, subtaskId) => toggleSubtask(detailProject.id, taskId, subtaskId)}
          onAddSubtask={(taskId, text) => addSubtask(detailProject.id, taskId, text)}
          onDeleteSubtask={(taskId, subtaskId) => deleteSubtask(detailProject.id, taskId, subtaskId)}
          onUpdateSubtask={(taskId, subtaskId, updates) => updateSubtask(detailProject.id, taskId, subtaskId, updates)}
          onUpdateNotes={(notes) => updateNotes(detailProject.id, notes)}
          onAddFiles={(files) => addFiles(detailProject.id, files)}
          onDeleteFile={(fileId) => deleteFile(detailProject.id, fileId)}
          onUpdateFile={(fileId, updates) => updateFile(detailProject.id, fileId, updates)}
          onShowSaved={showSaved}
          openModal={openModal}
        />
      )}
      <SyncStatus state={syncState} />
      <Modal modal={modal} onClose={() => setModal(null)} />
    </>
  );
}
