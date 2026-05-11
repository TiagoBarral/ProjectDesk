import { useEffect, useRef, useState } from 'react';
import ImportanceBadge from '../ImportanceBadge.jsx';
import TaskDetailModal from '../TaskDetailModal.jsx';
import { priorityClass, priorityFromImportance } from '../helpers.js';
import { improveTaskTitle } from '../../lib/ai.js';

export default function TasksTab({
  project,
  stats: projectStats,
  onToggleTask,
  onToggleTaskExpanded,
  onDeleteTask,
  onAddTask,
  onUpdateTask,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateSubtask,
  openModal,
}) {
  const openTasks = project.tasks.filter((task) => !task.done);
  const doneTasks = project.tasks.filter((task) => task.done);
  const seenTaskIdsRef = useRef(new Set(project.tasks.map((task) => task.id)));
  const previousProjectIdRef = useRef(project.id);
  const [enteringTaskIds, setEnteringTaskIds] = useState([]);

  useEffect(() => {
    const currentTaskIds = new Set(project.tasks.map((task) => task.id));

    if (previousProjectIdRef.current !== project.id) {
      previousProjectIdRef.current = project.id;
      seenTaskIdsRef.current = currentTaskIds;
      setEnteringTaskIds([]);
      return undefined;
    }

    const newTaskIds = project.tasks
      .map((task) => task.id)
      .filter((taskId) => !seenTaskIdsRef.current.has(taskId));

    seenTaskIdsRef.current = currentTaskIds;

    if (!newTaskIds.length) return undefined;

    setEnteringTaskIds(newTaskIds);
    const timer = window.setTimeout(() => {
      setEnteringTaskIds((ids) => ids.filter((taskId) => !newTaskIds.includes(taskId)));
    }, 520);

    return () => window.clearTimeout(timer);
  }, [project.id, project.tasks]);

  return (
    <>
      <div className="section-header">
        <div className="section-label">Tasks</div>
      </div>
      {projectStats.total > 0 && (
        <div className="prog-row">
          <div className="prog-bar"><div className="prog-fill" style={{ width: `${projectStats.pct}%` }} /></div>
          <span className="prog-txt">{projectStats.done} / {projectStats.total} · {projectStats.pct}%</span>
        </div>
      )}
      <button className="add-task-card" type="button" onClick={() => openModal(({ onClose }) => <AddTaskModal onClose={onClose} onSubmit={onAddTask} />)}>
        <span className="add-task-icon" aria-hidden="true" />
        <span className="add-task-dot-spacer" aria-hidden="true" />
        <span className="add-task-label">Add Task</span>
      </button>
      <button className="mobile-add-task-fab" type="button" aria-label="Add task" onClick={() => openModal(({ onClose }) => <AddTaskModal onClose={onClose} onSubmit={onAddTask} />)} />
      {openTasks.map((task) => (
        <TaskCard
          key={task.id}
          project={project}
          task={task}
          isEntering={enteringTaskIds.includes(task.id)}
          onToggleTask={onToggleTask}
          onToggleTaskExpanded={onToggleTaskExpanded}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
          onToggleSubtask={onToggleSubtask}
          onAddSubtask={onAddSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onUpdateSubtask={onUpdateSubtask}
          openModal={openModal}
        />
      ))}
      {!!doneTasks.length && <div className="completed-label">Completed</div>}
      {doneTasks.map((task) => (
        <TaskCard
          key={task.id}
          project={project}
          task={task}
          isEntering={enteringTaskIds.includes(task.id)}
          onToggleTask={onToggleTask}
          onToggleTaskExpanded={onToggleTaskExpanded}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
          onToggleSubtask={onToggleSubtask}
          onAddSubtask={onAddSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onUpdateSubtask={onUpdateSubtask}
          openModal={openModal}
        />
      ))}
    </>
  );
}

function TaskCard({
  project,
  task,
  isEntering,
  onToggleTask,
  onToggleTaskExpanded,
  onDeleteTask,
  onUpdateTask,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateSubtask,
  openModal,
}) {
  const [subText, setSubText] = useState('');
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [completionPulse, setCompletionPulse] = useState('');
  const menuRef = useRef(null);
  const previousDoneRef = useRef(task.done);
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.done).length;

  const submitSubtask = () => {
    if (!subText.trim()) return;
    onAddSubtask(task.id, subText);
    setSubText('');
  };

  const openTaskDetail = () => openModal(({ onClose }) => (
    <TaskDetailModal
      project={project}
      task={task}
      onClose={onClose}
      onUpdateTask={(taskId, updates) => onUpdateTask(taskId, updates)}
      onAddSubtask={(taskId, text) => onAddSubtask(taskId, text)}
    />
  ));

  const openEditTask = () => openModal(({ onClose }) => (
    <TaskModal title="Edit Task" actionLabel="Save Task" task={task} onClose={onClose} onSubmit={(updates) => onUpdateTask(task.id, updates)} />
  ));

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsideTap = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideTap, true);
    return () => document.removeEventListener('pointerdown', closeOnOutsideTap, true);
  }, [menuOpen]);

  useEffect(() => {
    if (previousDoneRef.current === task.done) return undefined;

    previousDoneRef.current = task.done;
    setCompletionPulse(task.done ? 'completed' : 'reopened');
    const timer = window.setTimeout(() => setCompletionPulse(''), 650);
    return () => window.clearTimeout(timer);
  }, [task.done]);

  return (
    <div
      className={[
        'task-card clickable',
        task.done ? 'is-done' : '',
        isEntering ? 'is-entering' : '',
        completionPulse ? `is-${completionPulse}` : '',
      ].filter(Boolean).join(' ')}
      onClick={openTaskDetail}
    >
      <div className="task-row">
        <button className={`task-check ${task.done ? 'done' : ''}`} type="button" aria-label="Toggle task" onClick={(event) => { event.stopPropagation(); onToggleTask(task.id); }} />
        <span className={`pdot ${priorityClass(priorityFromImportance(task.importance || 'medium'))}`} />
        <button className={`task-text ${task.done ? 'done' : ''}`} type="button" onClick={(event) => { event.stopPropagation(); openTaskDetail(); }}>{task.title}</button>
        <span className="mobile-task-meta">{importanceLabel(task.importance)} • {task.done ? 'Done' : 'Active'}</span>
        <ImportanceBadge importance={task.importance || 'medium'} />
        {!!task.subtasks.length && <span className="sub-count">{doneSubtasks}/{task.subtasks.length}</span>}
        <div className="task-actions" onClick={(event) => event.stopPropagation()}>
          <button className="icon-btn" type="button" aria-label="Add subtask" onClick={(event) => { event.stopPropagation(); onToggleTaskExpanded(task.id, true); }}>＋</button>
          <button
            className="icon-btn"
            type="button"
            aria-label="Edit task"
            onClick={(event) => { event.stopPropagation(); openEditTask(); }}
          >
            ✎
          </button>
          <button className="icon-btn" type="button" aria-label="Delete task" onClick={(event) => { event.stopPropagation(); onDeleteTask(task.id); }}>✕</button>
        </div>
        <div className="mobile-action-menu" ref={menuRef} onClick={(event) => event.stopPropagation()}>
          <button
            className="mobile-menu-trigger"
            type="button"
            aria-label="Task actions"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              <button className="mobile-menu-backdrop" type="button" aria-label="Close task actions" onClick={() => setMenuOpen(false)} />
              <div className="mobile-menu-panel">
                <button type="button" onClick={() => { setMenuOpen(false); onToggleTaskExpanded(task.id, true); }}>Add Subtask</button>
                <button type="button" onClick={() => { setMenuOpen(false); openEditTask(); }}>Edit Task</button>
                <button type="button" onClick={() => { setMenuOpen(false); onToggleTaskExpanded(task.id); }}>{task.expanded ? 'Hide Details' : 'Show Details'}</button>
                <button className="danger-menu-item" type="button" onClick={() => { setMenuOpen(false); onDeleteTask(task.id); }}>Delete Task</button>
              </div>
            </>
          )}
        </div>
        <button className="expand-btn" type="button" aria-label="Expand task" onClick={(event) => { event.stopPropagation(); onToggleTaskExpanded(task.id); }}>
          {task.expanded ? '▲' : '▼'}
        </button>
      </div>
      {task.expanded && (
        <div className="subtasks" onClick={(event) => event.stopPropagation()}>
          {task.description && <div className="task-description">{task.description}</div>}
          {task.subtasks.map((subtask) => (
            <div key={subtask.id} className="subtask-row">
              <button className={`sub-check ${subtask.done ? 'done' : ''}`} type="button" aria-label="Toggle subtask" onClick={() => onToggleSubtask(task.id, subtask.id)} />
              {editingSubtask === subtask.id ? (
                <input
                  className="inline-input sub-edit-input"
                  autoFocus
                  value={editingText}
                  onChange={(event) => setEditingText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && editingText.trim()) {
                      onUpdateSubtask(task.id, subtask.id, { text: editingText.trim() });
                      setEditingSubtask(null);
                    }
                    if (event.key === 'Escape') setEditingSubtask(null);
                  }}
                  onBlur={() => {
                    if (editingText.trim()) onUpdateSubtask(task.id, subtask.id, { text: editingText.trim() });
                    setEditingSubtask(null);
                  }}
                />
              ) : (
                <span className={`sub-text ${subtask.done ? 'done' : ''}`}>{subtask.text}</span>
              )}
              <button
                className="icon-btn"
                type="button"
                aria-label="Edit subtask"
                onClick={() => {
                  setEditingSubtask(subtask.id);
                  setEditingText(subtask.text);
                }}
              >
                ✎
              </button>
              <button className="icon-btn" type="button" aria-label="Delete subtask" onClick={() => onDeleteSubtask(task.id, subtask.id)}>✕</button>
            </div>
          ))}
          <div className="add-sub-row">
            <input
              className="inline-input"
              value={subText}
              onChange={(event) => setSubText(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submitSubtask()}
              placeholder="Add subtask..."
            />
            <button className="icon-btn" type="button" aria-label="Add subtask" onClick={submitSubtask}>↵</button>
          </div>
        </div>
      )}
    </div>
  );
}

