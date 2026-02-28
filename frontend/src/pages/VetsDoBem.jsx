import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Stethoscope, MapPin, Star, Share2, 
  Search, ShieldCheck, Phone, Navigation, Heart
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

// MOCK DATA (Simulando o Banco de Dados)
// Adicionei telefone e coordenadas para os botões funcionarem
const VETS_MOCK = [
  { 
    id: 1, 
    name: "Dr. Ricardo Silva", 
    clinic: "Gatos & Cia", 
    rating: 4.9, 
    reviews: 124,
    dist: "0.8km", 
    img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80", 
    tags: ["Cat Friendly", "Raio-X"],
    isOpen: true,
    isVerified: true,
    phone: "11999999999",
    address: "Rua dos Gatos, 123, São Paulo"
  },
  { 
    id: 2, 
    name: "Clínica 24h VetLife", 
    clinic: "VetLife Hospital", 
    rating: 4.5, 
    reviews: 89,
    dist: "3.2km", 
    img: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=150&q=80", 
    tags: ["24h", "Emergência"],
    isOpen: true,
    isVerified: false,
    phone: "11888888888",
    address: "Av. Veterinária, 500, São Paulo"
  },
];

export default function VetsDoBem() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [filter, setFilter] = useState('todos');

  // --- AÇÕES INTELIGENTES ---
  
  const handleInvite = () => {
    touch();
    if (navigator.share) {
        navigator.share({
            title: 'Gatedo Vets',
            text: 'Olá! Estou usando o Gatedo para cuidar do meu gatinho. Gostaria de te convidar para fazer parte da nossa rede de veterinários!',
            url: 'https://gatedo.com/vets/invite' // Link fictício
        }).catch(console.error);
    } else {
        alert("Link de convite copiado!");
    }
  };

  const handleCall = (e, phone) => {
    e.stopPropagation(); // Não abre o perfil, só liga
    touch();
    window.open(`tel:${phone}`, '_self');
  };

  const handleMaps = (e, address) => {
    e.stopPropagation(); // Não abre o perfil, só mapa
    touch();
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openProfile = (id) => {
      touch();
      navigate(`/vets/${id}`); // Rota para o perfil detalhado (criaremos depois)
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-32 pt-6 px-5 font-sans relative overflow-hidden">
      
      {/* Background Decorativo Suave */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>
      <div className="absolute top-0 left-0 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[#F8F9FE]/90 backdrop-blur-sm z-20 py-2">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600 border border-gray-100 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
                Rede <span className="text-green-600">Vet</span> <ShieldCheck size={20} className="text-green-600" />
            </h1>
            <p className="text-xs text-gray-400 font-bold">Quem cuida dos nossos gatinhos.</p>
        </div>
        <button className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-green-600 border border-green-100 relative hover:scale-105 transition-transform">
            <Heart size={20} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>

      {/* Busca Fixa */}
      <div className="sticky top-16 z-20 space-y-3 bg-[#F8F9FE] pb-2">
        <div className="bg-white p-3 rounded-[20px] shadow-sm flex items-center gap-3 border border-gray-100">
            <Search size={20} className="text-gray-300" />
            <input type="text" placeholder="Buscar clínica, vet ou bairro..." className="flex-1 outline-none text-sm font-bold text-gray-700 placeholder-gray-300 bg-transparent" />
        </div>

        {/* Filtros Horizontais */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['Perto de mim', '24h', 'Cat Friendly', 'Especialistas'].map((tag, i) => (
                <button 
                    key={i} 
                    onClick={() => setFilter(tag)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${filter === tag ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:border-green-200 hover:text-green-600'}`}
                >
                    {tag}
                </button>
            ))}
        </div>
      </div>

      {/* CARD CONVITE (NOVO DESIGN CLEAN) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="mb-6 bg-gradient-to-br from-green-400 to-teal-500 rounded-[24px] p-6 text-white relative overflow-hidden shadow-lg shadow-green-200"
      >
        <div className="relative z-10">
            <h3 className="text-lg font-black mb-1">Seu Vet não está aqui?</h3>
            <p className="text-xs font-medium opacity-90 mb-4 max-w-[85%] leading-relaxed">
                Convide ele para fazer parte da rede Gatedo e ajude outros tutores a encontrarem bons profissionais.
            </p>
            <button 
                onClick={handleInvite}
                className="bg-white text-green-600 px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 hover:scale-105 transition-transform shadow-sm"
            >
                <Share2 size={16} /> Convidar Veterinário
            </button>
        </div>
        {/* Ícone decorativo transparente */}
        <Stethoscope size={120} className="absolute -right-6 -bottom-6 opacity-20 rotate-[-15deg] text-white" />
      </motion.div>

      {/* Lista de Vets */}
      <div className="space-y-4">
        {VETS_MOCK.map((vet) => (
            <motion.div 
                key={vet.id} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => openProfile(vet.id)}
                className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group cursor-pointer"
            >
                {/* Badge Verificado */}
                {vet.isVerified && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-sm">
                        <ShieldCheck size={10} /> VERIFICADO
                    </div>
                )}

                <div className="flex gap-4">
                    {/* Foto com Status */}
                    <div className="relative">
                        <img src={vet.img} alt={vet.name} className="w-20 h-20 rounded-[18px] object-cover border-2 border-white shadow-sm bg-gray-100" />
                        {vet.isOpen && (
                            <div className="absolute -bottom-2 -right-1 bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-white flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Aberto
                            </div>
                        )}
                    </div>

                    <div className="flex-1 pt-1">
                        <h3 className="font-black text-gray-800 text-base leading-tight mb-1">{vet.name}</h3>
                        <p className="text-xs text-gray-500 font-medium mb-2">{vet.clinic}</p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                            {vet.tags.map(tag => (
                                <span key={tag} className="text-[9px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md font-bold border border-gray-100">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Status (Nota e Distância) */}
                        <div className="flex items-center gap-4 border-t border-gray-50 pt-2">
                            <div className="flex items-center gap-1">
                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-black text-gray-700">{vet.rating}</span>
                                <span className="text-[10px] text-gray-400">({vet.reviews})</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <MapPin size={12} />
                                <span className="text-xs font-bold">{vet.dist}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botões de Ação Rápida (Rodapé do Card) */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button 
                        onClick={(e) => handleCall(e, vet.phone)}
                        className="bg-[#6158ca] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:brightness-110 active:scale-95 transition-all"
                    >
                        <Phone size={14} /> Ligar
                    </button>
                    <button 
                        onClick={(e) => handleMaps(e, vet.address)}
                        className="bg-green-50 text-green-600 border border-green-100 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-100 active:scale-95 transition-all"
                    >
                        <Navigation size={14} /> Ir Agora
                    </button>
                </div>
            </motion.div>
        ))}
      </div>
    </div>
  );
}