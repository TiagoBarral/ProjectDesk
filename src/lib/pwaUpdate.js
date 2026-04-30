import { useCallback, useEffect, useState } from 'react';
import { logger } from './logger.js';

let registrationPromise = null;
let hasReloadedForUpdate = false;

export function usePwaUpdate() {
  const [waitingRegistration, setWaitingRegistration] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const handleControllerChange = () => {
      if (hasReloadedForUpdate) return;
      hasReloadedForUpdate = true;
      window.location.reload();
    };

    const getRegistration = async () => {
      if (!registrationPromise) {
        registrationPromise = navigator.serviceWorker.register('/sw.js');
      }
      return registrationPromise;
    };

    const register = async () => {
      try {
        const registration = await getRegistration();

        if (registration.waiting) {
          setWaitingRegistration(registration);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingRegistration(registration);
            }
          });
        });

        registration.update().catch((error) => logger.warn('PWA update check failed', error));
      } catch (error) {
        logger.warn('Service worker registration failed', error);
      }
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      window.removeEventListener('load', register);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const reloadForUpdate = useCallback(() => {
    const waitingWorker = waitingRegistration?.waiting;
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingRegistration]);

  return {
    updateAvailable: Boolean(waitingRegistration?.waiting),
    reloadForUpdate,
  };
}
