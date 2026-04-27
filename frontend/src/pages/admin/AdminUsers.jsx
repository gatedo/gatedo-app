import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Crown,
  Edit,
  Phone,
  X,
  SortAsc,
  Copy,
  Trash2,
  ShieldOff,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Mail,
  CalendarClock,
  PawPrint,
  Zap,
  Gem,
} from 'lucide-react';
import api from '../../services/api';
import {
  formatDate,
  formatNumber,
  formatShortId,
  getInitials,
  getTutorLevelMeta,
} from '../../utils/adminPanelMeta';

const PLAN_OPTIONS = [
  { value: 'FREE', label: 'Free', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'FOUNDER_EARLY', label: 'Founder Early', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'TESTER_FRIENDLY', label: 'Tester Friendly', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'TUTOR_PLUS', label: 'Tutor Plus', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'TUTOR_MASTER', label: 'Tutor Master', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

const USER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  { value: 'SUSPENDED', label: 'Suspenso', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
  { value: 'BANNED', label: 'Banido', className: 'bg-red-100 text-red-700 border-red-200', icon: ShieldOff },
];

const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativa', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'TRIALING', label: 'Trial', className: 'bg-sky-100 text-sky-700 border-sky-200' },
  { value: 'PAST_DUE', label: 'Atrasada', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'CANCELED', label: 'Cancelada', className: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'EXPIRED', label: 'Expirada', className: 'bg-gray-100 text-gray-600 border-gray-200' },
];

const SUBSCRIPTION_PLAN_TYPE_OPTIONS = [
  { value: 'FOUNDER_EARLY_ANNUAL', label: 'Founder Early Anual' },
  { value: 'TESTER_FRIENDLY_VIP', label: 'Tester Friendly VIP' },
  { value: 'TUTOR_PLUS_SEMESTRAL', label: 'Tutor Plus Semestral' },
  { value: 'TUTOR_PLUS_ANNUAL', label: 'Tutor Plus Anual' },
  { value: 'TUTOR_MASTER_SEMESTRAL', label: 'Tutor Master Semestral' },
  { value: 'TUTOR_MASTER_ANNUAL', label: 'Tutor Master Anual' },
  { value: 'MANUAL', label: 'Manual / Sem plano' },
];

const BADGE_OPTIONS = [
  'FOUNDER_EARLY',
  'TESTER_FRIENDLY',
  'TUTOR_PLUS',
  'TUTOR_MASTER',
  'EARLY_ADOPTER',
  'BETA_TESTER',
  'VET_FRIEND',
];

function toDateInputValue(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function Avatar({ name, photoUrl, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-base' : 'w-11 h-11 text-sm';

  if (photoUrl) {
    return <img src={photoUrl} alt={name || 'Avatar'} className={`${sizeClass} rounded-2xl object-cover border border-white shadow-sm shrink-0`} />;
  }

  return (
    <div className={`${sizeClass} rounded-2xl bg-[#8B4AFF]/12 text-[#8B4AFF] font-black flex items-center justify-center border border-[#8B4AFF]/10 shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function InfoChip({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${className}`}>
      {children}
    </span>
  );
}

function BadgePill({ badge }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black border bg-yellow-50 text-yellow-700 border-yellow-200">
      <Crown size={9} /> {badge}
    </span>
  );
}

function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h3 className="font-black text-lg text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
    plan: user?.plan || 'FREE',
    status: user?.status || 'ACTIVE',
    badges: Array.isArray(user?.badges) ? user.badges : [],
    xpt: Number(user?.xpt || 0),
    gpts: Number(user?.gatedoPoints || 0),
    subscriptionStatus: user?.subscription?.status || 'ACTIVE',
    subscriptionPlanType: user?.subscription?.planType || user?.plan || 'FREE',
    subscriptionProvider: user?.subscription?.provider || 'MANUAL',
    subscriptionExpiresAt: toDateInputValue(user?.subscription?.expiresAt || user?.planExpires),
    subscriptionAutoRenew: Boolean(user?.subscription?.autoRenew),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const levelMeta = getTutorLevelMeta(Number(form.xpt || 0));

  const toggleBadge = (badge) => {
    setForm((current) => {
      const nextBadges = current.badges.includes(badge)
        ? current.badges.filter((item) => item !== badge)
        : [...current.badges, badge];

      return {
        ...current,
        badges: nextBadges,
      };
    });
  };

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.patch(`/users/${user.id}`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        plan: form.plan,
        status: form.status,
        badges: form.badges,
        xpt: Number(form.xpt || 0),
        gpts: Number(form.gpts || 0),
        subscriptionStatus: form.subscriptionStatus,
        subscriptionPlanType: form.subscriptionPlanType,
        subscriptionProvider: form.subscriptionProvider,
        subscriptionExpiresAt: form.subscriptionExpiresAt ? new Date(form.subscriptionExpiresAt).toISOString() : null,
        subscriptionAutoRenew: form.subscriptionAutoRenew,
      });

      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao salvar as alteracoes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} photoUrl={user?.photoUrl} size="lg" />
            <div>
              <h3 className="font-black text-lg text-gray-800">Editar Tutor</h3>
              <p className="text-xs text-gray-400 font-mono">{user?.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="rounded-[22px] border border-[#8B4AFF]/10 bg-[#8B4AFF]/5 p-4 flex flex-wrap items-center gap-3">
            <InfoChip className="bg-white text-[#8B4AFF] border-[#8B4AFF]/10">
              <Zap size={11} /> Nivel {levelMeta.rank}
            </InfoChip>
            <InfoChip className="bg-white text-gray-700 border-gray-200">
              {levelMeta.emoji} {levelMeta.name}
            </InfoChip>
            <InfoChip className="bg-white text-[#8B4AFF] border-[#8B4AFF]/10">
              <PawPrint size={11} /> {formatNumber(form.gpts)} GPTS
            </InfoChip>
            <InfoChip className="bg-white text-amber-700 border-amber-200">
              <Gem size={11} /> {formatNumber(form.xpt)} XPT
            </InfoChip>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Nome', field: 'name', type: 'text' },
              { label: 'Email', field: 'email', type: 'email' },
              { label: 'Telefone / WhatsApp', field: 'phone', type: 'tel' },
              { label: 'Cidade', field: 'city', type: 'text' },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[field] || ''}
                  onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Plano</label>
              <select
                value={form.plan}
                onChange={(event) => setForm((current) => ({ ...current, plan: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#8B4AFF]"
              >
                {PLAN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Status do usuario</label>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#8B4AFF]"
              >
                {USER_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">GPTS</label>
              <input
                type="number"
                min="0"
                value={form.gpts}
                onChange={(event) => setForm((current) => ({ ...current, gpts: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">XPT</label>
              <input
                type="number"
                min="0"
                value={form.xpt}
                onChange={(event) => setForm((current) => ({ ...current, xpt: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-gray-100 p-5 bg-gray-50/70">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Assinatura</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                <select
                  value={form.subscriptionStatus}
                  onChange={(event) => setForm((current) => ({ ...current, subscriptionStatus: event.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#8B4AFF]"
                >
                  {SUBSCRIPTION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Plano recorrente</label>
                <select
                  value={form.subscriptionPlanType}
                  onChange={(event) => setForm((current) => ({ ...current, subscriptionPlanType: event.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#8B4AFF]"
                >
                  {SUBSCRIPTION_PLAN_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Proximo vencimento</label>
                <input
                  type="date"
                  value={form.subscriptionExpiresAt}
                  onChange={(event) => setForm((current) => ({ ...current, subscriptionExpiresAt: event.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Renovacao automatica</label>
                <select
                  value={form.subscriptionAutoRenew ? 'true' : 'false'}
                  onChange={(event) => setForm((current) => ({ ...current, subscriptionAutoRenew: event.target.value === 'true' }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#8B4AFF]"
                >
                  <option value="false">Desativada</option>
                  <option value="true">Ativada</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">Badges do tutor</label>
            <div className="flex flex-wrap gap-2">
              {BADGE_OPTIONS.map((badge) => {
                const active = form.badges.includes(badge);
                return (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => toggleBadge(badge)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                      active
                        ? 'bg-[#8B4AFF] text-white border-[#8B4AFF] shadow-lg shadow-indigo-100'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-[#8B4AFF]'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}{badge}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-black text-white bg-[#8B4AFF] hover:bg-[#6d42e0] transition-colors disabled:opacity-70"
            >
              {saving ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [editingUser, setEditingUser] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Erro ao buscar usuarios:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(user) {
    try {
      await api.delete(`/users/${user.id}`);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setConfirm(null);
    } catch (err) {
      alert(`Erro ao deletar: ${err?.response?.data?.message || err?.message || 'Falha'}`);
    }
  }

  async function toggleBan(user) {
    const nextStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';

    try {
      await api.patch(`/users/${user.id}`, { status: nextStatus });
      setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, status: nextStatus } : item)));
      setConfirm(null);
    } catch (err) {
      alert(`Erro: ${err?.response?.data?.message || err?.message || 'Falha'}`);
    }
  }

  const processedUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = users.filter((user) => {
      const fields = [
        user?.name,
        user?.email,
        user?.city,
        user?.id,
        user?.plan,
        user?.subscription?.status,
      ]
        .filter(Boolean)
        .map((item) => String(item).toLowerCase());

      return !term || fields.some((field) => field.includes(term));
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'xpt') return Number(b.xpt || 0) - Number(a.xpt || 0);
      if (sortBy === 'gpts') return Number(b.gatedoPoints || 0) - Number(a.gatedoPoints || 0);
      if (sortBy === 'pets') return Number(b.pets?.length || 0) - Number(a.pets?.length || 0);
      if (sortBy === 'plan') return String(a.plan || '').localeCompare(String(b.plan || ''));
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [searchTerm, sortBy, users]);

  const stats = useMemo(() => ([
    {
      label: 'Total',
      value: users.length,
      className: 'bg-[#F4F3FF] text-[#8B4AFF]',
    },
    {
      label: 'Founders',
      value: users.filter((user) => user.plan === 'FOUNDER_EARLY').length,
      className: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Recorrencia ativa',
      value: users.filter((user) => ['ACTIVE', 'TRIALING'].includes(String(user.subscription?.status || ''))).length,
      className: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Banidos',
      value: users.filter((user) => user.status === 'BANNED').length,
      className: 'bg-red-50 text-red-500',
    },
  ]), [users]);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Users className="text-[#8B4AFF]" /> Gestao de Tutores
          </h2>
          <p className="text-sm text-gray-400">Veja avatar, ID, assinatura e gamificacao real dos tutores.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm">
            <SortAsc size={16} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="outline-none text-xs font-bold text-gray-700 bg-transparent"
            >
              <option value="name">Nome</option>
              <option value="plan">Plano</option>
              <option value="xpt">Mais XPT</option>
              <option value="gpts">Mais GPTS</option>
              <option value="pets">Mais gatos</option>
            </select>
          </div>

          <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm flex-1">
            <Search size={16} className="text-gray-400" />
            <input
              placeholder="Buscar nome, email, status ou ID..."
              className="outline-none text-sm font-bold text-gray-700 w-full"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <button
            onClick={loadUsers}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-[#8B4AFF] hover:border-[#8B4AFF] transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((item) => (
          <div key={item.label} className={`${item.className} rounded-2xl px-4 py-3 flex items-center gap-3`}>
            <span className="text-2xl font-black">{item.value}</span>
            <span className="text-xs font-bold text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-16 text-center text-gray-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            <p className="text-sm font-bold">Carregando tutores...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1180px]">
            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black border-b border-gray-100 tracking-wider">
              <tr>
                <th className="px-5 py-4">Tutor</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Plano</th>
                <th className="px-5 py-4">Assinatura</th>
                <th className="px-5 py-4">Jornada</th>
                <th className="px-5 py-4">Badges</th>
                <th className="px-5 py-4">Gatos</th>
                <th className="px-5 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {processedUsers.map((user) => {
                const levelMeta = getTutorLevelMeta(Number(user.xpt || 0));
                const userStatus = USER_STATUS_OPTIONS.find((option) => option.value === (user.status || 'ACTIVE')) || USER_STATUS_OPTIONS[0];
                const subscriptionStatus = SUBSCRIPTION_STATUS_OPTIONS.find((option) => option.value === user.subscription?.status);
                const nextDue = user.subscription?.expiresAt || user.planExpires;
                const UserStatusIcon = userStatus.icon;

                return (
                  <tr key={user.id} className={`hover:bg-gray-50/60 transition-colors ${user.status === 'BANNED' ? 'opacity-70' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} photoUrl={user.photoUrl} />
                        <div className="min-w-0">
                          <p className="font-black text-gray-800 truncate">{user.name || 'Sem nome'}</p>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                            <Mail size={9} /> {user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => navigator.clipboard.writeText(user.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-gray-500 transition-colors"
                            >
                              <Copy size={9} /> {formatShortId(user.id)}
                            </button>
                            {user.city && <span className="text-[10px] text-gray-300">{user.city}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <InfoChip className={userStatus.className}>
                        <UserStatusIcon size={10} />
                        {userStatus.label}
                      </InfoChip>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <InfoChip className={(PLAN_OPTIONS.find((option) => option.value === user.plan) || PLAN_OPTIONS[0]).className}>
                          <Crown size={10} />
                          {(PLAN_OPTIONS.find((option) => option.value === user.plan) || PLAN_OPTIONS[0]).label}
                        </InfoChip>
                        {user.phone && (
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Phone size={10} /> {user.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        {subscriptionStatus ? (
                          <InfoChip className={subscriptionStatus.className}>
                            <CalendarClock size={10} />
                            {subscriptionStatus.label}
                          </InfoChip>
                        ) : (
                          <InfoChip className="bg-gray-100 text-gray-500 border-gray-200">
                            <CalendarClock size={10} />
                            Sem registro
                          </InfoChip>
                        )}
                        <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase">
                            {user.subscription?.planType || user.plan || 'FREE'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Proximo venc.: {formatDate(nextDue)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <InfoChip className="bg-[#F4F3FF] text-[#8B4AFF] border-[#E5DDFF]">
                          <Zap size={10} />
                          Nivel {levelMeta.rank}
                        </InfoChip>
                        <p className="text-[11px] font-black text-gray-700">
                          {levelMeta.emoji} {levelMeta.name}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <InfoChip className="bg-white text-[#8B4AFF] border-[#E5DDFF]">
                            <PawPrint size={10} />
                            {formatNumber(user.gatedoPoints)} GPTS
                          </InfoChip>
                          <InfoChip className="bg-amber-50 text-amber-700 border-amber-200">
                            <Gem size={10} />
                            {formatNumber(user.xpt)} XPT
                          </InfoChip>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(user.badges || []).length > 0
                          ? user.badges.map((badge) => <BadgePill key={badge} badge={badge} />)
                          : <span className="text-gray-300 text-xs">—</span>}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
                          <PawPrint size={15} />
                        </div>
                        <div>
                          <p className="font-black text-gray-800">{user.pets?.length || 0}</p>
                          <p className="text-[10px] text-gray-400">perfils felinos</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.phone && (
                          <button
                            onClick={() => window.open(`https://wa.me/55${String(user.phone).replace(/\D/g, '')}`, '_blank')}
                            title="Abrir WhatsApp"
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <Phone size={13} />
                          </button>
                        )}

                        <button
                          onClick={() => setEditingUser(user)}
                          title="Editar tutor"
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Edit size={13} />
                        </button>

                        <button
                          onClick={() => setConfirm({ type: user.status === 'BANNED' ? 'unban' : 'ban', user })}
                          title={user.status === 'BANNED' ? 'Reativar conta' : 'Banir usuario'}
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === 'BANNED'
                              ? 'bg-green-50 text-green-600 hover:bg-green-100'
                              : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                          }`}
                        >
                          {user.status === 'BANNED' ? <Shield size={13} /> : <ShieldOff size={13} />}
                        </button>

                        <button
                          onClick={() => setConfirm({ type: 'delete', user })}
                          title="Deletar conta"
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && processedUsers.length === 0 && (
          <div className="p-16 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">Nenhum tutor encontrado</p>
          </div>
        )}
      </div>

      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}

      {confirm?.type === 'delete' && (
        <ConfirmModal
          title="Deletar conta"
          message={`Isso vai apagar permanentemente a conta de "${confirm.user.name}" e os dados relacionados.`}
          confirmLabel="Deletar permanentemente"
          confirmClass="bg-red-500 hover:bg-red-600"
          onConfirm={() => deleteUser(confirm.user)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.type === 'ban' && (
        <ConfirmModal
          title="Banir usuario"
          message={`"${confirm.user.name}" perdera acesso imediato a plataforma. Voce pode reverter depois.`}
          confirmLabel="Banir usuario"
          confirmClass="bg-yellow-500 hover:bg-yellow-600"
          onConfirm={() => toggleBan(confirm.user)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.type === 'unban' && (
        <ConfirmModal
          title="Reativar conta"
          message={`Restaurar o acesso de "${confirm.user.name}" a plataforma?`}
          confirmLabel="Reativar"
          confirmClass="bg-green-500 hover:bg-green-600"
          onConfirm={() => toggleBan(confirm.user)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
