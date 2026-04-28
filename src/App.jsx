import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultData, loadRemoteState, loadState, normalizeData, saveState } from './lib/storage.js';
import Modal from './components/Modal.jsx';
import PriorityDashboard from './components/PriorityDashboard.jsx';
import ProjectCard from './components/ProjectCard.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
import SyncStatus from './components/SyncStatus.jsx';

const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2, 9));
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
  const base = slugify(project.name) || project.id;
  const sameBase = projects.filter((item) => (slugify(item.name) || item.id) === base);
  if (sameBase.length <= 1) return base;
  const index = sameBase.findIndex((item) => item.id === project.id);
  return index <= 0 ? base : `${base}-${index + 1}`;
}

function findProjectByRouteKey(projects, routeKey) {
  return projects.find((project) => projectRouteKey(project, projects) === routeKey) ||
    projects.find((project) => project.id === routeKey);
}

function projectPath(project, projects, tab = 'tasks') {
  return `/projects/${encodeURIComponent(projectRouteKey(project, projects))}/${tab}`;
}

function routeFromLocation() {
  const parts = window.location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'projects' && parts[1]) {
    return { view: 'detail', activeId: parts[1], activeTab: tabs.includes(parts[2]) ? parts[2] : 'tasks' };
  }
  return { view: 'home', activeId: null, activeTab: 'tasks' };
}

function routePath({ view, activeId, activeTab, project, projects }) {
  if (view === 'detail' && project && projects) return projectPath(project, projects, activeTab || 'tasks');
  if (view === 'detail' && activeId) return `/projects/${encodeURIComponent(activeId)}/${activeTab || 'tasks'}`;
  return '/';
}

