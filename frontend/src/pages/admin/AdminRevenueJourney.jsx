import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Cat,
  CheckCircle2,
  CircleDollarSign,
  GitBranch,
  Megaphone,
  PawPrint,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react';
import api from '../../services/api';

const P = '#8B4AFF';
const A = '#ebfc66';

const formatInt = (value) => Number(value || 0).toLocaleString('pt-BR');
const formatMoney = (value) =>
  `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function pct(part, total) {
  if (!total) return '0,0%';
  return `${((Number(part || 0) / Number(total || 1)) * 100).toFixed(1).replace('.', ',')}%`;
}

function MiniStat({ label, value, tone = P, icon: Icon }) {
  return (
    <div className="rounded-[22px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${tone}16` }}>
          <Icon size={20} style={{ color: tone }} />
        </div>
      </div>
    </div>
  );
}

function JourneyStep({ step, index, max }) {
  const Icon = step.icon;
  return (
    <div className="flex min-w-[220px] flex-1 items-stretch gap-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="relative flex-1 overflow-hidden rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm"
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, ${step.color}, ${A})` }}
        />
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${step.color}14` }}>
            <Icon size={22} style={{ color: step.color }} />
          </div>
          <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-black text-gray-400">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{step.stage}</p>
        <h3 className="mt-1 text-lg font-black leading-tight text-gray-900">{step.title}</h3>
        <p className="mt-2 min-h-[42px] text-sm font-semibold leading-relaxed text-gray-500">{step.detail}</p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{step.metricLabel}</p>
            <p className="text-2xl font-black" style={{ color: step.color }}>{step.metric}</p>
          </div>
          <p className="rounded-2xl px-3 py-2 text-right text-[10px] font-black" style={{ background: `${step.color}10`, color: step.color }}>
            {step.signal}
          </p>
        </div>
      </motion.div>
      {index < max - 1 && (
        <div className="hidden items-center lg:flex">
          <ArrowRight size={22} className="text-gray-300" />
        </div>
      )}
    </div>
  );
}

