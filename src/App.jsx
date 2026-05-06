import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cacheState, defaultData, getPendingSyncScope, hasPendingSync, loadRemoteState, loadState, mergeStateByUpdatedAt, normalizeData, saveState } from './lib/storage.js';
import { logger } from './lib/logger.js';
import { usePwaUpdate } from './lib/pwaUpdate.js';
import { PROJECT_TABS, parseRoutePath, projectPath, projectRouteKey, resolveProjectByRouteParam, routePath, slugify, uniqueProjectSlug } from './lib/routes.js';
import Modal from './components/Modal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import PriorityDashboard from './components/PriorityDashboard.jsx';
import ProjectCard from './components/ProjectCard.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
import SyncStatus from './components/SyncStatus.jsx';
import AuthScreen, { AccountMenu } from './components/AuthScreen.jsx';
import { DEFAULT_PROJECT_COLOR } from './components/helpers.js';
import { getCurrentSession, subscribeToAuth } from './lib/auth.js';
import { isSupabaseConfigured } from './lib/supabase.js';

const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2, 9));
const nowIso = () => new Date().toISOString();
const priorityFromImportance = (importance) => (importance === 'high' ? 'high' : importance === 'low' ? 'low' : 'mid');

function routeFromLocation() {
  return parseRoutePath(window.location.pathname);
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

function sortProjects(projects = []) {
  return [...projects].sort((left, right) => {
    if (Boolean(left.pinned) !== Boolean(right.pinned)) return left.pinned ? -1 : 1;
    return 0;
  });
}

function markImportedStateForSync(importedState, currentState, timestamp) {
  const imported = normalizeData(importedState);
  const current = normalizeData(currentState);
  const importedProjectsById = new Map(imported.projects.map((project) => [project.id, project]));

  const nextProjects = imported.projects.map((project) => {
    const currentProject = current.projects.find((item) => item.id === project.id);
    return {
      ...project,
      updated_at: timestamp,
      deleted_at: project.deleted_at || null,
      sync_pending: true,
      files: withMissingItemTombstones(project.files || [], currentProject?.files || [], timestamp),
      tasks: withMissingTaskTombstones(project.tasks || [], currentProject?.tasks || [], timestamp),
    };
  });

  current.projects.forEach((project) => {
    if (importedProjectsById.has(project.id)) return;
    nextProjects.push({
      ...project,
      updated_at: timestamp,
      deleted_at: timestamp,
      sync_pending: true,
    });
  });

  return normalizeData({ ...imported, projects: nextProjects });
}

function withMissingTaskTombstones(importedTasks, currentTasks, timestamp) {
  const importedById = new Map(importedTasks.map((task) => [task.id, task]));
  const nextTasks = importedTasks.map((task) => {
    const currentTask = currentTasks.find((item) => item.id === task.id);
    return {
      ...task,
      updated_at: timestamp,
      deleted_at: task.deleted_at || null,
      sync_pending: true,
      subtasks: withMissingItemTombstones(task.subtasks || [], currentTask?.subtasks || [], timestamp),
    };
  });

  currentTasks.forEach((task) => {
    if (importedById.has(task.id)) return;
    nextTasks.push({
      ...task,
      updated_at: timestamp,
      deleted_at: timestamp,
      sync_pending: true,
      subtasks: (task.subtasks || []).map((subtask) => ({
        ...subtask,
        updated_at: timestamp,
        deleted_at: timestamp,
        sync_pending: true,
      })),
    });
  });

  return nextTasks;
}

function withMissingItemTombstones(importedItems, currentItems, timestamp) {
  const importedById = new Map(importedItems.map((item) => [item.id, item]));
  const nextItems = importedItems.map((item) => ({
    ...item,
    updated_at: timestamp,
    deleted_at: item.deleted_at || null,
    sync_pending: true,
  }));

  currentItems.forEach((item) => {
    if (importedById.has(item.id)) return;
    nextItems.push({
      ...item,
      updated_at: timestamp,
      deleted_at: timestamp,
      sync_pending: true,
    });
  });

  return nextItems;
}

export default function App() {
  const initialRoute = routeFromLocation();
  const [data, setData] = useState(defaultData);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncState, setSyncState] = useState('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState(null);
  const [view, setView] = useState(initialRoute.view);
  const [routeProjectParam, setRouteProjectParam] = useState(initialRoute.routeProjectParam);
  const [activeTab, setActiveTab] = useState(initialRoute.activeTab);
  const [pendingRoute, setPendingRoute] = useState(null);
  const [modal, setModal] = useState(null);
  const dataRef = useRef(defaultData);
  const isRefreshingRef = useRef(false);
  const { updateAvailable, reloadForUpdate } = usePwaUpdate();
  const user = session?.user || null;
  const syncUserId = user?.id || null;

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let alive = true;
    getCurrentSession()
      .then(({ session: currentSession }) => {
        if (!alive) return;
        setSession(currentSession);
        setAuthReady(true);
      })
      .catch((error) => {
        logger.error('Auth session load error', error);
        if (alive) setAuthReady(true);
      });

    return subscribeToAuth((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
  }, []);

  const refreshFromRemote = useCallback(async ({ silent = false } = {}) => {
    if (isRefreshingRef.current || isInitializing) return null;
    if (!syncUserId) return null;
    if (!window.navigator.onLine) {
      if (!silent) setSyncState('offline');
      return false;
    }

    isRefreshingRef.current = true;
    if (!silent) setSyncState('syncing');

    try {
      const remoteState = await loadRemoteState({ throwOnError: true, userId: syncUserId });
      if (!remoteState) {
        setLastSyncedAt(new Date());
        if (!silent) setSyncState('synced');
        return null;
      }

      const mergedState = mergeStateByUpdatedAt(dataRef.current, normalizeData(remoteState));
      let nextState = mergedState;
      dataRef.current = nextState;
      setData(nextState);
      cacheState(nextState, { userId: syncUserId });

      const pendingScope = getPendingSyncScope(mergedState);

      if (hasPendingSync(pendingScope)) {
        try {
          await saveState(mergedState, { changed: pendingScope, userId: syncUserId });
          const confirmedRemoteState = await loadRemoteState({ throwOnError: true, userId: syncUserId });
          if (confirmedRemoteState) {
            nextState = mergeStateByUpdatedAt(mergedState, normalizeData(confirmedRemoteState));
          }
        } catch (pendingError) {
          logger.error('Pending sync retry error', pendingError);
        }
      }

      dataRef.current = nextState;
      setData(nextState);
      cacheState(nextState, { userId: syncUserId });
      setLastSyncedAt(new Date());
      if (!silent) setSyncState('synced');
      return nextState;
    } catch (error) {
      logger.error('Remote refresh error', error);
      if (!silent) setSyncState('error');
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [isInitializing, syncUserId]);

  useEffect(() => {
    if (!authReady) return undefined;

    let alive = true;
    async function hydrateState() {
      let usedRemote = false;
      let hydratedState = null;
      setIsInitializing(true);
      setHasHydrated(false);
      try {
        const localState = await loadState({ userId: syncUserId });
        if (!alive) return;
        const normalizedLocal = normalizeData(localState);
        hydratedState = normalizedLocal;
        setData(normalizedLocal);
        if (syncUserId) {
          cacheState(normalizedLocal, { userId: syncUserId });
        }

        const remoteState = await loadRemoteState({ userId: syncUserId });
        if (!alive) return;

        const normalizedRemote = remoteState ? normalizeData(remoteState) : null;
        const hasRemoteProjects = Boolean(normalizedRemote?.projects?.length);
        const hasRemoteTasks = Boolean(normalizedRemote?.projects?.some((project) => project.tasks?.length));
        if (hasRemoteProjects || hasRemoteTasks) {
          usedRemote = true;
          const mergedState = mergeStateByUpdatedAt(normalizedLocal, normalizedRemote);
          hydratedState = mergedState;
          setData(mergedState);
          cacheState(mergedState, { userId: syncUserId });
        } else if (syncUserId && normalizedLocal.projects?.length) {
          setSyncState('syncing');
          await saveState(normalizedLocal, { userId: syncUserId });
          setLastSyncedAt(new Date());
          setSyncState('synced');
        }
      } catch (error) {
        logger.error('Hydration error', error);
      } finally {
        if (alive) {
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
    }

    hydrateState();
    return () => {
      alive = false;
    };
  }, [authReady, syncUserId]);

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

  const projects = useMemo(() => sortProjects(visibleProjects(data.projects)), [data.projects]);
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
      setView('notFound');
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
      const canonicalPath = projectPath(activeProject, activeTab);
      if (window.location.pathname !== canonicalPath) {
        logger.debug('route: canonicalizing project route', {
          from: window.location.pathname,
          to: canonicalPath,
        });
        window.history.replaceState(null, '', canonicalPath);
        setRouteProjectParam(projectRouteKey(activeProject));
      }
    }
  }, [hasHydrated, view, activeProject, projects, activeTab, pendingRoute]);

  const persist = useCallback((nextState, changed) => {
    const normalized = normalizeData(nextState);
    dataRef.current = normalized;
    setData(normalized);

    if (!hasHydrated || isInitializing) return;

    cacheState(normalized, { userId: syncUserId });

    if (!window.navigator.onLine) {
      setSyncState('offline');
      return;
    }
    if (!syncUserId) {
      setSyncState('idle');
      return;
    }

    setSyncState('syncing');
    saveState(normalized, { changed, userId: syncUserId })
      .then(() => {
        setLastSyncedAt(new Date());
        setSyncState('synced');
        return refreshFromRemote({ silent: true });
      })
      .catch((error) => {
        logger.error('State persistence error', error);
        setSyncState(window.navigator.onLine ? 'error' : 'offline');
      });
  }, [hasHydrated, isInitializing, refreshFromRemote, syncUserId]);

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
    const path = routePath({ ...nextRoute, currentPath: window.location.pathname });
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setView(nextRoute.view);
    setRouteProjectParam(nextRoute.project ? projectRouteKey(nextRoute.project) : nextRoute.routeProjectParam);
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
    if (!detailProject || !PROJECT_TABS.includes(tab)) return;
    navigate({ view: 'detail', project: detailProject, activeTab: tab });
  };

  const setFilters = (filters) => {
    updateData((current) => ({ ...current, filters: { ...current.filters, ...filters } }), { projects: [], tasks: [], subtasks: [] });
  };

  const openConfirm = useCallback(({ title, message, confirmLabel, onConfirm }) => {
    openModal(({ onClose }) => (
      <ConfirmModal title={title} message={message} confirmLabel={confirmLabel} onClose={onClose} onConfirm={onConfirm} />
    ));
  }, [openModal]);

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
    const title = task.title || task.text || '';
    const importance = task.importance || 'medium';
    updateProject(projectId, (project) => ({
      ...project,
      tasks: [...project.tasks, { id: taskId, title, text: title, description: task.description || '', priority: priorityFromImportance(importance), importance, done: false, expanded: false, updated_at: timestamp, deleted_at: null, sync_pending: true, subtasks: [] }],
    }), { tasks: [taskId] }, { markProjectPending: false });
  };

  const addProject = (project) => {
    const timestamp = nowIso();
    const projectId = uid();
    const nextProject = {
      id: projectId,
      slug: uniqueProjectSlug(project.name, data.projects, projectId),
      name: project.name,
      color: project.color || DEFAULT_PROJECT_COLOR,
      status: project.status || 'active',
      pinned: false,
      notes: '',
      files: [],
      tasks: [],
      updated_at: timestamp,
      deleted_at: null,
      sync_pending: true,
    };

    persist({
      ...data,
      projects: [...data.projects, nextProject],
    }, { projects: [projectId] });
  };

  const updateProjectMeta = (projectId, updates) => {
    const projectUpdates = updates.name ? { ...updates, slug: uniqueProjectSlug(updates.name, data.projects, projectId), updated_at: nowIso(), sync_pending: true } : { ...updates, updated_at: nowIso(), sync_pending: true };
    const nextState = normalizeData({
      ...data,
      projects: data.projects.map((project) => (project.id === projectId ? { ...project, ...projectUpdates } : project)),
    });
    const nextProjects = nextState.projects;
    const nextProject = nextProjects.find((project) => project.id === projectId);

    if (view === 'detail' && nextProject && detailProject?.id === projectId) {
      const resolvedNextProject = resolveProjectByRouteParam(nextProjects, nextProject.slug || slugify(nextProject.name) || nextProject.id) || nextProject;
      const nextRouteKey = projectRouteKey(resolvedNextProject);
      const nextPath = projectPath(resolvedNextProject, activeTab);
      setPendingRoute({ path: nextPath, routeProjectParam: nextRouteKey, activeTab });
    }

    persist(nextState, { projects: [projectId] });
  };

  const deleteProject = (projectId) => {
    const timestamp = nowIso();
    const nextState = normalizeData({
      ...data,
      projects: data.projects.map((project) => (
        project.id === projectId
          ? { ...project, deleted_at: timestamp, updated_at: timestamp, sync_pending: true }
          : project
      )),
    });

    persist(nextState, { projects: [projectId] });
    navigate({ view: 'home', routeProjectParam: null, activeTab: 'tasks' });
  };

  const confirmDeleteTask = (projectId, taskId) => {
    const project = projects.find((item) => item.id === projectId);
    const task = project?.tasks.find((item) => item.id === taskId);
    openConfirm({
      title: 'Delete Task',
      message: `Delete "${task?.title || task?.text || 'this task'}"? This removes it from the task list and syncs the deletion across devices.`,
      confirmLabel: 'Delete Task',
      onConfirm: () => deleteTask(projectId, taskId),
    });
  };

  const confirmDeleteSubtask = (projectId, taskId, subtaskId) => {
    const project = projects.find((item) => item.id === projectId);
    const task = project?.tasks.find((item) => item.id === taskId);
    const subtask = task?.subtasks.find((item) => item.id === subtaskId);
    openConfirm({
      title: 'Delete Subtask',
      message: `Delete "${subtask?.text || 'this subtask'}"?`,
      confirmLabel: 'Delete Subtask',
      onConfirm: () => deleteSubtask(projectId, taskId, subtaskId),
    });
  };

  const confirmDeleteFile = (projectId, fileId) => {
    const project = projects.find((item) => item.id === projectId);
    const file = project?.files.find((item) => item.id === fileId);
    openConfirm({
      title: 'Delete File',
      message: `Remove "${file?.name || 'this file'}" from ProjectDesk? Uploaded file metadata is hidden now; physical Storage cleanup can be added later.`,
      confirmLabel: 'Delete File',
      onConfirm: () => deleteFile(projectId, fileId),
    });
  };

  const updateTask = (projectId, taskId, updates) => {
    const timestamp = nowIso();
    const normalizedUpdates = {
      ...updates,
      ...(updates.title ? { text: updates.title } : {}),
      ...(updates.importance ? { priority: priorityFromImportance(updates.importance) } : {}),
    };
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, ...normalizedUpdates, updated_at: timestamp, sync_pending: true } : task)),
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
    const timestamp = nowIso();
    const nextFiles = files.map((file) => ({
      ...file,
      id: file.id || uid(),
      updated_at: file.updated_at || timestamp,
      deleted_at: file.deleted_at || null,
      sync_pending: true,
    }));

    updateProject(
      projectId,
      (project) => ({ ...project, files: [...project.files, ...nextFiles] }),
      { files: nextFiles.map((file) => file.id) },
      { markProjectPending: false },
    );
  };

  const deleteFile = (projectId, fileId) => {
    const timestamp = nowIso();
    updateProject(
      projectId,
      (project) => ({
        ...project,
        files: project.files.map((file) => (
          file.id === fileId ? { ...file, deleted_at: timestamp, updated_at: timestamp, sync_pending: true } : file
        )),
      }),
      { files: [fileId] },
      { markProjectPending: false },
    );
  };

  const updateFile = (projectId, fileId, updates) => {
    const timestamp = nowIso();
    updateProject(
      projectId,
      (project) => ({
        ...project,
        files: project.files.map((file) => (
          file.id === fileId ? { ...file, ...updates, updated_at: timestamp, sync_pending: true } : file
        )),
      }),
      { files: [fileId] },
      { markProjectPending: false },
    );
  };

  const showSaved = () => {
    setLastSyncedAt(new Date());
    setSyncState('synced');
  };

  const exportBackup = () => {
    const backup = normalizeData(dataRef.current);
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projectdesk-backup-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const importBackup = (backupState) => {
    const timestamp = nowIso();
    const replacement = markImportedStateForSync(backupState, dataRef.current, timestamp);
    persist(replacement);
  };
  const openDataTools = () => openModal(({ onClose }) => (
    <DataToolsModal onClose={onClose} onExport={exportBackup} onImport={importBackup} />
  ));
  const openNewProject = () => openModal(({ onClose }) => (
    <NewProjectModal onClose={onClose} onSubmit={addProject} />
  ));

  if (isSupabaseConfigured && authReady && !user) {
    return <AuthScreen authReady={authReady} isSupabaseConfigured={isSupabaseConfigured} />;
  }

  if (isSupabaseConfigured && !authReady) {
    return <AuthScreen authReady={authReady} isSupabaseConfigured={isSupabaseConfigured} />;
  }

  return (
    <>
      {view === 'notFound' ? (
        <NotFoundPage onGoHome={goHome} />
      ) : view === 'detail' && !detailProject ? (
        <RouteLoading />
      ) : view === 'home' ? (
        <main className="home">
          <div className="projects-section">
            <div className="home-header">
              <div>
                <h1>Projects</h1>
                <p>Manage tasks, notes, and files per project</p>
              </div>
              <div className="home-header-actions">
                <button className="add-btn" type="button" onClick={openNewProject}>+ New Project</button>
                {isSupabaseConfigured ? (
                  <AccountMenu user={user} onOpenData={openDataTools} onSignOut={() => setSyncState('idle')} />
                ) : (
                  <button className="data-btn" type="button" onClick={openDataTools}>Data</button>
                )}
              </div>
            </div>
            <div className="card-grid">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={() => openProject(project.id)} />
              ))}
            </div>
          </div>
          <PriorityDashboard
            projects={projects}
            filters={data.filters}
            onFiltersChange={setFilters}
            onToggleTask={toggleTask}
            onUpdateTask={updateTask}
            openModal={openModal}
          />
        </main>
      ) : (
        <ProjectDetail
          project={detailProject}
          activeTab={activeTab}
          onBack={goHome}
          onHome={goHome}
          onTabChange={switchTab}
          onUpdateProject={(updates) => updateProjectMeta(detailProject.id, updates)}
          onDeleteProject={() => deleteProject(detailProject.id)}
          onToggleTask={(taskId) => toggleTask(detailProject.id, taskId)}
          onToggleTaskExpanded={(taskId, expanded) => toggleTaskExpanded(detailProject.id, taskId, expanded)}
          onDeleteTask={(taskId) => confirmDeleteTask(detailProject.id, taskId)}
          onAddTask={(task) => addTask(detailProject.id, task)}
          onUpdateTask={(taskId, updates) => updateTask(detailProject.id, taskId, updates)}
          onToggleSubtask={(taskId, subtaskId) => toggleSubtask(detailProject.id, taskId, subtaskId)}
          onAddSubtask={(taskId, text) => addSubtask(detailProject.id, taskId, text)}
          onDeleteSubtask={(taskId, subtaskId) => confirmDeleteSubtask(detailProject.id, taskId, subtaskId)}
          onUpdateSubtask={(taskId, subtaskId, updates) => updateSubtask(detailProject.id, taskId, subtaskId, updates)}
          onUpdateNotes={(notes) => updateNotes(detailProject.id, notes)}
          onAddFiles={(files) => addFiles(detailProject.id, files)}
          onDeleteFile={(fileId) => confirmDeleteFile(detailProject.id, fileId)}
          onUpdateFile={(fileId, updates) => updateFile(detailProject.id, fileId, updates)}
          onShowSaved={showSaved}
          openModal={openModal}
          userId={syncUserId}
        />
      )}
      {updateAvailable && <UpdateToast onReload={reloadForUpdate} />}
      <SyncStatus state={syncState} lastSyncedAt={lastSyncedAt} />
      <Modal modal={modal} onClose={() => setModal(null)} />
    </>
  );
}

