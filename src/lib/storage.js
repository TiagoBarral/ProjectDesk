import { isSupabaseConfigured, supabase } from './supabase.js';

const STORAGE_KEY = 'project-ecosystem:data:v2';

export const defaultData = {
  projects: [
    {
      id: 'polimetrics',
      name: 'PoliMetrics',
      color: '#5e5ce6',
      status: 'active',
      tasks: [
        {
          id: 'pm-t1',
          text: 'Finish polling dashboard wireframes',
          priority: 'high',
          importance: 'high',
          done: false,
          expanded: true,
          subtasks: [
            { id: 'pm-t1-s1', text: 'Define top-line KPI cards', done: true },
            { id: 'pm-t1-s2', text: 'Sketch district comparison table', done: false },
            { id: 'pm-t1-s3', text: 'Check mobile chart stacking', done: false },
          ],
        },
        {
          id: 'pm-t2',
          text: 'Clean sample election dataset',
          priority: 'mid',
          importance: 'medium',
          done: false,
          expanded: false,
          subtasks: [
            { id: 'pm-t2-s1', text: 'Normalize candidate names', done: false },
            { id: 'pm-t2-s2', text: 'Remove duplicate polling rows', done: false },
          ],
        },
        {
          id: 'pm-t3',
          text: 'Write tooltip copy for confidence intervals',
          priority: 'low',
          importance: 'low',
          done: true,
          expanded: false,
          subtasks: [
            { id: 'pm-t3-s1', text: 'Draft plain-language explanation', done: true },
            { id: 'pm-t3-s2', text: 'Review with dashboard labels', done: true },
          ],
        },
      ],
      notes: 'PoliMetrics focus this week:\n\n- Keep the dashboard dense and analytical.\n- Make the mobile view easy to scan during quick checks.\n- Priority is the polling dashboard, then data cleanup, then copy polish.\n\nQuestions to validate: are confidence intervals understandable without extra documentation?',
      files: [
        { id: 'pm-f1', name: 'Polling dashboard brief', kind: 'link', path: 'https://example.com/polimetrics/brief', date: '4/27/2026' },
        { id: 'pm-f2', name: 'dataset-cleaning-notes.csv', kind: 'link', path: 'D:\\Projects\\PoliMetrics\\dataset-cleaning-notes.csv', date: '4/27/2026' },
      ],
    },
    {
      id: 'leadbridge',
      name: 'LeadBridge',
      color: '#ff9500',
      status: 'active',
      tasks: [
        {
          id: 'lb-t1',
          text: 'Map CRM onboarding flow',
          priority: 'high',
          importance: 'high',
          done: false,
          expanded: true,
          subtasks: [
            { id: 'lb-t1-s1', text: 'List required contact fields', done: true },
            { id: 'lb-t1-s2', text: 'Design import review step', done: false },
            { id: 'lb-t1-s3', text: 'Add duplicate detection notes', done: false },
          ],
        },
        {
          id: 'lb-t2',
          text: 'Prototype lead scoring rules',
          priority: 'mid',
          importance: 'medium',
          done: false,
          expanded: false,
          subtasks: [
            { id: 'lb-t2-s1', text: 'Score recent activity', done: false },
            { id: 'lb-t2-s2', text: 'Weight company fit', done: false },
            { id: 'lb-t2-s3', text: 'Flag stale leads', done: false },
          ],
        },
        {
          id: 'lb-t3',
          text: 'Review empty states for pipeline board',
          priority: 'low',
          importance: 'low',
          done: true,
          expanded: false,
          subtasks: [
            { id: 'lb-t3-s1', text: 'Check no-leads state', done: true },
            { id: 'lb-t3-s2', text: 'Check filtered-out state', done: true },
          ],
        },
      ],
      notes: 'LeadBridge validation notes:\n\n- Main workflow should feel operational, not like a marketing page.\n- Test table-to-card transitions on Android.\n- Use the high-priority CRM onboarding task to check dashboard filters.\n\nPotential later Supabase tables: organizations, contacts, leads, lead_events.',
      files: [
        { id: 'lb-f1', name: 'CRM import checklist', kind: 'link', path: 'https://example.com/leadbridge/import-checklist', date: '4/27/2026' },
      ],
    },
    {
      id: 'portfolio',
      name: 'Portfolio Journal',
      color: '#34c759',
      status: 'active',
      tasks: [
        {
          id: 'pf-t1',
          text: 'Explore portfolio entry templates',
          priority: 'mid',
          importance: 'medium',
          done: false,
          expanded: true,
          subtasks: [
            { id: 'pf-t1-s1', text: 'Collect three reference layouts', done: true },
            { id: 'pf-t1-s2', text: 'Pick fields for project metadata', done: false },
            { id: 'pf-t1-s3', text: 'Test long title wrapping', done: false },
          ],
        },
        {
          id: 'pf-t2',
          text: 'Write first case study draft',
          priority: 'high',
          importance: 'high',
          done: false,
          expanded: false,
          subtasks: [
            { id: 'pf-t2-s1', text: 'Outline problem and constraints', done: false },
            { id: 'pf-t2-s2', text: 'Add screenshots checklist', done: false },
            { id: 'pf-t2-s3', text: 'Summarize outcome metrics', done: false },
          ],
        },
        {
          id: 'pf-t3',
          text: 'Tag older notes by theme',
          priority: 'low',
          importance: 'low',
          done: true,
          expanded: false,
          subtasks: [
            { id: 'pf-t3-s1', text: 'Create themes list', done: true },
            { id: 'pf-t3-s2', text: 'Tag five sample notes', done: true },
          ],
        },
      ],
      notes: 'Portfolio Journal notes:\n\n- Daily use should be quick: capture the project, what changed, and why it matters.\n- Check notes autosave by typing here, navigating away, and coming back.\n- Case study draft is the highest-value next task.',
      files: [
        { id: 'pf-f1', name: 'Portfolio inspiration board', kind: 'link', path: 'https://example.com/portfolio/inspiration', date: '4/27/2026' },
      ],
    },
    {
      id: 'spark',
      name: 'SPARK',
      color: '#ff2d55',
      status: 'active',
      tasks: [
        {
          id: 'sp-t1',
          text: 'Define SPARK weekly planning ritual',
          priority: 'high',
          importance: 'high',
          done: false,
          expanded: true,
          subtasks: [
            { id: 'sp-t1-s1', text: 'Choose recurring review questions', done: false },
            { id: 'sp-t1-s2', text: 'Create energy and focus labels', done: false },
            { id: 'sp-t1-s3', text: 'Decide Sunday or Monday cadence', done: true },
          ],
        },
        {
          id: 'sp-t2',
          text: 'Build idea backlog categories',
          priority: 'mid',
          importance: 'medium',
          done: false,
          expanded: false,
          subtasks: [
            { id: 'sp-t2-s1', text: 'Separate experiments from commitments', done: false },
            { id: 'sp-t2-s2', text: 'Add quick-win category', done: false },
          ],
        },
        {
          id: 'sp-t3',
          text: 'Archive completed April experiments',
          priority: 'low',
          importance: 'low',
          done: true,
          expanded: false,
          subtasks: [
            { id: 'sp-t3-s1', text: 'Move finished items to notes', done: true },
            { id: 'sp-t3-s2', text: 'Keep one lesson per experiment', done: true },
          ],
        },
      ],
      notes: 'SPARK notes:\n\n- Use this project to test quick capture, completion stats, subtasks, and low-priority filtering.\n- The weekly planning ritual is intentionally expanded to verify nested subtasks on mobile.\n- Keep the visual style calm even when the task list is busy.',
      files: [
        { id: 'sp-f1', name: 'SPARK ritual draft', kind: 'link', path: 'D:\\Projects\\SPARK\\weekly-ritual.md', date: '4/27/2026' },
      ],
    },
  ],
  filters: { importance: 'all', project: 'all', status: 'active' },
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hash32(value, seed) {
  let hash = 0x811c9dc5 ^ seed;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function stableUuid(value) {
  const source = String(value || 'projectdesk-id');
  const hex = [0, 1, 2, 3].map((seed) => hash32(source, seed * 0x9e3779b9)).join('');
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function ensureUuid(value, fallback) {
  const raw = String(value || '').trim();
  return UUID_RE.test(raw) ? raw : stableUuid(raw || fallback);
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeData(data) {
  const safe = data && Array.isArray(data.projects) ? data : defaultData;
  return {
    projects: safe.projects.map((project, projectIndex) => {
      const projectId = ensureUuid(project.id, `project:${projectIndex}:${project.name || ''}`);
      const projectSlug = slugify(project.name) || slugify(project.slug) || projectId;
      return {
        id: projectId,
        slug: projectSlug,
        name: project.name,
        color: project.color,
        status: project.status || 'planning',
        notes: project.notes || '',
        updated_at: project.updated_at || null,
        files: Array.isArray(project.files) ? project.files : [],
        tasks: (project.tasks || []).map((task, taskIndex) => {
          const taskId = ensureUuid(task.id, `task:${projectId}:${taskIndex}:${task.text || ''}`);
          return {
            id: taskId,
            text: task.text || '',
            priority: task.priority || 'mid',
            importance: task.importance || 'medium',
            done: Boolean(task.done),
            expanded: Boolean(task.expanded),
            updated_at: task.updated_at || null,
            subtasks: (task.subtasks || []).map((subtask, subtaskIndex) => ({
              id: ensureUuid(subtask.id, `subtask:${taskId}:${subtaskIndex}:${subtask.text || ''}`),
              text: subtask.text || '',
              done: Boolean(subtask.done),
            })),
          };
        }),
      };
    }),
    filters: {
      importance: safe.filters?.importance || 'all',
      project: safe.filters?.project && safe.filters.project !== 'all' ? ensureUuid(safe.filters.project, safe.filters.project) : 'all',
      status: safe.filters?.status || 'active',
    },
  };
}

let syncQueue = Promise.resolve();

export async function loadState() {
  return loadLocalFallback();
}

export async function loadRemoteState() {
  if (!isSupabaseConfigured) return null;

  try {
    const [projectsResult, tasksResult, subtasksResult] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('subtasks').select('*'),
    ]);

    const firstError = [projectsResult, tasksResult, subtasksResult].find((result) => result.error)?.error;
    if (firstError) throw firstError;
    if (!projectsResult.data?.length) return null;

    const filesResult = await supabase.from('files').select('*');
    if (filesResult.error) {
      console.error('Supabase files load error', filesResult.error);
    }

    console.log('[remote rows]', {
      projects: projectsResult.data?.length,
      tasks: tasksResult.data?.length,
      subtasks: subtasksResult.data?.length,
    });

    const remoteState = composeData({
      projects: projectsResult.data || [],
      tasks: tasksResult.data || [],
      subtasks: subtasksResult.data || [],
      files: filesResult.error ? [] : filesResult.data || [],
    });
    const normalized = normalizeData(remoteState);
    return normalized;
  } catch (error) {
    console.error('Supabase load error', error);
    return null;
  }
}

export function mergeStateByUpdatedAt(localState, remoteState) {
  const local = normalizeData(localState);
  const remote = normalizeData(remoteState);
  const localProjects = new Map(local.projects.map((project) => [project.id, project]));
  const remoteProjects = new Map(remote.projects.map((project) => [project.id, project]));
  const projectIds = new Set([...localProjects.keys(), ...remoteProjects.keys()]);

  return normalizeData({
    projects: Array.from(projectIds).map((projectId) => {
      const localProject = localProjects.get(projectId);
      const remoteProject = remoteProjects.get(projectId);
      if (!localProject) return remoteProject;
      if (!remoteProject) return localProject;

      const projectBase = isNewer(localProject.updated_at, remoteProject.updated_at) ? localProject : remoteProject;
      return {
        ...projectBase,
        tasks: mergeTasksByUpdatedAt(localProject.tasks || [], remoteProject.tasks || []),
      };
    }),
    filters: local.filters || remote.filters || defaultData.filters,
  });
}

export async function saveState(state) {
  const normalized = normalizeData(state);
  writeLocalState(normalized);

  if (isSupabaseConfigured) {
    syncQueue = syncQueue
      .catch(() => undefined)
      .then(() => syncStateToSupabase(normalized))
      .catch((error) => {
        console.error('Supabase save error', error);
      });
  }

  return normalized;
}

export function cacheState(state) {
  const normalized = normalizeData(state);
  writeLocalState(normalized);
  return normalized;
}

function readLocalState() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return clone(defaultData);
  return normalizeData(JSON.parse(raw));
}

function writeLocalState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(state)));
}

