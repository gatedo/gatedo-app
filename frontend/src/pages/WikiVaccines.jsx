import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Syringe, Shield, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import useSensory from '../hooks/useSensory';

const PROTOCOL = [
  { 
    title: "1ª Dose Múltipla",
    age: "9 Semanas",
    vaccines: ["V3, V4 ou V5"],
    desc: "Proteção contra Rinotraqueíte, Calicivirose, Panleucopenia. (V4 inclui Clamídia, V5 inclui Leucemia Felina).",
    color: "bg-blue-50 border-blue-200 text-blue-800"
  },
  { 
    title: "2ª Dose Múltipla",
    age: "+ 3 a 4 Semanas",
    vaccines: ["V3, V4 ou V5"],
    desc: "Reforço essencial para garantir a imunidade inicial.",
    color: "bg-blue-50 border-blue-200 text-blue-800"
  },
  { 
    title: "3ª Dose + Antirrábica",
    age: "+ 3 a 4 Semanas",
    vaccines: ["V3, V4 ou V5", "Antirrábica"],
    desc: "Última dose do ciclo inicial e proteção contra a Raiva (obrigatória).",
    color: "bg-indigo-50 border-indigo-200 text-indigo-800"
  },
  { 
    title: "Reforço Semestral (Opcional)",
    age: "6 Meses",
    vaccines: ["V3, V4 ou V5"],
    desc: "Dose adicional recomendada para gatos com alto risco ou conforme orientação vet.",
    color: "bg-purple-50 border-purple-200 text-purple-800"
  },
  { 
    title: "Reforço Anual",
    age: "Todo ano",
    vaccines: ["Múltipla + Antirrábica"],
    desc: "Para manter a proteção ativa por toda a vida.",
    color: "bg-green-50 border-green-200 text-green-800"
  }
];

export default function WikiVaccines() {
  const navigate = useNavigate();
  const touch = useSensory();

  return (
    <div className="min-h-screen bg-[#F2F4F8] pb-10 pt-6 px-5 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
           <h2 className="text-xl font-black text-gray-800 leading-none">Protocolo Vacinal</h2>
           <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wide">Guia Oficial Gatedo</p>
        </div>
      </div>

      {/* Intro Card */}
      <div className="bg-gradient-to-br from-[#6158ca] to-[#8a84e2] p-5 rounded-[24px] text-white shadow-lg shadow-indigo-200 mb-8 relative overflow-hidden">
          <div className="relative z-10">
              <h3 className="font-black text-lg mb-2 flex items-center gap-2"><Shield size={20}/> Imunização Felina</h3>
              <p className="text-sm opacity-90 leading-relaxed">
                  Seguir o calendário rigorosamente é a única forma de prevenir doenças fatais. Consulte sempre seu veterinário.
              </p>
          </div>
          <Syringe size={120} className="absolute -right-6 -bottom-6 opacity-10 rotate-[-15deg]" />
      </div>

      {/* Timeline */}
      <div className="space-y-6 relative">
          {/* Linha Vertical */}
          <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-gray-200 rounded-full" />

          {PROTOCOL.map((step, idx) => (
              <div key={idx} className="relative pl-12">
                  {/* Bolinha da Timeline */}
                  <div className="absolute left-0 top-0 w-10 h-10 bg-white rounded-full border-4 border-[#F2F4F8] flex items-center justify-center shadow-sm z-10">
                      <span className="text-[10px] font-black text-gray-400">{idx + 1}</span>
                  </div>

                  <div className={`p-4 rounded-[20px] border-2 ${step.color} shadow-sm relative`}>
                      <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-sm">{step.title}</h4>
                          <span className="text-[10px] font-bold bg-white/50 px-2 py-1 rounded-lg flex items-center gap-1">
                              <Clock size={10} /> {step.age}
                          </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                          {step.vaccines.map(v => (
                              <span key={v} className="text-[9px] font-black bg-white px-2 py-1 rounded-md uppercase tracking-wide shadow-sm">
                                  {v}
                              </span>
                          ))}
                      </div>

                      <p className="text-xs opacity-80 font-medium leading-snug">
                          {step.desc}
                      </p>
                  </div>
              </div>
          ))}
      </div>

      {/* Alerta FeLV */}
      <div className="mt-8 bg-orange-50 border border-orange-100 p-4 rounded-[20px] flex gap-3">
          <AlertCircle size={24} className="text-orange-500 flex-shrink-0" />
          <div>
              <h4 className="font-bold text-orange-700 text-sm mb-1">Atenção à V5 (FeLV)</h4>
              <p className="text-xs text-orange-600 leading-relaxed">
                  A vacina contra Leucemia Felina (V5) só deve ser aplicada em gatos que testaram <strong>negativo</strong> para a doença. Faça o teste antes!
              </p>
          </div>
      </div>

    </div>
  );
}