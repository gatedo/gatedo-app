import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ExternalLink, Search } from 'lucide-react';
import api from '../services/api';

export default function FolderList() {
  const { id, folderId } = useParams();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        // Busca os registros de saúde do tipo específico que tenham anexos
        const response = await api.get(`/pets/${id}/health-records?folder=${folderId}`);
        setDocs(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [id, folderId]);

  return (
    <div className="min-h-screen bg-[#F8F9FE] px-6 pt-12 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black uppercase text-gray-800 tracking-tighter">Pasta {folderId}</h1>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center font-black text-gray-300 uppercase py-20">Buscando arquivos...</p>
        ) : docs.length > 0 ? (
          docs.map((doc, idx) => (
            <div key={idx} className="bg-white p-5 rounded-[28px] border border-gray-50 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                <FileText size={22} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-gray-800 uppercase leading-none">{doc.title}</p>
                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase italic">{new Date(doc.date).toLocaleDateString('pt-BR')}</p>
              </div>
              <button className="p-3 bg-gray-50 rounded-xl text-gray-400">
                <ExternalLink size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-20">
            <Search size={48} className="mx-auto mb-4" />
            <p className="text-xs font-black uppercase">Nenhum documento aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}