async function loadLocalFallback() {
  try {
    return readLocalState();
  } catch (error) {
    console.error('localStorage load error', error);
    return clone(defaultData);
  }
}

function composeData({ projects, tasks, subtasks, files }) {
  const tasksByProject = groupBy(tasks, 'project_id');
  const subtasksByTask = groupBy(subtasks, 'task_id');
  const filesByProject = groupBy(files, 'project_id');

  return {
    projects: projects.map((project) => ({
      id: project.id,
      slug: project.slug || slugify(project.name || project.title || '') || project.id,
      name: project.name || project.title || '',
      color: project.color || '#5e5ce6',
      status: project.status || 'active',
      notes: project.notes || '',
      updated_at: project.updated_at || null,
      files: (filesByProject[project.id] || []).map((file) => ({
        id: file.id,
        name: file.name,
        kind: file.kind || 'link',
        path: file.path || '',
        mimeType: file.mime_type || file.mimeType || '',
        size: file.size_bytes || file.size || 0,
        date: file.date_label || file.date || '',
        data: file.data_url || file.data || '',
      })),
      tasks: (tasksByProject[project.id] || []).map((task) => ({
        id: task.id,
        text: task.text || task.title || '',
        priority: task.priority || 'mid',
        importance: task.importance || 'medium',
        done: Boolean(task.done ?? task.completed),
        expanded: Boolean(task.expanded),
        updated_at: task.updated_at || null,
        subtasks: (subtasksByTask[task.id] || []).map((subtask) => ({
          id: subtask.id,
          text: subtask.text || subtask.title || '',
          done: Boolean(subtask.done ?? subtask.completed),
        })),
      })),
    })),
    filters: defaultData.filters,
  };
}

