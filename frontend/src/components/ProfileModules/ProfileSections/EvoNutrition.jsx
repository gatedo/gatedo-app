import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Info,
  Utensils,
  Store,
  MessageCircle,
  Trash2,
  Plus,
  Share2,
  X,
  Sparkles,
  Clock3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from 'lucide-react';

const C = {
  purple: '#8B4AFF',
  purpleDark: '#4B40C6',
  accent: '#DFFF40',
  blue: '#2D7FF9',
  amber: '#FFB800',
  pink: '#FF006B',
  green: '#16A34A',
};

function normalizeFoodType(value) {
  if (!value) return 'Não informado';

  const map = {
    dry: 'Ração seca',
    wet: 'Ração úmida',
    mixed: 'Alimentação mista',
    natural: 'Alimentação natural',
    homemade: 'Caseira',
    prescription: 'Prescrição veterinária',
  };

  return map[String(value).toLowerCase()] || value;
}

function normalizeFeedFrequency(value) {
  if (!value) return 'Não informado';

  const map = {
    free: 'Livre demanda',
    scheduled: 'Horários definidos',
    mixed: 'Misto',
    custom: 'Personalizada',
  };

  return map[String(value).toLowerCase()] || value;
}

function normalizeGender(value) {
  if (!value) return 'Gato';
  const v = String(value).toLowerCase();
  if (['male', 'macho', 'masculino'].includes(v)) return 'Macho';
  if (['female', 'fêmea', 'femea', 'feminino'].includes(v)) return 'Fêmea';
  return value;
}

function getWeightReference(cat) {
  const breed = String(cat?.breed || 'SRD').toUpperCase();
  let min = 3.2;
  let max = 5.5;

  if (breed.includes('MAINE')) {
    min = 6;
    max = 11;
  } else if (breed.includes('PERSA')) {
    min = 3;
    max = 5.5;
  } else if (breed.includes('BENGAL')) {
    min = 3.5;
    max = 6.5;
  }

  return { min, max };
}

function getWeightStatus(cat) {
  const w = Number(cat?.weight || 0);
  const { min, max } = getWeightReference(cat);

  if (!w) {
    return {
      key: 'pending',
      label: 'Pendente',
      msg: 'Registre o peso para ativar a leitura evolutiva.',
      color: '#9CA3AF',
      bg: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
    };
  }

  if (w < min) {
    return {
      key: 'under',
      label: 'Subpeso',
      msg: `${cat?.name} está abaixo da faixa estimada para o perfil atual.`,
      color: C.amber,
      bg: `linear-gradient(135deg, ${C.amber} 0%, #F59E0B 100%)`,
    };
  }

  if (w > max) {
    return {
      key: 'over',
      label: 'Sobrepeso',
      msg: `${cat?.name} está acima da faixa estimada para o perfil atual.`,
      color: C.pink,
      bg: `linear-gradient(135deg, ${C.pink} 0%, #E11D48 100%)`,
    };
  }

  return {
    key: 'ideal',
    label: 'Peso ideal',
    msg: `${cat?.name} está dentro da faixa esperada para o perfil atual.`,
    color: C.blue,
    bg: `linear-gradient(135deg, ${C.blue} 0%, #2563EB 100%)`,
  };
}