function importanceLabel(importance) {
  return { high: 'High', medium: 'Medium', low: 'Low' }[importance || 'medium'] || 'Medium';
}

function AddTaskModal({ onClose, onSubmit }) {
  return <TaskModal title="New Task" actionLabel="Add Task" onClose={onClose} onSubmit={onSubmit} />;
}

function TaskModal({ title, actionLabel, task, onClose, onSubmit }) {
  const [taskTitle, setTaskTitle] = useState(task?.title || task?.text || '');
  const [description, setDescription] = useState(task?.description || '');
  const [importance, setImportance] = useState(task?.importance || 'medium');
  const [improveError, setImproveError] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  const improveTitle = async () => {
    setImproveError('');
    setIsImproving(true);

    try {
      const improvedTitle = await improveTaskTitle(taskTitle);
      setTaskTitle(improvedTitle);
    } catch (error) {
      setImproveError(error.message || 'AI improvement failed.');
    } finally {
      setIsImproving(false);
    }
  };

  const submit = () => {
    if (!taskTitle.trim()) return;
    onSubmit({ title: taskTitle.trim(), text: taskTitle.trim(), description: description.trim(), importance, priority: priorityFromImportance(importance) });
    onClose();
  };

  return (
    <>
      <h2>{title}</h2>
      <div className="field">
        <label>Title</label>
        <div className="task-title-ai-row">
          <input autoFocus value={taskTitle} onChange={(event) => { setTaskTitle(event.target.value); setImproveError(''); }} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="What needs to be done?" />
          <button
            className={`ai-improve-btn ${isImproving ? 'is-loading' : ''}`}
            type="button"
            disabled={isImproving || !taskTitle.trim()}
            onClick={improveTitle}
          >
            Improve
          </button>
        </div>
        {improveError && <div className="ai-error">{improveError}</div>}
        <small>AI suggests a cleaner title only. You still choose whether to save it.</small>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Add more detail..." />
      </div>
      <div className="field">
        <label>Importance</label>
        <select className={`importance-select importance-${importance}`} value={importance} onChange={(event) => setImportance(event.target.value)}>
          <option value="high">🔴 High — must do soon or blocks progress</option>
          <option value="medium">🟡 Medium — important but not urgent</option>
          <option value="low">🟢 Low — nice to have</option>
        </select>
      </div>
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>Cancel</button>
        <button className="mbtn mbtn-pri" type="button" onClick={submit}>{actionLabel}</button>
      </div>
    </>
  );
}
