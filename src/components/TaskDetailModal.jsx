import { useState } from 'react';
import ImportanceBadge from './ImportanceBadge.jsx';
import { priorityClass, priorityFromImportance } from './helpers.js';

export default function TaskDetailModal({ project, task, onClose, onUpdateTask }) {
  const [title, setTitle] = useState(task.title || task.text || '');
  const [description, setDescription] = useState(task.description || '');
  const [importance, setImportance] = useState(task.importance || 'medium');
  const [done, setDone] = useState(Boolean(task.done));
  const priority = priorityFromImportance(importance);

  const submit = () => {
    if (!title.trim()) return;
    onUpdateTask(task.id, {
      title: title.trim(),
      text: title.trim(),
      description: description.trim(),
      importance,
      priority,
      done,
    });
    onClose();
  };

  return (
    <>
      <h2>Task Details</h2>
      <div className="task-detail-meta">
        <span className="proj-chip">{project.name}</span>
        <ImportanceBadge importance={importance} />
        <span className={`pdot ${priorityClass(priority)}`} />
        <label className="done-toggle">
          <input type="checkbox" checked={done} onChange={(event) => setDone(event.target.checked)} />
          Done
        </label>
      </div>
      <div className="field">
        <label>Title</label>
        <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Add more task details..." />
      </div>
      <div className="field">
        <label>Importance</label>
        <select className={`importance-select importance-${importance}`} value={importance} onChange={(event) => setImportance(event.target.value)}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div className="task-detail-subtasks">
        <div className="section-label">Subtasks</div>
        {task.subtasks.length ? (
          task.subtasks.map((subtask) => (
            <div key={subtask.id} className="subtask-row readonly">
              <span className={`sub-check ${subtask.done ? 'done' : ''}`} />
              <span className={`sub-text ${subtask.done ? 'done' : ''}`}>{subtask.text}</span>
            </div>
          ))
        ) : (
          <div className="empty compact">No subtasks yet.</div>
        )}
      </div>
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>Cancel</button>
        <button className="mbtn mbtn-pri" type="button" onClick={submit}>Save Task</button>
      </div>
    </>
  );
}
