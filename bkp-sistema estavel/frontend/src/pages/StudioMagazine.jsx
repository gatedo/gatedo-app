import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Layers, Type } from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { catsData } from '../data/cats';

// Templates de Revista
const TEMPLATES = [
    { 
        id: 'vogue', 
        name: 'VOGUE', 
        color: 'text-white', 
        font: 'font-serif',
        title: 'VOGUE',
        headlines: [
            { text: "ÍCONE FASHION", style: "top-32 left-4 text-xl font-bold text-white drop-shadow-md" },
            { text: "A VIDA SECRETA", style: "bottom-32 left-4 text-3xl font-black text-yellow-400 italic drop-shadow-md leading-none" },
            { text: "DOS SACHÊS", style: "bottom-24 left-4 text-3xl font-black text-white italic drop-shadow-md leading-none" },
            { text: "ED. ESPECIAL", style: "top-4 right-4 text-[10px] font-bold bg-red-600 text-white px-2 py-1" }
        ]
    },
    { 
        id: 'time', 
        name: 'TIME', 
        color: 'text-red-600', 
        font: 'font-serif',
        title: 'TIME',
        border: 'border-[12px] border-red-600',
        headlines: [
             { text: "GATO DO ANO", style: "top-28 right-4 text-right text-2xl font-black text-white bg-red-600 px-2" },
             { text: "Como ele dominou", style: "bottom-20 left-4 text-2xl font-bold text-white drop-shadow-lg" },
             { text: "a casa inteira.", style: "bottom-12 left-4 text-2xl font-bold text-white drop-shadow-lg" },
        ]
    },
    { 
        id: 'ng', 
        name: 'NAT GEO', 
        color: 'text-yellow-400', 
        font: 'font-sans',
        title: 'NATIONAL GEOGRAPHIC',
        titleStyle: 'text-xl font-bold bg-black text-yellow-400 px-2 ml-4 mt-4 inline-block',
        border: 'border-[12px] border-yellow-400',
        headlines: [
             { text: "O CAÇADOR", style: "bottom-28 left-4 text-4xl font-black text-white drop-shadow-lg" },
             { text: "DE INSETOS", style: "bottom-16 left-4 text-4xl font-black text-white/80 drop-shadow-lg" },
        ]
    }
];

export default function StudioMagazine() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [selectedCat, setSelectedCat] = useState(catsData[0]);
  const [template, setTemplate] = useState(TEMPLATES[0]);

  return (
    <div className="min-h-screen bg-[#13131f] pb-32 pt-6 px-5 font-sans text-white">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white/10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="text-xl font-black">Capa de Revista</h1>
            <p className="text-xs text-gray-400">Seu gato na banca de jornal.</p>
        </div>
      </div>

      {/* --- PREVIEW DA CAPA --- */}
      <div className="flex justify-center mb-6">
        <motion.div 
            key={`${selectedCat.id}-${template.id}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-sm aspect-[3/4] relative overflow-hidden shadow-2xl bg-gray-800 ${template.border || ''}`}
        >
            {/* Foto de Fundo */}
            <img src={selectedCat.image} className="w-full h-full object-cover" />
            
            {/* Overlay Sutil */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

            {/* Título da Revista (Atrás da cabeça se usássemos recorte IA, mas aqui é simples) */}
            {template.titleStyle ? (
                <h1 className={`absolute top-0 left-0 ${template.titleStyle}`}>{template.title}</h1>
            ) : (
                <h1 className={`absolute top-4 w-full text-center text-[5rem] font-black leading-none tracking-tighter drop-shadow-lg ${template.color} ${template.font}`}>
                    {template.title}
                </h1>
            )}

            {/* Manchetes */}
            {template.headlines.map((line, i) => (
                <p key={i} className={`absolute ${line.style}`}>
                    {line.text}
                </p>
            ))}

            {/* Nome do Gato (Dinâmico) */}
            <p className="absolute bottom-4 right-4 text-xs font-bold text-white/80 uppercase tracking-widest drop-shadow-md">
                MODELO: {selectedCat.name}
            </p>

        </motion.div>
      </div>

      {/* --- CONTROLES --- */}
      <div className="space-y-6">
          
          {/* Seletor de Modelo */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 mb-3 ml-1 uppercase">1. O Modelo</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {catsData.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => { touch(); setSelectedCat(cat); }}
                        className={`w-12 h-12 rounded-full border-2 p-0.5 transition-all ${selectedCat.id === cat.id ? 'border-[#ebfc66]' : 'border-transparent opacity-50'}`}
                    >
                        <img src={cat.image} className="w-full h-full rounded-full object-cover" />
                    </button>
                ))}
            </div>
          </div>

          {/* Seletor de Revista */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 mb-3 ml-1 uppercase">2. A Revista</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {TEMPLATES.map(temp => (
                    <button 
                        key={temp.id}
                        onClick={() => { touch(); setTemplate(temp); }}
                        className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                            template.id === temp.id ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600'
                        }`}
                    >
                        {temp.name}
                    </button>
                ))}
            </div>
          </div>

          {/* Botão Salvar */}
          <button className="w-full bg-[#ebfc66] text-[#13131f] py-4 rounded-[24px] font-black text-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg">
                <Download size={20} /> Imprimir Capa
          </button>
      </div>

    </div>
  );
}