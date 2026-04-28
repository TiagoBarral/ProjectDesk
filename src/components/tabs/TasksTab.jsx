import { useEffect, useState } from 'react';
import ImportanceBadge from '../ImportanceBadge.jsx';
import { priorityClass } from '../helpers.js';

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

  useEffect(() => {
    console.log('[render] tasks tab', {
      projectId: project.id,
      projectName: project.name,
      count: project.tasks.length,
      openCount: openTasks.length,
      doneCount: doneTasks.length,
      taskNames: project.tasks.map((task) => task.text),
    });
  }, [doneTasks.length, openTasks.length, project.id, project.name, project.tasks]);

  return (
    <>
      <div className="section-header">
        <div className="section-label">Tasks</div>
        <button className="add-btn" type="button" onClick={() => openModal(({ onClose }) => <AddTaskModal onClose={onClose} onSubmit={onAddTask} />)}>+ Add Task</button>
      </div>
      {projectStats.total > 0 && (
        <div className="prog-row">
          <div className="prog-bar"><div className="prog-fill" style={{ width: `${projectStats.pct}%`, background: project.color }} /></div>
          <span className="prog-txt">{projectStats.done} / {projectStats.total} · {projectStats.pct}%</span>
        </div>
      )}
      {!openTasks.length && !doneTasks.length && <div className="empty">No tasks yet.</div>}
      {openTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
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
          task={task}
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
  task,
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
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.done).length;

  const submitSubtask = () => {
    if (!subText.trim()) return;
    onAddSubtask(task.id, subText);
    setSubText('');
  };

  return (
    <div className="task-card">
      <div className="task-row">
        <button className={`task-check ${task.done ? 'done' : ''}`} type="button" aria-label="Toggle task" onClick={() => onToggleTask(task.id)} />
        <span className={`pdot ${priorityClass(task.priority)}`} />
        <span className={`task-text ${task.done ? 'done' : ''}`}>{task.text}</span>
        <ImportanceBadge importance={task.importance || 'medium'} />
        {!!task.subtasks.length && <span className="sub-count">{doneSubtasks}/{task.subtasks.length}</span>}
        <div className="task-actions">
          <button className="icon-btn" type="button" aria-label="Add subtask" onClick={() => onToggleTaskExpanded(task.id, true)}>＋</button>
          <button
            className="icon-btn"
            type="button"
            aria-label="Edit task"
            onClick={() => openModal(({ onClose }) => (
              <TaskModal title="Edit Task" actionLabel="Save Task" task={task} onClose={onClose} onSubmit={(updates) => onUpdateTask(task.id, updates)} />
            ))}
          >
            ✎
          </button>
          <button className="icon-btn" type="button" aria-label="Delete task" onClick={() => onDeleteTask(task.id)}>✕</button>
        </div>
        <button className="expand-btn" type="button" aria-label="Expand task" onClick={() => onToggleTaskExpanded(task.id)}>
          {task.expanded ? '▲' : '▼'}
        </button>
      </div>
      {task.expanded && (
        <div className="subtasks">
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
            <button className="icon-btn" type="button" onClick={submitSubtask}>↵</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddTaskModal({ onClose, onSubmit }) {
  return <TaskModal title="New Task" actionLabel="Add Task" onClose={onClose} onSubmit={onSubmit} />;
}

function TaskModal({ title, actionLabel, task, onClose, onSubmit }) {
  const [text, setText] = useState(task?.text || '');
  const [importance, setImportance] = useState(task?.importance || 'medium');
  const [priority, setPriority] = useState(task?.priority || 'mid');

  const submit = () => {
    if (!text.trim()) return;
    onSubmit({ text: text.trim(), importance, priority });
    onClose();
  };

  return (
    <>
      <h2>{title}</h2>
      <div className="field">
        <label>Task name</label>
        <input autoFocus value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="What needs to be done?" />
      </div>
      <div className="field">
        <label>Importance</label>
        <select value={importance} onChange={(event) => setImportance(event.target.value)}>
          <option value="high">🔴 High — must do soon or blocks progress</option>
          <option value="medium">🟡 Medium — important but not urgent</option>
          <option value="low">🟢 Low — nice to have</option>
        </select>
      </div>
      <div className="field">
        <label>Priority dot</label>
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="high">🔴 High</option>
          <option value="mid">🟠 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
      </div>
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>Cancel</button>
        <button className="mbtn mbtn-pri" type="button" onClick={submit}>{actionLabel}</button>
      </div>
    </>
  );
}
