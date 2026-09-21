import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Única forma de pedir uma oferta ao módulo de decisão — nenhuma tela decide
// sozinha, isto só pergunta e mostra o que o backend devolver (no máx. 1).
export default function useOfferDecision({ surface, petId, trigger, enabled = true }) {
  const [offer, setOffer] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOffer = useCallback(() => {
    if (!enabled || !surface) return;
    setLoading(true);
    api.get('/offers/decide', { params: { surface, petId, trigger } })
      .then((r) => {
        setOffer(r.data?.offer || null);
        setAlert(r.data?.alert || null);
      })
      .catch(() => {
        setOffer(null);
        setAlert(null);
      })
      .finally(() => setLoading(false));
  }, [surface, petId, trigger, enabled]);

  useEffect(() => { fetchOffer(); }, [fetchOffer]);

  const dismiss = useCallback(() => {
    setOffer(null);
    setAlert(null);
  }, []);

  return { offer, alert, loading, refetch: fetchOffer, dismiss };
}
