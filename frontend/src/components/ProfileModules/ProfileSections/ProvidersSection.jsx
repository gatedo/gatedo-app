import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Building2,
  Stethoscope,
  Phone,
  MapPin,
  Plus,
  HeartHandshake,
  Star,
  Search,
  X,
  CheckCircle2,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

function normalizeText(value = "") {
  return String(value || "").trim();
}

function normalizeKey(value = "") {
  return normalizeText(value).toLowerCase();
}

function fmtDate(date) {
  if (!date) return "Sem data";
  try {
    return new Date(date).toLocaleDateString("pt-BR");
  } catch {
    return "Sem data";
  }
}

function sortByLastDate(items = []) {
  return [...items].sort((a, b) => {
    const da = a.lastDate ? new Date(a.lastDate).getTime() : 0;
    const db = b.lastDate ? new Date(b.lastDate).getTime() : 0;
    return db - da;
  });
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
          <Icon size={16} className="text-gray-700" />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-gray-500 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProviderCard({
  item,
  type,
  onSelect,
  selected = false,
  showRecommend = true,
  onRecommend,
}) {
  const isVet = type === "vet";

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-black text-gray-900 break-words">
              {item.name}
            </h4>

            {item.isTrusted && (
              <Pill className="bg-emerald-50 text-emerald-700">
                <Star size={10} />
                confiança
              </Pill>
            )}

            {selected && (
              <Pill className="bg-black text-white">
                <CheckCircle2 size={10} />
                selecionado
              </Pill>
            )}
          </div>

          {isVet && item.clinicName && (
            <p className="text-[11px] text-gray-500 font-semibold mt-1">
              Clínica: {item.clinicName}
            </p>
          )}

          {!isVet && item.address && (
            <p className="text-[11px] text-gray-500 font-semibold mt-1">
              {item.address}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect?.(item)}
          className="shrink-0 px-3 py-2 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-wide hover:opacity-90 transition"
        >
          usar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.phone ? (
          <Pill className="bg-gray-100 text-gray-700">
            <Phone size={10} />
            {item.phone}
          </Pill>
        ) : null}

        {item.city ? (
          <Pill className="bg-gray-100 text-gray-700">
            <MapPin size={10} />
            {item.city}
          </Pill>
        ) : null}

        {typeof item.totalVisits === "number" ? (
          <Pill className="bg-amber-50 text-amber-700">
            {item.totalVisits} atendimento{item.totalVisits === 1 ? "" : "s"}
          </Pill>
        ) : null}

        {item.lastDate ? (
          <Pill className="bg-sky-50 text-sky-700">
            último em {fmtDate(item.lastDate)}
          </Pill>
        ) : null}
      </div>

      {item.notes ? (
        <div className="text-[11px] text-gray-500 bg-gray-50 rounded-2xl p-3">
          {item.notes}
        </div>
      ) : null}

      {showRecommend && (
        <button
          type="button"
          onClick={() => onRecommend?.(item, type)}
          className="w-full rounded-2xl border border-rose-100 bg-rose-50 text-rose-700 py-2 text-[10px] font-black uppercase tracking-wide hover:bg-rose-100 transition flex items-center justify-center gap-2"
        >
          <HeartHandshake size={12} />
          indicar para rede catfriendly
        </button>
      )}
    </div>
  );
}

