import { useEffect, useRef, useState } from 'react';
import { DEFAULT_PROJECT_COLOR, stats } from './helpers.js';
import ConfirmModal from './ConfirmModal.jsx';
import FilesTab from './tabs/FilesTab.jsx';
import NotesTab from './tabs/NotesTab.jsx';
import TasksTab from './tabs/TasksTab.jsx';

export default function ProjectDetail(props) {
  const { project, activeTab, onBack, onHome, onTabChange, onUpdateProject, onDeleteProject, openModal } = props;
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef(null);
  const projectStats = stats(project);
  const activeFileCount = project.files.filter((file) => !file.deleted_at).length;
  const badgeClass = { active: 'badge-active', paused: 'badge-paused', planning: 'badge-planning' }[project.status] || 'badge-planning';
  const badgeLabel = { active: 'Active', paused: 'Paused', planning: 'Planning', done: 'Done' }[project.status] || project.status;
  const openEditProject = () => openModal(({ onClose }) => (
    <EditProjectModal project={project} onClose={onClose} onSubmit={onUpdateProject} onDelete={onDeleteProject} openModal={openModal} />
  ));
  const openDeleteProject = () => openModal(({ onClose }) => (
    <DeleteProjectModal project={project} onClose={onClose} onConfirm={onDeleteProject} />
  ));

  useEffect(() => {
    if (!projectMenuOpen) return undefined;

    const closeOnOutsideTap = (event) => {
      if (!projectMenuRef.current?.contains(event.target)) setProjectMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideTap, true);
    return () => document.removeEventListener('pointerdown', closeOnOutsideTap, true);
  }, [projectMenuOpen]);

  return (
    <main className="detail">
      <div className="topbar">
        <button className="back-btn" type="button" onClick={onBack}>← Back</button>
        <div className="topbar-dot" style={{ background: DEFAULT_PROJECT_COLOR }} />
        <h2>{project.name}</h2>
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <button type="button" onClick={onHome || onBack}>Projects</button>
          <span>›</span>
          <span title={project.name}>{project.name}</span>
          <span>›</span>
          <span>{activeTab[0].toUpperCase() + activeTab.slice(1)}</span>
        </nav>
        <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
        <button
          className="ghost-btn topbar-edit"
          type="button"
          onClick={openEditProject}
        >
          Edit
        </button>
        <button
          className="ghost-btn danger-btn"
          type="button"
          onClick={openDeleteProject}
        >
          Delete
        </button>
        <div className="project-mobile-actions" ref={projectMenuRef}>
          <button
            className="mobile-menu-trigger"
            type="button"
            aria-label="Project actions"
            aria-expanded={projectMenuOpen}
            onClick={() => setProjectMenuOpen((open) => !open)}
          >
            ⋯
          </button>
          {projectMenuOpen && (
            <>
              <button className="mobile-menu-backdrop" type="button" aria-label="Close project actions" onClick={() => setProjectMenuOpen(false)} />
              <div className="mobile-menu-panel">
                <button type="button" onClick={() => { setProjectMenuOpen(false); openEditProject(); }}>Edit Project</button>
                <button className="danger-menu-item" type="button" onClick={() => { setProjectMenuOpen(false); openDeleteProject(); }}>Delete Project</button>
              </div>
            </>
          )}
        </div>
        <div className="tabs">
          <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} type="button" onClick={() => onTabChange('tasks')}>Tasks</button>
          <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`} type="button" onClick={() => onTabChange('notes')}>Notes</button>
          <button className={`tab ${activeTab === 'files' ? 'active' : ''}`} type="button" onClick={() => onTabChange('files')}>Files{activeFileCount ? ` · ${activeFileCount}` : ''}</button>
        </div>
      </div>
      <div className="content">
        {activeTab === 'tasks' && <TasksTab project={project} stats={projectStats} {...props} />}
        {activeTab === 'notes' && <NotesTab project={project} onUpdateNotes={props.onUpdateNotes} onShowSaved={props.onShowSaved} />}
        {activeTab === 'files' && <FilesTab project={project} userId={props.userId} onAddFiles={props.onAddFiles} onDeleteFile={props.onDeleteFile} onUpdateFile={props.onUpdateFile} openModal={props.openModal} />}
      </div>
    </main>
  );
}

function DeleteProjectModal({ project, onClose, onConfirm }) {
  const submit = () => {
    onConfirm();
    onClose();
  };

  return (
    <>
      <h2>Delete Project</h2>
      <p className="modal-copy">
        Delete {project.name}? This removes it from your project list and syncs the deletion across devices.
      </p>
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>Cancel</button>
        <button className="mbtn mbtn-danger" type="button" onClick={submit}>Delete Project</button>
      </div>
    </>
  );
}

function EditProjectModal({ project, onClose, onSubmit, onDelete, openModal }) {
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status);
  const [pinned, setPinned] = useState(Boolean(project.pinned));

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), status, pinned });
    onClose();
  };

  const deleteProject = () => {
    openModal(({ onClose: closeConfirm }) => (
      <ConfirmModal
        title="Delete Project"
        message={`Delete ${project.name}? This removes it from your project list and syncs the deletion across devices.`}
        confirmLabel="Delete Project"
        onClose={closeConfirm}
        onConfirm={onDelete}
      />
    ));
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
      <label className="check-field">
        <input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} />
        <span>Pin project to the top</span>
      </label>
      <button className="mobile-delete-project mbtn mbtn-danger" type="button" onClick={deleteProject}>Delete Project</button>
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>Cancel</button>
        <button className="mbtn mbtn-pri" type="button" onClick={submit}>Save Project</button>
      </div>
    </>
  );
}