function mergeTasksByUpdatedAt(localTasks, remoteTasks) {
  const localById = new Map(localTasks.map((task) => [task.id, task]));
  const remoteById = new Map(remoteTasks.map((task) => [task.id, task]));
  const taskIds = new Set([...localById.keys(), ...remoteById.keys()]);

  return Array.from(taskIds).map((taskId) => {
    const localTask = localById.get(taskId);
    const remoteTask = remoteById.get(taskId);
    if (!localTask) return remoteTask;
    if (!remoteTask) return localTask;
    return isNewer(localTask.updated_at, remoteTask.updated_at) ? localTask : remoteTask;
  });
}

function isNewer(leftUpdatedAt, rightUpdatedAt) {
  return timestampValue(leftUpdatedAt) > timestampValue(rightUpdatedAt);
}

function timestampValue(value) {
  const timestamp = Date.parse(value || '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    groups[item[key]] = groups[item[key]] || [];
    groups[item[key]].push(item);
    return groups;
  }, {});
}

async function syncStateToSupabase(data) {
  const rows = flattenData(data);

  console.log('Saving to Supabase', {
    projects: rows.projects,
    tasks: rows.tasks,
    subtasks: rows.subtasks,
  });

  await upsertRows('projects', rows.projects);
  await upsertRows('tasks', rows.tasks);
  await upsertRows('subtasks', rows.subtasks);
}

