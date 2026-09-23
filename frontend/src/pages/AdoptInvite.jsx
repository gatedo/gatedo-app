import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { HeartHandshake, CheckCircle2, XCircle, Clock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', bg: '#F4F3FF', green: '#10B981', red: '#DC2626' };

function InlineLogin({ onLoggedIn }) {
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
      onLoggedIn();
    } catch (err) {
      setError(err?.response?.data?.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
      <p className="text-[12px] font-black text-gray-800 mb-3">Já tenho conta</p>
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full text-[13px] font-medium bg-gray-50 rounded-xl px-3 py-2.5 outline-none mb-2" />
      <div className="relative mb-2">
        <input type={showPw ? 'text' : 'password'} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full text-[13px] font-medium bg-gray-50 rounded-xl px-3 py-2.5 pr-10 outline-none" />
        <button onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="text-[11px] font-bold mb-2" style={{ color: C.red }}>{error}</p>}
      <button onClick={submit} disabled={loading}
        className="w-full py-3 rounded-2xl font-black text-white text-[13px]"
        style={{ background: loading ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </div>
  );
}

export default function AdoptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);

  const [preview, setPreview] = useState(undefined);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/transfer-invites/${token}`).then((r) => setPreview(r.data)).catch(() => setPreview(null));
  }, [token]);

  const accept = async () => {
    touch();
    setError('');
    setAccepting(true);
    try {
      const res = await api.post(`/transfer-invites/${token}/accept`);
      navigate(`/adocao/boas-vindas/${res.data.id}`, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Não deu pra aceitar esse convite.');
    } finally {
      setAccepting(false);
    }
  };

  if (preview === undefined) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <p className="text-[12px] font-medium text-gray-400">Carregando...</p>
    </div>;
  }

  if (!preview || preview.status !== 'PENDING') {
    const msg = preview?.status === 'EXPIRED' ? 'Este convite expirou.'
      : preview?.status === 'ACCEPTED' ? 'Este convite já foi usado.'
      : 'Convite não encontrado ou cancelado.';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: C.bg }}>
        <XCircle size={28} style={{ color: C.red }} className="mb-3" />
        <p className="text-[13px] font-black text-gray-700">{msg}</p>
        <button onClick={() => navigate('/home')} className="mt-4 px-5 py-2.5 rounded-2xl font-black text-xs text-white" style={{ background: C.purple }}>
          Ir para o Gatedo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: C.bg }}>
      <div className="px-5 pt-10 pb-6 text-center">
        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-4 border-white shadow-sm">
          {preview.petPhoto
            ? <img src={preview.petPhoto} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: `${C.purple}10` }}>🐱</div>}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck size={11} style={{ color: C.purple }} /> Convite de {preview.ongName}
        </p>
        <h1 className="text-xl font-black text-gray-900 mt-1">Adotar {preview.petName}</h1>
      </div>

      <div className="px-5 space-y-4">
        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">O que acontece ao aceitar</p>
          <div className="space-y-2.5">
            <p className="text-[12px] font-medium text-gray-600 leading-relaxed">
              <strong className="text-gray-800">Vai com {preview.petName}:</strong> ficha, carteira de vacinas, preventivos, pesagens, histórico e documentos.
            </p>
            <p className="text-[12px] font-medium text-gray-600 leading-relaxed">
              <strong className="text-gray-800">Nunca vai:</strong> dados pessoais de quem entregou, conversas e anotações internas da ONG.
            </p>
            <p className="text-[12px] font-medium text-gray-600 leading-relaxed">
              Depois do aceite, <strong className="text-gray-800">{preview.ongName} mantém só o registro de que {preview.petName} foi adotado</strong>, com a data — sem acesso a nenhum registro novo.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-[18px] p-3.5 flex items-start gap-2" style={{ background: '#FEF2F2' }}>
            <XCircle size={15} className="shrink-0 mt-0.5" style={{ color: C.red }} />
            <p className="text-[11px] font-medium text-gray-600">{error}</p>
          </div>
        )}

        {user ? (
          <button onClick={accept} disabled={accepting}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm"
            style={{ background: accepting ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
            <HeartHandshake size={18} /> {accepting ? 'Recebendo...' : `Aceitar e receber ${preview.petName}`}
          </button>
        ) : (
          <>
            <InlineLogin onLoggedIn={() => {}} />
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-black text-gray-400">OU</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <button
              onClick={() => { touch(); navigate(`/register?inviteToken=${token}`); }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
              Criar conta e adotar {preview.petName}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
