import React, { useContext, useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Heart, Copy, Check, X } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', red: '#DC2626', green: '#10B981' };

/**
 * Bloco "Apoie o GATEDO" — doação livre, sem contrapartida. Mora só no
 * Perfil (nunca home, nunca aba Saúde, nunca modal — regra dura, igual a
 * do motor de ofertas). Gerar o PDF pro veterinário dispara uma notificação
 * chamando pro Perfil (ver users.service.ts#notifyDonationAfterPdf) em vez
 * de mostrar qualquer coisa na tela de Saúde. Some por 90 dias após
 * dispensado (User.donationDismissedAt), e nem aparece se o admin ainda
 * não tiver configurado a chave Pix em AppSettings.
 */
export default function SupportGatedoBlock({ className = '' }) {
  const { user } = useContext(AuthContext);
  const touch = useSensory();
  const [pixKey, setPixKey] = useState(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const impressionFired = useRef(false);
  const surface = 'DONATION_PROFILE';

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      api.get('/settings/public'),
      api.get(`/users/${user.id}/donation-state`),
    ]).then(([settingsRes, stateRes]) => {
      const key = settingsRes.data?.DONATION_PIX_KEY;
      if (!key) return; // admin ainda não configurou — bloco não existe pro usuário
      if (stateRes.data?.suppressed) return;
      setPixKey(key);
      setVisible(true);
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!visible || impressionFired.current) return;
    impressionFired.current = true;
    api.post('/offers/event', { surface, offerKey: 'support-gatedo', action: 'IMPRESSION' }).catch(() => {});
  }, [visible, surface]);

  const copy = () => {
    touch();
    navigator.clipboard?.writeText(pixKey).then(() => {
      setCopied(true);
      api.post('/offers/event', { surface, offerKey: 'support-gatedo', action: 'CLICK', metadata: { via: 'copy_pix' } }).catch(() => {});
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const dismiss = () => {
    touch();
    setVisible(false);
    if (user?.id) api.post(`/users/${user.id}/donation/dismiss`).catch(() => {});
    api.post('/offers/event', { surface, offerKey: 'support-gatedo', action: 'DISMISS' }).catch(() => {});
  };

  if (!visible || !pixKey) return null;

  return (
    <div className={`bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm relative ${className}`}>
      <button onClick={dismiss} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center">
        <X size={13} className="text-gray-400" />
      </button>

      <div className="flex items-center gap-2 mb-2 pr-6">
        <Heart size={15} style={{ color: C.red }} />
        <p className="text-[12px] font-black text-gray-800">Apoie o GATEDO</p>
      </div>
      <p className="text-[11px] font-medium text-gray-500 leading-relaxed mb-4">
        O app é gratuito. O que sustenta hoje são os protocolos e a lojinha — se quiser ajudar além disso,
        uma doação livre mantém a IA, o banco de dados e a segurança dos seus dados no ar. Sem contrapartida, sem selo, só se quiser.
      </p>

      <div className="flex items-center gap-4">
        <div className="bg-white p-2 rounded-xl border border-gray-100 shrink-0">
          <QRCode value={pixKey} size={72} fgColor={C.purpleDark} bgColor="#ffffff" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-wide text-gray-400 mb-1">Chave Pix</p>
          <p className="text-[11px] font-medium text-gray-600 truncate mb-2">{pixKey}</p>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black"
            style={{ background: copied ? '#ECFDF5' : '#F1E9FF', color: copied ? C.green : C.purple }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copiado' : 'Copiar chave'}
          </button>
        </div>
      </div>
    </div>
  );
}
