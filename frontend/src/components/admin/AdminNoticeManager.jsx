import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  Megaphone,
  Calendar,
  Trophy,
  Eye,
} from 'lucide-react';
import api from '../../services/api';
import NoticeFormModal from './NoticeFormModal';

function formatDate(value) {
  if (!value) return 'Sem expiração';

  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return 'Data inválida';
  }
}

function getStatusLabel(notice) {
  if (!notice.isActive) {
    return { label: 'Inativo', color: '#6B7280', bg: '#F3F4F6' };
  }

  if (notice.expiresAt && new Date(notice.expiresAt).getTime() < Date.now()) {
    return { label: 'Expirado', color: '#92400E', bg: '#FEF3C7' };
  }

  return { label: 'Ativo', color: '#065F46', bg: '#D1FAE5' };
}

export default function AdminNoticeManager() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  const showToast = (msg, type = 'default') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  const fetchNotices = useCallback(async () => {
    setLoading(true);

    try {
      const res = await api.get('/notices/admin');
      setNotices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao carregar notices admin:', err);
      setNotices([]);
      showToast('Erro ao carregar comunicados', 'warn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const stats = useMemo(() => {
    const active = notices.filter((n) => n.isActive).length;
    const inactive = notices.filter((n) => !n.isActive).length;
    const totalXp = notices.reduce((sum, n) => sum + Number(n.xpReward || 0), 0);

    return { active, inactive, totalXp };
  }, [notices]);

  const handleCreate = () => {
    setEditingNotice(null);
    setOpenModal(true);
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setOpenModal(true);
  };

  const handleSaved = async () => {
    await fetchNotices();
    window.dispatchEvent(new CustomEvent('gatedo:refresh-notices'));
    showToast(editingNotice?.id ? 'Comunicado atualizado' : 'Comunicado criado', 'success');
    setEditingNotice(null);
    setOpenModal(false);
  };

  const handleToggle = async (notice) => {
    try {
      await api.patch(`/notices/${notice.id}`, {
        isActive: !notice.isActive,
      });

      showToast(
        notice.isActive ? 'Comunicado desativado' : 'Comunicado ativado',
        'success',
      );

      await fetchNotices();
      window.dispatchEvent(new CustomEvent('gatedo:refresh-notices'));
    } catch (err) {
      console.error('Erro ao alternar comunicado:', err);
      showToast('Não foi possível alterar o status', 'warn');
    }
  };

  const handleDelete = async (notice) => {
    const ok = window.confirm(`Excluir o comunicado "${notice.title}"?`);
    if (!ok) return;

    try {
      await api.delete(`/notices/${notice.id}`);
      showToast('Comunicado excluído', 'success');
      await fetchNotices();
      window.dispatchEvent(new CustomEvent('gatedo:refresh-notices'));
    } catch (err) {
      console.error('Erro ao excluir comunicado:', err);
      showToast('Não foi possível excluir o comunicado', 'warn');
    }
  };

  return (
    <div className="space-y-6">
      <NoticeFormModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingNotice(null);
        }}
        onSaved={handleSaved}
        initialData={editingNotice}
      />

      {toast && (
        <div className="fixed bottom-8 right-8 z-[550]">
          <div
            className="px-5 py-3 rounded-full font-black text-sm shadow-lg"
            style={
              toast.type === 'success'
                ? { background: '#e1ff00', color: '#1a1a00' }
                : toast.type === 'warn'
                  ? { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }
                  : { background: '#111827', color: '#fff' }
            }
          >
            {toast.msg}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-[24px] bg-white border border-gray-100 p-5 shadow-sm">
          <p className="text-[11px] font-black text-gray-400 uppercase">Total</p>
          <p className="text-2xl font-black text-gray-800 mt-2">{notices.length}</p>
        </div>

        <div className="rounded-[24px] bg-white border border-gray-100 p-5 shadow-sm">
          <p className="text-[11px] font-black text-gray-400 uppercase">Ativos</p>
          <p className="text-2xl font-black text-emerald-700 mt-2">{stats.active}</p>
        </div>

        <div className="rounded-[24px] bg-white border border-gray-100 p-5 shadow-sm">
          <p className="text-[11px] font-black text-gray-400 uppercase">Inativos</p>
          <p className="text-2xl font-black text-gray-700 mt-2">{stats.inactive}</p>
        </div>

        <div className="rounded-[24px] bg-white border border-gray-100 p-5 shadow-sm">
          <p className="text-[11px] font-black text-gray-400 uppercase">XP Total</p>
          <p className="text-2xl font-black text-violet-700 mt-2">{stats.totalXp}</p>
        </div>
      </div>

      <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-800">Official Notice Engine</h2>
            <p className="text-[11px] font-bold text-gray-400 mt-1">
              Gerencie avisos oficiais, onboarding progressivo e campanhas com XP
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-[16px] text-white font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #8B4AFF, #8B5CF6)' }}
          >
            <Plus size={16} />
            Novo comunicado
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center">
              <p className="font-black text-gray-400">Carregando comunicados...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="py-16 text-center">
              <Megaphone size={38} className="mx-auto text-gray-300 mb-4" />
              <p className="font-black text-gray-600">Nenhum comunicado cadastrado</p>
              <p className="text-sm text-gray-400 mt-1">
                Crie o primeiro aviso oficial para o app.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice, index) => {
                const status = getStatusLabel(notice);

                return (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-[24px] border border-gray-100 bg-gray-50 p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-gray-800">
                            {notice.title}
                          </h3>

                          <span
                            className="text-[10px] font-black px-2.5 py-1 rounded-full"
                            style={{ background: status.bg, color: status.color }}
                          >
                            {status.label}
                          </span>

                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                            +{notice.xpReward || 0} XP
                          </span>

                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 inline-flex items-center gap-1">
                            <Eye size={12} />
                            {notice.totalReads ?? 0}
                          </span>

                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gray-200 text-gray-700">
                            {notice.type || 'INFO'}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed mt-3">
                          {notice.content}
                        </p>

                        <div className="flex items-center gap-4 flex-wrap mt-4 text-[11px] font-bold text-gray-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={13} />
                            {formatDate(notice.expiresAt)}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Trophy size={13} />
                            Criado em {formatDate(notice.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleEdit(notice)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-white border border-gray-200 text-gray-700 font-black text-sm"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>

                        <button
                          onClick={() => handleToggle(notice)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-white border border-gray-200 text-gray-700 font-black text-sm"
                        >
                          <Power size={14} />
                          {notice.isActive ? 'Desativar' : 'Ativar'}
                        </button>

                        <button
                          onClick={() => handleDelete(notice)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-red-50 border border-red-200 text-red-600 font-black text-sm"
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}