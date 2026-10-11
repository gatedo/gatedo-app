import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { X, Phone, MapPin, CalendarClock, FileText, ChevronRight, Stethoscope, Pill } from 'lucide-react';
import { formatRecordDate } from '../../../utils/dates';

function Block({ label, children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-50 border-gray-100',
    amber: 'bg-amber-50 border-amber-100',
    purple: 'bg-[#FCFCFF] border-[#8B4AFF14]',
  };
  return (
    <div className={`rounded-2xl border p-3.5 ${tones[tone]}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400 mb-1.5">{label}</p>
      <div className="text-[13px] leading-relaxed text-gray-700">{children}</div>
    </div>
  );
}

// Resumo de um registro clínico (consulta, vacina, medicação...) com os
// documentos que nasceram dele (prontuário em PDF, receita).
export default function HealthRecordModal({ record, meta, documents = [], onClose, onOpenDoc }) {
  useEffect(() => {
    if (!record) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [record]);

  if (!record) return null;

  const Icon = meta?.icon || Stethoscope;
  const linkedDocs = documents.filter((d) => d?.metadata?.linkedHealthRecordId === record.id);
  const recommendations = Array.isArray(record.recommendations) ? record.recommendations.filter(Boolean) : [];
  const professional = [record.veterinarian, record.clinicName].filter(Boolean).join(' · ');
  const nextCare = record.recommendedRecheck && record.recheckDate
    ? `Reconsulta recomendada em ${formatRecordDate(record.recheckDate)}`
    : record.nextDueDate ? `Próxima dose/aplicação em ${formatRecordDate(record.nextDueDate)}` : null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" style={{ zIndex: 10000 }} onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-start gap-3 border-b border-gray-50">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: meta?.toneBg }}>
            <Icon size={18} style={{ color: meta?.toneText }} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: meta?.toneBg, color: meta?.toneText }}>
              {meta?.label || 'Registro'}
            </span>
            <p className="text-[16px] font-black text-gray-900 leading-tight mt-1">{record.title || meta?.label}</p>
            <p className="text-[12px] font-bold text-gray-400 mt-0.5">
              {formatRecordDate(record.date, { day: '2-digit', month: 'long', year: 'numeric' })}
              {professional ? ` · ${professional}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {(record.reason || record.specialty || record.appointmentMode) ? (
            <Block label="Contexto">
              {record.reason ? <p><b>Motivo:</b> {record.reason}</p> : null}
              {record.specialty ? <p><b>Especialidade:</b> {record.specialty}</p> : null}
              {record.appointmentMode ? <p><b>Atendimento:</b> {record.appointmentMode === 'specialist' ? 'Especialista' : 'Clínico geral'}</p> : null}
            </Block>
          ) : null}

          {record.notes ? (
            <Block label="Anotações">
              <p className="whitespace-pre-line">{record.notes}</p>
            </Block>
          ) : null}

          {recommendations.length ? (
            <Block label="Recomendações">
              <ul className="list-disc pl-5 space-y-1">{recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </Block>
          ) : null}

          {(record.prescribedMedicationName || record.ongoing) ? (
            <Block label="Tratamento">
              <p className="flex items-center gap-1.5"><Pill size={13} className="text-amber-600" /> {record.prescribedMedicationName || record.title}{record.ongoing ? ' · contínuo' : ''}</p>
            </Block>
          ) : null}

          {nextCare ? (
            <Block label="Próximo cuidado" tone="amber">
              <p className="flex items-center gap-1.5 font-bold text-amber-700"><CalendarClock size={13} /> {nextCare}</p>
            </Block>
          ) : null}

          {(record.clinicName || record.clinicPhone || record.clinicAddress) ? (
            <Block label="Onde foi" tone="purple">
              {record.clinicName ? <p className="font-black text-gray-800">{record.clinicName}</p> : null}
              {record.clinicPhone ? (
                <a href={`tel:${String(record.clinicPhone).replace(/[^\d+]/g, '')}`} className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-[#8B4AFF]">
                  <Phone size={12} /> {record.clinicPhone}
                </a>
              ) : null}
              {record.clinicAddress ? (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(record.clinicAddress)}`} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-gray-500">
                  <MapPin size={12} /> {record.clinicAddress}
                </a>
              ) : null}
            </Block>
          ) : null}

          {linkedDocs.length ? (
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400 mb-2 px-1">Documentos deste atendimento</p>
              <div className="space-y-2">
                {linkedDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => onOpenDoc?.(doc)}
                    disabled={doc.fileMissing}
                    className="w-full flex items-center gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm px-3.5 py-3 text-left disabled:opacity-50"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#F4F3FF] text-[#8B4AFF] flex items-center justify-center flex-shrink-0">
                      <FileText size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-gray-800 truncate">{doc.title}</p>
                      <p className="text-[10px] font-bold text-gray-400">{doc.fileMissing ? 'Arquivo indisponível' : 'Toque para ver'}</p>
                    </div>
                    <ChevronRight size={15} className="text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
