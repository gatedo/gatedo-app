import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
  ArrowLeft, Plus, Syringe, Bug, ShieldCheck, FlaskConical,
  X, Link2, Copy, Check, Trash2, HeartHandshake, Share2, Megaphone,
} from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import { brandAssets } from '../brand/assets';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', bg: '#F4F3FF', green: '#10B981', amber: '#F59E0B', red: '#DC2626' };

const STATUS_META = {
  DISPONIVEL: { label: 'Disponível', color: C.green, bg: '#ECFDF5' },
  EM_PROCESSO: { label: 'Em processo', color: C.amber, bg: '#FFFBEB' },
  ADOTADO: { label: 'Adotado', color: '#6B7280', bg: '#F3F4F6' },
};

const INVITE_TTL_LABEL = '7 dias';
const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

// ─── Modal: gerar convite de transferência ───────────────────────────────────
function InviteModal({ pet, onClose }) {
  const touch = useSensory();
  const cardRef = useRef(null);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    api.post(`/ong/pets/${pet.id}/transfer-invites`)
      .then((r) => setInvite(r.data))
      .finally(() => setLoading(false));
  }, [pet.id]);

  const link = invite ? `${APP_URL}/adotar/${invite.token}` : '';

  const copy = () => {
    touch();
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  // Gera uma imagem do card (foto do gato + identidade Gatedo + QR) e manda
  // pro share sheet nativo — mesmo caminho que o Comunigato já usa
  // (navigator.share, com fallback pra copiar link se não der).
  const shareCard = async () => {
    touch();
    setSharing(true);
    const shareText = `${pet.name} está disponível para adoção! Conheça: ${link}`;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2, useCORS: true });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = blob ? new File([blob], `adote-${pet.name}.png`, { type: 'image/png' }) : null;

      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Adote ${pet.name}`, text: shareText });
      } else if (navigator.share) {
        await navigator.share({ title: `Adote ${pet.name}`, text: shareText, url: link });
      } else {
        await navigator.clipboard?.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Foto do R2 pode travar o canvas por CORS — nesse caso compartilha só o link.
      if (navigator.share) {
        await navigator.share({ title: `Adote ${pet.name}`, text: shareText, url: link }).catch(() => {});
      } else {
        await navigator.clipboard?.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="relative w-full sm:max-w-[420px] bg-white rounded-t-[28px] sm:rounded-[28px] p-5 pb-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Convite de adoção · {pet.name}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {loading ? (
          <p className="text-center text-[12px] font-medium text-gray-400 py-10">Gerando convite...</p>
        ) : (
          <>
            {/* Card compartilhável — foto do gato + identidade Gatedo + QR */}
            <div ref={cardRef} className="rounded-[24px] overflow-hidden mb-4" style={{ background: `linear-gradient(160deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
              <div className="pt-5 px-5 pb-3">
                <img src={brandAssets.gatedoYellow} alt="Gatedo" className="h-6 object-contain" crossOrigin="anonymous" />
              </div>
              <div className="mx-3 rounded-[18px] overflow-hidden bg-white/10 aspect-square">
                {pet.photoUrl
                  ? <img src={pet.photoUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center text-6xl">🐱</div>}
              </div>
              <div className="px-5 pt-4 pb-5 text-center">
                <p className="text-white/70 text-[9px] font-black uppercase tracking-[3px] mb-1">Quer adotar?</p>
                <p className="text-white text-2xl font-black mb-3">{pet.name}</p>
                <div className="bg-white rounded-2xl p-3 inline-block">
                  <QRCode value={link} size={120} fgColor={C.purpleDark} bgColor="#ffffff" />
                </div>
              </div>
            </div>

            <button onClick={shareCard} disabled={sharing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[12px] text-white mb-2"
              style={{ background: sharing ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
              <Share2 size={14} /> {sharing ? 'Preparando...' : 'Compartilhar nas redes'}
            </button>

            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
              <Link2 size={14} className="text-gray-400 shrink-0" />
              <p className="text-[11px] font-medium text-gray-600 truncate flex-1">{link}</p>
            </div>
            <button onClick={copy}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-[12px] mb-2"
              style={{ background: '#F1E9FF', color: C.purple }}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado!' : 'Copiar link'}
            </button>
            <p className="text-[10px] font-bold text-gray-400 text-center">Válido por {INVITE_TTL_LABEL}. Ao ser aceito, {pet.name} passa a ser gerenciado pelo adotante — vocês mantêm só o registro da adoção, sem acesso a novos registros.</p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Modal: sugerir melhoria ──────────────────────────────────────────────────
function SuggestionModal({ onClose }) {
  const touch = useSensory();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!message.trim()) return;
    touch();
    setSubmitting(true);
    try {
      await api.post('/ong/suggestions', { message: message.trim() });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="relative w-full sm:max-w-[420px] bg-white rounded-t-[28px] sm:rounded-[28px] p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-black text-gray-900">Sugerir melhoria</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${C.green}18` }}>
              <Check size={22} style={{ color: C.green }} />
            </div>
            <p className="text-[13px] font-bold text-gray-700 mb-5">Enviado! Obrigado pela ideia.</p>
            <button onClick={onClose} className="px-6 py-3 rounded-2xl font-black text-white text-[12px]"
              style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p className="text-[12px] font-medium text-gray-500 mb-3">
              O que falta ou poderia funcionar melhor pra sua ONG no Gatedo?
            </p>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conta pra gente..."
              className="w-full text-[13px] font-medium bg-gray-50 rounded-xl px-3 py-2.5 outline-none resize-none mb-4"
            />
            <button onClick={submit} disabled={submitting || !message.trim()}
              className="w-full py-3.5 rounded-2xl font-black text-white text-[13px]"
              style={{ background: submitting || !message.trim() ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
              {submitting ? 'Enviando...' : 'Enviar sugestão'}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Modal: cadastro rápido em lote ──────────────────────────────────────────
function BulkAddModal({ onClose, onDone }) {
  const touch = useSensory();
  const [rows, setRows] = useState([{ name: '', ageYears: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const setRow = (i, field, value) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  const addRow = () => setRows((prev) => [...prev, { name: '', ageYears: '' }]);
  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    const pets = rows
      .filter((r) => r.name.trim())
      .map((r) => ({ name: r.name.trim(), ageYears: r.ageYears ? Number(r.ageYears) : undefined }));
    if (pets.length === 0) return;
    touch();
    setSubmitting(true);
    try {
      await api.post('/ong/pets/bulk', { pets });
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="relative w-full sm:max-w-[440px] bg-white rounded-t-[28px] sm:rounded-[28px] p-5 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-black text-gray-900">Cadastrar vários gatos</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-2 mb-3">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="text" placeholder="Nome" value={r.name}
                onChange={(e) => setRow(i, 'name', e.target.value)}
                className="flex-1 text-[13px] font-medium bg-gray-50 rounded-xl px-3 py-2.5 outline-none" />
              <input type="number" placeholder="Idade" value={r.ageYears}
                onChange={(e) => setRow(i, 'ageYears', e.target.value)}
                className="w-20 text-[13px] font-medium bg-gray-50 rounded-xl px-3 py-2.5 outline-none" />
              {rows.length > 1 && (
                <button onClick={() => removeRow(i)} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                  <Trash2 size={14} className="text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={addRow} className="w-full py-2.5 rounded-xl font-black text-[11px] mb-4" style={{ background: '#F4F3FF', color: C.purple }}>
          + Adicionar linha
        </button>

        <button onClick={submit} disabled={submitting}
          className="w-full py-3.5 rounded-2xl font-black text-white text-[13px]"
          style={{ background: submitting ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
          {submitting ? 'Salvando...' : `Cadastrar ${rows.filter((r) => r.name.trim()).length || ''}`}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Modal: preventivo em lote ────────────────────────────────────────────────
const PREVENTIVE_TYPES = [
  { value: 'VACCINE', label: 'Vacina' },
  { value: 'VERMIFUGE', label: 'Vermífugo' },
  { value: 'PARASITE', label: 'Antipulgas' },
];

function BulkHealthModal({ pets, onClose, onDone }) {
  const touch = useSensory();
  const [selected, setSelected] = useState([]);
  const [type, setType] = useState('VERMIFUGE');
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    if (selected.length === 0 || !title.trim()) return;
    touch();
    setSubmitting(true);
    try {
      await api.post('/ong/health-records/bulk', { petIds: selected, type, title: title.trim() });
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="relative w-full sm:max-w-[440px] bg-white rounded-t-[28px] sm:rounded-[28px] p-5 pb-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-black text-gray-900">Registrar preventivo em lote</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          {PREVENTIVE_TYPES.map((t) => (
            <button key={t.value} onClick={() => setType(t.value)}
              className="flex-1 py-2 rounded-xl text-[11px] font-black"
              style={type === t.value ? { background: C.purple, color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}>
              {t.label}
            </button>
          ))}
        </div>

        <input type="text" placeholder="Ex.: Vermífugo Drontal" value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-[13px] font-medium bg-gray-50 rounded-xl px-3 py-2.5 outline-none mb-3" />

        <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">
          Selecione os gatos ({selected.length})
        </p>
        <div className="space-y-1.5 mb-4 max-h-[220px] overflow-y-auto">
          {pets.map((p) => (
            <button key={p.id} onClick={() => toggle(p.id)}
              className="w-full flex items-center gap-2.5 bg-gray-50 rounded-xl p-2.5 text-left">
              {selected.includes(p.id) ? <Check size={16} style={{ color: C.purple }} /> : <div className="w-4 h-4 rounded border border-gray-300" />}
              <span className="text-[12px] font-bold text-gray-700">{p.name}</span>
            </button>
          ))}
        </div>

        <button onClick={submit} disabled={submitting || selected.length === 0 || !title.trim()}
          className="w-full py-3.5 rounded-2xl font-black text-white text-[13px]"
          style={{ background: submitting || selected.length === 0 || !title.trim() ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
          {submitting ? 'Registrando...' : `Registrar para ${selected.length}`}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Card de gato ─────────────────────────────────────────────────────────────
function PetRow({ pet, onInvite, onStatusChange }) {
  const meta = STATUS_META[pet.adoptionStatus] || STATUS_META.DISPONIVEL;
  return (
    <div className="bg-white rounded-[22px] p-4 border border-gray-50 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0" style={{ border: `2px solid ${C.purple}25` }}>
          {pet.photoUrl
            ? <img src={pet.photoUrl} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: `${C.purple}10` }}>🐱</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-gray-800 truncate">{pet.name}</p>
          <p className="text-[10px] font-bold text-gray-400">
            {pet.ageYears != null ? `${pet.ageYears} ano${pet.ageYears !== 1 ? 's' : ''}` : 'idade não informada'}
          </p>
        </div>
        <select
          value={pet.adoptionStatus || 'DISPONIVEL'}
          onChange={(e) => onStatusChange(pet.id, e.target.value)}
          className="text-[10px] font-black uppercase tracking-wide rounded-full px-2.5 py-1.5 border-0 outline-none"
          style={{ background: meta.bg, color: meta.color }}
        >
          {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-3 mb-3 px-1">
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: pet.healthSummary.vacinado ? C.green : '#D1D5DB' }}>
          <Syringe size={12} /> Vacina
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: pet.healthSummary.vermifugado ? C.green : '#D1D5DB' }}>
          <Bug size={12} /> Vermífugo
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: pet.healthSummary.castrado ? C.green : '#D1D5DB' }}>
          <ShieldCheck size={12} /> Castrado
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: pet.healthSummary.testeFivFelv ? C.green : '#D1D5DB' }}>
          <FlaskConical size={12} /> FIV/FeLV
        </span>
      </div>

      <button onClick={() => onInvite(pet)} disabled={pet.adoptionStatus === 'ADOTADO'}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[11px]"
        style={pet.adoptionStatus === 'ADOTADO'
          ? { background: '#F3F4F6', color: '#9CA3AF' }
          : { background: '#F1E9FF', color: C.purple }}>
        <HeartHandshake size={14} /> Gerar convite de adoção
      </button>
    </div>
  );
}

export default function OngDashboard() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteFor, setInviteFor] = useState(null);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkHealthOpen, setBulkHealthOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/ong/pets').then((r) => setPets(Array.isArray(r.data) ? r.data : [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { DISPONIVEL: 0, EM_PROCESSO: 0, ADOTADO: 0 };
    pets.forEach((p) => { c[p.adoptionStatus || 'DISPONIVEL'] = (c[p.adoptionStatus || 'DISPONIVEL'] || 0) + 1; });
    return c;
  }, [pets]);

  const updateStatus = async (petId, status) => {
    touch();
    setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, adoptionStatus: status } : p)));
    await api.patch(`/ong/pets/${petId}/adoption-status`, { status }).catch(() => load());
  };

  if (user?.role !== 'ONG' && user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: C.bg }}>
        <HeartHandshake size={28} style={{ color: C.purple }} className="mb-3" />
        <p className="text-[13px] font-black text-gray-700 mb-1">Painel exclusivo pra ONGs parceiras</p>
        <button onClick={() => navigate('/ong/apply')} className="mt-3 px-5 py-2.5 rounded-2xl font-black text-xs text-white" style={{ background: C.purple }}>
          Solicitar conta ONG
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: C.bg }}>
      <div className="px-5 pt-8 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { touch(); navigate(-1); }}
            className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm"
            style={{ color: C.purple }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 flex items-center gap-1.5">
              ONG parceira <ShieldCheck size={11} style={{ color: C.purple }} />
            </p>
            <h1 className="text-xl font-black text-gray-900 leading-none mt-1">Meus gatos</h1>
          </div>
          <button onClick={() => { touch(); setSuggestionOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-black text-[11px] shrink-0"
            style={{ background: '#F1E9FF', color: C.purple }}>
            <Megaphone size={14} /> Sugerir
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {Object.entries(STATUS_META).map(([k, m]) => (
            <div key={k} className="flex-1 bg-white rounded-2xl p-3 border border-gray-50 text-center">
              <p className="text-lg font-black" style={{ color: m.color }}>{counts[k] || 0}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => { touch(); setBulkAddOpen(true); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-[11px]" style={{ background: '#F1E9FF', color: C.purple }}>
            <Plus size={14} /> Cadastrar gatos
          </button>
          <button onClick={() => { touch(); setBulkHealthOpen(true); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-[11px]" style={{ background: '#F1E9FF', color: C.purple }}>
            <Syringe size={14} /> Preventivo em lote
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-32 rounded-[22px] bg-gray-100 animate-pulse" />)}</div>
        ) : pets.length === 0 ? (
          <p className="text-center text-[12px] font-medium text-gray-400 py-10">Nenhum gato cadastrado ainda.</p>
        ) : (
          <div className="space-y-2.5">
            {pets.map((pet) => (
              <PetRow key={pet.id} pet={pet} onInvite={setInviteFor} onStatusChange={updateStatus} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {inviteFor && <InviteModal pet={inviteFor} onClose={() => setInviteFor(null)} />}
        {bulkAddOpen && <BulkAddModal onClose={() => setBulkAddOpen(false)} onDone={() => { setBulkAddOpen(false); load(); }} />}
        {bulkHealthOpen && <BulkHealthModal pets={pets} onClose={() => setBulkHealthOpen(false)} onDone={() => { setBulkHealthOpen(false); }} />}
        {suggestionOpen && <SuggestionModal onClose={() => setSuggestionOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
