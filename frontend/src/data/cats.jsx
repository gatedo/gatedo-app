import React from 'react';
import { ShieldCheck, Heart, Star, Trophy, Zap, Camera, Lock } from 'lucide-react';

export const catsData = [
    {
      id: 1,
      name: "Frederico",
      breed: "Persa Cream",
      gender: "Macho",
      age: "2 anos",
      birthDate: "03.12.2010",
      weight: "4.8 Kg",
      isNeutered: true,
      image: "https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=800&q=80",
      
      // COR DO CARTÃO (Gradiente Roxo do Print)
      // Se o usuário personalizar, mudamos aqui.
      cardColor: "from-[#6158ca] to-[#5b35a1]", 

      
      gatedoId: "RG-2024-8899",
      microchip: "123-456-789",
      city: "Porto Alegre-RS",
      
      level: 4,
      rankTitle: "CAÇADOR DE SACHE",
      currentPoints: 850,
      nextLevelPoints: 1200,

      // CONQUISTAS PARA O VERSO
      achievements: [
        { label: "Primeiro Gato", icon: <Heart size={24} />, color: "text-pink-500", bg: "bg-pink-100", unlocked: true },
        { label: "Vacinação em Dia", icon: <ShieldCheck size={24} />, color: "text-blue-500", bg: "bg-blue-100", unlocked: true },
        { label: "Fotogênico", icon: <Camera size={24} />, color: "text-purple-500", bg: "bg-purple-100", unlocked: true },
        { label: "7 Dias Seguidos", icon: <Zap size={24} />, color: "text-orange-500", bg: "bg-orange-100", unlocked: true },
        { label: "Influencer", icon: <Star size={24} />, color: "text-yellow-500", bg: "bg-yellow-100", unlocked: false }, // Bloqueado
        { label: "Rei do Sofá", icon: <Trophy size={24} />, color: "text-green-500", bg: "bg-green-100", unlocked: false }, // Bloqueado
      ],

      vaccines: [
        { name: "V4 (Quádrupla)", date: "15/08/2025", status: "ok" },
        { name: "Raiva", date: "04/02/2026", status: "warning" }
      ],
      
      bio: {
        title: "Sobre Persa",
        desc: "O Persa é conhecido por seu temperamento calmo e afetuoso. São gatos majestosos que apreciam o conforto do lar."
      }
    },
    // ... outros gatos
];