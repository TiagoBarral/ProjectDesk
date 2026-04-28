import ImportanceBadge from './ImportanceBadge.jsx';

const getAllTasks = (projects) => projects.flatMap((project) => (
  project.tasks.map((task) => ({
    ...task,
    importance: task.importance || 'medium',
    projectId: project.id,
    projectName: project.name,
    projectColor: project.color,
  }))
));

export default function PriorityDashboard({ projects, filters, onFiltersChange, onToggleTask }) {
  const allTasks = getAllTasks(projects);
  const summary = {
    high: allTasks.filter((task) => !task.done && task.importance === 'high').length,
    medium: allTasks.filter((task) => !task.done && task.importance === 'medium').length,
    low: allTasks.filter((task) => !task.done && task.importance === 'low').length,
    done: allTasks.filter((task) => task.done).length,
  };
  const order = { high: 0, medium: 1, low: 2 };
  const tasks = allTasks
    .filter((task) => {
      if (filters.importance !== 'all' && task.importance !== filters.importance) return false;
      if (filters.project !== 'all' && task.projectId !== filters.project) return false;
      if (filters.status === 'active' && task.done) return false;
      if (filters.status === 'completed' && !task.done) return false;
      return true;
    })
    .sort((a, b) => (order[a.importance] ?? 1) - (order[b.importance] ?? 1));

  return (
    <section className="dash-section">
      <div className="dash-title">Priority Dashboard</div>
      <div className="dash-sub">Focus on what matters most across all your projects</div>
      <div className="sum-grid">
        <SummaryCard color="#dc2626" stripe="#ef4444" label="High Priority" value={summary.high} sub="active tasks" />
        <SummaryCard color="#d97706" stripe="#f59e0b" label="Medium Priority" value={summary.medium} sub="active tasks" />
        <SummaryCard color="#16a34a" stripe="#22c55e" label="Low Priority" value={summary.low} sub="active tasks" />
        <SummaryCard color="var(--accent)" stripe="var(--accent)" label="Completed" value={summary.done} sub="tasks done" />
      </div>
      <div className="filter-bar">
        <select className="filter-select" value={filters.importance} onChange={(event) => onFiltersChange({ importance: event.target.value })}>
          <option value="all">All Importance</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="filter-select" value={filters.project} onChange={(event) => onFiltersChange({ project: event.target.value })}>
          <option value="all">All Projects</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <select className="filter-select" value={filters.status} onChange={(event) => onFiltersChange({ status: event.target.value })}>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="ptask-table">
        {!tasks.length ? (
          <div className="dash-empty">No tasks match these filters.</div>
        ) : (
          <>
            <div className="ptask-head"><span /><span>Task</span><span>Project</span><span>Importance</span><span>Status</span></div>
            {tasks.map((task) => (
              <div key={`${task.projectId}-${task.id}`} className={`ptask-row ${task.importance === 'high' ? 'imp-high' : task.importance === 'low' ? 'imp-low' : ''}`}>
                <button className={`ptask-check ${task.done ? 'done' : ''}`} type="button" aria-label="Toggle task" onClick={() => onToggleTask(task.projectId, task.id)} />
                <span className={`ptask-title ${task.done ? 'done' : ''}`} title={task.text}>{task.text}</span>
                <span className="proj-chip" style={{ background: `${task.projectColor}22`, color: task.projectColor }}>{task.projectName}</span>
                <ImportanceBadge importance={task.importance} />
                <span className={`ptask-status ${task.done ? '' : 'active'}`}>{task.done ? 'Done' : 'Active'}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ color, stripe, label, value, sub }) {
  return (
    <div className="sum-card">
      <div className="sum-card-accent" style={{ background: stripe }} />
      <div className="sum-card-label" style={{ color }}>{label}</div>
      <div className="sum-card-val" style={{ color }}>{value}</div>
      <div className="sum-card-sub">{sub}</div>
    </div>
  );
}
