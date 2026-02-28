import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Volume2, Bell, Smartphone, 
  Trash2, ShieldCheck, Moon, Fingerprint 
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

export default function Settings() {
  const navigate = useNavigate();
  const touch = useSensory();

  // Estados locais para simular as preferências
  const [sounds, setSounds] = useState(true);
  const [notifs, setNotifs] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  const SettingToggle = ({ icon: Icon, label, desc, active, onToggle, color = "#6158ca" }) => (
    <div className="bg-white rounded-[24px] p-5 mb-4 shadow-sm border border-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}10`, color: color }}>
          <Icon size={22} />
        </div>
        <div>
          <p className="font-black text-gray-800 text-sm">{label}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{desc}</p>
        </div>
      </div>
      <button 
        onClick={() => { touch(); onToggle(); }}
        className={`w-12 h-6 rounded-full transition-all relative ${active ? 'bg-[#6158ca]' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FE] px-6 pt-12 pb-32 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => { touch(); navigate(-1); }} className="p-2 bg-white rounded-2xl shadow-sm text-gray-400">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-gray-800">Configurações</h1>
      </div>

      <section className="mb-8">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 ml-2">Experiência</p>
        <SettingToggle 
          icon={Volume2} 
          label="Sons Sensoriais" 
          desc="Miados e cliques suaves" 
          active={sounds} 
          onToggle={() => setSounds(!sounds)} 
        />
        <SettingToggle 
          icon={Bell} 
          label="Notificações" 
          desc="Alertas de saúde e lembretes" 
          active={notifs} 
          onToggle={() => setNotifs(!notifs)} 
          color="#f59e0b"
        />
      </section>

      <section className="mb-8">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 ml-2">Segurança & PWA</p>
        <SettingToggle 
          icon={Fingerprint} 
          label="Acesso Rápido" 
          desc="Biometria ao abrir o App" 
          active={biometrics} 
          onToggle={() => setBiometrics(!biometrics)} 
          color="#2ecc71"
        />
        
        {/* Botão de Limpeza de Cache (Útil para o limbo do PWA) */}
        <button 
          onClick={() => { touch(); alert('Cache limpo!'); window.location.reload(); }}
          className="w-full flex items-center gap-4 p-5 bg-white rounded-[24px] shadow-sm border border-gray-50 text-left active:scale-[0.98] transition-all"
        >
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <Trash2 size={22} />
          </div>
          <div>
            <p className="font-black text-gray-800 text-sm">Limpar Dados do App</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Redefinir arquivos temporários</p>
          </div>
        </button>
      </section>

      <div className="mt-4 p-4 bg-indigo-50 rounded-[24px] flex items-start gap-3">
        <Smartphone size={20} className="text-[#6158ca] mt-0.5" />
        <p className="text-[10px] font-bold text-indigo-400 leading-relaxed uppercase">
          O Gatedo está instalado como PWA. Para garantir que você receba as últimas atualizações, evite limpar os cookies do navegador.
        </p>
      </div>
    </div>
  );
}