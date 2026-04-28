import { importanceLabel } from './helpers.js';

export default function ImportanceBadge({ importance }) {
  const cls = importance === 'high' ? 'imp-high-badge' : importance === 'low' ? 'imp-low-badge' : 'imp-med-badge';
  return <span className={`imp-badge ${cls}`}>{importanceLabel(importance)}</span>;
}
