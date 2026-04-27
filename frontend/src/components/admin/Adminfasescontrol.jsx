/**
 * AdminFasesControl.jsx
 * Painel de controle das fases de venda do Fundador
 *
 * Funcionalidades:
 *   - Ativar/desativar cada fase (qual está aberta para venda)
 *   - Ajustar manualmente o número de vendidas por fase
 *   - Ver progresso de vagas em tempo real
 *   - Quando webhook estiver pronto, vendidas vêm automaticamente da API
 *
 * Localização: src/components/admin/AdminFasesControl.jsx
 * Import path: import api from '../../services/api'
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, CheckCircle, Lock, Edit3, Save,
  X, TrendingUp, Users, AlertTriangle, RefreshCw
} from 'lucide-react';
import api from '../../services/api';

// ─── Config base das fases ────────────────────────────────────────────────────
const FASE_CONFIG = [
  { n: 1, label: 'Early Bird',   price: 47,  totalVagas: 50,  color: '#EF4444', kiwifyUrl: 'https://pay.kiwify.com.br/VjePvmn' },
  { n: 2, label: 'Fundador',     price: 67,  totalVagas: 100, color: '#f59e0b', kiwifyUrl: 'https://pay.kiwify.com.br/TlfQJm5' },
  { n: 3, label: 'Acesso Final', price: 97,  totalVagas: 200, color: '#6158ca', kiwifyUrl: 'https://pay.kiwify.com.br/tcbqqVl' },
];

// ─── Estado inicial padrão ────────────────────────────────────────────────────
const DEFAULT_STATE = {
  faseAtiva: 1,  // qual fase está aberta para vendas
  vendas: { 1: 0, 2: 0, 3: 0 },
  encerrado: false, // true quando todas as fases esgotarem
};

export default function AdminFasesControl() {
  const [config,    setConfig]    = useState(DEFAULT_STATE);
  const [editando,  setEditando]  = useState(null); // fase sendo editada
  const [tempVal,   setTempVal]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');

  // ── Carrega config do backend ──────────────────────────────────────────────
  useEffect(() => {
    api.get('/admin/fases/config')
      .then(r => setConfig(c => ({ ...c, ...r.data })))
      .catch(() => {}); // silencioso — usa padrão local
  }, []);

  // ── Salva no backend ───────────────────────────────────────────────────────
  const saveConfig = async (newConfig) => {
    setLoading(true);
    setError('');
    try {
      await api.patch('/admin/fases/config', newConfig);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Não foi possível salvar no servidor. Alteração aplicada localmente.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const setFaseAtiva = (n) => {
    const novo = { ...config, faseAtiva: n, encerrado: false };
    setConfig(novo);
    saveConfig(novo);
  };

  const toggleEncerrado = () => {
    const novo = { ...config, encerrado: !config.encerrado };
    setConfig(novo);
    saveConfig(novo);
  };

  const saveVendas = (fase, valor) => {
    const v = Math.max(0, Math.min(Number(valor), FASE_CONFIG.find(f => f.n === fase).totalVagas));
    const novo = { ...config, vendas: { ...config.vendas, [fase]: v } };
    setConfig(novo);
    setEditando(null);
    saveConfig(novo);
  };

  const refresh = () => {
    setLoading(true);
    api.get('/admin/fases/config')
      .then(r => setConfig(c => ({ ...c, ...r.data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="p-2.5 rounded-2xl" style={{ background: 'rgba(97,88,202,0.1)' }}>
          <Layers size={18} color="#6158ca" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-black text-gray-800 italic">Controle de Fases 🐾</h3>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fundador · Kiwify</p>
        </div>
        <button onClick={refresh} disabled={loading}
          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
          <RefreshCw size={13} color="#9CA3AF" className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">

        {/* Erro / Sucesso */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-100">
              <AlertTriangle size={13} color="#f59e0b" />
              <p className="text-[10px] font-bold text-amber-700">{error}</p>
            </motion.div>
          )}
          {saved && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-2xl bg-green-50 border border-green-100">
              <CheckCircle size={13} color="#10B981" />
              <p className="text-[10px] font-bold text-green-700">Configuração salva!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle encerrado */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
          <div>
            <p className="text-xs font-black text-gray-700 uppercase tracking-tight">Vendas abertas</p>
            <p className="text-[9px] text-gray-400 font-bold mt-0.5">
              {config.encerrado ? 'Página mostra "Esgotado"' : `Fase ${config.faseAtiva} ativa`}
            </p>
          </div>
          <button onClick={toggleEncerrado}
            className="relative w-11 h-6 rounded-full transition-all"
            style={{ background: config.encerrado ? '#E5E7EB' : '#6158ca' }}>
            <motion.div
              animate={{ x: config.encerrado ? 2 : 22 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </button>
        </div>

        {/* Cards das fases */}
        {FASE_CONFIG.map(f => {
          const vendidas  = config.vendas[f.n] ?? 0;
          const restantes = f.totalVagas - vendidas;
          const pct       = Math.min((vendidas / f.totalVagas) * 100, 100);
          const urgente   = restantes > 0 && restantes <= f.totalVagas * 0.2;
          const esgotada  = restantes <= 0;
          const ativa     = !config.encerrado && config.faseAtiva === f.n;

          return (
            <motion.div key={f.n}
              animate={{ opacity: config.encerrado ? 0.5 : 1 }}
              className="rounded-[20px] border-2 overflow-hidden transition-all"
              style={{
                borderColor: ativa ? f.color : '#F3F4F6',
                background:  ativa ? `${f.color}08` : 'white',
              }}>

              {/* Header da fase */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Badge fase */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: ativa ? f.color : '#F3F4F6' }}>
                  <span className="text-xs font-black" style={{ color: ativa ? 'white' : '#9CA3AF' }}>
                    F{f.n}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-gray-800">{f.label}</p>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                      style={{
                        background: ativa ? f.color : esgotada ? '#FEE2E2' : '#F3F4F6',
                        color:      ativa ? 'white'  : esgotada ? '#EF4444' : '#9CA3AF',
                      }}>
                      {esgotada ? 'ESGOTADA' : ativa ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold">
                    R${f.price} · {f.totalVagas} vagas
                  </p>
                </div>

                {/* Botão ativar */}
                {!esgotada && !ativa && !config.encerrado && (
                  <button onClick={() => setFaseAtiva(f.n)}
                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all"
                    style={{ borderColor: f.color, color: f.color }}>
                    Ativar
                  </button>
                )}
                {ativa && (
                  <CheckCircle size={18} color={f.color} />
                )}
                {esgotada && (
                  <Lock size={15} color="#EF4444" />
                )}
              </div>

              {/* Barra de progresso */}
              <div className="px-4 pb-1">
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ background: esgotada ? '#EF4444' : urgente ? '#f59e0b' : f.color }}
                  />
                </div>
              </div>

              {/* Vendidas — editável */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Users size={11} color="#9CA3AF" />
                  <span className="text-[10px] font-black text-gray-500">
                    {vendidas} vendida{vendidas !== 1 ? 's' : ''} · {restantes > 0 ? `${restantes} restantes` : 'Esgotada'}
                  </span>
                  {urgente && (
                    <span className="text-[8px] font-black text-amber-500">🔥 Últimas!</span>
                  )}
                </div>

                {/* Editar vendidas manualmente */}
                {editando === f.n ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min="0" max={f.totalVagas}
                      value={tempVal}
                      onChange={e => setTempVal(e.target.value)}
                      className="w-16 text-center text-xs font-black border-2 border-[#6158ca] rounded-xl px-2 py-1 outline-none"
                      autoFocus
                    />
                    <button onClick={() => saveVendas(f.n, tempVal)}
                      className="w-7 h-7 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                      <Save size={11} color="#10B981" />
                    </button>
                    <button onClick={() => setEditando(null)}
                      className="w-7 h-7 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <X size={11} color="#9CA3AF" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setEditando(f.n); setTempVal(String(vendidas)); }}
                    className="flex items-center gap-1 text-[9px] font-black text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-all">
                    <Edit3 size={10} />
                    Editar
                  </button>
                )}
              </div>

              {/* Link Kiwify */}
              <div className="flex items-center gap-2 mx-4 mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                <TrendingUp size={10} color="#9CA3AF" />
                <a href={f.kiwifyUrl} target="_blank" rel="noreferrer"
                  className="text-[9px] font-mono text-gray-400 truncate hover:text-[#6158ca] transition-colors">
                  {f.kiwifyUrl}
                </a>
              </div>
            </motion.div>
          );
        })}

        {/* Nota webhook */}
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
          <p className="text-[9px] font-bold text-blue-600 leading-relaxed">
            💡 <strong>Automático via webhook:</strong> quando o endpoint{' '}
            <code className="bg-blue-100 px-1 rounded">POST /kiwify/webhook</code> estiver ativo,
            o contador de vendidas atualiza sozinho a cada compra. Por ora, edite manualmente.
          </p>
        </div>
      </div>
    </div>
  );
}