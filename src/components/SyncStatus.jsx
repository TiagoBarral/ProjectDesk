import { useEffect, useMemo, useState } from 'react';

function syncedLabel(lastSyncedAt, now) {
  if (!lastSyncedAt) return 'Synced';

  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - lastSyncedAt.getTime()) / 1000));
  if (elapsedSeconds < 60) return 'Synced just now';

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `Synced ${elapsedMinutes}m ago`;

  return `Synced ${Math.floor(elapsedMinutes / 60)}h ago`;
}

export default function SyncStatus({ state, lastSyncedAt }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setNow(new Date());
  }, [lastSyncedAt, state]);

  const label = useMemo(() => {
    if (state === 'syncing') return 'Syncing...';
    if (state === 'offline') return 'Offline';
    if (state === 'error') return 'Sync failed';
    return syncedLabel(lastSyncedAt, now);
  }, [lastSyncedAt, now, state]);

  const isVisible = state !== 'idle' || Boolean(lastSyncedAt);

  return (
    <div className={`sync-bar ${isVisible ? 'visible' : ''} ${state}`}>
      <div className={`sync-dot ${state === 'idle' ? 'synced' : state}`} />
      <span>{label}</span>
    </div>
  );
}
