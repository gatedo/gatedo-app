import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Phone, MessageCircle, Star, 
  Clock, ShieldCheck, Share2, Heart, Navigation, Calendar 
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

// MOCK DATA (Simulação de Banco de Dados)
const VETS_DB = {
  1: {
    id: 1,
    name: "Dr. Ricardo Silva",
    clinic: "Clínica Gatos & Cia",
    specialty: "Especialista em Felinos",
    rating: 4.9,
    reviews: 124,
    address: "Rua dos Gatos, 123 - Vila Madalena, SP",
    phone: "11999999999",
    whatsapp: "5511999999999",
    about: "Apaixonado por gatos desde criança, o Dr. Ricardo se especializou em medicina felina para oferecer um atendimento sem estresse. Sua clínica possui certificação Cat Friendly Gold.",
    services: ["Consulta", "Vacinação", "Cirurgia", "Exames"],
    img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80",
    cover: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
    isVerified: true,
    isOpen: true
  },
  2: {
    id: 2,
    name: "Dra. Julia Mendes",
    clinic: "VetLife Hospital 24h",
    specialty: "Clínica Geral e Emergência",
    rating: 4.8,
    reviews: 89,
    address: "Av. Veterinária, 500 - Pinheiros, SP",
    phone: "11888888888",
    whatsapp: "5511888888888",
    about: "Atendimento de emergência 24 horas com equipe multidisciplinar. UTI completa e laboratório próprio.",
    services: ["Emergência 24h", "Internação", "Raio-X", "Ultrassom"],
    img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
    cover: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80",
    isVerified: false,
    isOpen: true
  }
};

export default function VetProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const touch = useSensory();
  const [vet, setVet] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Simula busca no banco
    const foundVet = VETS_DB[id];
    if (foundVet) setVet(foundVet);
  }, [id]);

  if (!vet) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando perfil...</div>;

  // AÇÕES
  const handleCall = () => window.open(`tel:${vet.phone}`, '_self');
  const handleZap = () => window.open(`https://wa.me/${vet.whatsapp}`, '_blank');
  const handleMaps = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vet.address)}`, '_blank');
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: vet.name,
        text: `Olha esse vet que achei no Gatedo: ${vet.name}`,
        url: window.location.href
      });
    } else {
      alert("Link copiado!");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-10 font-sans relative">
      
      {/* CAPA + HEADER */}
      <div className="relative h-64 bg-gray-200">
        <img src={vet.cover} className="w-full h-full object-cover" alt="Capa" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60"></div>
        
        {/* Botão Voltar */}
        <button 
            onClick={() => { touch(); navigate(-1); }} 
            className="absolute top-6 left-5 bg-white/20 backdrop-blur-md w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/30 transition-colors border border-white/20"
        >
            <ArrowLeft size={20} />
        </button>

        {/* Ações Topo */}
        <div className="absolute top-6 right-5 flex gap-3">
            <button onClick={handleShare} className="bg-white/20 backdrop-blur-md w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/30 border border-white/20">
                <Share2 size={20} />
            </button>
            <button 
                onClick={() => { touch(); setIsFavorite(!isFavorite); }} 
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors border ${isFavorite ? 'bg-red-500 border-red-500 text-white' : 'bg-white/20 backdrop-blur-md border-white/20 text-white'}`}
            >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (Card Sobreposto) */}
      <div className="relative -mt-16 px-5">
        <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            
            {/* Foto e Status */}
            <div className="flex justify-between items-end mb-4 -mt-16">
                <div className="relative">
                    <img src={vet.img} className="w-24 h-24 rounded-[24px] object-cover border-4 border-white shadow-md bg-white" alt={vet.name} />
                    {vet.isVerified && (
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Verificado">
                            <ShieldCheck size={14} />
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end">
                     <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 mb-2 border border-yellow-100">
                        <Star size={12} fill="currentColor" /> {vet.rating} <span className="text-yellow-400/60">({vet.reviews})</span>
                     </div>
                     {vet.isOpen ? (
                         <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 flex items-center gap-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Aberto Agora
                         </span>
                     ) : (
                         <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Fechado</span>
                     )}
                </div>
            </div>

            {/* Título e Info */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800 leading-tight mb-1">{vet.name}</h1>
                <p className="text-sm font-bold text-[#8B4AFF] mb-1">{vet.clinic}</p>
                <p className="text-xs text-gray-400 font-medium">{vet.specialty}</p>
            </div>

            {/* Botões de Ação Principais */}
            <div className="grid grid-cols-4 gap-3 mb-8">
                <ActionButton icon={Phone} label="Ligar" color="bg-indigo-50 text-indigo-600" onClick={handleCall} />
                <ActionButton icon={MessageCircle} label="WhatsApp" color="bg-green-50 text-green-600" onClick={handleZap} />
                <ActionButton icon={Navigation} label="Rota" color="bg-blue-50 text-blue-600" onClick={handleMaps} />
                <ActionButton icon={Calendar} label="Agendar" color="bg-orange-50 text-orange-600" onClick={() => alert("Agendamento em breve!")} />
            </div>

            {/* Sobre */}
            <div className="mb-8">
                <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-2">Sobre o Profissional</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {vet.about}
                </p>
            </div>

            {/* Serviços (Tags) */}
            <div className="mb-8">
                <h3 className="text-sm font-black text-gray-800 mb-3">Serviços Oferecidos</h3>
                <div className="flex flex-wrap gap-2">
                    {vet.services.map(tag => (
                        <span key={tag} className="bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold border border-gray-100">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Endereço */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex gap-4 items-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={handleMaps}>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                    <MapPin size={20} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Endereço</p>
                    <p className="text-sm font-bold text-gray-700 leading-tight">{vet.address}</p>
                </div>
            </div>

        </div>
      </div>

    </div>
  );
}

// Componente de Botão Pequeno
function ActionButton({ icon: Icon, label, color, onClick }) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-transform active:scale-95 ${color}`}>
            <Icon size={20} />
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    )
}