function flattenData(data) {
  const projects = [];
  const tasks = [];
  const subtasks = [];

  data.projects.forEach((project, projectIndex) => {
    const projectId = ensureUuid(project.id, `project:${projectIndex}:${project.name || ''}`);
    const projectSlug = project.slug || slugify(project.name) || projectId;
    projects.push({
      id: projectId,
      slug: projectSlug,
      name: project.name,
      color: project.color,
      status: project.status,
      notes: project.notes || '',
      updated_at: project.updated_at || null,
    });
    project.tasks.forEach((task, taskIndex) => {
      const taskId = ensureUuid(task.id, `task:${projectId}:${taskIndex}:${task.text || ''}`);
      tasks.push({
        id: taskId,
        project_id: projectId,
        text: task.text,
        done: task.done,
        importance: task.importance,
        priority: task.priority,
        updated_at: task.updated_at || null,
      });
      task.subtasks.forEach((subtask, subtaskIndex) => {
        subtasks.push({
          id: ensureUuid(subtask.id, `subtask:${taskId}:${subtaskIndex}:${subtask.text || ''}`),
          task_id: taskId,
          text: subtask.text,
          done: subtask.done,
        });
      });
    });
  });

  return { projects, tasks, subtasks };
}

async function upsertRows(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Supabase save error', error);
    throw error;
  }
}

export const storage = {
  load: loadState,
  save: saveState,
};

export { isSupabaseConfigured };
