/**
 * AdminFinancial.jsx — Painel financeiro integrado com fases reais
 * Puxa dados de:
 *   GET /admin/fases/config → vendas por fase (webhook atualiza automaticamente)
 *   GET /users             → total de usuários e fundadores
 */
import React, { useEffect, useState } from 'react';
import {
  TrendingUp, DollarSign, Users, Crown,
  Target, Layers, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

// ─── Config das fases (espelho do backend) ────────────────────────────────────
const FASES = [
  { n: 1, label: 'Early Bird',   price: 47,  totalVagas: 50  },
  { n: 2, label: 'Fundador',     price: 67,  totalVagas: 100 },
  { n: 3, label: 'Acesso Final', price: 97,  totalVagas: 200 },
];

// Calcula receita total com base nas vendas por fase
function calcReceita(vendas = {}) {
  return FASES.reduce((acc, f) => acc + (vendas[f.n] ?? 0) * f.price, 0);
}

// Receita potencial se todas as vagas de todas as fases fossem vendidas
const RECEITA_MAXIMA = FASES.reduce((acc, f) => acc + f.totalVagas * f.price, 0);

export default function AdminFinancial() {
  const [loading,   setLoading]   = useState(true);
  const [usuarios,  setUsuarios]  = useState({ total: 0, founders: 0 });
  const [fasesData, setFasesData] = useState({ faseAtiva: 1, encerrado: false, vendas: { 1: 0, 2: 0, 3: 0 } });

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/users').catch(() => ({ data: [] })),
      api.get('/admin/fases/config').catch(() => ({ data: {} })),
    ]).then(([usersRes, fasesRes]) => {
      const users    = Array.isArray(usersRes.data) ? usersRes.data : [];
      const founders = users.filter(u => u.plan === 'FOUNDER_EARLY').length;
      setUsuarios({ total: users.length, founders });

      if (fasesRes.data?.vendas) {
        setFasesData(fasesRes.data);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Cálculos ────────────────────────────────────────────────────────────────
  const totalVendidas = FASES.reduce((acc, f) => acc + (fasesData.vendas[f.n] ?? 0), 0);
  const receita       = calcReceita(fasesData.vendas);
  const receitaMedia  = totalVendidas > 0 ? receita / totalVendidas : 0;
  const progressoMeta = Math.min((totalVendidas / 400) * 100, 100); // meta total: 400 fundadores (100+100+200)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <TrendingUp size={22} className="text-green-500" />
          Financeiro
        </h2>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-1.5 bg-white rounded-xl border border-gray-100">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Receita real */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-400 to-emerald-600 p-6 rounded-[24px] text-white shadow-lg shadow-green-200 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-green-100 font-bold text-[10px] uppercase tracking-widest mb-1">Receita Confirmada</p>
            <h3 className="text-3xl font-black">
              {loading ? '...' : `R$ ${receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </h3>
            <p className="text-[10px] mt-2 bg-white/20 inline-block px-2 py-1 rounded-lg">
              {totalVendidas} fundador{totalVendidas !== 1 ? 'es' : ''} · ticket médio R${receitaMedia.toFixed(0)}
            </p>
          </div>
          <DollarSign size={90} className="absolute -right-3 -bottom-5 opacity-20 rotate-[-15deg]" />
        </motion.div>

        {/* Receita potencial */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Potencial Total</p>
          <h3 className="text-3xl font-black text-gray-800">
            R$ {RECEITA_MAXIMA.toLocaleString('pt-BR')}
          </h3>
          <p className="text-[10px] text-gray-400 mt-2">
            Se todas as {FASES.reduce((a, f) => a + f.totalVagas, 0)} vagas forem vendidas
          </p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <motion.div className="h-full rounded-full bg-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${(receita / RECEITA_MAXIMA) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
          <p className="text-[9px] text-gray-400 mt-1">
            {((receita / RECEITA_MAXIMA) * 100).toFixed(1)}% atingido
          </p>
        </motion.div>

        {/* Meta fundadores */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Meta Fundadores</p>
              <h3 className="text-3xl font-black text-gray-800">
                {totalVendidas} <span className="text-sm text-gray-400">/ 350</span>
              </h3>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl">
              <Crown size={22} className="text-amber-500" />
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div className="h-full rounded-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressoMeta}%` }}
              transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
          <p className="text-[9px] text-gray-400 mt-1">{progressoMeta.toFixed(1)}% da meta</p>
        </motion.div>
      </div>

      {/* Detalhamento por fase */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <Layers size={16} color="#6158ca" />
          <h3 className="font-black text-gray-800 text-sm">Receita por Fase</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {FASES.map((f, i) => {
            const vendidas   = fasesData.vendas[f.n] ?? 0;
            const receitaF   = vendidas * f.price;
            const pct        = Math.min((vendidas / f.totalVagas) * 100, 100);
            const ativa      = fasesData.faseAtiva === f.n && !fasesData.encerrado;
            const esgotada   = vendidas >= f.totalVagas;

            return (
              <motion.div key={f.n}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-4 px-6 py-4">

                {/* Badge fase */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs"
                  style={{
                    background: ativa ? '#6158ca' : esgotada ? '#FEE2E2' : '#F3F4F6',
                    color:      ativa ? 'white'   : esgotada ? '#EF4444' : '#9CA3AF',
                  }}>
                  F{f.n}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-black text-gray-700">{f.label}</p>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                      style={{
                        background: ativa ? 'rgba(97,88,202,0.1)' : esgotada ? '#FEE2E2' : '#F3F4F6',
                        color:      ativa ? '#6158ca'              : esgotada ? '#EF4444' : '#9CA3AF',
                      }}>
                      {esgotada ? 'Esgotada' : ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                      style={{ background: esgotada ? '#EF4444' : ativa ? '#6158ca' : '#D1D5DB' }} />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {vendidas}/{f.totalVagas} vagas · R${f.price} cada
                  </p>
                </div>

                {/* Receita */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-gray-800">
                    R$ {receitaF.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[9px] text-gray-400">{pct.toFixed(0)}%</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={14} color="#10B981" />
            <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Total arrecadado</span>
          </div>
          <span className="text-lg font-black text-gray-800">
            R$ {receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Usuários */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50">
            <Users size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Tutores</p>
            <p className="text-2xl font-black text-gray-800">{usuarios.total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50">
            <Target size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Conversão</p>
            <p className="text-2xl font-black text-gray-800">
              {usuarios.total > 0 ? ((totalVendidas / usuarios.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
