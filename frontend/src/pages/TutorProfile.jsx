import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Crown,
  Edit2,
  Gem,
  LifeBuoy,
  LogOut,
  MapPin,
  PawPrint,
  Repeat,
  Settings,
  Trophy,
  User,
  WalletCards,
  Zap,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import useSensory from '../hooks/useSensory';
import api from '../services/api';
import GamificationDrawer from '../components/GamificationDrawer';
import {
  countActivePets,
  formatDateBR,
  formatPlanType,
  getCatLifeBadge,
  getMembershipMeta,
} from '../utils/membershipMeta';

function MenuButton({
  icon: Icon,
  title,
  subtitle,
  color = 'bg-purple-50 text-purple-500',
  onClick,
}) {
  const touch = useSensory();
  const iconNode = React.createElement(Icon, { size: 20 });

  return (
    <button
      onClick={() => {
        touch();
        onClick?.();
      }}
      className="w-full bg-white p-5 rounded-[28px] flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-4 text-left min-w-0">
        <div className={`p-3 rounded-2xl ${color}`}>
          {iconNode}
        </div>
        <div className="min-w-0">
          <span className="block font-black text-gray-800 text-sm uppercase tracking-tight">
            {title}
          </span>
          <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">
            {subtitle}
          </span>
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-300" />
    </button>
  );
}

function CatMiniCard({ cat }) {
  return (
    <div className="min-w-[126px] bg-white rounded-[24px] p-3 border border-gray-100 shadow-sm">
      <div className="w-16 h-16 rounded-[22px] overflow-hidden bg-[#ede9ff] mx-auto mb-3 border border-[#8B4AFF]/10">
        {cat?.photoUrl ? (
          <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8B4AFF]">
            <PawPrint size={24} />
          </div>
        )}
      </div>
      <p className="text-[11px] font-black text-gray-800 text-center truncate">
        {cat?.name || 'Meu gato'}
      </p>
      <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-[2px] mt-1">
        {getCatLifeBadge(cat)}
      </p>
    </div>
  );
}

