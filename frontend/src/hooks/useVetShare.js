import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

// Estado da "Pasta do Vet" de um pet: link ativo (se houver) e quantos
// documentos estão marcados com Vet.
export default function useVetShare(petId) {
  const [link, setLink] = useState(null);
  const [sharedCount, setSharedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!petId) return;
    try {
      const { data } = await api.get(`/vet-share/pet/${petId}`);
      setLink(data?.link || null);
      setSharedCount(Number(data?.sharedCount || 0));
    } catch (err) {
      console.warn('[vet-share] status indisponível', err?.response?.status);
    }
  }, [petId]);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (days = 7) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/vet-share/pet/${petId}`, { days });
      setLink(data?.link || null);
      return data?.link || null;
    } finally {
      setLoading(false);
    }
  }, [petId]);

  const revoke = useCallback(async () => {
    if (!link?.id) return;
    setLoading(true);
    try {
      await api.delete(`/vet-share/${link.id}`);
      setLink(null);
    } finally {
      setLoading(false);
    }
  }, [link?.id]);

  return { link, sharedCount, loading, reload, create, revoke };
}
