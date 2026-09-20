import { useState, useEffect } from 'react';
import { refreshImageUrl } from '@/lib/api-client';

/**
 * Hook pour gérer les URLs d'images avec rafraîchissement automatique
 * Les URLs signées expirent après 7 jours, ce hook les rafraîchit automatiquement
 */
export function useImageUrl(initialUrl: string | null, filePath: string | null) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rafraîchir l'URL manuellement
  const refresh = async () => {
    if (!filePath) return;

    setLoading(true);
    setError(null);

    try {
      const response = await refreshImageUrl(filePath);
      setUrl(response.url);
    } catch (err) {
      console.error('Failed to refresh image URL:', err);
      setError('Failed to refresh image URL');
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir automatiquement si l'URL est proche de l'expiration (par exemple, tous les 5 jours)
  useEffect(() => {
    if (!filePath || !url) return;

    // Calculer quand rafraîchir (5 jours après le chargement initial)
    const refreshInterval = 5 * 24 * 60 * 60 * 1000; // 5 jours en millisecondes

    const timer = setTimeout(() => {
      refresh();
    }, refreshInterval);

    return () => clearTimeout(timer);
  }, [filePath, url]);

  return { url, loading, error, refresh };
}
