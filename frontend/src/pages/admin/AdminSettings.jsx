import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  ExternalLink,
  Globe2,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import api from '../../services/api';

const P = '#8B4AFF';
const A = '#ebfc66';
const DARK = '#0f0a1e';

const CHECKS = [
  { id: 'health', label: 'API Health', path: '/health', auth: false },
  { id: 'users', label: 'Tutores', path: '/users', auth: true },
  { id: 'pets', label: 'Gatos Admin', path: '/pets', params: { scope: 'admin' }, auth: true },
  { id: 'ventures', label: 'Venture OS', path: '/admin/intelligence/ventures', auth: true },
  { id: 'campaigns', label: 'Campaign Studio', path: '/admin/intelligence/campaigns', auth: true },
  { id: 'notices', label: 'Comunicados', path: '/notices/admin', auth: true },
];

const ADMIN_LINKS = [
  { label: 'Home do app', href: '/home' },
  { label: 'Gatedopedia', href: '/wiki' },
  { label: 'Studio', href: '/studio' },
  { label: 'Loja', href: '/store' },
  { label: 'Comunigato', href: '/comunigato' },
];

function getStorageRows() {
  if (typeof window === 'undefined') return [];

  const keys = [
    'gatedo_admin_venture_os_v1',
    'gatedo_admin_campaign_studio_v1',
    'gatedo_breed_content_v1',
    'gatedo_srd_content_v1',
    'gatedo_wild_feline_content_v1',
  ];

  return keys.map((key) => {
    const value = window.localStorage.getItem(key);
    const bytes = value ? new Blob([value]).size : 0;
    return {
      key,
      exists: !!value,
      size: bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`,
    };
  });
}

function StatusPill({ status }) {
  const isOk = status === 'ok';
  const isLoading = status === 'loading';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase"
      style={{
        backgroundColor: isOk ? '#dcfce7' : isLoading ? '#f3f4f6' : '#fee2e2',
        color: isOk ? '#15803d' : isLoading ? '#6b7280' : '#b91c1c',
      }}
    >
      {isLoading ? <RefreshCw size={11} className="animate-spin" /> : isOk ? <CheckCircle2 size={11} /> : <WifiOff size={11} />}
      {isLoading ? 'Checando' : isOk ? 'Online' : 'Falha'}
    </span>
  );
}

export default function AdminSettings() {
  const [checks, setChecks] = useState({});
  const [storageRows, setStorageRows] = useState(() => getStorageRows());

  const apiBase = api.defaults?.baseURL || 'API nao configurada';

  const summary = useMemo(() => {
    const values = Object.values(checks);
    const ok = values.filter((item) => item?.status === 'ok').length;
    const fail = values.filter((item) => item?.status === 'error').length;
    return { ok, fail, total: CHECKS.length };
  }, [checks]);

  const runChecks = async () => {
    setStorageRows(getStorageRows());
    setChecks(Object.fromEntries(CHECKS.map((check) => [check.id, { status: 'loading' }])));

    const results = await Promise.allSettled(
      CHECKS.map(async (check) => {
        const started = performance.now();
        const response = await api.get(check.path, check.params ? { params: check.params } : undefined);
        const elapsed = Math.round(performance.now() - started);
        const count = Array.isArray(response.data) ? response.data.length : null;
        return [check.id, { status: 'ok', elapsed, count }];
      }),
    );

    const next = {};
    results.forEach((result, index) => {
      const check = CHECKS[index];
      if (result.status === 'fulfilled') {
        next[check.id] = result.value[1];
      } else {
        next[check.id] = {
          status: 'error',
          message: result.reason?.response?.data?.message || result.reason?.message || 'Falha ao consultar',
        };
      }
    });

    setChecks(next);
  };

  useEffect(() => {
    runChecks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem]" style={{ backgroundColor: DARK }}>
        <div className="absolute inset-0 opacity-80" style={{ backgroundImage: `radial-gradient(circle at 12% 25%, ${P}60, transparent 32%), radial-gradient(circle at 90% 10%, ${A}35, transparent 30%)` }} />
        <div className="relative z-10 p-7 md:p-9 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: A }}>
              <ShieldCheck size={22} style={{ color: P }} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: A }}>Admin Health Center</p>
            <h1 className="text-3xl md:text-4xl font-black text-white mt-2">Configuracoes e integracoes</h1>
            <p className="text-sm text-white/60 leading-relaxed mt-3 max-w-2xl">
              Verifique API, dados essenciais, sincronizacao das ferramentas estrategicas e pontos locais que ainda precisam migrar para backend.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 min-w-[260px]">
            {[
              { label: 'Online', value: summary.ok, color: '#10b981' },
              { label: 'Falhas', value: summary.fail, color: '#ef4444' },
              { label: 'Checks', value: summary.total, color: A },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-3 border border-white/10 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[9px] font-black text-white/40 uppercase">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Conectividade</p>
              <h2 className="text-lg font-black text-gray-900">Rotas essenciais do admin</h2>
            </div>
            <button onClick={runChecks} className="px-3 py-2 rounded-xl text-xs font-black text-white flex items-center gap-2" style={{ backgroundColor: P }}>
              <RefreshCw size={13} /> Atualizar
            </button>
          </div>

          <div className="space-y-3">
            {CHECKS.map((check) => {
              const state = checks[check.id] || { status: 'loading' };
              return (
                <div key={check.id} className="rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Database size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900">{check.label}</p>
                      <p className="text-[11px] text-gray-400 truncate">{check.path}</p>
                      {state.message && <p className="text-[11px] text-red-500 mt-1">{state.message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {typeof state.count === 'number' && <span className="text-[10px] font-black text-gray-400">{state.count} itens</span>}
                    {state.elapsed && <span className="text-[10px] font-black text-gray-400">{state.elapsed} ms</span>}
                    <StatusPill status={state.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <Globe2 size={20} style={{ color: P }} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ambiente</p>
                <h2 className="text-lg font-black text-gray-900">Base API</h2>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-500 break-all">{apiBase}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive size={20} style={{ color: P }} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Fallback local</p>
                <h2 className="text-lg font-black text-gray-900">Chaves no navegador</h2>
              </div>
            </div>
            <div className="space-y-2">
              {storageRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-3">
                  <p className="text-[11px] font-bold text-gray-600 truncate">{row.key}</p>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${row.exists ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {row.exists ? row.size : 'vazio'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <Activity size={20} style={{ color: P }} />
              <h2 className="text-lg font-black text-gray-900">Atalhos do app</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ADMIN_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-black text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center justify-between">
                  {link.label}
                  <ExternalLink size={13} />
                </a>
              ))}
            </div>
          </div>

          <SettingsFieldsCard
            icon={ShieldCheck}
            title="Apoio & Achadinhos"
            hint="Enquanto estiver vazio, o bloco correspondente simplesmente não aparece pro usuário — nada quebra."
            fields={SUPPORT_FIELDS}
          />

          <SettingsFieldsCard
            icon={ShieldCheck}
            title="Assinaturas · Clube GATEDO"
            hint="Preço em centavos (ex.: 1990 = R$ 19,90). Enquanto o link de checkout estiver vazio, o botão de assinar fica desabilitado na tela do Clube."
            fields={CLUBE_FIELDS}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Apoie o GATEDO / Achadinhos WhatsApp — chave Pix e link do grupo ────────
const SUPPORT_FIELDS = [
  { key: 'DONATION_PIX_KEY', label: 'Chave Pix (ou "Pix Copia e Cola")', placeholder: 'CPF, e-mail, telefone ou o código completo copia-e-cola',
    help: 'Colando o código completo "Pix Copia e Cola" (não só a chave), o QR Code no app fica escaneável direto pelo app do banco.' },
  { key: 'WHATSAPP_ACHADINHOS_LINK', label: 'Link do grupo de achadinhos (WhatsApp)', placeholder: 'https://chat.whatsapp.com/...' },
  { key: 'WHATSAPP_ACHADINHOS_TEXT', label: 'Texto do convite (o que a pessoa recebe / frequência)', placeholder: 'Ex.: achadinhos e promoções pros seus gatos, 2-3x por semana' },
];

// ─── Clube GATEDO — preço mensal/anual e links de checkout Kiwify ───────────
const CLUBE_FIELDS = [
  { key: 'CLUBE_MONTHLY_PRICE_CENTAVOS', label: 'Preço mensal (centavos)', placeholder: 'Ex.: 1990' },
  { key: 'CLUBE_MONTHLY_KIWIFY_URL', label: 'Link de checkout Kiwify — mensal', placeholder: 'https://pay.kiwify.com.br/...' },
  { key: 'CLUBE_ANNUAL_PRICE_CENTAVOS', label: 'Preço anual (centavos)', placeholder: 'Ex.: 19900' },
  { key: 'CLUBE_ANNUAL_KIWIFY_URL', label: 'Link de checkout Kiwify — anual', placeholder: 'https://pay.kiwify.com.br/...' },
  { key: 'CLUBE_COMMUNITY_LINK', label: 'Link do grupo/comunidade exclusiva do Clube', placeholder: 'https://chat.whatsapp.com/... ou https://t.me/...' },
];

function SettingsFieldsCard({ icon: Icon, title, hint, fields }) {
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    api.get('/settings/public').then((r) => setValues((prev) => ({ ...(r.data || {}), ...prev }))).catch(() => {});
  }, []);

  const save = async (key) => {
    setSaving(key);
    try {
      await api.post('/admin/settings', { key, value: values[key] || '' });
      setSaved(key);
      setTimeout(() => setSaved((s) => (s === key ? null : s)), 1800);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-1">
        <Icon size={20} style={{ color: P }} />
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
      </div>
      {hint && <p className="text-xs font-medium text-gray-400 mb-4">{hint}</p>}
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <p className="text-xs font-black text-gray-700 mb-1">{f.label}</p>
            {f.help && <p className="text-[10px] font-medium text-gray-400 mb-1.5">{f.help}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                value={values[f.key] || ''}
                placeholder={f.placeholder}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="flex-1 text-xs font-medium bg-gray-50 rounded-xl px-3 py-2.5 outline-none"
              />
              <button
                onClick={() => save(f.key)}
                disabled={saving === f.key}
                className="px-4 py-2.5 rounded-xl font-black text-[11px] text-white shrink-0"
                style={{ background: saved === f.key ? '#10B981' : saving === f.key ? '#9ca3af' : P }}
              >
                {saved === f.key ? 'Salvo!' : saving === f.key ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
