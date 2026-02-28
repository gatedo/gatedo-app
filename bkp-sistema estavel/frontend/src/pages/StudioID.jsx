import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, PawPrint, QrCode } from 'lucide-react';
import useSensory from '../hooks/useSensory';

// Importa seus gatos
import { catsData } from '../data/cats';

export default function StudioID() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [selectedCat, setSelectedCat] = useState(catsData[0]); // Seleciona o primeiro por padrão

  return (
    <div className="min-h-screen bg-[#13131f] pb-32 pt-6 px-5 font-sans text-white">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white/10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="text-xl font-black">RG Pet Oficial</h1>
            <p className="text-xs text-gray-400">Documento de fofura registrado.</p>
        </div>
      </div>

      {/* --- ÁREA DO DOCUMENTO (Preview) --- */}
      <div className="flex justify-center mb-8">
        <motion.div 
            key={selectedCat.id}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-full max-w-sm aspect-[1.58/1] bg-gradient-to-br from-green-400 to-teal-600 rounded-[24px] p-4 shadow-2xl relative overflow-hidden border-2 border-white/20"
        >
            {/* Marca D'água de Fundo */}
            <PawPrint className="absolute -right-10 -bottom-10 text-white opacity-10 w-48 h-48 rotate-12" />
            
            {/* Cabeçalho do RG */}
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                        <img src="/logo-full.png" className="w-6 opacity-80" alt="" /> {/* Placeholder logo */}
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-white uppercase leading-none">República Federativa</h3>
                        <h2 className="text-xs font-black text-white uppercase tracking-wider">DO GATEDO</h2>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-bold text-green-100 uppercase">Válido em todo</p>
                    <p className="text-[8px] font-bold text-green-100 uppercase">Território Nacional</p>
                </div>
            </div>

            {/* Conteúdo do RG */}
            <div className="flex gap-4 relative z-10">
                {/* Foto 3x4 */}
                <div className="w-24 h-32 bg-gray-200 rounded-[12px] border-2 border-white overflow-hidden shadow-sm flex-shrink-0">
                    <img src={selectedCat.image} className="w-full h-full object-cover" />
                </div>

                {/* Dados */}
                <div className="flex-1 space-y-2">
                    <div>
                        <p className="text-[8px] text-green-100 font-bold uppercase">Nome Civil</p>
                        <p className="text-lg font-black text-white leading-none truncate">{selectedCat.name.toUpperCase()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <div>
                            <p className="text-[8px] text-green-100 font-bold uppercase">Raça / Cor</p>
                            <p className="text-[10px] font-bold text-white leading-tight">{selectedCat.breed}</p>
                        </div>
                         <div>
                            <p className="text-[8px] text-green-100 font-bold uppercase">Nascimento</p>
                            <p className="text-[10px] font-bold text-white leading-tight">12/04/2020</p>
                        </div>
                    </div>
                     <div>
                        <p className="text-[8px] text-green-100 font-bold uppercase">Filiação</p>
                        <p className="text-[10px] font-bold text-white leading-tight">Tutor(a) Ana Maria</p>
                    </div>
                </div>
            </div>

            {/* Rodapé (Assinatura e QR) */}
            <div className="mt-3 flex justify-between items-end relative z-10">
                <div className="flex-1 mr-4">
                    <p className="text-[8px] text-green-100 font-bold uppercase mb-1">Assinatura do Portador</p>
                    <div className="h-6 border-b border-white/50 flex items-end pb-1 font-script text-white text-sm opacity-80 italic">
                        {selectedCat.name} 🐾
                    </div>
                </div>
                <div className="bg-white p-1 rounded-md">
                    <QrCode size={24} className="text-black" />
                </div>
            </div>

        </motion.div>
      </div>

      {/* --- SELETOR DE GATO --- */}
      <h3 className="text-sm font-bold text-gray-400 mb-3 ml-1">Selecione o Gato:</h3>
      <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
        {catsData.map(cat => (
            <button 
                key={cat.id}
                onClick={() => { touch(); setSelectedCat(cat); }}
                className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all ${selectedCat.id === cat.id ? 'opacity-100 scale-105' : 'opacity-50'}`}
            >
                <div className={`w-14 h-14 rounded-full p-0.5 ${selectedCat.id === cat.id ? 'border-2 border-green-400' : 'border border-gray-600'}`}>
                    <img src={cat.image} className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="text-[10px] font-bold text-gray-300">{cat.name}</span>
            </button>
        ))}
      </div>

      {/* --- AÇÕES --- */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-[#ebfc66] text-[#13131f] py-4 rounded-[24px] font-black text-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-green-900/20">
            <Download size={20} /> Salvar RG
        </button>
        <button className="bg-white/10 text-white py-4 rounded-[24px] font-black text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
            <Share2 size={20} /> Compartilhar
        </button>
      </div>

    </div>
  );
}