export default function TutorProfile() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user, setUser, signOut } = useContext(AuthContext);
  const { xpt, gpts, tutor, refreshGamification } = useGamification();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingRenewal, setSavingRenewal] = useState(false);
  const [showGamifDrawer, setShowGamifDrawer] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!user?.id) return;

      setLoading(true);

      try {
        const response = await api.get(`/users/${user.id}/profile`);
        if (cancelled) return;

        setProfile(response.data || null);
        setUser((current) => ({
          ...current,
          photoUrl: response.data?.photoUrl || current?.photoUrl || null,
          name: response.data?.name || current?.name || '',
          city: response.data?.city || current?.city || null,
          plan: response.data?.plan || current?.plan || 'FREE',
          badges: response.data?.badges || current?.badges || [],
          planExpires: response.data?.planExpires || current?.planExpires || null,
        }));
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    refreshGamification?.();

    return () => {
      cancelled = true;
    };
  }, [refreshGamification, setUser, user?.id]);

  const membership = useMemo(
    () => getMembershipMeta(profile || user || {}),
    [profile, user],
  );

  const pets = profile?.pets || [];
  const activeCats = pets.filter((pet) => !pet.isMemorial && !pet.isArchived);
  const memorialCats = pets.filter((pet) => pet.isMemorial);
  const autoRenew = Boolean(profile?.subscription?.autoRenew);

  async function handleToggleRenewal() {
    if (!user?.id || savingRenewal || !profile?.subscription) return;

    setSavingRenewal(true);

    try {
      const response = await api.patch(`/users/${user.id}`, {
        subscriptionAutoRenew: !autoRenew,
      });

      setProfile((current) => ({
        ...(current || {}),
        subscription: response.data?.subscription || {
          ...(current?.subscription || {}),
          autoRenew: !autoRenew,
        },
      }));
    } catch {
      // noop: mantemos o estado anterior se falhar
    } finally {
      setSavingRenewal(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gatedo-light-bg)] px-6 pt-10 pb-32">
        <div className="animate-pulse space-y-4">
          <div className="h-44 rounded-[36px] bg-[#8B4AFF]/15" />
          <div className="h-28 rounded-[28px] bg-white" />
          <div className="h-24 rounded-[28px] bg-white" />
          <div className="h-24 rounded-[28px] bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32">
      <div className="relative overflow-hidden bg-[#8B4AFF] rounded-b-[56px] px-6 pt-10 pb-28">
        <img
          src="/assets/logo-fundo1.svg"
          alt=""
          className="absolute -top-16 -right-16 w-[300px] opacity-25 pointer-events-none"
        />

        <div className="relative z-10 flex items-start gap-4">
          <div className="w-24 h-24 rounded-[32px] overflow-hidden border-[5px] border-white/70 bg-white/30 shadow-xl">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt={profile?.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <User size={34} />
              </div>
            )}
          </div>

          <div className="flex-1 pt-1">
            <p className="text-[10px] font-black uppercase tracking-[4px] text-white/60">
              Perfil do Tutor
            </p>
            <h1 className="text-[28px] leading-none font-black text-white mt-2">
              {profile?.name || user?.name || 'Tutor'}
            </h1>
            {profile?.city && (
              <div className="flex items-center gap-1 text-white/80 mt-2">
                <MapPin size={12} />
                <span className="text-[11px] font-bold">{profile.city}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/14 border border-white/20 backdrop-blur-md">
              <Crown size={14} className="text-[#edff61]" />
              <span className="text-[10px] font-black uppercase tracking-[2px] text-white">
                {membership.label}
              </span>
              {profile?.membership?.renewalDiscountPercent > 0 && (
                <span className="text-[10px] font-black text-[#edff61]">
                  {profile.membership.renewalDiscountPercent}% off vitalício
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-14 relative z-20 space-y-5">
        <div className="bg-white rounded-[34px] border border-gray-100 shadow-xl p-5">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setShowGamifDrawer(true)}
              className="bg-[#F5F1FF] rounded-[22px] px-3 py-4 text-center"
            >
              <Trophy size={16} className="mx-auto text-[#8B4AFF] mb-2" />
              <p className="text-lg font-black text-gray-800">{Number(xpt || tutor?.xpt || 0).toLocaleString('pt-BR')}</p>
              <p className="text-[9px] font-black uppercase tracking-[2px] text-gray-400">XPT</p>
            </button>

            <button
              onClick={() => navigate('/clube?reason=points')}
              className="bg-[#FFFCE8] rounded-[22px] px-3 py-4 text-center"
            >
              <PawPrint size={16} className="mx-auto text-[#8B4AFF] mb-2" />
              <p className="text-lg font-black text-gray-800">{Number(gpts || profile?.gatedoPoints || 0).toLocaleString('pt-BR')}</p>
              <p className="text-[9px] font-black uppercase tracking-[2px] text-gray-400">GPTS</p>
            </button>

            <div className="bg-[#EEF9F2] rounded-[22px] px-3 py-4 text-center">
              <HeartIcon />
              <p className="text-lg font-black text-gray-800">{countActivePets(pets)}</p>
              <p className="text-[9px] font-black uppercase tracking-[2px] text-gray-400">Gatos ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[34px] border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[4px] text-[#8B4AFF]">
                Meu plano
              </p>
              <h2 className="text-xl font-black text-gray-800 mt-2">
                {membership.label}
              </h2>
              <p className="text-sm font-medium text-gray-500 mt-2 leading-relaxed">
                {membership.unlimitedCats
                  ? 'Gatos ilimitados com benefícios ativos na sua assinatura.'
                  : `Até ${membership.maxActiveCats || 0} gatos ativos no plano atual. Gatos em memorial não ocupam vaga.`}
              </p>
            </div>

            <button
              onClick={() => navigate('/clube')}
              className="shrink-0 px-4 py-3 rounded-2xl bg-[#8B4AFF] text-white text-[10px] font-black uppercase tracking-[2px]"
            >
              Ver planos
            </button>
          </div>

          <div className="space-y-3">
            <InfoRow
              icon={WalletCards}
              label="Plano atual"
              value={formatPlanType(profile?.subscription?.planType) || membership.label}
            />
            <InfoRow
              icon={CalendarDays}
              label="Compra / início"
              value={formatDateBR(profile?.subscription?.startedAt || profile?.createdAt)}
            />
            <InfoRow
              icon={CalendarDays}
              label="Expiração"
              value={formatDateBR(profile?.subscription?.expiresAt || profile?.planExpires, 'Sem vencimento')}
            />
            <InfoRow
              icon={Gem}
              label="Benefício de renovação"
              value={
                profile?.membership?.renewalDiscountPercent > 0
                  ? `${profile.membership.renewalDiscountPercent}% off vitalício`
                  : 'Sem desconto adicional'
              }
            />
          </div>

          <div className="mt-5 rounded-[24px] bg-[#F6F3FF] border border-[#8B4AFF]/10 p-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#8B4AFF]">
                <Repeat size={15} />
                <p className="text-[10px] font-black uppercase tracking-[3px]">
                  Renovação automática
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-600 mt-2">
                {!profile?.subscription
                  ? 'Disponível após a primeira assinatura'
                  : autoRenew
                  ? 'Ativada no seu painel'
                  : 'Desativada no seu painel'}
              </p>
            </div>

            <button
              type="button"
              disabled={savingRenewal || !profile?.subscription}
              onClick={handleToggleRenewal}
              className={`relative w-14 h-8 rounded-full transition-all ${
                autoRenew ? 'bg-[#8B4AFF]' : 'bg-gray-300'
              } ${savingRenewal || !profile?.subscription ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                  autoRenew ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => navigate('/clube?reason=points')}
            className="w-full mt-4 rounded-[24px] px-5 py-4 bg-[#FFF9D9] border border-[#edff61] flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF]">
                Comprar Gatedo Points
              </p>
              <p className="text-sm font-semibold text-gray-600 mt-2">
                Reponha GPTS para IA, Studio e recursos sob demanda.
              </p>
            </div>
            <Zap size={18} className="text-[#8B4AFF]" />
          </button>
        </div>

        <div className="bg-white rounded-[34px] border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[4px] text-[#8B4AFF]">
                Meus gatos
              </p>
              <h2 className="text-xl font-black text-gray-800 mt-2">
                {activeCats.length} ativos
                {memorialCats.length > 0 ? ` · ${memorialCats.length} no memorial` : ''}
              </h2>
            </div>

            <button
              onClick={() => navigate('/cats')}
              className="text-[10px] font-black uppercase tracking-[2px] text-[#8B4AFF]"
            >
              Ver todos
            </button>
          </div>

          {pets.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {pets.map((cat) => (
                <CatMiniCard key={cat.id} cat={cat} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] bg-[#F8F7FF] p-5 border border-dashed border-[#8B4AFF]/20 text-center">
              <p className="text-sm font-semibold text-gray-500">
                Você ainda não cadastrou gatos no app.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3 pb-4">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] px-2">
            Minha conta
          </p>
          <MenuButton
            icon={Edit2}
            title="Editar Perfil"
            subtitle="Dados pessoais e foto"
            onClick={() => navigate('/profile/edit')}
          />
          <MenuButton
            icon={Crown}
            title="Gatedo Plus"
            subtitle="Planos, founder e gatedo points"
            color="bg-amber-50 text-amber-500"
            onClick={() => navigate('/clube')}
          />
          <MenuButton
            icon={Trophy}
            title="Gamificação"
            subtitle="Nível, xpt e conquistas"
            color="bg-[#F5F1FF] text-[#8B4AFF]"
            onClick={() => setShowGamifDrawer(true)}
          />
          <MenuButton
            icon={Bell}
            title="Novidades"
            subtitle="Alertas e lançamentos do app"
            color="bg-blue-50 text-blue-500"
            onClick={() => navigate('/alerts')}
          />
          <MenuButton
            icon={Settings}
            title="Configurações"
            subtitle="Sons, notificações e biometria"
            color="bg-purple-50 text-purple-500"
            onClick={() => navigate('/settings')}
          />
          <MenuButton
            icon={LifeBuoy}
            title="Ajuda & Suporte"
            subtitle="FAQ e contato direto"
            color="bg-indigo-50 text-indigo-500"
            onClick={() => navigate('/support')}
          />
        </div>

        <button
          onClick={() => {
            touch();
            signOut();
            navigate('/login');
          }}
          className="w-full rounded-[28px] bg-white border border-red-100 text-red-500 font-black uppercase text-[10px] tracking-[2px] py-5 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
        >
          <LogOut size={16} /> Sair da Conta
        </button>

        <footer className="pb-8 pt-2 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[2px] text-gray-400">
            <Link to="/terms" className="hover:text-[#8B4AFF]">
              Termos de uso
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/privacy" className="hover:text-[#8B4AFF]">
              Politica de privacidade
            </Link>
          </div>
          <p className="mt-3 text-[10px] font-bold text-gray-300">
            Gatedo App - cuidado, memoria e identidade felina.
          </p>
        </footer>
      </div>

      <GamificationDrawer
        isOpen={showGamifDrawer}
        onClose={() => setShowGamifDrawer(false)}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  const iconNode = React.createElement(Icon, { size: 16 });

  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-gray-100 px-4 py-3">
      <div className="w-10 h-10 rounded-2xl bg-[#F5F1FF] text-[#8B4AFF] flex items-center justify-center shrink-0">
        {iconNode}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[3px] text-gray-400">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-700 mt-1 truncate">{value}</p>
      </div>
    </div>
  );
}

function HeartIcon() {
  return <PawPrint size={16} className="mx-auto text-[#1CA55B] mb-2" />;
}