function QuickAddForm({
  mode,
  onCancel,
  onSave,
  saving = false,
  defaultClinicName = "",
}) {
  const isVet = mode === "vet";

  const [form, setForm] = useState({
    name: "",
    specialty: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    clinicName: defaultClinicName || "",
    notes: "",
    isTrusted: true,
  });

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    if (!normalizeText(form.name)) return;
    onSave?.({
      ...form,
      type: mode,
      name: normalizeText(form.name),
      specialty: normalizeText(form.specialty),
      phone: normalizeText(form.phone),
      whatsapp: normalizeText(form.whatsapp),
      address: normalizeText(form.address),
      city: normalizeText(form.city),
      clinicName: normalizeText(form.clinicName),
      notes: normalizeText(form.notes),
    });
  }

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-gray-900 uppercase">
            {isVet ? "novo veterinário" : "nova clínica"}
          </h4>
          <p className="text-[11px] text-gray-500">
            Cadastro rápido para reutilizar no prontuário.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-gray-50 rounded-[22px] p-4">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
            {isVet ? "Nome do veterinário" : "Nome da clínica"}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder-gray-300"
            placeholder={isVet ? "Ex.: Dra. Ana Paula" : "Ex.: Clínica Gato Feliz"}
          />
        </div>

        {isVet && (
          <div className="bg-gray-50 rounded-[22px] p-4">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Especialidade
            </label>
            <input
              type="text"
              value={form.specialty}
              onChange={(e) => set("specialty", e.target.value)}
              className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder-gray-300"
              placeholder="Felinos, clínico geral, dermatologia..."
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-[22px] p-4">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Telefone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 placeholder-gray-300"
              placeholder="(00) 0000-0000"
            />
          </div>

          <div className="bg-gray-50 rounded-[22px] p-4">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              WhatsApp
            </label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 placeholder-gray-300"
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        {isVet && (
          <div className="bg-gray-50 rounded-[22px] p-4">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Clínica vinculada
            </label>
            <input
              type="text"
              value={form.clinicName}
              onChange={(e) => set("clinicName", e.target.value)}
              className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder-gray-300"
              placeholder="Ex.: Clínica Gato Feliz"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-[22px] p-4">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Cidade / Bairro
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 placeholder-gray-300"
              placeholder="Cidade / Bairro"
            />
          </div>

          <div className="bg-gray-50 rounded-[22px] p-4">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Endereço
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full bg-transparent outline-none text-xs font-bold text-gray-800 placeholder-gray-300"
              placeholder="Rua / referência"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-[22px] p-4">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
            Observações
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full bg-transparent outline-none text-xs font-semibold text-gray-700 placeholder-gray-300 resize-none"
            placeholder="Atende bem felinos, emergência 24h, tutor confia..."
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-[22px] bg-gray-100 text-gray-700 text-[11px] font-black uppercase tracking-wide hover:bg-gray-200 transition"
        >
          cancelar
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex-1 py-3 rounded-[22px] bg-gray-900 text-white text-[11px] font-black uppercase tracking-wide hover:opacity-90 transition disabled:opacity-60"
        >
          {saving ? "salvando..." : "salvar contato"}
        </button>
      </div>
    </div>
  );
}

export default function ProvidersSection({
  cat,
  healthRecords = [],
  treatments = [],
  onSelectVet,
  onSelectClinic,
  compact = false,
}) {
  const [loading, setLoading] = useState(false);
  const [trustedVets, setTrustedVets] = useState([]);
  const [trustedClinics, setTrustedClinics] = useState([]);
  const [showAddVet, setShowAddVet] = useState(false);
  const [showAddClinic, setShowAddClinic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVetId, setSelectedVetId] = useState(null);
  const [selectedClinicId, setSelectedClinicId] = useState(null);

  const catId = cat?.id || cat?._id || null;

  useEffect(() => {
    loadTrustedProviders();
  }, [catId]);

  async function loadTrustedProviders() {
    if (!catId) return;

    try {
      setLoading(true);

      // Ajustado para falhar sem quebrar caso o endpoint ainda não exista.
      const [vetsRes, clinicsRes] = await Promise.allSettled([
        axios.get(`${API}/trusted-vets/pet/${catId}`),
        axios.get(`${API}/trusted-clinics/pet/${catId}`),
      ]);

      if (vetsRes.status === "fulfilled") {
        setTrustedVets(vetsRes.value?.data || []);
      }

      if (clinicsRes.status === "fulfilled") {
        setTrustedClinics(clinicsRes.value?.data || []);
      }
    } catch (error) {
      console.warn("Providers persistentes ainda não disponíveis no backend.");
    } finally {
      setLoading(false);
    }
  }

  async function saveTrustedProvider(payload) {
    try {
      setSaving(true);

      const endpoint =
        payload.type === "vet"
          ? `${API}/trusted-vets`
          : `${API}/trusted-clinics`;

      const body = {
        ...payload,
        petId: catId,
      };

      const { data } = await axios.post(endpoint, body);

      if (payload.type === "vet") {
        setTrustedVets((prev) => sortByLastDate([{ ...data, isTrusted: true }, ...prev]));
        setShowAddVet(false);
      } else {
        setTrustedClinics((prev) =>
          sortByLastDate([{ ...data, isTrusted: true }, ...prev])
        );
        setShowAddClinic(false);
      }
    } catch (error) {
      // fallback suave: salva localmente em memória se backend ainda não tiver endpoint
      const mock = {
        id: `local-${Date.now()}`,
        ...payload,
        petId: catId,
        totalVisits: 0,
        lastDate: null,
        isTrusted: true,
      };

      if (payload.type === "vet") {
        setTrustedVets((prev) => sortByLastDate([mock, ...prev]));
        setShowAddVet(false);
      } else {
        setTrustedClinics((prev) => sortByLastDate([mock, ...prev]));
        setShowAddClinic(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function recommendToNetwork(item, type) {
    // Gancho futuro para Rede do Bem / CatFriendly / B2B.
    console.log("INDICAR PARA REDE", { item, type, catId });
    alert(
      `${
        type === "vet" ? "Veterinário" : "Clínica"
      } marcado para futura indicação na Rede CatFriendly GATEDO.`
    );
  }

  const derivedClinics = useMemo(() => {
    const map = new Map();

    [...healthRecords, ...treatments].forEach((entry) => {
      const name = normalizeText(entry?.clinicName);
      if (!name) return;

      const key = normalizeKey(name);
      const current = map.get(key) || {
        id: key,
        name,
        phone: normalizeText(entry?.clinicPhone),
        address: normalizeText(entry?.clinicAddress),
        city: normalizeText(entry?.clinicAddress),
        totalVisits: 0,
        lastDate: null,
        notes: "",
        isTrusted: false,
        source: "derived",
      };

      current.totalVisits += 1;

      if (!current.phone && entry?.clinicPhone) {
        current.phone = normalizeText(entry.clinicPhone);
      }

      if (!current.address && entry?.clinicAddress) {
        current.address = normalizeText(entry.clinicAddress);
      }

      if (!current.lastDate || new Date(entry?.date || 0) > new Date(current.lastDate || 0)) {
        current.lastDate = entry?.date || current.lastDate;
      }

      map.set(key, current);
    });

    return sortByLastDate(Array.from(map.values()));
  }, [healthRecords, treatments]);

  const derivedVets = useMemo(() => {
    const map = new Map();

    [...healthRecords, ...treatments].forEach((entry) => {
      const name = normalizeText(entry?.veterinarian);
      if (!name) return;

      const key = normalizeKey(name);
      const current = map.get(key) || {
        id: key,
        name,
        clinicName: normalizeText(entry?.clinicName),
        phone: normalizeText(entry?.clinicPhone),
        city: normalizeText(entry?.clinicAddress),
        specialty: "",
        totalVisits: 0,
        lastDate: null,
        notes: "",
        isTrusted: false,
        source: "derived",
      };

      current.totalVisits += 1;

      if (!current.clinicName && entry?.clinicName) {
        current.clinicName = normalizeText(entry.clinicName);
      }

      if (!current.phone && entry?.clinicPhone) {
        current.phone = normalizeText(entry.clinicPhone);
      }

      if (!current.lastDate || new Date(entry?.date || 0) > new Date(current.lastDate || 0)) {
        current.lastDate = entry?.date || current.lastDate;
      }

      map.set(key, current);
    });

    return sortByLastDate(Array.from(map.values()));
  }, [healthRecords, treatments]);

  const mergedClinics = useMemo(() => {
    const map = new Map();

    [...derivedClinics, ...trustedClinics].forEach((item) => {
      const key = normalizeKey(item?.name);
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          ...item,
          isTrusted: !!item?.isTrusted,
        });
        return;
      }

      const current = map.get(key);
      map.set(key, {
        ...current,
        ...item,
        totalVisits: Math.max(current.totalVisits || 0, item.totalVisits || 0),
        lastDate:
          new Date(item.lastDate || 0) > new Date(current.lastDate || 0)
            ? item.lastDate
            : current.lastDate,
        isTrusted: current.isTrusted || !!item?.isTrusted,
      });
    });

    return sortByLastDate(Array.from(map.values()));
  }, [derivedClinics, trustedClinics]);

  const mergedVets = useMemo(() => {
    const map = new Map();

    [...derivedVets, ...trustedVets].forEach((item) => {
      const key = normalizeKey(item?.name);
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          ...item,
          isTrusted: !!item?.isTrusted,
        });
        return;
      }

      const current = map.get(key);
      map.set(key, {
        ...current,
        ...item,
        totalVisits: Math.max(current.totalVisits || 0, item.totalVisits || 0),
        lastDate:
          new Date(item.lastDate || 0) > new Date(current.lastDate || 0)
            ? item.lastDate
            : current.lastDate,
        isTrusted: current.isTrusted || !!item?.isTrusted,
      });
    });

    return sortByLastDate(Array.from(map.values()));
  }, [derivedVets, trustedVets]);

  const query = normalizeKey(search);

  const filteredClinics = useMemo(() => {
    if (!query) return mergedClinics;
    return mergedClinics.filter((item) =>
      [item.name, item.phone, item.address, item.city].some((v) =>
        normalizeKey(v).includes(query)
      )
    );
  }, [mergedClinics, query]);

  const filteredVets = useMemo(() => {
    if (!query) return mergedVets;
    return mergedVets.filter((item) =>
      [item.name, item.phone, item.clinicName, item.specialty].some((v) =>
        normalizeKey(v).includes(query)
      )
    );
  }, [mergedVets, query]);

  function handleSelectVet(vet) {
    setSelectedVetId(vet.id);
    onSelectVet?.(vet);
  }

  function handleSelectClinic(clinic) {
    setSelectedClinicId(clinic.id);
    onSelectClinic?.(clinic);
  }

  return (
    <section className={compact ? "space-y-4" : "space-y-5"}>
      <SectionTitle
        icon={HeartHandshake}
        title="clínicas e veterinários"
        subtitle="Base de confiança + atendimentos recorrentes do prontuário."
      />

      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Search size={16} className="text-gray-500" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-800 placeholder-gray-300"
            placeholder="Buscar clínica, veterinário, telefone..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setShowAddVet((prev) => !prev);
            setShowAddClinic(false);
          }}
          className="bg-white rounded-[24px] border border-gray-100 shadow-sm px-4 py-4 hover:shadow-md transition flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wide text-gray-800"
        >
          <Plus size={14} />
          veterinário
        </button>

        <button
          type="button"
          onClick={() => {
            setShowAddClinic((prev) => !prev);
            setShowAddVet(false);
          }}
          className="bg-white rounded-[24px] border border-gray-100 shadow-sm px-4 py-4 hover:shadow-md transition flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wide text-gray-800"
        >
          <Plus size={14} />
          clínica
        </button>
      </div>

      {showAddVet && (
        <QuickAddForm
          mode="vet"
          onCancel={() => setShowAddVet(false)}
          onSave={saveTrustedProvider}
          saving={saving}
        />
      )}

      {showAddClinic && (
        <QuickAddForm
          mode="clinic"
          onCancel={() => setShowAddClinic(false)}
          onSave={saveTrustedProvider}
          saving={saving}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <Building2 size={15} className="text-gray-700" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wide text-gray-800">
                clínicas
              </h4>
              <p className="text-[11px] text-gray-500">
                {filteredClinics.length} encontrada{filteredClinics.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {filteredClinics.length ? (
          <div className="space-y-3">
            {filteredClinics.map((clinic) => (
              <ProviderCard
                key={`clinic-${clinic.id}`}
                item={clinic}
                type="clinic"
                selected={selectedClinicId === clinic.id}
                onSelect={handleSelectClinic}
                onRecommend={recommendToNetwork}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-dashed border-gray-200 p-5 text-center text-[11px] text-gray-500 font-semibold">
            Nenhuma clínica cadastrada ou detectada no histórico.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <Stethoscope size={15} className="text-gray-700" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wide text-gray-800">
                veterinários
              </h4>
              <p className="text-[11px] text-gray-500">
                {filteredVets.length} encontrado{filteredVets.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {filteredVets.length ? (
          <div className="space-y-3">
            {filteredVets.map((vet) => (
              <ProviderCard
                key={`vet-${vet.id}`}
                item={vet}
                type="vet"
                selected={selectedVetId === vet.id}
                onSelect={handleSelectVet}
                onRecommend={recommendToNetwork}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-dashed border-gray-200 p-5 text-center text-[11px] text-gray-500 font-semibold">
            Nenhum veterinário cadastrado ou detectado no histórico.
          </div>
        )}
      </div>

      {loading && (
        <div className="text-[11px] text-gray-400 font-semibold">
          carregando base de confiança...
        </div>
      )}
    </section>
  );
}