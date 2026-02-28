import React, { useState } from 'react';
import { Copy, Share2, MessageCircle, Star, Heart, Check, Instagram, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code'; // Certifique-se de ter instalado

export default function AdminLinkGenerator() {
  const [name, setName] = useState('');
  const [type, setType] = useState('vip');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const baseUrl = "https://app.gatedo.com/register";
  const generatedLink = `${baseUrl}?type=${type}${name ? `&name=${encodeURIComponent(name)}` : ''}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMessage = () => {
    return type === 'vip' 
      ? `Fala ${name}! Criei um acesso VIP exclusivo pra você no Gatedo. Dá uma olhada: ${generatedLink}`
      : `Olá! Seu acesso como Fundador Gatedo está liberado. Finalize aqui: ${generatedLink}`;
  };

  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm max-w-2xl mx-auto mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-[#6158ca]/10 rounded-2xl text-[#6158ca]"><Share2 size={24} /></div>
        <div>
          <h3 className="text-xl font-black text-gray-800 italic">Gerador de Convites 🐾</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Eventos e Convites Diretos</p>
        </div>
      </div>

      <div className="space-y-6">
        <input 
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nome do Convidado"
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-bold outline-none focus:border-[#6158ca]"
        />

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setType('vip')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 ${type === 'vip' ? 'border-[#6158ca] bg-[#6158ca]/5' : 'border-gray-50 opacity-40'}`}>
            <Heart size={20} className={type === 'vip' ? 'text-[#6158ca] fill-current' : ''} />
            <span className="text-[10px] font-black uppercase">Convite VIP</span>
          </button>
          <button onClick={() => setType('founder')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 ${type === 'founder' ? 'border-amber-500 bg-amber-50' : 'border-gray-50 opacity-40'}`}>
            <Star size={20} className={type === 'founder' ? 'text-amber-500 fill-current' : ''} />
            <span className="text-[10px] font-black uppercase">Fundador</span>
          </button>
        </div>

        <div className="bg-gray-900 rounded-[24px] p-6 text-center">
          <code className="text-[#ebfc66] text-[10px] block mb-4 break-all">{generatedLink}</code>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button onClick={() => copyToClipboard(generatedLink)} className="bg-white/10 text-white p-3 rounded-xl text-[10px] font-black"><Copy size={14} /></button>
            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(getMessage())}`)} className="bg-[#25D366] text-white p-3 rounded-xl text-[10px] font-black"><MessageCircle size={14} /></button>
            <button onClick={() => { copyToClipboard(getMessage()); window.open('https://instagram.com/direct/inbox/'); }} className="bg-gradient-to-tr from-orange-400 to-purple-600 text-white p-3 rounded-xl text-[10px] font-black"><Instagram size={14} /></button>
            <button onClick={() => setShowQR(true)} className="bg-white text-gray-900 p-3 rounded-xl text-[10px] font-black"><QrCode size={14} /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#6158ca]/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-10 rounded-[40px] flex flex-col items-center shadow-2xl relative">
              <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 text-gray-400"><X /></button>
              <div className="bg-[#ebfc66] p-6 rounded-3xl mb-6">
                <QRCode value={generatedLink} size={180} fgColor="#6158ca" />
              </div>
              <p className="font-black text-gray-800 italic uppercase tracking-widest text-xs">Escaneie para entrar!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}