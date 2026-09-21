import { useCallback, useState } from 'react';
import api from '../services/api';

// Resolve qual gato usar pro check de emergência: se vier um catId (ex.: já
// dentro do perfil de um gato), usa ele direto; senão busca a lista — 1 gato
// ativo usa na hora, mais de um abre um seletor rápido. Mesmo comportamento
// usado no ícone de emergência da bottom nav, agora reaproveitado também
// pela aba Saúde.
export default function useEmergencyCheck({ navigate, touch } = {}) {
  const [loading, setLoading] = useState(false);
  const [cat, setCat] = useState(null);
  const [open, setOpen] = useState(false);
  const [pickerCats, setPickerCats] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const trigger = useCallback(async (catIdHint) => {
    touch?.('nav');
    if (loading) return;

    setLoading(true);
    try {
      if (catIdHint) {
        const { data } = await api.get(`/pets/${catIdHint}`);
        setCat(data);
        setOpen(true);
        return;
      }

      const { data } = await api.get('/pets');
      const active = (data || []).filter((c) => !c.isMemorial && !c.isArchived);
      if (active.length === 0) {
        navigate?.('/cat-new');
      } else if (active.length === 1) {
        setCat(active[0]);
        setOpen(true);
      } else {
        setPickerCats(active);
        setPickerOpen(true);
      }
    } catch {
      // falha ao buscar gato — não abre o modal
    } finally {
      setLoading(false);
    }
  }, [loading, navigate, touch]);

  const pickCat = useCallback((selected) => {
    setPickerOpen(false);
    setCat(selected);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  return { loading, cat, open, pickerCats, pickerOpen, trigger, pickCat, close, closePicker };
}
