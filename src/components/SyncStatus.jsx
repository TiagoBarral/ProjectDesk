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
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setNow(new Date());
  }, [lastSyncedAt, state]);

  useEffect(() => {
    if (state !== 'synced' && state !== 'idle') {
      setShowSuccess(false);
      return undefined;
    }

    if (!lastSyncedAt) return undefined;

    setShowSuccess(true);
    const timer = window.setTimeout(() => setShowSuccess(false), 2400);
    return () => window.clearTimeout(timer);
  }, [lastSyncedAt, state]);

  const label = useMemo(() => {
    if (state === 'syncing') return 'Syncing...';
    if (state === 'offline') return 'Offline';
    if (state === 'error') return 'Sync failed';
    return syncedLabel(lastSyncedAt, now);
  }, [lastSyncedAt, now, state]);

  const isPersistent = state === 'syncing' || state === 'offline' || state === 'error';
  const isVisible = isPersistent || showSuccess;
  const displayState = showSuccess && (state === 'idle' || state === 'synced') ? 'synced' : state;

  return (
    <div className={`sync-bar ${isVisible ? 'visible' : ''} ${displayState}`}>
      <div className={`sync-dot ${displayState === 'idle' ? 'synced' : displayState}`} />
      <span>{label}</span>
    </div>
  );
}
