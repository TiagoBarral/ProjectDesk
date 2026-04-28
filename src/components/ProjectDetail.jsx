import { useState } from 'react';
import { stats } from './helpers.js';
import FilesTab from './tabs/FilesTab.jsx';
import NotesTab from './tabs/NotesTab.jsx';
import TasksTab from './tabs/TasksTab.jsx';

export default function ProjectDetail(props) {
  const { project, activeTab, onBack, onTabChange, onUpdateProject, openModal } = props;
  const projectStats = stats(project);
  const badgeClass = { active: 'badge-active', paused: 'badge-paused', planning: 'badge-planning' }[project.status] || 'badge-planning';
  const badgeLabel = { active: 'Active', paused: 'Paused', planning: 'Planning', done: 'Done' }[project.status] || project.status;

  return (
    <main className="detail">
      <div className="topbar">
        <button className="back-btn" type="button" onClick={onBack}>← Back</button>
        <div className="topbar-dot" style={{ background: project.color }} />
        <h2>{project.name}</h2>
        <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
        <button
          className="ghost-btn topbar-edit"
          type="button"
          onClick={() => openModal(({ onClose }) => (
            <EditProjectModal project={project} onClose={onClose} onSubmit={onUpdateProject} />
          ))}
        >
          Edit
        </button>
        <div className="tabs">
          <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} type="button" onClick={() => onTabChange('tasks')}>Tasks</button>
          <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`} type="button" onClick={() => onTabChange('notes')}>Notes</button>
          <button className={`tab ${activeTab === 'files' ? 'active' : ''}`} type="button" onClick={() => onTabChange('files')}>Files{project.files.length ? ` · ${project.files.length}` : ''}</button>
        </div>
      </div>
      <div className="content">
        {activeTab === 'tasks' && <TasksTab project={project} stats={projectStats} {...props} />}
        {activeTab === 'notes' && <NotesTab project={project} onUpdateNotes={props.onUpdateNotes} onShowSaved={props.onShowSaved} />}
        {activeTab === 'files' && <FilesTab project={project} onAddFiles={props.onAddFiles} onDeleteFile={props.onDeleteFile} onUpdateFile={props.onUpdateFile} openModal={props.openModal} />}
      </div>
    </main>
  );
}

function EditProjectModal({ project, onClose, onSubmit }) {
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status);
  const [color, setColor] = useState(project.color);

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), status, color });
    onClose();
  };

  return (
    <>
      <h2>Edit Project</h2>
      <div className="field">
        <label>Project name</label>
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} />
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
      <div className="field">
        <label>Color</label>
        <div className="color-row">
          {['#5e5ce6', '#ff9500', '#34c759', '#ff2d55', '#007aff', '#af52de'].map((option) => (
            <button
              key={option}
              className={`color-swatch ${color === option ? 'active' : ''}`}
              type="button"
              aria-label={`Use ${option}`}
              style={{ background: option }}
              onClick={() => setColor(option)}
            />
          ))}
          <input className="color-input" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
        </div>
      </div>
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>Cancel</button>
        <button className="mbtn mbtn-pri" type="button" onClick={submit}>Save Project</button>
      </div>
    </>
  );
}
