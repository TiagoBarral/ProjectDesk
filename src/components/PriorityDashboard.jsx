import { useEffect, useMemo, useState } from 'react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const allTasks = getAllTasks(projects);
  const order = { high: 0, medium: 1, low: 2 };
  const filteredTasks = useMemo(() => (
    allTasks
      .filter((task) => {
      if (filters.importance !== 'all' && task.importance !== filters.importance) return false;
      if (filters.project !== 'all' && task.projectId !== filters.project) return false;
      if (filters.status === 'active' && task.done) return false;
      if (filters.status === 'completed' && !task.done) return false;
      return true;
      })
      .sort((a, b) => (order[a.importance] ?? 1) - (order[b.importance] ?? 1))
  ), [allTasks, filters.importance, filters.project, filters.status]);
  const summary = {
    high: filteredTasks.filter((task) => !task.done && task.importance === 'high').length,
    medium: filteredTasks.filter((task) => !task.done && task.importance === 'medium').length,
    low: filteredTasks.filter((task) => !task.done && task.importance === 'low').length,
    done: filteredTasks.filter((task) => task.done).length,
  };
  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / rowsPerPage));
  const safePage = Math.min(currentPage, pageCount);
  const startIndex = (safePage - 1) * rowsPerPage;
  const pagedTasks = filteredTasks.slice(startIndex, startIndex + rowsPerPage);
  const showingStart = filteredTasks.length ? startIndex + 1 : 0;
  const showingEnd = Math.min(startIndex + rowsPerPage, filteredTasks.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.importance, filters.project, filters.status, rowsPerPage]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

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
        {!filteredTasks.length ? (
          <div className="dash-empty">No tasks match these filters.</div>
        ) : (
          <>
            <div className="ptask-head"><span /><span>Task</span><span>Project</span><span>Importance</span><span>Status</span></div>
            {pagedTasks.map((task) => (
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
      {!!filteredTasks.length && (
        <div className="pagination-row">
          <span className="pagination-count">Showing {showingStart}-{showingEnd} of {filteredTasks.length}</span>
          <div className="pagination-controls">
            <button className="page-btn" type="button" disabled={safePage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button>
            <span className="page-status">Page {safePage} of {pageCount}</span>
            <button className="page-btn" type="button" disabled={safePage === pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}>Next</button>
            <select className="rows-select" value={rowsPerPage} onChange={(event) => setRowsPerPage(Number(event.target.value))} aria-label="Rows per page">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}
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
