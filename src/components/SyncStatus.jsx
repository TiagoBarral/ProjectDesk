import { useEffect, useState } from 'react';

export default function SyncStatus({ state }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state === 'idle') return undefined;
    setVisible(true);
    if (state !== 'saving') {
      const timer = window.setTimeout(() => setVisible(false), 2000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state]);

  return (
    <div className={`sync-bar ${visible ? 'visible' : ''}`}>
      <div className={`sync-dot ${state === 'saving' ? 'saving' : ''}`} />
      <span>{state === 'saving' ? 'Saving...' : 'Saved'}</span>
    </div>
  );
}
