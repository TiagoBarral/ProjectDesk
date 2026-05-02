import { DEFAULT_PROJECT_COLOR, stats } from './helpers.js';

export default function ProjectCard({ project, onOpen }) {
  const projectStats = stats(project);
  const activeFileCount = project.files.filter((file) => !file.deleted_at).length;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (projectStats.pct / 100) * circumference;
  const badgeClass = { active: 'badge-active', paused: 'badge-paused', planning: 'badge-planning' }[project.status] || 'badge-planning';
  const badgeLabel = { active: 'Active', paused: 'Paused', planning: 'Planning', done: 'Done' }[project.status] || project.status;

  return (
    <button
      className="project-card"
      type="button"
      onClick={onOpen}
      style={{ '--project-color': DEFAULT_PROJECT_COLOR }}
    >
      <div className="card-stripe" />
      <div className="card-top">
        <div>
          <div className="card-name">{project.name}</div>
          <div className="card-badges">
            <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
            {project.pinned && <span className="pin-badge" title="Pinned project">Pinned</span>}
          </div>
        </div>
        <div className="ring-wrap">
          <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
            <circle className="ring-bg" cx="38" cy="38" r={radius} />
            <circle
              className="ring-fill"
              cx="38"
              cy="38"
              r={radius}
              stroke="var(--project-color)"
              strokeDasharray={circumference.toFixed(2)}
              strokeDashoffset={offset.toFixed(2)}
            />
          </svg>
          <div className="ring-pct">
            <span className="num">{projectStats.pct}%</span>
            <span className="lbl">done</span>
          </div>
        </div>
      </div>
      <div className="card-stats">
        <div><div className="stat-val">{projectStats.total}</div><div className="stat-lbl">Tasks</div></div>
        <div><div className="stat-val">{projectStats.done}</div><div className="stat-lbl">Done</div></div>
        <div><div className="stat-val">{activeFileCount}</div><div className="stat-lbl">Files</div></div>
      </div>
      <div className="card-arrow">→</div>
    </button>
  );
}
