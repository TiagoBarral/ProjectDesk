export const stats = (project) => {
  const total = project.tasks.length;
  const done = project.tasks.filter((task) => task.done).length;
  return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
};

export const hexToRgb = (hex) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
].join(',');

export const importanceLabel = (importance) => (
  importance === 'high' ? 'High' : importance === 'low' ? 'Low' : 'Medium'
);

export const priorityClass = (priority) => (
  priority === 'high' ? 'p-high' : priority === 'low' ? 'p-low' : 'p-mid'
);

export const priorityFromImportance = (importance) => (
  importance === 'high' ? 'high' : importance === 'low' ? 'low' : 'mid'
);

export const DEFAULT_PROJECT_COLOR = '#64748b';

export const fileIcon = (type, name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!type && ext) {
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📋';
    if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
    if (['mp4', 'mov', 'avi'].includes(ext)) return '🎬';
    if (['mp3', 'wav', 'm4a'].includes(ext)) return '🎵';
  }
  if (!type) return '📄';
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📕';
  if (type.includes('word')) return '📝';
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return '📊';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📋';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('zip')) return '🗜️';
  return '📄';
};

export const fmtSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};