function HealthCheck({ ok, title, detail }) {
  return (
    <div className={`rounded-2xl border p-4 ${ok ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}>
      <div className="flex items-start gap-3">
        <CheckCircle2 size={18} className={ok ? 'text-emerald-500' : 'text-amber-500'} />
        <div>
          <p className={`text-sm font-black ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>{title}</p>
          <p className={`mt-1 text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>{detail}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminRevenueJourney() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSnapshot = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/intelligence/ops/metrics');
      setSnapshot(res.data || null);
    } catch (err) {
      console.error('Erro ao carregar jornada de receita:', err);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  const data = useMemo(() => {
    const metrics = snapshot?.metrics || {};
    const inventory = snapshot?.inventory || {};
    const monetization = snapshot?.monetization || {};
    const usersTotal = Number(inventory.usersTotal || 0);
    const petsTotal = Number(inventory.petsTotal || 0);
    const mau = Number(metrics.mau?.current || 0);
    const prospects = Number(metrics.prospects?.current || 0);
    const subscriptions = Number(monetization.activeSubscriptions || 0);
    const purchaseInvites = Number(monetization.purchaseInvites || 0);
    const founders = Number(monetization.founderInvites || 0);

    return {
      metrics,
      inventory,
      monetization,
      journey: [
        {
          stage: 'Aquisição',
          title: 'Tráfego, orgânico e prospecção',
          detail: 'Entrada por conteúdo, Meta/Instagram, WhatsApp, influenciadores e convites.',
          metricLabel: 'Prospects',
          metric: formatInt(prospects),
          signal: `${pct(usersTotal, Math.max(prospects, usersTotal))} viraram base`,
          icon: Megaphone,
          color: '#ec4899',
        },
        {
          stage: 'Conta',
          title: 'Cadastro do tutor',
          detail: 'Primeiro compromisso: criar conta, confirmar acesso e entrar no ecossistema.',
          metricLabel: 'Tutores',
          metric: formatInt(usersTotal),
          signal: `${formatInt(inventory.usersNew30d)} novos em 30d`,
          icon: UserPlus,
          color: P,
        },
        {
          stage: 'Ativação',
          title: 'Cadastro dos gatos',
          detail: 'O gato cria vínculo, dados de saúde, perfil social e oportunidade de retenção.',
          metricLabel: 'Gatos',
          metric: formatInt(petsTotal),
          signal: `${pct(petsTotal, usersTotal)} gatos por tutor base`,
          icon: Cat,
          color: '#f59e0b',
        },
        {
          stage: 'Retenção',
          title: 'Gamificação e rotina',
          detail: 'XP, GPTS, conquistas, diário, saúde, studio e comunigato mantêm uso recorrente.',
          metricLabel: 'MAU',
          metric: formatInt(mau),
          signal: `D30 ${metrics.d30Retention?.current || 0}%`,
          icon: Sparkles,
          color: '#10b981',
        },
        {
          stage: 'Conversão',
          title: 'Clube, assinatura e points',
          detail: 'Kiwify aprova compra, webhook ativa plano, assinatura e saldo no app.',
          metricLabel: 'Assinaturas',
          metric: formatInt(subscriptions),
          signal: `${purchaseInvites + founders} compras/convites`,
          icon: WalletCards,
          color: '#0ea5e9',
        },
        {
          stage: 'Expansão',
          title: 'Social proof e novas receitas',
          detail: 'Comunidade, vets, afiliados, memorial, parceiros e B2B aumentam LTV.',
          metricLabel: 'MRR',
          metric: formatMoney(monetization.mrr),
          signal: `${formatInt(monetization.pointsBought)} GPTS comprados`,
          icon: CircleDollarSign,
          color: '#7c3aed',
        },
      ],
    };
  }, [snapshot]);

  const health = data.monetization || {};

  return (
    <div className="space-y-7">
      <div className="overflow-hidden rounded-[32px] bg-[#15111f] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em]" style={{ color: A }}>Revenue Journey OS</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Jornada visual de monetização</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-white/60">
              Um mapa vivo do caminho entre aquisição, ativação, retenção e receita. A ideia é você abrir isso e saber onde empurrar o negócio hoje.
            </p>
          </div>
          <button
            onClick={fetchSnapshot}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#15111f]"
            style={{ background: A }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="MRR estimado" value={formatMoney(health.mrr)} icon={BadgeDollarSign} tone="#10b981" />
        <MiniStat label="Assinaturas ativas" value={formatInt(health.activeSubscriptions)} icon={ShieldCheck} tone="#0ea5e9" />
        <MiniStat label="Compras Kiwify" value={formatInt(Number(health.purchaseInvites || 0) + Number(health.founderInvites || 0))} icon={BarChart3} tone={P} />
        <MiniStat label="GPTS comprados" value={formatInt(health.pointsBought)} icon={PawPrint} tone="#f59e0b" />
      </div>

      <div className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${P}14` }}>
            <GitBranch size={20} style={{ color: P }} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Fluxo estratégico ponta a ponta</h2>
            <p className="text-sm font-semibold text-gray-400">Use como roteiro de produto, marketing e operação.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:overflow-x-auto lg:pb-2">
          {data.journey.map((step, index) => (
            <JourneyStep key={step.stage} step={step} index={index} max={data.journey.length} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Saúde da monetização</h2>
          <p className="mt-1 text-sm font-semibold text-gray-400">
            O fluxo básico está desenhado quando checkout, webhook, convite e assinatura conversam entre si.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <HealthCheck
              ok={Boolean(health.kiwifySignatureConfigured)}
              title="Assinatura Kiwify"
              detail={health.kiwifySignatureConfigured ? 'KIWIFY_TOKEN configurado para validar webhooks.' : 'Configure KIWIFY_TOKEN no backend antes de produção.'}
            />
            <HealthCheck
              ok={Boolean(health.appUrlConfigured)}
              title="URL de ativação"
              detail={health.appUrlConfigured ? 'APP_URL configurada para montar links de cadastro.' : 'Configure APP_URL para emails/links de ativação corretos.'}
            />
            <HealthCheck
              ok={Number(health.purchaseInvites || 0) + Number(health.founderInvites || 0) > 0}
              title="Compras registradas"
              detail={`${formatInt(Number(health.purchaseInvites || 0) + Number(health.founderInvites || 0))} convites gerados por compra.`}
            />
            <HealthCheck
              ok={Number(health.activeSubscriptions || 0) > 0}
              title="Planos ativos"
              detail={`${formatInt(health.activeSubscriptions)} assinaturas ativas no banco.`}
            />
          </div>
        </div>

        <div className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Próximos controles</h2>
          <div className="mt-4 space-y-3">
            {[
              'Adicionar UTMs no checkout Kiwify para ligar campanha a compra.',
              'Registrar eventos internos: visita Clube, clique checkout, cadastro pós-compra.',
              'Criar alerta quando webhook gerar convite mas usuário não ativar.',
              'Cruzar MAU, gatos cadastrados e plano para achar tutores com maior chance de conversão.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                <CheckCircle2 size={16} className="mt-0.5 text-emerald-500" />
                <p className="text-sm font-bold leading-relaxed text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
