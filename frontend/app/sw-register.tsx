'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker enregistré avec succès:', registration.scope);
          })
          .catch((error) => {
            console.log('Erreur lors de l\'enregistrement du Service Worker:', error);
          });
      });
    }
  }, []);

  return null;
}