function RouteLoading() {
  return (
    <main className="not-found">
      <div className="not-found-card">
        <div className="not-found-kicker">Loading route</div>
        <h1>Opening project...</h1>
        <p>ProjectDesk is checking the saved project route.</p>
      </div>
    </main>
  );
}

function NotFoundPage({ onGoHome }) {
  return (
    <main className="not-found">
      <div className="not-found-card">
        <div className="not-found-kicker">404</div>
        <h1>Project route not found</h1>
        <p>This project link may have been renamed, deleted, or mistyped.</p>
        <button className="mbtn mbtn-pri" type="button" onClick={onGoHome}>Back to Projects</button>
      </div>
    </main>
  );
}

function UpdateToast({ onReload }) {
  return (
    <div className="update-toast" role="status" aria-live="polite">
      <span>Update available</span>
      <button type="button" onClick={onReload}>Reload</button>
    </div>
  );
}

function DataToolsModal({ onClose, onExport, onImport }) {
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [error, setError] = useState('');
  const [isReading, setIsReading] = useState(false);

  const readBackup = async (file) => {
    if (!file) return;
    setIsReading(true);
    setError('');
    setSelectedBackup(null);

    try {
      const parsed = JSON.parse(await file.text());
      const normalized = normalizeData(parsed);
      if (!Array.isArray(normalized.projects)) throw new Error('Backup file is missing projects.');
      setSelectedBackup({
        name: file.name,
        state: normalized,
        projectCount: normalized.projects.filter((project) => !project.deleted_at).length,
        taskCount: countTasks(normalized.projects),
      });
    } catch (importError) {
      setError(importError.message || 'Could not read this backup file.');
    } finally {
      setIsReading(false);
    }
  };

  const submitImport = () => {
    if (!selectedBackup) return;
    onImport(selectedBackup.state);
    onClose();
  };

  return (
    <>
      <h2>Data</h2>
      <p className="modal-note">Back up or restore your ProjectDesk data. Imports replace the current dataset and then sync the replacement.</p>
      <div className="data-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onExport}>Export JSON</button>
        <label className="import-btn">
          Import JSON
          <input type="file" accept="application/json,.json" onChange={(event) => readBackup(event.target.files?.[0])} />
        </label>
      </div>
      {isReading && <p className="modal-note">Reading backup...</p>}
      {error && <div className="warn-note danger-note">{error}</div>}
      {selectedBackup && (
        <div className="import-preview">
          <strong>{selectedBackup.name}</strong>
          <span>{selectedBackup.projectCount} projects · {selectedBackup.taskCount} tasks</span>
          <p>This will replace the current app data. Export a fresh backup first if you are unsure.</p>
        </div>
      )}
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>Close</button>
        <button className="mbtn mbtn-danger" type="button" disabled={!selectedBackup} onClick={submitImport}>Replace with Backup</button>
      </div>
    </>
  );
}

function NewProjectModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), status });
    onClose();
  };

  return (
    <>
      <h2>New Project</h2>
      <div className="field">
        <label>Project name</label>
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="Project name" />
      </div>
      <div className="field">
        <label>Status</label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="planning">Planning</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>Cancel</button>
        <button className="mbtn mbtn-pri" type="button" onClick={submit}>Create Project</button>
      </div>
    </>
  );
}
