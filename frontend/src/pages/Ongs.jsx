import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  HeartHandshake,
  Heart,
  MapPin,
  PawPrint,
  Plus,
  X,
  Mail,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Users,
  Cat,
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

const STORAGE_KEY = 'gatedo_ongs_support_network_v1';

const seedOngs = [
  {
    id: 'ong-seed-1',
    type: 'support',
    name: 'Adote um Gatinho',
    city: 'São Paulo',
    state: 'SP',
    whatsapp: '',
    email: 'contato@adoteumgatinho.org.br',
    instagram: '@adoteumgatinho',
    supportType: 'Resgate e adoção',
    notes: 'Projeto referência em adoção responsável e apoio a resgates.',
    tutorName: 'Comunidade GATEDO',
    tutorAvatar: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ong-seed-2',
    type: 'support',
    name: 'Gatos do Parque',
    city: 'Rio de Janeiro',
    state: 'RJ',
    whatsapp: '',
    email: 'contato@gatosdoparque.org',
    instagram: '@gatosdoparque',
    supportType: 'Castração e CED',
    notes: 'Atuação comunitária com foco em cuidado coletivo e controle populacional.',
    tutorName: 'Comunidade GATEDO',
    tutorAvatar: '',
    createdAt: new Date().toISOString(),
  },
];

const seedAdoptions = [
  {
    id: 'ADO-1001',
    type: 'adoption',
    catName: 'Mingau',
    age: '3 meses',
    gender: 'Macho',
    city: 'Porto Alegre',
    state: 'RS',
    castrated: 'Não',
    vaccinated: 'Não',
    vermifuged: 'Sim',
    temperament: 'Brincalhão e muito carinhoso',
    requirements: 'Adoção responsável, ambiente seguro e adaptação gradual.',
    whatsapp: '',
    email: 'adocao@exemplo.com',
    tutorName: 'Tutor GATEDO',
    tutorAvatar: '',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80',
    status: 'disponivel',
    adoptedBy: '',
    adoptedAt: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ADO-1002',
    type: 'adoption',
    catName: 'Luna',
    age: '2 anos',
    gender: 'Fêmea',
    city: 'Curitiba',
    state: 'PR',
    castrated: 'Sim',
    vaccinated: 'Sim',
    vermifuged: 'Sim',
    temperament: 'Calma, observadora e dócil',
    requirements: 'Busca lar tranquilo e adoção responsável.',
    whatsapp: '',
    email: 'resgate@exemplo.com',
    tutorName: 'Tutora GATEDO',
    tutorAvatar: '',
    image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=500&q=80',
    status: 'disponivel',
    adoptedBy: '',
    adoptedAt: '',
    createdAt: new Date().toISOString(),
  },
];

const emptySupportForm = {
  name: '',
  city: '',
  state: '',
  whatsapp: '',
  email: '',
  instagram: '',
  supportType: '',
  notes: '',
  tutorName: '',
  tutorAvatar: '',
};

const emptyAdoptionForm = {
  catName: '',
  age: '',
  gender: 'Macho',
  city: '',
  state: '',
  castrated: 'Não',
  vaccinated: 'Não',
  vermifuged: 'Não',
  temperament: '',
  requirements: '',
  whatsapp: '',
  email: '',
  tutorName: '',
  tutorAvatar: '',
  image: '',
};

const avatarFromName = (name = '') =>
  name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'TG';

const formatDate = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('pt-BR');
  } catch {
    return '';
  }
};

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { supportEntries: seedOngs, adoptionEntries: seedAdoptions };
    const parsed = JSON.parse(raw);
    return {
      supportEntries: Array.isArray(parsed.supportEntries) && parsed.supportEntries.length ? parsed.supportEntries : seedOngs,
      adoptionEntries: Array.isArray(parsed.adoptionEntries) && parsed.adoptionEntries.length ? parsed.adoptionEntries : seedAdoptions,
    };
  } catch {
    return { supportEntries: seedOngs, adoptionEntries: seedAdoptions };
  }
}

