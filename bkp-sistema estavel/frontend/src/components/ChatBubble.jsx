import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';

export default function ChatBubble({ message, isUser }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white ${
        isUser ? 'bg-gatedo-primary text-white' : 'bg-white text-gatedo-primary'
      }`}>
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>

      {/* Balão */}
      <div className={`p-4 max-w-[80%] shadow-sm text-sm leading-relaxed relative ${
        isUser 
          ? 'bg-gatedo-primary text-white rounded-2xl rounded-tr-sm' 
          : 'bg-white text-gray-700 rounded-2xl rounded-tl-sm border border-gray-100'
      }`}>
        {message}
        
        {/* Detalhe da pontinha do balão */}
        <div className={`absolute top-0 w-2 h-2 ${
            isUser ? '-right-1 bg-gatedo-primary' : '-left-1 bg-white border-l border-t border-gray-100'
        } transform rotate-45`} />
      </div>
    </motion.div>
  );
}