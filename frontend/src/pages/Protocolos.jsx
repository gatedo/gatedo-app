import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Lock, ChevronRight } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', bg: '#F4F3FF' };

export default function Protocolos() {
  const navigate = useNavigate();
  const location = useLocation();
  const touch = useSensory();
  const { user } = useContext(AuthContext);
  const catId = location.state?.catId || null;

  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/content/protocols', { params: { userId: user?.id } })
      .then((r) => setProtocols(Array.isArray(r.data) ? r.data : []))
      .catch(() => setProtocols([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const open = (protocol) => {
    touch('nav');
    navigate(`/protocolos/${protocol.slug}`, { state: { catId } });
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: C.bg }}>
      <div className="px-5 pt-8 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => { touch(); navigate(-1); }}
            className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm"
            style={{ color: C.purple }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">Passo a passo</p>
            <h1 className="text-xl font-black text-gray-900 leading-none mt-1">Protocolos</h1>
          </div>
        </div>

        {loading && <p className="text-center text-[12px] font-medium text-gray-400 py-10">Carregando...</p>}

        {!loading && protocols.length === 0 && (
          <p className="text-center text-[12px] font-medium text-gray-400 py-10">
            Nenhum protocolo disponível ainda.
          </p>
        )}

        <div className="space-y-2.5">
          {protocols.map((p) => (
            <button
              key={p.id}
              onClick={() => open(p)}
              className="w-full text-left bg-white rounded-[22px] p-4 border border-gray-100 shadow-sm flex items-center gap-3"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: p.locked ? '#F3F4F6' : '#F1E9FF' }}
              >
                {p.locked ? <Lock size={18} className="text-gray-400" /> : <ClipboardCheck size={18} style={{ color: C.purple }} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black text-gray-800 truncate">{p.title}</p>
                <p className="text-[11px] font-medium text-gray-400 truncate mt-0.5">
                  {p.locked ? 'Requer selo Founder/Pro' : `${p.totalDays} dias · ${p.summary || ''}`}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