function persistStorage(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function CenterModal({ open, onClose, title, children, ctaLabel = 'Entendi, seguir em modo prévia' }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-[#1E1631]/45 backdrop-blur-[6px] px-5 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 14 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-md bg-white rounded-[30px] shadow-[0_22px_60px_rgba(82,38,162,0.20)] border border-white/70 p-6"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 text-pink-500 text-[11px] font-black mb-3">
                <Heart className="w-3.5 h-3.5 fill-pink-500" /> MVP progressivo da comunidade
              </div>
              <h3 className="text-[22px] leading-[1.05] font-black text-gray-900">{title}</h3>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
          <button
            onClick={onClose}
            className="mt-6 w-full h-12 rounded-[18px] bg-gradient-to-r from-[#7B3FF2] to-[#5B39F4] text-white font-black text-sm shadow-[0_14px_26px_rgba(91,57,244,0.28)]"
          >
            {ctaLabel}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-9 h-9 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center">
          <Icon size={18} />
        </div>
        <h3 className="text-sm font-black text-gray-800">{title}</h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed pl-11">{subtitle}</p>
    </div>
  );
}

function InfoStat({ label, value }) {
  return (
    <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100">
      <div className="text-[28px] leading-none font-black text-gray-900 mb-2">{value}</div>
      <div className="text-xs font-semibold text-gray-500 leading-snug">{label}</div>
    </div>
  );
}

function MiniAvatar({ name, avatar }) {
  if (avatar) return <img src={avatar} alt={name} className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm" />;
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm">
      {avatarFromName(name)}
    </div>
  );
}

