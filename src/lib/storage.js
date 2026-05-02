import { isSupabaseConfigured, supabase } from './supabase.js';
import { logger } from './logger.js';

const STORAGE_KEY = 'project-ecosystem:data:v2';

export const defaultData = {
  projects: [
    {
      id: 'polimetrics',
      name: 'PoliMetrics',
      color: '#5e5ce6',
      status: 'active',
      tasks: [],
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
      tasks: [],
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
      tasks: [],
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
      tasks: [],
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
  const usedProjectSlugs = new Set();

  return {
    projects: safe.projects.map((project, projectIndex) => {
      const projectId = ensureUuid(project.id, `project:${projectIndex}:${project.name || ''}`);
      const baseSlug = slugify(project.slug) || slugify(project.name) || projectId;
      let projectSlug = baseSlug;
      let slugSuffix = 2;
      while (!project.deleted_at && usedProjectSlugs.has(projectSlug)) {
        projectSlug = `${baseSlug}-${slugSuffix}`;
        slugSuffix += 1;
      }
      if (!project.deleted_at) usedProjectSlugs.add(projectSlug);

      return {
        id: projectId,
        slug: projectSlug,
        name: project.name,
        color: project.color,
        status: project.status || 'planning',
        pinned: Boolean(project.pinned),
        notes: project.notes || '',
        updated_at: project.updated_at || null,
        deleted_at: project.deleted_at || null,
        sync_pending: Boolean(project.sync_pending),
        files: (Array.isArray(project.files) ? project.files : []).map((file, fileIndex) => {
          const fileName = file.name || file.path || file.public_url || 'Untitled file';
          const fileId = ensureUuid(file.id, `file:${projectId}:${fileIndex}:${fileName}`);
          return {
            id: fileId,
            name: fileName,
            kind: file.kind || 'link',
            path: file.path || file.public_url || '',
            mimeType: file.mimeType || file.mime_type || '',
            size: file.size ?? file.size_bytes ?? 0,
            date: file.date || file.date_label || '',
            storage_bucket: file.storage_bucket || '',
            storage_path: file.storage_path || '',
            public_url: file.public_url || '',
            updated_at: file.updated_at || null,
            deleted_at: file.deleted_at || null,
            sync_pending: Boolean(file.sync_pending),
          };
        }),
        tasks: (project.tasks || []).map((task, taskIndex) => {
          const taskTitle = task.title || task.text || '';
          const taskId = ensureUuid(task.id, `task:${projectId}:${taskIndex}:${taskTitle}`);
          return {
            id: taskId,
            title: taskTitle,
            text: taskTitle,
            description: task.description || '',
            priority: task.priority || 'mid',
            importance: task.importance || 'medium',
            done: Boolean(task.done),
            expanded: Boolean(task.expanded),
            updated_at: task.updated_at || null,
            deleted_at: task.deleted_at || null,
            sync_pending: Boolean(task.sync_pending),
            subtasks: (task.subtasks || []).map((subtask, subtaskIndex) => ({
              id: ensureUuid(subtask.id, `subtask:${taskId}:${subtaskIndex}:${subtask.text || ''}`),
              text: subtask.text || '',
              done: Boolean(subtask.done),
              updated_at: subtask.updated_at || null,
              deleted_at: subtask.deleted_at || null,
              sync_pending: Boolean(subtask.sync_pending),
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

export async function loadRemoteState({ throwOnError = false } = {}) {
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
      if (throwOnError) throw filesResult.error;
      logger.warn('Supabase files load error', filesResult.error);
    }

    const remoteState = composeData({
      projects: projectsResult.data || [],
      tasks: tasksResult.data || [],
      subtasks: subtasksResult.data || [],
      files: filesResult.error ? [] : filesResult.data || [],
    });
    const normalized = normalizeData(remoteState);
    return normalized;
  } catch (error) {
    logger.error('Supabase load error', error);
    if (throwOnError) throw error;
    return null;
  }
}

export function mergeStateByUpdatedAt(localState, remoteState) {
  const local = normalizeData(localState);
  const remote = normalizeData(remoteState);
  const localProjects = new Map(local.projects.map((project) => [project.id, project]));
  const remoteProjects = new Map(remote.projects.map((project) => [project.id, project]));
  const projectIds = new Set([...localProjects.keys(), ...remoteProjects.keys()]);

  const merged = normalizeData({
    projects: Array.from(projectIds).map((projectId) => {
      const localProject = localProjects.get(projectId);
      const remoteProject = remoteProjects.get(projectId);
      if (!localProject) return clearSyncPending(remoteProject);
      if (!remoteProject) return localProject.sync_pending ? localProject : null;

      const projectBase = shouldKeepLocal(localProject, remoteProject) ? localProject : remoteProject;
      return {
        ...clearSyncPending(projectBase),
        sync_pending: projectBase === localProject ? localProject.sync_pending : false,
        files: mergeItemsByUpdatedAt(localProject.files || [], remoteProject.files || []),
        tasks: mergeTasksByUpdatedAt(localProject.tasks || [], remoteProject.tasks || []),
      };
    }).filter(Boolean),
    filters: local.filters || remote.filters || defaultData.filters,
  });

  logHydrationCounts(local, remote, merged);
  return merged;
}

export async function saveState(state, options = {}) {
  const normalized = normalizeData(state);
  writeLocalState(normalized);

  if (isSupabaseConfigured) {
    const syncTask = syncQueue
      .catch(() => undefined)
      .then(() => syncStateToSupabase(normalized, options.changed));

    syncQueue = syncTask.catch((error) => {
      logger.error('Supabase save error', error);
    });

    await syncTask;
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
    logger.error('localStorage load error', error);
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
      pinned: Boolean(project.pinned),
      notes: project.notes || '',
      updated_at: project.updated_at || null,
      deleted_at: project.deleted_at || null,
      sync_pending: false,
      files: (filesByProject[project.id] || []).map((file) => ({
        id: file.id,
        name: file.name,
        kind: file.kind || 'link',
        path: file.path || '',
        mimeType: file.mime_type || file.mimeType || '',
        size: file.size_bytes ?? file.size ?? 0,
        date: file.date_label || file.date || '',
        storage_bucket: file.storage_bucket || '',
        storage_path: file.storage_path || '',
        public_url: file.public_url || '',
        updated_at: file.updated_at || null,
        deleted_at: file.deleted_at || null,
        sync_pending: false,
      })),
      tasks: (tasksByProject[project.id] || []).map((task) => ({
        id: task.id,
        title: task.title || task.text || '',
        text: task.title || task.text || '',
        description: task.description || '',
        priority: task.priority || 'mid',
        importance: task.importance || 'medium',
        done: Boolean(task.done ?? task.completed),
        expanded: Boolean(task.expanded),
        updated_at: task.updated_at || null,
        deleted_at: task.deleted_at || null,
        sync_pending: false,
        subtasks: (subtasksByTask[task.id] || []).map((subtask) => ({
          id: subtask.id,
          text: subtask.text || subtask.title || '',
          done: Boolean(subtask.done ?? subtask.completed),
          updated_at: subtask.updated_at || null,
          deleted_at: subtask.deleted_at || null,
          sync_pending: false,
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
    if (!localTask) return clearSyncPending(remoteTask);
    if (!remoteTask) return localTask.sync_pending ? localTask : null;
    const taskBase = shouldKeepLocal(localTask, remoteTask) ? localTask : remoteTask;
    return {
      ...clearSyncPending(taskBase),
      sync_pending: taskBase === localTask ? localTask.sync_pending : false,
      subtasks: mergeItemsByUpdatedAt(localTask.subtasks || [], remoteTask.subtasks || []),
    };
  }).filter(Boolean);
}

function mergeItemsByUpdatedAt(localItems, remoteItems) {
  const localById = new Map(localItems.map((item) => [item.id, item]));
  const remoteById = new Map(remoteItems.map((item) => [item.id, item]));
  const itemIds = new Set([...localById.keys(), ...remoteById.keys()]);

  return Array.from(itemIds).map((itemId) => {
    const localItem = localById.get(itemId);
    const remoteItem = remoteById.get(itemId);
    if (!localItem) return clearSyncPending(remoteItem);
    if (!remoteItem) return localItem.sync_pending ? localItem : null;
    const itemBase = shouldKeepLocal(localItem, remoteItem) ? localItem : remoteItem;
    return {
      ...clearSyncPending(itemBase),
      sync_pending: itemBase === localItem ? localItem.sync_pending : false,
    };
  }).filter(Boolean);
}

function shouldKeepLocal(localItem, remoteItem) {
  return Boolean(localItem?.sync_pending) && isNewerEvent(localItem, remoteItem);
}

function clearSyncPending(item) {
  return item ? { ...item, sync_pending: false } : item;
}

function isNewerEvent(leftItem, rightItem) {
  return eventTimestamp(leftItem) > eventTimestamp(rightItem);
}

function eventTimestamp(item) {
  return Math.max(timestampValue(item?.updated_at), timestampValue(item?.deleted_at));
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

function logHydrationCounts(local, remote, merged) {
  logger.debug('hydrate: counts', {
    localActiveTaskCount: countActiveTasks(local.projects),
    remoteActiveTaskCount: countActiveTasks(remote.projects),
    mergedActiveTaskCount: countActiveTasks(merged.projects),
    localOnlyTaskIds: difference(taskIds(local.projects), taskIds(remote.projects)),
    remoteOnlyTaskIds: difference(taskIds(remote.projects), taskIds(local.projects)),
  });
}

function countActiveTasks(projects = []) {
  return projects.reduce((total, project) => (
    project.deleted_at ? total : total + (project.tasks || []).filter((task) => !task.deleted_at).length
  ), 0);
}

function taskIds(projects = []) {
  return new Set(projects.flatMap((project) => (project.tasks || []).map((task) => task.id)));
}

function difference(leftSet, rightSet) {
  return Array.from(leftSet).filter((id) => !rightSet.has(id));
}

async function syncStateToSupabase(data, changed) {
  const rows = flattenData(data, changed);

  logger.info('sync: saving', {
    projectCount: rows.projects.length,
    taskCount: rows.tasks.length,
    fileCount: rows.files.length,
  });

  const results = await Promise.all([
    upsertFreshRows('projects', rows.projects),
    upsertFreshRows('tasks', rows.tasks),
    upsertFreshRows('subtasks', rows.subtasks),
    upsertFreshRows('files', rows.files),
  ]);

  logger.info('sync: saved', {
    projectCount: results[0],
    taskCount: results[1],
    subtaskCount: results[2],
    fileCount: results[3],
  });
}

function flattenData(data, changed) {
  const scope = createSyncScope(changed);
  const projects = [];
  const tasks = [];
  const subtasks = [];
  const files = [];

  data.projects.forEach((project, projectIndex) => {
    const projectId = ensureUuid(project.id, `project:${projectIndex}:${project.name || ''}`);
    const projectSlug = project.slug || slugify(project.name) || projectId;
    if (shouldSync(scope, 'projects', projectId)) {
      projects.push({
        id: projectId,
        slug: projectSlug,
        name: project.name,
        color: project.color,
        status: project.status,
        pinned: Boolean(project.pinned),
        notes: project.notes || '',
        updated_at: project.updated_at || null,
        deleted_at: project.deleted_at || null,
      });
    }
    project.files.forEach((file, fileIndex) => {
      const fileName = file.name || file.path || file.public_url || '';
      const fileId = ensureUuid(file.id, `file:${projectId}:${fileIndex}:${fileName}`);
      if (shouldSync(scope, 'files', fileId)) {
        files.push({
          id: fileId,
          project_id: projectId,
          name: fileName || 'Untitled file',
          kind: file.kind || 'link',
          path: file.path || file.public_url || '',
          mime_type: file.mimeType || file.mime_type || '',
          size_bytes: file.size ?? file.size_bytes ?? 0,
          date_label: file.date || file.date_label || '',
          storage_bucket: file.storage_bucket || null,
          storage_path: file.storage_path || null,
          public_url: file.public_url || null,
          updated_at: file.updated_at || null,
          deleted_at: file.deleted_at || null,
        });
      }
    });
    project.tasks.forEach((task, taskIndex) => {
      const taskTitle = task.title || task.text || '';
      const taskId = ensureUuid(task.id, `task:${projectId}:${taskIndex}:${taskTitle}`);
      if (shouldSync(scope, 'tasks', taskId)) {
        tasks.push({
          id: taskId,
          project_id: projectId,
          title: taskTitle,
          text: taskTitle,
          description: task.description || '',
          done: task.done,
          importance: task.importance,
          priority: task.priority,
          updated_at: task.updated_at || null,
          deleted_at: task.deleted_at || null,
        });
      }
      task.subtasks.forEach((subtask, subtaskIndex) => {
        const subtaskId = ensureUuid(subtask.id, `subtask:${taskId}:${subtaskIndex}:${subtask.text || ''}`);
        if (shouldSync(scope, 'subtasks', subtaskId)) {
          subtasks.push({
            id: subtaskId,
            task_id: taskId,
            text: subtask.text,
            done: subtask.done,
            updated_at: subtask.updated_at || null,
            deleted_at: subtask.deleted_at || null,
          });
        }
      });
    });
  });

  return { projects, tasks, subtasks, files };
}

function createSyncScope(changed) {
  if (!changed) return null;
  return {
    projects: new Set(changed.projects || []),
    tasks: new Set(changed.tasks || []),
    subtasks: new Set(changed.subtasks || []),
    files: new Set(changed.files || []),
  };
}

function shouldSync(scope, key, id) {
  return !scope || scope[key].has(id);
}

async function upsertFreshRows(table, rows) {
  if (!rows.length) return 0;

  const remoteRows = await fetchRemoteFreshness(table, rows.map((row) => row.id));
  const freshRows = rows.filter((row) => {
    const remoteRow = remoteRows.get(row.id);
    return !remoteRow || eventTimestamp(row) > eventTimestamp(remoteRow);
  });

  await upsertRows(table, freshRows);
  return freshRows.length;
}

async function fetchRemoteFreshness(table, ids) {
  const { data, error } = await supabase.from(table).select('id,updated_at,deleted_at').in('id', ids);
  if (error) {
    throw error;
  }
  return new Map((data || []).map((row) => [row.id, row]));
}

async function upsertRows(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) {
    throw error;
  }
}

export const storage = {
  load: loadState,
  save: saveState,
};

export { isSupabaseConfigured };
