import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  UserRound,
  Search,
  Plus,
  CheckCircle2,
  HeartHandshake,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from 'lucide-react';

const C = {
  purple: '#8B4AFF',
  purpleDark: '#4B40C6',
  accent: '#DFFF40',
};

const TRUSTED_KEY = (petId) => `gatedo_trusted_providers_${petId}`;

const readTrustedProviders = (petId) => {
  if (!petId) return { vets: [], clinics: [] };
  try {
    const raw = localStorage.getItem(TRUSTED_KEY(petId));
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      vets: Array.isArray(parsed?.vets) ? parsed.vets : [],
      clinics: Array.isArray(parsed?.clinics) ? parsed.clinics : [],
    };
  } catch {
    return { vets: [], clinics: [] };
  }
};

const saveTrustedProviders = (petId, payload) => {
  if (!petId) return;
  localStorage.setItem(TRUSTED_KEY(petId), JSON.stringify(payload));
};

const normalize = (v) => String(v || '').trim();
const keyify = (v) => normalize(v).toLowerCase();

function SmallBadge({ children, tone = 'default' }) {
  const styles =
    tone === 'good'
      ? { bg: '#ECFDF3', color: '#027A48', border: '#A6F4C5' }
      : tone === 'lime'
        ? { bg: '#FAFFE8', color: '#5A7000', border: '#DFFF4060' }
        : { bg: '#F4F3FF', color: C.purple, border: `${C.purple}20` };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border"
      style={{ background: styles.bg, color: styles.color, borderColor: styles.border }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
        <Icon size={16} style={{ color: C.purple }} />
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
        {subtitle ? (
          <p className="text-[11px] font-bold text-gray-400 mt-0.5">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function ProviderCard({
  type,
  item,
  selected,
  onSelect,
}) {
  const isVet = type === 'vet';

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className={`w-full text-left rounded-[22px] border p-4 transition-all ${
        selected ? 'shadow-md scale-[0.995]' : 'shadow-sm'
      }`}
      style={{
        background: selected ? '#FCFBFF' : '#FFFFFF',
        borderColor: selected ? `${C.purple}35` : '#F1F1F4',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-gray-800 break-words">
              {item.name}
            </p>

            {item.source === 'manual' ? (
              <SmallBadge tone="good">confiança</SmallBadge>
            ) : (
              <SmallBadge>histórico</SmallBadge>
            )}

            {selected ? (
              <SmallBadge tone="lime">
                <CheckCircle2 size={9} />
                selecionado
              </SmallBadge>
            ) : null}
          </div>

          {isVet && item.clinicName ? (
            <p className="text-[10px] font-bold text-gray-500 mt-1">{item.clinicName}</p>
          ) : null}

          {!isVet && item.phone ? (
            <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
              <Phone size={10} /> {item.phone}
            </p>
          ) : null}

          {!isVet && item.address ? (
            <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
              <MapPin size={10} /> {item.address}
            </p>
          ) : null}

          {isVet && item.clinicPhone ? (
            <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
              <Phone size={10} /> {item.clinicPhone}
            </p>
          ) : null}

          {item.notes ? (
            <p className="text-[10px] font-bold text-gray-400 mt-2 line-clamp-2">
              {item.notes}
            </p>
          ) : null}
        </div>

        <div className="flex-shrink-0 mt-0.5">
          {selected ? (
            <CheckCircle2 size={16} style={{ color: C.purple }} />
          ) : (
            <div className="w-4 h-4 rounded-full border border-gray-300" />
          )}
        </div>
      </div>
    </button>
  );
}

function QuickCreateCard({
  petId,
  mode,
  initialClinicName = '',
  onSave,
  onCancel,
}) {
  const isVet = mode === 'vet';

  const [form, setForm] = useState({
    name: '',
    clinicName: initialClinicName || '',
    phone: '',
    address: '',
    notes: '',
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const next = {
      id: `${form.name || 'novo'}::${Date.now()}`.toLowerCase(),
      name: normalize(form.name),
      clinicName: normalize(form.clinicName),
      clinicPhone: isVet ? normalize(form.phone) : '',
      clinicAddress: isVet ? normalize(form.address) : '',
      phone: !isVet ? normalize(form.phone) : '',
      address: !isVet ? normalize(form.address) : '',
      notes: normalize(form.notes),
      source: 'manual',
      trustLevel: 'trusted',
      catFriendlyEligible: true,
    };

    if (!next.name) return;
    onSave?.(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-[24px] border border-gray-100 bg-white shadow-sm p-4 mt-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Novo {isVet ? 'Veterinário' : 'Clínica'}
            </p>
            <p className="text-[11px] font-bold text-gray-400 mt-0.5">
              Salva na base de confiança do tutor
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center"
          >
            <X size={13} className="text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={isVet ? 'Nome do veterinário' : 'Nome da clínica'}
            className="w-full rounded-2xl bg-[#FAFAFD] border border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 outline-none"
          />

          {isVet ? (
            <input
              value={form.clinicName}
              onChange={(e) => set('clinicName', e.target.value)}
              placeholder="Clínica vinculada"
              className="w-full rounded-2xl bg-[#FAFAFD] border border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 outline-none"
            />
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="Telefone / WhatsApp"
              className="w-full rounded-2xl bg-[#FAFAFD] border border-gray-100 px-4 py-3 text-xs font-bold text-gray-700 outline-none"
            />
            <input
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Cidade / Bairro"
              className="w-full rounded-2xl bg-[#FAFAFD] border border-gray-100 px-4 py-3 text-xs font-bold text-gray-700 outline-none"
            />
          </div>

          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Observações, referência, especialidade..."
            className="w-full rounded-2xl bg-[#FAFAFD] border border-gray-100 px-4 py-3 text-xs font-bold text-gray-700 outline-none resize-none"
          />

          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-black text-white"
            style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.purpleDark})` }}
          >
            <Plus size={14} />
            Salvar contato
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProvidersSelector({
  petId,
  healthRecords = [],
  treatments = [],
  value = {
    veterinarian: '',
    clinicName: '',
    clinicPhone: '',
    clinicAddress: '',
  },
  onChange,
  compact = false,
}) {
  const [trusted, setTrusted] = useState(() => readTrustedProviders(petId));
  const [search, setSearch] = useState('');
  const [openVets, setOpenVets] = useState(true);
  const [openClinics, setOpenClinics] = useState(false);
  const [showNewVet, setShowNewVet] = useState(false);
  const [showNewClinic, setShowNewClinic] = useState(false);

  useEffect(() => {
    setTrusted(readTrustedProviders(petId));
  }, [petId]);

  const inferred = useMemo(() => {
    const vetsMap = new Map();
    const clinicsMap = new Map();

    [...healthRecords, ...treatments].forEach((record) => {
      const vetName = normalize(record?.veterinarian);
      const clinicName = normalize(record?.clinicName);

      if (vetName) {
        const key = keyify(vetName);
        const prev = vetsMap.get(key) || {};
        vetsMap.set(key, {
          id: key,
          name: vetName,
          clinicName: clinicName || prev.clinicName || '',
          clinicPhone: normalize(record?.clinicPhone) || prev.clinicPhone || '',
          clinicAddress: normalize(record?.clinicAddress) || prev.clinicAddress || '',
          notes: prev.notes || '',
          source: 'history',
          catFriendlyEligible: true,
        });
      }

      if (clinicName) {
        const key = keyify(clinicName);
        const prev = clinicsMap.get(key) || {};
        clinicsMap.set(key, {
          id: key,
          name: clinicName,
          phone: normalize(record?.clinicPhone) || prev.phone || '',
          address: normalize(record?.clinicAddress) || prev.address || '',
          notes: prev.notes || '',
          source: 'history',
          catFriendlyEligible: true,
        });
      }
    });

    return {
      vets: [...vetsMap.values()],
      clinics: [...clinicsMap.values()],
    };
  }, [healthRecords, treatments]);

  const merged = useMemo(() => {
    const mergeUnique = (primary, secondary, key) => {
      const map = new Map();

      [...primary, ...secondary].forEach((item) => {
        const k = keyify(item?.[key]);
        if (!k) return;

        if (!map.has(k)) {
          map.set(k, item);
        } else {
          map.set(k, { ...map.get(k), ...item });
        }
      });

      return [...map.values()];
    };

    return {
      vets: mergeUnique(trusted.vets, inferred.vets, 'name'),
      clinics: mergeUnique(trusted.clinics, inferred.clinics, 'name'),
    };
  }, [trusted, inferred]);

  const filtered = useMemo(() => {
    const q = keyify(search);
    if (!q) return merged;

    const filterList = (list, fields) =>
      list.filter((item) =>
        fields.some((field) => keyify(item?.[field]).includes(q))
      );

    return {
      vets: filterList(merged.vets, ['name', 'clinicName', 'clinicPhone', 'clinicAddress', 'notes']),
      clinics: filterList(merged.clinics, ['name', 'phone', 'address', 'notes']),
    };
  }, [merged, search]);

  const persistTrusted = (next) => {
    saveTrustedProviders(petId, next);
    setTrusted(readTrustedProviders(petId));
  };

  const handleSaveNewVet = (item) => {
    const next = {
      vets: [item, ...trusted.vets],
      clinics: [...trusted.clinics],
    };
    persistTrusted(next);

    onChange?.({
      veterinarian: item.name || '',
      clinicName: item.clinicName || '',
      clinicPhone: item.clinicPhone || '',
      clinicAddress: item.clinicAddress || '',
    });

    setShowNewVet(false);
    setOpenVets(true);
  };

  const handleSaveNewClinic = (item) => {
    const next = {
      vets: [...trusted.vets],
      clinics: [item, ...trusted.clinics],
    };
    persistTrusted(next);

    onChange?.({
      veterinarian: value?.veterinarian || '',
      clinicName: item.name || '',
      clinicPhone: item.phone || '',
      clinicAddress: item.address || '',
    });

    setShowNewClinic(false);
    setOpenClinics(true);
  };

  const selectVet = (vet) => {
    onChange?.({
      veterinarian: vet.name || '',
      clinicName: vet.clinicName || value?.clinicName || '',
      clinicPhone: vet.clinicPhone || value?.clinicPhone || '',
      clinicAddress: vet.clinicAddress || value?.clinicAddress || '',
    });
  };

  const selectClinic = (clinic) => {
    onChange?.({
      veterinarian: value?.veterinarian || '',
      clinicName: clinic.name || '',
      clinicPhone: clinic.phone || '',
      clinicAddress: clinic.address || '',
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[28px] bg-white border border-gray-50 shadow-sm p-5">
        <SectionTitle
          icon={HeartHandshake}
          title="Base de confiança"
          subtitle="Selecione contatos do histórico ou cadastre novos para reutilizar."
        />

        <div className="flex items-center gap-2 px-3 py-3 rounded-2xl bg-[#FAFAFD] border border-gray-100">
          <Search size={14} className="text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clínica, vet, telefone..."
            className="w-full bg-transparent outline-none text-sm font-bold text-gray-700 placeholder-gray-300"
          />
        </div>

        <div className="rounded-[20px] mt-3 p-4 border border-[#DFFF4050]" style={{ background: '#FAFFE8' }}>
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="text-[#5A7000] mt-0.5" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-[#5A7000]">
                Futuro guia veterinário
              </p>
              <p className="text-[11px] font-bold text-[#657411] mt-1 leading-relaxed">
                Essa base já prepara a futura Rede CatFriendly GATEDO e a camada B2B com clínicas e veterinários indicados pelo tutor.
              </p>
            </div>
          </div>
        </div>

        {/* VETS */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpenVets((s) => !s)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <UserRound size={14} style={{ color: C.purple }} />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Veterinários
              </p>
              <SmallBadge>{filtered.vets.length}</SmallBadge>
            </div>
            {openVets ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
          </button>

          <AnimatePresence>
            {openVets && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-3">
                  {filtered.vets.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-gray-200 p-4 text-center">
                      <p className="text-[11px] font-bold text-gray-400">
                        Nenhum veterinário encontrado ainda.
                      </p>
                    </div>
                  ) : (
                    filtered.vets.map((vet) => (
                      <ProviderCard
                        key={vet.id || vet.name}
                        type="vet"
                        item={vet}
                        selected={keyify(value?.veterinarian) === keyify(vet.name)}
                        onSelect={selectVet}
                      />
                    ))
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowNewVet((s) => !s);
                      if (!showNewVet) setShowNewClinic(false);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-black border border-dashed border-gray-200 text-gray-600 bg-[#FCFCFF]"
                  >
                    <Plus size={14} />
                    Novo veterinário
                  </button>

                  <AnimatePresence>
                    {showNewVet ? (
                      <QuickCreateCard
                        petId={petId}
                        mode="vet"
                        initialClinicName={value?.clinicName || ''}
                        onSave={handleSaveNewVet}
                        onCancel={() => setShowNewVet(false)}
                      />
                    ) : null}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CLINICS */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpenClinics((s) => !s)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 size={14} style={{ color: C.purple }} />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Clínicas
              </p>
              <SmallBadge>{filtered.clinics.length}</SmallBadge>
            </div>
            {openClinics ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
          </button>

          <AnimatePresence>
            {openClinics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-3">
                  {filtered.clinics.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-gray-200 p-4 text-center">
                      <p className="text-[11px] font-bold text-gray-400">
                        Nenhuma clínica encontrada ainda.
                      </p>
                    </div>
                  ) : (
                    filtered.clinics.map((clinic) => (
                      <ProviderCard
                        key={clinic.id || clinic.name}
                        type="clinic"
                        item={clinic}
                        selected={keyify(value?.clinicName) === keyify(clinic.name)}
                        onSelect={selectClinic}
                      />
                    ))
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowNewClinic((s) => !s);
                      if (!showNewClinic) setShowNewVet(false);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-black border border-dashed border-gray-200 text-gray-600 bg-[#FCFCFF]"
                  >
                    <Plus size={14} />
                    Nova clínica
                  </button>

                  <AnimatePresence>
                    {showNewClinic ? (
                      <QuickCreateCard
                        petId={petId}
                        mode="clinic"
                        onSave={handleSaveNewClinic}
                        onCancel={() => setShowNewClinic(false)}
                      />
                    ) : null}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}