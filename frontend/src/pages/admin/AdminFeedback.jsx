import React, { useEffect, useState } from 'react';
import { MessageSquareText, Send } from 'lucide-react';
import api from '../../services/api';

const C = { purple: '#8B4AFF' };

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'NOVO', label: 'Novo' },
  { value: 'LIDO', label: 'Lido' },
  { value: 'RESPONDIDO', label: 'Respondido' },
  { value: 'ARQUIVADO', label: 'Arquivado' },
];

const CATEGORY_LABEL = { FEATURE: '💡 Ideia', BUG: '🐛 Bug', DESIGN: '🎨 Visual', MESSAGE: '💬 Mensagem', OTHER: '✨ Outro' };
const SOURCE_LABEL = { MUNDO_GATEDO: 'Mundo Gatedo', PROFILE: 'Perfil' };

const STATUS_STYLE = {
  NOVO: { bg: '#EFF6FF', color: '#2563EB' },
  LIDO: { bg: '#F5F3FF', color: '#8B4AFF' },
  RESPONDIDO: { bg: '#F0FDF4', color: '#16A34A' },
  ARQUIVADO: { bg: '#F9FAFB', color: '#6B7280' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `há ${days}d`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `há ${hours}h`;
  const min = Math.floor(diff / 60000);
  return min > 0 ? `há ${min}min` : 'agora';
}

function MessageCard({ msg, onUpdate }) {
  const [reply, setReply] = useState(msg.adminReply || '');
  const [saving, setSaving] = useState(false);
  const statusStyle = STATUS_STYLE[msg.status] || STATUS_STYLE.NOVO;

  const setStatus = async (status) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/feedback/admin/${msg.id}`, { status });
      onUpdate(data);
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/feedback/admin/${msg.id}`, { adminReply: reply.trim(), status: 'RESPONDIDO' });
      onUpdate(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-black text-gray-800 truncate">{msg.user?.name || 'Tutor'}</p>
          <p className="text-[11px] text-gray-400 font-medium truncate">{msg.user?.email}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-black px-2 py-1 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.color }}>
            {msg.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[10px] font-bold text-gray-500">{CATEGORY_LABEL[msg.category] || msg.category}</span>
        <span className="text-[10px] font-bold text-gray-300">·</span>
        <span className="text-[10px] font-bold text-gray-500">{SOURCE_LABEL[msg.source] || msg.source}</span>
        <span className="text-[10px] font-bold text-gray-300">·</span>
        <span className="text-[10px] font-bold text-gray-400">{timeAgo(msg.createdAt)}</span>
      </div>

      <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-line mb-3">{msg.text}</p>

      {msg.adminReply && (
        <div className="rounded-xl p-3 mb-3 bg-emerald-50 border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1">Sua resposta</p>
          <p className="text-[12px] text-emerald-800 font-medium">{msg.adminReply}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Responder (opcional)..."
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium outline-none"
        />
        <button
          onClick={sendReply}
          disabled={saving || !reply.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: reply.trim() ? C.purple : '#F3F4F6', color: reply.trim() ? '#fff' : '#9CA3AF' }}
        >
          <Send size={14} />
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {['NOVO', 'LIDO', 'ARQUIVADO'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            disabled={saving || msg.status === s}
            className="px-2.5 py-1 rounded-full text-[10px] font-black"
            style={msg.status === s ? { background: '#F3F4F6', color: '#9CA3AF' } : { background: '#F4F3FF', color: C.purple }}
          >
            Marcar {s.toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminFeedback() {
  const [status, setStatus] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/feedback/admin', { params: { status: status || undefined } })
      .then((r) => setMessages(r.data || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const handleUpdate = (updated) => {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <MessageSquareText size={22} style={{ color: C.purple }} /> Sugestões & Mensagens
        </h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Caixa de sugestões (Mundo Gatedo) e "Fale com a gente" (Perfil), tudo aqui.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className="px-3 py-1.5 rounded-full text-[11px] font-black"
            style={status === tab.value ? { background: C.purple, color: '#fff' } : { background: '#F4F3FF', color: '#6b7280' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm font-medium text-gray-400">Carregando...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm font-medium text-gray-400 text-center py-10">Nenhuma mensagem aqui ainda.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {messages.map((msg) => (
            <MessageCard key={msg.id} msg={msg} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
