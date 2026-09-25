import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import api from '../../services/api';
import useSensory from '../../hooks/useSensory';
import { track } from '../../utils/track';

// Bloco 3 da Loja, sempre por último: convite pro grupo de achadinhos no
// WhatsApp. Some sozinho se o admin não tiver configurado o link ainda.
export default function StoreWhatsAppBlock() {
  const touch = useSensory();
  const [link, setLink] = useState(null);
  const [text, setText] = useState('');
  const fired = useRef(false);

  useEffect(() => {
    api.get('/settings/public').then((r) => {
      if (r.data?.WHATSAPP_ACHADINHOS_LINK) {
        setLink(r.data.WHATSAPP_ACHADINHOS_LINK);
        setText(r.data.WHATSAPP_ACHADINHOS_TEXT || '');
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!link || fired.current) return;
    fired.current = true;
    api.post('/offers/event', { surface: 'STORE_WHATSAPP', offerKey: 'achadinhos-group', action: 'IMPRESSION' }).catch(() => {});
  }, [link]);

  if (!link) return null;

  const open = () => {
    touch();
    api.post('/offers/event', { surface: 'STORE_WHATSAPP', offerKey: 'achadinhos-group', action: 'CLICK' }).catch(() => {});
    track('whatsapp_group_click');
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      id="store-section-whatsapp"
      onClick={open}
      className="w-full text-left rounded-2xl p-3.5 flex items-center gap-3"
      style={{ background: 'linear-gradient(135deg, #128C4A 0%, #075E33 100%)' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.16)' }}>
        <MessageCircle size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-white leading-tight">Grupo de Achadinhos</p>
        <p className="text-[10px] font-bold text-white/70 leading-tight mt-0.5 line-clamp-1">
          {text || 'Promoções e novidades no WhatsApp'}
        </p>
      </div>
      <span className="text-[10px] font-black bg-white text-[#128C4A] px-2.5 py-1.5 rounded-lg shrink-0">Entrar</span>
    </button>
  );
}
