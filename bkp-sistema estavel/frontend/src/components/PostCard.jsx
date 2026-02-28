import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import useSensory from '../hooks/useSensory';

export default function PostCard({ post }) {
  const touch = useSensory();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const handleLike = () => {
    touch(liked ? 'tap' : 'success'); // Som diferente se curtir ou descurtir
    if (!liked) setLikesCount(c => c + 1);
    else setLikesCount(c => c - 1);
    setLiked(!liked);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white p-4 rounded-[24px] shadow-sm mb-4 border border-gray-50"
    >
      {/* Cabeçalho do Post */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${post.userColor} flex items-center justify-center text-lg shadow-sm`}>
                {post.userAvatar}
            </div>
            <div>
                <h4 className="font-bold text-gray-800 text-sm leading-tight">{post.userName}</h4>
                <p className="text-[10px] text-gray-400 font-bold">{post.time} • {post.tag}</p>
            </div>
        </div>
        <button className="text-gray-300"><MoreHorizontal size={20} /></button>
      </div>

      {/* Conteúdo */}
      <p className="text-gray-600 text-sm leading-relaxed mb-3 font-medium">
        {post.content}
      </p>

      {/* Imagem (Se houver) */}
      {post.image && (
        <div className="w-full h-48 rounded-[18px] overflow-hidden mb-3 bg-gray-100">
            <img src={post.image} alt="Post" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Barra de Ações */}
      <div className="flex items-center gap-6 pt-2 border-t border-gray-50">
        <button 
            onClick={handleLike}
            className={`flex items-center gap-2 text-xs font-bold transition-colors ${liked ? 'text-red-500' : 'text-gray-400'}`}
        >
            <Heart size={20} className={liked ? 'fill-red-500' : ''} />
            {likesCount}
        </button>
        
        <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gatedo-primary transition-colors">
            <MessageCircle size={20} />
            {post.comments}
        </button>

        <div className="flex-1"></div>

        <button className="text-gray-400 hover:text-gatedo-primary transition-colors">
            <Share2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}