function FieldCard({ label, value, icon: Icon, accent = C.purple }) {
  return (
    <div className="rounded-[22px] border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        {Icon ? <Icon size={12} style={{ color: accent }} /> : null}
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
          {label}
        </p>
      </div>
      <p className="text-sm font-black text-gray-800 leading-snug">{value || 'Não informado'}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, color = C.purple }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-10 h-10 rounded-[16px] flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}14` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-700 leading-none">
          {title}
        </h3>
        {subtitle ? (
          <p className="text-[10px] font-bold text-gray-400 mt-1">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function SupplierCard({ supplier, onInvite, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-[18px] border border-gray-100">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm flex-shrink-0">
          <Store size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black text-gray-800 uppercase truncate">{supplier.name}</p>
          <p className="text-[10px] text-gray-400 font-bold truncate">
            {supplier.whatsapp || 'Sem WhatsApp'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onInvite(supplier.name)}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:scale-90"
        >
          <Share2 size={14} />
        </button>

        {supplier.whatsapp ? (
          <a
            href={`https://wa.me/${String(supplier.whatsapp).replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"
          >
            <MessageCircle size={14} />
          </a>
        ) : null}

        <button
          onClick={onDelete}
          className="p-2 bg-red-50 text-red-500 rounded-lg"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function EvoNutrition({ cat }) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({ name: '', whatsapp: '' });

  const status = useMemo(() => getWeightStatus(cat), [cat]);
  const genderLabel = useMemo(() => normalizeGender(cat?.gender), [cat?.gender]);

 const nutritionInsight = useMemo(() => {
  const pieces = [];
  const weight = Number(cat?.weight || 0);
  const hasBrand = !!cat?.foodBrand;
  const hasType = !!cat?.foodType;
  const hasFreq = !!cat?.feedFrequencyMode;

  if (!weight) {
    pieces.push('O peso ainda não foi registrado, então a leitura evolutiva nutricional está incompleta.');
  } else if (status.key === 'ideal') {
    pieces.push((cat?.name || 'O gato') + ' está dentro da faixa estimada para o perfil atual.');
  } else if (status.key === 'under') {
    pieces.push('O peso sugere atenção para ganho gradual de condição corporal.');
  } else if (status.key === 'over') {
    pieces.push('O peso sugere atenção para manejo calórico e rotina alimentar.');
  }

  if (hasBrand && hasType) {
    const normalizedType = String(normalizeFoodType(cat.foodType)).toLowerCase();
    const brandSuffix = cat.foodBrand ? ' (' + cat.foodBrand + ')' : '';
    pieces.push(
      'A base alimentar atual está registrada como ' + normalizedType + brandSuffix + '.'
    );
  } else if (hasBrand || hasType) {
    pieces.push(
      'A alimentação está parcialmente registrada; vale completar a base nutricional.'
    );
  } else {
    pieces.push(
      'Ainda faltam dados da alimentação principal para enriquecer a evolução.'
    );
  }

  if (hasFreq) {
    pieces.push(
      'A rotina atual está definida como ' +
        String(normalizeFeedFrequency(cat.feedFrequencyMode)).toLowerCase() +
        '.'
    );
  } else {
    pieces.push('A frequência de alimentação ainda não foi estruturada.');
  }

  return pieces.join(' ');
}, [cat, status]);

  const nutritionCompleteness = useMemo(() => {
    let score = 0;
    if (cat?.weight) score += 25;
    if (cat?.foodBrand) score += 20;
    if (cat?.foodType) score += 20;
    if (cat?.feedFrequencyMode) score += 20;
    if (cat?.feedFrequencyNotes) score += 15;
    return score;
  }, [cat]);

  const inviteSupplier = (supplierName) => {
    const msg = encodeURIComponent(
      `Olá ${supplierName}! Sou o tutor do ${cat?.name} e gostaria de te ter como fornecedor registrado no ecossistema do GATEDO.`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const addSupplier = () => {
    if (!newSupplier.name.trim()) return;

    setSuppliers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newSupplier.name.trim(),
        whatsapp: newSupplier.whatsapp.trim(),
      },
    ]);

    setNewSupplier({ name: '', whatsapp: '' });
  };

  return (
    <div className="space-y-6 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[30px] p-4 text-white shadow-2xl relative overflow-hidden"
        style={{ background: status.bg }}
      >
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-white/10" />

        <div className="relative z-10 flex justify-between items-start gap-4">
          <div className="flex gap-4 items-center min-w-0">
            <div className="bg-white/20 p-4 rounded-[20px] backdrop-blur-lg border border-white/30 flex-shrink-0">
              <Scale size={28} />
            </div>

            <div className="min-w-0">
              <div className="flex items-end gap-1 leading-none">
                <span className="text-5xl font-black tracking-tighter">{cat?.weight || '0.0'}</span>
                <span className="text-sm font-bold mb-1">KG</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-90">
                {status.label}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowInfoModal(true)}
            className="p-3 bg-white/20 rounded-full border border-white/20 active:scale-90 transition-all flex-shrink-0"
          >
            <Info size={20} />
          </button>
        </div>

        <div className="relative z-10 mt-4 pt-4 border-t border-white/10 text-center">
          <p className="text-xs font-bold italic opacity-95">"{status.msg}"</p>
        </div>
      </motion.div>

      <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-50">
        <SectionTitle
          icon={Sparkles}
          title="Leitura Evolutiva"
          subtitle="Como a nutrição conversa com o progresso do gato"
          color={C.purple}
        />

        <div className="rounded-[22px] bg-[#F4F3FF] border border-[#8B4AFF18] px-4 py-4 mb-4">
          <p className="text-[11px] font-bold text-gray-700 leading-relaxed">
            {nutritionInsight}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldCard
            label="Completude nutricional"
            value={`${nutritionCompleteness}%`}
            icon={CheckCircle2}
            accent={nutritionCompleteness >= 70 ? C.green : C.purple}
          />
          <FieldCard
            label="Faixa de peso"
            value={status.label}
            icon={Activity}
            accent={status.key === 'ideal' ? C.green : status.key === 'pending' ? '#9CA3AF' : C.amber}
          />
          <FieldCard
            label="Tipo alimentar"
            value={normalizeFoodType(cat?.foodType)}
            icon={Utensils}
            accent={C.purple}
          />
          <FieldCard
            label="Frequência"
            value={normalizeFeedFrequency(cat?.feedFrequencyMode)}
            icon={Clock3}
            accent={C.purpleDark}
          />
        </div>
      </div>

      <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-50">
        <SectionTitle
          icon={Utensils}
          title="Base Nutricional"
          subtitle="Dados estruturados da rotina alimentar"
          color={C.blue}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldCard
            label="Marca principal"
            value={cat?.foodBrand || 'Não informado'}
            icon={Utensils}
            accent={C.blue}
          />
          <FieldCard
            label="Tipo de alimentação"
            value={normalizeFoodType(cat?.foodType)}
            icon={Utensils}
            accent={C.blue}
          />
          <FieldCard
            label="Frequência"
            value={normalizeFeedFrequency(cat?.feedFrequencyMode)}
            icon={Clock3}
            accent={C.blue}
          />
          <FieldCard
            label="Perfil biológico"
            value={`${genderLabel} · ${cat?.breed || 'SRD'}`}
            icon={TrendingUp}
            accent={C.blue}
          />
        </div>

        {cat?.feedFrequencyNotes ? (
          <div className="mt-4 rounded-[22px] bg-gray-50 border border-gray-100 px-4 py-4">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 mb-1.5">
              Observações da rotina alimentar
            </p>
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              {cat.feedFrequencyNotes}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] bg-amber-50 border border-amber-100 px-4 py-4 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
              Ainda não há observações nutricionais detalhadas registradas para {cat?.name}.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-50">
        <SectionTitle
          icon={TrendingUp}
          title="Indicadores de Evolução"
          subtitle="Leitura visual para acompanhamento"
          color={C.green}
        />

        <div className="space-y-4">
          {[
            {
              label: 'Peso x perfil atual',
              pct: status.key === 'ideal' ? 92 : status.key === 'pending' ? 20 : status.key === 'under' ? 58 : 54,
              color: status.key === 'ideal' ? 'bg-emerald-400' : status.key === 'pending' ? 'bg-gray-300' : 'bg-amber-400',
            },
            {
              label: 'Rotina alimentar',
              pct: cat?.feedFrequencyMode ? 84 : 28,
              color: cat?.feedFrequencyMode ? 'bg-indigo-400' : 'bg-gray-300',
            },
            {
              label: 'Base nutricional',
              pct: nutritionCompleteness,
              color: nutritionCompleteness >= 70 ? 'bg-fuchsia-400' : 'bg-gray-300',
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-gray-500 w-28 leading-tight">
                {item.label}
              </span>

              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className={`h-full ${item.color}`}
                />
              </div>

              <span className="text-[10px] font-black text-gray-800 w-10 text-right">
                {item.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-50">
        <SectionTitle
          icon={Store}
          title="Fornecedores"
          subtitle="Rede útil do tutor para alimentação e apoio"
          color={C.green}
        />

        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Nome da loja ou fornecedor"
            value={newSupplier.name}
            onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold outline-none"
          />

          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="WhatsApp"
              value={newSupplier.whatsapp}
              onChange={(e) => setNewSupplier({ ...newSupplier, whatsapp: e.target.value })}
              className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold outline-none"
            />

            <button
              onClick={addSupplier}
              className="bg-emerald-500 text-white px-4 rounded-2xl active:scale-95 flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {suppliers.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-gray-200 bg-gray-50 py-6 text-center">
            <p className="text-xs font-bold text-gray-400">Nenhum fornecedor cadastrado ainda</p>
            <p className="text-[10px] text-gray-300 mt-1">
              Adicione lojas, pet shops ou contatos úteis da rotina alimentar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {suppliers.map((s) => (
              <SupplierCard
                key={s.id}
                supplier={s}
                onInvite={inviteSupplier}
                onDelete={() => {
                  if (confirm('Remover fornecedor?')) {
                    setSuppliers((prev) => prev.filter((x) => x.id !== s.id));
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative bg-white rounded-[30px] p-6 max-w-sm shadow-2xl"
            >
              <button
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X size={15} className="text-gray-500" />
              </button>

              <h4 className="text-lg font-black text-gray-800 uppercase tracking-tighter mb-4">
                Metodologia Evolutiva
              </h4>

              <p className="text-sm text-gray-500 leading-relaxed">
                Este bloco cruza peso, faixa estimada, base nutricional e rotina alimentar para construir uma leitura gradual da evolução do gato. Ele não substitui avaliação veterinária, mas organiza contexto útil para rotina, observação e acompanhamento.
              </p>

              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full mt-6 py-4 rounded-2xl font-black uppercase text-[10px] text-white"
                style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.purpleDark})` }}
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}