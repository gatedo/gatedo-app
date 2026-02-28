import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Shield, Sparkles, Award, Palette, Info } from 'lucide-react';
import useSensory from '../hooks/useSensory';

// Tipos Populares de SRD no Brasil
const SRD_TYPES = [
  { 
    id: 'frajola', 
    name: 'Frajola', 
    desc: 'O clássico preto e branco. Elegante, parece que está sempre de smoking.',
    color: 'bg-gray-800 text-white',
    img: 'https://images.unsplash.com/photo-1511696088237-77293a38892f?auto=format&fit=crop&w=300&q=80' // Imagem ilustrativa tuxedo
  },
  { 
    id: 'laranjinha', 
    name: 'Laranjinha', 
    desc: 'Famosos por serem caóticos, carinhosos e muito falantes. Personalidade pura.',
    color: 'bg-orange-500 text-white',
    img: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=300&q=80'
  },
  { 
    id: 'escaminha', 
    name: 'Escaminha', 
    desc: 'Pelagem preta e laranja misturada. Dizem que trazem sorte e têm gênio forte.',
    color: 'bg-amber-700 text-white',
    img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=300&q=80'
  },
  { 
    id: 'tigrado', 
    name: 'Tigrado', 
    desc: 'O "M" na testa é sua marca. São os reis da camuflagem e excelentes caçadores.',
    color: 'bg-stone-600 text-white',
    img: 'https://images.unsplash.com/photo-1520315342629-6ea920342047?auto=format&fit=crop&w=300&q=80'
  },
  { 
    id: 'sialata', 
    name: 'Sialata', 
    desc: 'Parece siamês, mas é 100% brasileiro. Olhos azuis e pelagem clara com pontas escuras.',
    color: 'bg-indigo-400 text-white',
    img: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=300&q=80'
  },
  { 
    id: 'tricolor', 
    name: 'Tricolor', 
    desc: 'Branco, preto e laranja. A grande maioria (99%) são fêmeas!',
    color: 'bg-pink-500 text-white',
    img: 'https://images.unsplash.com/photo-1548802673-380ab8ebc427?auto=format&fit=crop&w=300&q=80'
  },
];

export default function WikiSRD() {
  const navigate = useNavigate();
  const touch = useSensory();

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-32 pt-6 px-5 font-sans">
      
      {/* Header com Navegação */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600 border border-gray-100 hover:bg-gray-50">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <span className="bg-[#ebfc66] text-[#6158ca] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">Especial</span>
            </div>
            <h1 className="text-xl font-black text-gray-800">
                Gatos <span className="text-[#FF9F43]">SRD</span>
            </h1>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#FF9F43] to-[#ffb673] rounded-[32px] p-6 text-white mb-8 relative overflow-hidden shadow-lg shadow-orange-200">
        <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2 leading-tight">Únicos, Exclusivos<br/>e 100% Brasileiros.</h2>
            <p className="text-xs font-medium opacity-90 leading-relaxed max-w-[80%]">
                SRD significa "Sem Raça Definida". Eles possuem uma mistura genética única que os torna mais resistentes e especiais.
            </p>
        </div>
        <Heart size={120} className="absolute -right-4 -bottom-8 opacity-20 rotate-[-15deg]" />
      </div>

      {/* Seção: Vantagens */}
      <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
         <Shield size={20} className="text-[#FF9F43]" /> Superpoderes
      </h3>
      
      <div className="grid grid-cols-2 gap-3 mb-8">
         <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3">
                <ActivityIcon />
            </div>
            <h4 className="font-bold text-sm text-gray-800">Saúde de Ferro</h4>
            <p className="text-[10px] text-gray-500 mt-1">Maior variabilidade genética reduz doenças hereditárias.</p>
         </div>
         <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-3">
                <Sparkles size={20} />
            </div>
            <h4 className="font-bold text-sm text-gray-800">Exclusividade</h4>
            <p className="text-[10px] text-gray-500 mt-1">Nunca haverá outro gato igual ao seu no mundo.</p>
         </div>
      </div>

      {/* Seção: Tipos Brasileiros */}
      <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
         <Palette size={20} className="text-[#FF9F43]" /> Clássicos Brasileiros
      </h3>
      <p className="text-xs text-gray-500 mb-4 -mt-2">Eles não têm pedigree, mas têm apelidos famosos.</p>

      <div className="space-y-4">
        {SRD_TYPES.map((type, idx) => (
            <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex gap-4 items-center group cursor-pointer hover:shadow-md transition-all"
                onClick={() => touch()}
            >
                <div className={`w-16 h-16 rounded-[18px] flex-shrink-0 overflow-hidden relative shadow-sm`}>
                    <img src={type.img} className="w-full h-full object-cover" />
                    {/* Badge de Cor */}
                    <div className={`absolute bottom-0 w-full h-1.5 ${type.color}`} />
                </div>
                <div>
                    <h4 className="text-base font-black text-gray-800 mb-1 group-hover:text-[#FF9F43] transition-colors">{type.name}</h4>
                    <p className="text-[10px] font-medium text-gray-500 leading-tight">
                        {type.desc}
                    </p>
                </div>
            </motion.div>
        ))}
      </div>

      {/* Box Curiosidade Final */}
      <div className="mt-8 bg-blue-50 rounded-[24px] p-5 flex gap-4 items-start border border-blue-100">
         <Info size={24} className="text-blue-500 flex-shrink-0 mt-1" />
         <div>
             <h4 className="text-sm font-bold text-blue-800 mb-1">Você sabia?</h4>
             <p className="text-xs text-blue-700/80 leading-relaxed">
                 O dia 31 de Julho é comemorado o <strong>Dia do Vira-Lata</strong> no Brasil. Uma data para celebrar a adoção e o amor sem raça definida!
             </p>
         </div>
      </div>

    </div>
  );
}

// Ícone simples para Saúde
const ActivityIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);