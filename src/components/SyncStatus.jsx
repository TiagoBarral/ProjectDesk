import { useEffect, useState } from 'react';

const labels = {
  syncing: 'Syncing...',
  synced: 'Synced',
  error: 'Sync error',
  offline: 'Offline',
};

export default function SyncStatus({ state }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state === 'idle') return undefined;
    setVisible(true);
    if (state !== 'syncing' && state !== 'offline') {
      const timer = window.setTimeout(() => setVisible(false), 2000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state]);

  return (
    <div className={`sync-bar ${visible ? 'visible' : ''} ${state}`}>
      <div className={`sync-dot ${state}`} />
      <span>{labels[state] || 'Synced'}</span>
    </div>
  );
}
