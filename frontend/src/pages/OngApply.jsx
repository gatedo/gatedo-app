import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartHandshake, CheckCircle2, Clock, XCircle } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6' };

export default function OngApply() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);

  const [profile, setProfile] = useState(undefined); // undefined = carregando, null = nunca pediu
  const [form, setForm] = useState({ name: '', cnpjOuResponsavel: '', city: '', instagram: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    api.get('/ong/me').then((r) => setProfile(r.data)).catch(() => setProfile(null));
  }, [user?.id]);

  const submit = async () => {
    setError('');
    if (!form.name || !form.cnpjOuResponsavel) {
      setError('Preencha nome e CNPJ (ou responsável).');
      return;
    }
    touch();
    setSubmitting(true);
    try {
      const res = await api.post('/ong/apply', form);
      setProfile(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Não deu pra enviar. Tenta de novo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F4F3FF' }}>
      <div className="px-5 pt-8 pb-5">
        <button
          onClick={() => { touch(); navigate(-1); }}
          className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm mb-4"
          style={{ color: C.purple }}
        >
          <ArrowLeft size={18} />
        </button>
        <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">Conta gratuita</p>
        <h1 className="text-xl font-black text-gray-900 leading-none mt-1">Sou uma ONG de adoção</h1>
      </div>

      <div className="px-5">
        {profile === undefined ? (
          <p className="text-center text-[12px] font-medium text-gray-400 py-10">Carregando...</p>
        ) : profile?.status === 'APPROVED' ? (
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-center">
            <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: '#10B981' }} />
            <p className="text-[14px] font-black text-gray-800 mb-1">ONG parceira aprovada</p>
            <p className="text-[12px] font-medium text-gray-500 mb-4">Seu selo já está ativo. Acesse o painel multi-gato.</p>
            <button
              onClick={() => { touch(); navigate('/ong/dashboard'); }}
              className="px-5 py-3 rounded-2xl font-black text-white text-[13px]"
              style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
            >
              Abrir painel
            </button>
          </div>
        ) : profile?.status === 'PENDING' ? (
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-center">
            <Clock size={28} className="mx-auto mb-3 text-gray-300" />
            <p className="text-[14px] font-black text-gray-800 mb-1">Pedido em análise</p>
            <p className="text-[12px] font-medium text-gray-500">
              Enviamos "{profile.name}" para aprovação manual. Avisamos assim que sair a resposta.
            </p>
          </div>
        ) : (
          <>
            {profile?.status === 'REJECTED' && (
              <div className="rounded-[18px] p-3.5 mb-4 flex items-start gap-2" style={{ background: '#FEF2F2' }}>
                <XCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                <p className="text-[11px] font-medium text-gray-600">
                  Pedido anterior não aprovado{profile.rejectionReason ? `: ${profile.rejectionReason}` : '.'} Pode reenviar com os dados corretos.
                </p>
              </div>
            )}

            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-4">
                <HeartHandshake size={16} style={{ color: C.purple }} />
                <p className="text-[12px] font-bold text-gray-600">
                  Grátis pra sempre. Aprovação manual — nome, CNPJ (ou responsável), cidade e Instagram.
                </p>
              </div>

              {[
                { key: 'name', label: 'Nome da ONG', placeholder: 'Ex.: Adote um Gatinho' },
                { key: 'cnpjOuResponsavel', label: 'CNPJ ou responsável', placeholder: 'CNPJ ou nome de quem responde' },
                { key: 'city', label: 'Cidade', placeholder: 'Cidade/UF' },
                { key: 'instagram', label: 'Instagram', placeholder: '@sua_ong' },
              ].map((f) => (
                <div key={f.key} className="mb-3">
                  <p className="text-[11px] font-bold text-gray-600 mb-1.5">{f.label}</p>
                  <input
                    type="text"
                    value={form[f.key]}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full text-[13px] font-medium bg-gray-50 rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>
              ))}

              {error && <p className="text-[11px] font-bold mt-1 mb-2" style={{ color: '#DC2626' }}>{error}</p>}
            </div>

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl font-black text-white text-sm"
              style={{ background: submitting ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
            >
              {submitting ? 'Enviando...' : 'Enviar pedido'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
