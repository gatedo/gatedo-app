import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartHandshake, Heart, MapPin, ExternalLink, PawPrint, Plus } from 'lucide-react';
import useSensory from '../hooks/useSensory';

const ONGS = [
  { id: 1, name: "Adote um Gatinho", location: "São Paulo, SP", focus: "Resgate e Adoção", img: "https://images.unsplash.com/photo-1548546738-8509cb246ed3?auto=format&fit=crop&w=100&q=80" },
  { id: 2, name: "Gatos do Parque", location: "Rio de Janeiro, RJ", focus: "Castração e CED", img: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=100&q=80" },
];

const ADOPTION = [
  { id: 1, name: "Mingau", age: "3 meses", gender: "Macho", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80" },
  { id: 2, name: "Luna", age: "2 anos", gender: "Fêmea", img: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80" },
];

export default function Ongs() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [activeTab, setActiveTab] = useState('ongs');

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-32 pt-6 px-5 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600 border border-gray-100"><ArrowLeft size={20} /></button>
        <div>
            <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">Adote & <span className="text-pink-500">Ajude</span> <Heart size={20} className="text-pink-500 fill-pink-500" /></h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-[20px] shadow-sm mb-6">
        <button onClick={() => setActiveTab('ongs')} className={`flex-1 py-3 rounded-[16px] text-xs font-black transition-all ${activeTab === 'ongs' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}>Apoiar ONGs</button>
        <button onClick={() => setActiveTab('adotar')} className={`flex-1 py-3 rounded-[16px] text-xs font-black transition-all ${activeTab === 'adotar' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}>Quero Adotar</button>
      </div>

      <AnimatePresence mode='wait'>
        {activeTab === 'ongs' ? (
            <motion.div key="ongs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Botão Indicar */}
                <button className="w-full py-4 border-2 border-dashed border-pink-200 rounded-[24px] text-pink-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors">
                    <Plus size={16} /> Indicar uma ONG
                </button>

                {ONGS.map(ong => (
                    <div key={ong.id} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex gap-4">
                        <img src={ong.img} className="w-16 h-16 rounded-[18px] object-cover" />
                        <div className="flex-1">
                            <h3 className="font-black text-gray-800">{ong.name}</h3>
                            <p className="text-xs text-gray-500">{ong.focus}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin size={10} /> {ong.location}</span>
                                <button className="text-[10px] font-black text-pink-500 flex items-center gap-1 bg-pink-50 px-2 py-1 rounded-full"><HeartHandshake size={10} /> Doar</button>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
        ) : (
            <motion.div key="adoption" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
                {ADOPTION.map(cat => (
                    <div key={cat.id} className="bg-white p-3 rounded-[24px] shadow-sm border border-gray-100">
                        <div className="aspect-square rounded-[18px] overflow-hidden mb-3 relative">
                            <img src={cat.img} className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-black text-gray-700">
                                {cat.age}
                            </div>
                        </div>
                        <h3 className="font-black text-gray-800 text-sm">{cat.name}</h3>
                        <p className="text-[10px] text-gray-400 mb-2">{cat.gender}</p>
                        <button className="w-full py-2 bg-pink-500 text-white rounded-xl text-xs font-bold">Quero Adotar</button>
                    </div>
                ))}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}