export default function Ongs() {
  const navigate = useNavigate();
  const touch = useSensory();

  const [activeTab, setActiveTab] = useState('support');
  const [introOpen, setIntroOpen] = useState(true);
  const [supportEntries, setSupportEntries] = useState([]);
  const [adoptionEntries, setAdoptionEntries] = useState([]);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [showAdoptionForm, setShowAdoptionForm] = useState(false);
  const [supportForm, setSupportForm] = useState(emptySupportForm);
  const [adoptionForm, setAdoptionForm] = useState(emptyAdoptionForm);
  const [adoptionToMark, setAdoptionToMark] = useState(null);
  const [adopterName, setAdopterName] = useState('');

  useEffect(() => {
    const { supportEntries, adoptionEntries } = readStorage();
    setSupportEntries(supportEntries);
    setAdoptionEntries(adoptionEntries);
  }, []);

  useEffect(() => {
    if (!supportEntries.length && !adoptionEntries.length) return;
    persistStorage({ supportEntries, adoptionEntries });
  }, [supportEntries, adoptionEntries]);

  const supportRanking = useMemo(() => {
    const grouped = supportEntries.reduce((acc, item) => {
      const key = `${item.name}::${item.city}::${item.state}`.toLowerCase();
      if (!acc[key]) {
        acc[key] = { ...item, recommenders: [] };
      }
      acc[key].recommenders.push({ name: item.tutorName || 'Tutor GATEDO', avatar: item.tutorAvatar || '' });
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.recommenders.length - a.recommenders.length);
  }, [supportEntries]);

  const adoptionStats = useMemo(() => {
    const total = adoptionEntries.length;
    const adopted = adoptionEntries.filter((item) => item.status === 'adotado').length;
    const available = adoptionEntries.filter((item) => item.status !== 'adotado').length;
    return { total, adopted, available };
  }, [adoptionEntries]);

  const handleAddSupport = () => {
    touch?.('success');
    setShowSupportForm(true);
  };

  const handleAddAdoption = () => {
    touch?.('success');
    setShowAdoptionForm(true);
  };

  const submitSupport = (e) => {
    e.preventDefault();
    if (!supportForm.name || !supportForm.city || !supportForm.state) return;
    const next = {
      id: `SUP-${Date.now()}`,
      type: 'support',
      ...supportForm,
      tutorName: supportForm.tutorName || 'Tutor GATEDO',
      createdAt: new Date().toISOString(),
    };
    setSupportEntries((prev) => [next, ...prev]);
    setSupportForm(emptySupportForm);
    setShowSupportForm(false);
  };

  const submitAdoption = (e) => {
    e.preventDefault();
    if (!adoptionForm.catName || !adoptionForm.city || !adoptionForm.state) return;
    const next = {
      id: `ADO-${Math.floor(Date.now() / 1000)}`,
      type: 'adoption',
      ...adoptionForm,
      tutorName: adoptionForm.tutorName || 'Tutor GATEDO',
      status: 'disponivel',
      adoptedBy: '',
      adoptedAt: '',
      createdAt: new Date().toISOString(),
    };
    setAdoptionEntries((prev) => [next, ...prev]);
    setAdoptionForm(emptyAdoptionForm);
    setShowAdoptionForm(false);
  };

  const confirmAdoption = () => {
    if (!adoptionToMark || !adopterName.trim()) return;
    setAdoptionEntries((prev) =>
      prev.map((item) =>
        item.id === adoptionToMark.id
          ? {
              ...item,
              status: 'adotado',
              adoptedBy: adopterName.trim(),
              adoptedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    setAdoptionToMark(null);
    setAdopterName('');
  };

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 pt-6 px-5 font-sans">
      <CenterModal open={introOpen} onClose={() => setIntroOpen(false)} title="Rede de Apoio & Adoção Responsável">
        <p>
          Este módulo já nasce com uma base útil para o MVP: tutores podem indicar ONGs, protetores e pontos de apoio, além de cadastrar
          gatinhos para adoção responsável com contato por WhatsApp e email.
        </p>
        <p>
          O guia inteligente, o mapa validado e o ranking avançado da comunidade entram conforme a adesão real da plataforma. Por enquanto,
          você já pode usar o módulo em modo progressivo.
        </p>
      </CenterModal>

      <CenterModal
        open={!!adoptionToMark}
        onClose={() => {
          setAdoptionToMark(null);
          setAdopterName('');
        }}
        title="Confirmar adoção"
        ctaLabel="Confirmar adoção"
      >
        <div className="space-y-3">
          <p>
            Marque este gatinho como adotado para atualizar o contador da comunidade e registrar quem concluiu a adoção responsável.
          </p>
          <div className="bg-gray-50 rounded-[18px] p-3 border border-gray-100">
            <div className="text-[11px] font-black text-pink-500 mb-1">ID do gatinho</div>
            <div className="text-sm font-black text-gray-800">{adoptionToMark?.id}</div>
          </div>
          <input
            value={adopterName}
            onChange={(e) => setAdopterName(e.target.value)}
            placeholder="Nome de quem adotou"
            className="w-full h-12 rounded-[16px] border border-gray-200 px-4 text-sm outline-none"
          />
          <button
            onClick={confirmAdoption}
            className="w-full h-12 rounded-[18px] bg-gradient-to-r from-[#7B3FF2] to-[#5B39F4] text-white font-black text-sm"
          >
            Confirmar adoção
          </button>
        </div>
      </CenterModal>

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { touch?.(); navigate(-1); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600 border border-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            Rede do <span className="text-pink-500">Bem</span> <Heart className="text-pink-500 fill-pink-500" size={20} />
          </h1>
          <p className="text-xs text-gray-500">Apoio real da comunidade, com terreno pronto para crescer após o MVP.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <InfoStat label="Pontos de apoio e ONGs indicados" value={supportRanking.length} />
        <InfoStat label="Gatinhos cadastrados para adoção" value={adoptionStats.total} />
        <InfoStat label="Adoções marcadas pela comunidade" value={adoptionStats.adopted} />
      </div>

      <div className="flex bg-white p-1 rounded-[20px] shadow-sm mb-6 border border-gray-100">
        <button
          onClick={() => setActiveTab('support')}
          className={`flex-1 py-3 rounded-[16px] text-xs font-black transition-all ${activeTab === 'support' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}
        >
          Rede de apoio
        </button>
        <button
          onClick={() => setActiveTab('adoption')}
          className={`flex-1 py-3 rounded-[16px] text-xs font-black transition-all ${activeTab === 'adoption' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}
        >
          Adoção responsável
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'support' ? (
          <motion.div key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <SectionTitle
              icon={Building2}
              title="ONGs, protetores e pontos de apoio"
              subtitle="Já dá para registrar indicações úteis da comunidade. Ranking validado, mapa e reputação avançada entram depois do MVP."
            />

            <button
              onClick={handleAddSupport}
              className="w-full py-4 border-2 border-dashed border-pink-200 rounded-[24px] text-pink-500 font-black text-xs flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors bg-white"
            >
              <Plus size={16} /> Indicar ONG ou ponto de apoio
            </button>

            {showSupportForm && (
              <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-gray-900">Nova indicação da comunidade</div>
                    <div className="text-[11px] text-gray-500">Esses dados já ficam prontos para alimentar o guia inteligente depois do MVP.</div>
                  </div>
                  <button onClick={() => setShowSupportForm(false)} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={submitSupport} className="grid grid-cols-2 gap-3">
                  <input value={supportForm.name} onChange={(e) => setSupportForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome da ONG / protetor" className="col-span-2 h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={supportForm.city} onChange={(e) => setSupportForm((p) => ({ ...p, city: e.target.value }))} placeholder="Cidade" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={supportForm.state} onChange={(e) => setSupportForm((p) => ({ ...p, state: e.target.value }))} placeholder="UF" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={supportForm.whatsapp} onChange={(e) => setSupportForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={supportForm.email} onChange={(e) => setSupportForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={supportForm.instagram} onChange={(e) => setSupportForm((p) => ({ ...p, instagram: e.target.value }))} placeholder="Instagram" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={supportForm.supportType} onChange={(e) => setSupportForm((p) => ({ ...p, supportType: e.target.value }))} placeholder="Tipo de ajuda" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={supportForm.tutorName} onChange={(e) => setSupportForm((p) => ({ ...p, tutorName: e.target.value }))} placeholder="Seu nome" className="col-span-2 h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <textarea value={supportForm.notes} onChange={(e) => setSupportForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Observações úteis" rows={3} className="col-span-2 rounded-[16px] border border-gray-200 px-4 py-3 text-sm outline-none resize-none" />
                  <button type="submit" className="col-span-2 h-12 rounded-[18px] bg-gradient-to-r from-[#7B3FF2] to-[#5B39F4] text-white font-black text-sm">Salvar indicação</button>
                </form>
              </div>
            )}

            {supportRanking.map((item) => (
              <div key={`${item.name}-${item.city}-${item.state}`} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex gap-4">
                <div className="w-16 h-16 rounded-[18px] bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                  <Building2 size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <h3 className="font-black text-gray-800 leading-tight">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.supportType || 'Ponto de apoio da comunidade'}</p>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-pink-50 text-pink-500 text-[10px] font-black">
                      {item.recommenders.length} indicação{item.recommenders.length > 1 ? 'ões' : ''}
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1 mb-2"><MapPin size={11} /> {item.city}, {item.state}</div>
                  {item.notes ? <p className="text-xs text-gray-600 leading-relaxed mb-3">{item.notes}</p> : null}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center -space-x-2">
                      {item.recommenders.slice(0, 4).map((rec, idx) => <MiniAvatar key={`${rec.name}-${idx}`} name={rec.name} avatar={rec.avatar} />)}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.whatsapp ? (
                        <a href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      ) : null}
                      {item.email ? (
                        <a href={`mailto:${item.email}`} className="text-[11px] font-black text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                          <Mail size={12} /> Email
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="adoption" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <SectionTitle
              icon={Cat}
              title="Cadastro de gatinhos para adoção"
              subtitle="Já dá para registrar contatos, mostrar o status da adoção e contar quantos gatinhos já encontraram lar."
            />

            <button
              onClick={handleAddAdoption}
              className="w-full py-4 border-2 border-dashed border-pink-200 rounded-[24px] text-pink-500 font-black text-xs flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors bg-white"
            >
              <Plus size={16} /> Cadastrar gatinho para adoção
            </button>

            {showAdoptionForm && (
              <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-gray-900">Novo cadastro de adoção responsável</div>
                    <div className="text-[11px] text-gray-500">Com esse registro, o tutor já pode receber interessados por WhatsApp e email.</div>
                  </div>
                  <button onClick={() => setShowAdoptionForm(false)} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={submitAdoption} className="grid grid-cols-2 gap-3">
                  <input value={adoptionForm.catName} onChange={(e) => setAdoptionForm((p) => ({ ...p, catName: e.target.value }))} placeholder="Nome do gatinho" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={adoptionForm.age} onChange={(e) => setAdoptionForm((p) => ({ ...p, age: e.target.value }))} placeholder="Idade" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <select value={adoptionForm.gender} onChange={(e) => setAdoptionForm((p) => ({ ...p, gender: e.target.value }))} className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none bg-white">
                    <option>Macho</option>
                    <option>Fêmea</option>
                  </select>
                  <input value={adoptionForm.image} onChange={(e) => setAdoptionForm((p) => ({ ...p, image: e.target.value }))} placeholder="URL da foto (opcional)" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={adoptionForm.city} onChange={(e) => setAdoptionForm((p) => ({ ...p, city: e.target.value }))} placeholder="Cidade" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={adoptionForm.state} onChange={(e) => setAdoptionForm((p) => ({ ...p, state: e.target.value }))} placeholder="UF" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <select value={adoptionForm.castrated} onChange={(e) => setAdoptionForm((p) => ({ ...p, castrated: e.target.value }))} className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none bg-white">
                    <option>Não</option>
                    <option>Sim</option>
                  </select>
                  <select value={adoptionForm.vaccinated} onChange={(e) => setAdoptionForm((p) => ({ ...p, vaccinated: e.target.value }))} className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none bg-white">
                    <option>Não</option>
                    <option>Sim</option>
                  </select>
                  <select value={adoptionForm.vermifuged} onChange={(e) => setAdoptionForm((p) => ({ ...p, vermifuged: e.target.value }))} className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none bg-white">
                    <option>Não</option>
                    <option>Sim</option>
                  </select>
                  <input value={adoptionForm.tutorName} onChange={(e) => setAdoptionForm((p) => ({ ...p, tutorName: e.target.value }))} placeholder="Nome do tutor responsável" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={adoptionForm.whatsapp} onChange={(e) => setAdoptionForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <input value={adoptionForm.email} onChange={(e) => setAdoptionForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="h-11 rounded-[16px] border border-gray-200 px-4 text-sm outline-none" />
                  <textarea value={adoptionForm.temperament} onChange={(e) => setAdoptionForm((p) => ({ ...p, temperament: e.target.value }))} placeholder="Temperamento e observações" rows={3} className="col-span-2 rounded-[16px] border border-gray-200 px-4 py-3 text-sm outline-none resize-none" />
                  <textarea value={adoptionForm.requirements} onChange={(e) => setAdoptionForm((p) => ({ ...p, requirements: e.target.value }))} placeholder="Requisitos da adoção responsável" rows={3} className="col-span-2 rounded-[16px] border border-gray-200 px-4 py-3 text-sm outline-none resize-none" />
                  <button type="submit" className="col-span-2 h-12 rounded-[18px] bg-gradient-to-r from-[#7B3FF2] to-[#5B39F4] text-white font-black text-sm">Salvar cadastro</button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {adoptionEntries.map((cat) => (
                <div key={cat.id} className="bg-white p-3 rounded-[24px] shadow-sm border border-gray-100">
                  <div className="aspect-square rounded-[18px] overflow-hidden mb-3 relative bg-pink-50">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.catName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-pink-400"><PawPrint size={34} /></div>
                    )}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-[9px] font-black ${cat.status === 'adotado' ? 'bg-emerald-500 text-white' : 'bg-white/85 text-gray-700'}`}>
                      {cat.status === 'adotado' ? 'Adotado' : 'Disponível'}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-white/85 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-black text-gray-700">
                      {cat.age || 'Sem idade'}
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-black text-gray-800 text-sm leading-tight">{cat.catName}</h3>
                    <span className="text-[9px] font-black text-pink-500 bg-pink-50 px-2 py-1 rounded-full">{cat.id}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">{cat.gender} • {cat.city}, {cat.state}</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed min-h-[48px]">{cat.temperament || 'Sem observações adicionais por enquanto.'}</p>
                  <div className="mt-3 mb-3 flex items-center gap-2 text-[10px] text-gray-500">
                    <MiniAvatar name={cat.tutorName} avatar={cat.tutorAvatar} />
                    <span>{cat.tutorName || 'Tutor responsável'}</span>
                  </div>
                  {cat.status === 'adotado' ? (
                    <div className="rounded-[16px] bg-emerald-50 border border-emerald-100 p-3 text-[11px] text-emerald-700 leading-relaxed mb-3">
                      <div className="font-black mb-1">Adoção confirmada</div>
                      <div>Adotado por: {cat.adoptedBy}</div>
                      <div>Registrado em: {formatDate(cat.adoptedAt)}</div>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {cat.whatsapp ? (
                        <a href={`https://wa.me/${cat.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 h-10 rounded-[14px] bg-emerald-500 text-white text-[11px] font-black inline-flex items-center justify-center gap-1">
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      ) : null}
                      {cat.email ? (
                        <a href={`mailto:${cat.email}`} className="flex-1 h-10 rounded-[14px] bg-pink-50 text-pink-500 text-[11px] font-black inline-flex items-center justify-center gap-1 border border-pink-100">
                          <Mail size={12} /> Email
                        </a>
                      ) : null}
                    </div>
                    {cat.status !== 'adotado' ? (
                      <button
                        onClick={() => {
                          touch?.('success');
                          setAdoptionToMark(cat);
                        }}
                        className="w-full h-10 rounded-[14px] bg-gray-900 text-white text-[11px] font-black inline-flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={12} /> Marcar como adotado
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
