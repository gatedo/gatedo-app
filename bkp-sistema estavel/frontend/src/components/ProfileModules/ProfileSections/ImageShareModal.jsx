const ImageShareModal = ({ imageUrl, catName, onClose }) => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
  >
    <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white"><X /></button>
    
    <div className="w-full max-w-md">
      <motion.img 
        layoutId={imageUrl}
        src={imageUrl} 
        className="w-full rounded-[32px] shadow-2xl mb-8 border-4 border-white/10"
      />
      
      <div className="grid grid-cols-2 gap-4">
        {/* OPÇÃO 1: COMUNIGATO */}
        <button 
          onClick={() => alert('Postado no Feed Comunigato!')}
          className="flex flex-col items-center justify-center gap-3 bg-[#6158ca] p-6 rounded-[24px] text-white shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Feed ComuniGato</span>
        </button>

        {/* OPÇÃO 2: REDES EXTERNAS */}
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: `Veja o ${catName}`, url: imageUrl });
            }
          }}
          className="flex flex-col items-center justify-center gap-3 bg-[#ebfc66] p-6 rounded-[24px] text-[#6158ca] shadow-lg"
        >
          <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center">
            <Share2 size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Redes Sociais</span>
        </button>
      </div>

      <button className="w-full mt-4 flex items-center justify-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
        <Download size={14} /> Salvar no dispositivo
      </button>
    </div>
  </motion.div>
);