export default function App() {
  const initialRoute = routeFromLocation();
  const [data, setData] = useState(defaultData);
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSyncState] = useState('idle');
  const [view, setView] = useState(initialRoute.view);
  const [activeId, setActiveId] = useState(initialRoute.activeId);
  const [activeTab, setActiveTab] = useState(initialRoute.activeTab);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let alive = true;
    async function hydrateState() {
      const localState = await loadState();
      if (!alive) return;
      setData(normalizeData(localState));

      const remoteState = await loadRemoteState();
      if (!alive) return;
      if (remoteState?.projects?.length) {
        setData(normalizeData(remoteState));
      }
      setHydrated(true);
    }

    hydrateState();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const nextRoute = routeFromLocation();
      setView(nextRoute.view);
      setActiveId(nextRoute.activeId);
      setActiveTab(nextRoute.activeTab);
      setModal(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const projects = data.projects;
  const activeProject = useMemo(() => findProjectByRouteKey(projects, activeId), [projects, activeId]);

  useEffect(() => {
    if (hydrated && view === 'detail' && activeId && !activeProject) {
      window.history.replaceState(null, '', '/');
      setView('home');
      setActiveId(null);
      setActiveTab('tasks');
    }
  }, [hydrated, view, activeId, activeProject]);

  useEffect(() => {
    if (hydrated && view === 'detail' && activeProject) {
      const canonicalPath = projectPath(activeProject, projects, activeTab);
      if (window.location.pathname !== canonicalPath) {
        window.history.replaceState(null, '', canonicalPath);
        setActiveId(projectRouteKey(activeProject, projects));
      }
    }
  }, [hydrated, view, activeProject, projects, activeTab]);

  const persist = useCallback((nextState) => {
    const normalized = normalizeData(nextState);
    setData(normalized);

    if (!hydrated) return;

    setSyncState('saving');
    saveState(normalized)
      .then(() => setSyncState('saved'))
      .catch((error) => {
        console.error('State persistence error', error);
        setSyncState('saved');
      });
  }, [hydrated]);

  const updateData = useCallback((updater) => {
    const nextState = typeof updater === 'function' ? updater(data) : updater;
    persist(nextState);
  }, [data, persist]);

  const updateProject = useCallback((projectId, updater) => {
    updateData((current) => ({
      ...current,
      projects: current.projects.map((project) => (project.id === projectId ? updater(project) : project)),
    }));
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
    setActiveId(nextRoute.project ? projectRouteKey(nextRoute.project, projects) : nextRoute.activeId);
    setActiveTab(nextRoute.activeTab || 'tasks');
    setModal(null);
  }, [projects]);

  const openProject = (projectId) => {
    const project = projects.find((item) => item.id === projectId);
    if (project) navigate({ view: 'detail', project, activeTab: 'tasks' });
  };

  const goHome = () => {
    navigate({ view: 'home', activeId: null, activeTab: 'tasks' });
  };

  const switchTab = (tab) => {
    if (!activeProject || !tabs.includes(tab)) return;
    navigate({ view: 'detail', project: activeProject, activeTab: tab });
  };

  const setFilters = (filters) => {
    updateData((current) => ({ ...current, filters: { ...current.filters, ...filters } }));
  };

  const toggleTask = (projectId, taskId) => {
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    }));
  };

  const toggleTaskExpanded = (projectId, taskId, expanded) => {
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, expanded: expanded ?? !task.expanded } : task)),
    }));
  };

  const deleteTask = (projectId, taskId) => {
    updateProject(projectId, (project) => ({ ...project, tasks: project.tasks.filter((task) => task.id !== taskId) }));
  };

  const addTask = (projectId, task) => {
    updateProject(projectId, (project) => ({
      ...project,
      tasks: [...project.tasks, { id: uid(), text: task.text, priority: task.priority, importance: task.importance, done: false, expanded: false, subtasks: [] }],
    }));
  };

  const updateProjectMeta = (projectId, updates) => {
    const nextProjects = projects.map((project) => (project.id === projectId ? { ...project, ...updates } : project));
    const nextProject = nextProjects.find((project) => project.id === projectId);
    updateData((current) => ({
      ...current,
      projects: current.projects.map((project) => (project.id === projectId ? { ...project, ...updates } : project)),
    }));
    if (view === 'detail' && nextProject && activeProject?.id === projectId) {
      const nextPath = projectPath(nextProject, nextProjects, activeTab);
      window.history.replaceState(null, '', nextPath);
      setActiveId(projectRouteKey(nextProject, nextProjects));
    }
  };

  const updateTask = (projectId, taskId, updates) => {
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
    }));
  };

  const toggleSubtask = (projectId, taskId, subtaskId) => {
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => task.id === taskId ? {
        ...task,
        subtasks: task.subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask)),
      } : task),
    }));
  };

  const addSubtask = (projectId, taskId, text) => {
    if (!text.trim()) return;
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => task.id === taskId ? {
        ...task,
        expanded: true,
        subtasks: [...task.subtasks, { id: uid(), text: text.trim(), done: false }],
      } : task),
    }));
  };

  const deleteSubtask = (projectId, taskId, subtaskId) => {
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => task.id === taskId ? {
        ...task,
        subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
      } : task),
    }));
  };

  const updateSubtask = (projectId, taskId, subtaskId, updates) => {
    updateProject(projectId, (project) => ({
      ...project,
      tasks: project.tasks.map((task) => task.id === taskId ? {
        ...task,
        subtasks: task.subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, ...updates } : subtask)),
      } : task),
    }));
  };

  const updateNotes = (projectId, notes) => {
    updateProject(projectId, (project) => ({ ...project, notes }));
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

  const showSaved = () => setSyncState('saved');

  return (
    <>
      {view === 'home' || !activeProject ? (
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
          project={activeProject}
          activeTab={activeTab}
          onBack={goHome}
          onTabChange={switchTab}
          onUpdateProject={(updates) => updateProjectMeta(activeProject.id, updates)}
          onToggleTask={(taskId) => toggleTask(activeProject.id, taskId)}
          onToggleTaskExpanded={(taskId, expanded) => toggleTaskExpanded(activeProject.id, taskId, expanded)}
          onDeleteTask={(taskId) => deleteTask(activeProject.id, taskId)}
          onAddTask={(task) => addTask(activeProject.id, task)}
          onUpdateTask={(taskId, updates) => updateTask(activeProject.id, taskId, updates)}
          onToggleSubtask={(taskId, subtaskId) => toggleSubtask(activeProject.id, taskId, subtaskId)}
          onAddSubtask={(taskId, text) => addSubtask(activeProject.id, taskId, text)}
          onDeleteSubtask={(taskId, subtaskId) => deleteSubtask(activeProject.id, taskId, subtaskId)}
          onUpdateSubtask={(taskId, subtaskId, updates) => updateSubtask(activeProject.id, taskId, subtaskId, updates)}
          onUpdateNotes={(notes) => updateNotes(activeProject.id, notes)}
          onAddFiles={(files) => addFiles(activeProject.id, files)}
          onDeleteFile={(fileId) => deleteFile(activeProject.id, fileId)}
          onUpdateFile={(fileId, updates) => updateFile(activeProject.id, fileId, updates)}
          onShowSaved={showSaved}
          openModal={openModal}
        />
      )}
      <SyncStatus state={syncState} />
      <Modal modal={modal} onClose={() => setModal(null)} />
    </>
  );
}
