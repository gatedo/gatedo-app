// src/data/feed.js

export const storiesData = [
    { 
        id: 1, 
        user: "Gatedo Oficial", 
        img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80", 
        active: true 
    },
    { 
        id: 2, 
        user: "Vet Julia", 
        img: "https://images.unsplash.com/photo-1594772333072-61f2d1253972?auto=format&fit=crop&w=150&q=80", 
        active: true 
    },
    { 
        id: 3, 
        user: "Simba", 
        img: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=150&q=80", 
        active: false 
    },
    { 
        id: 4, 
        user: "Luna", 
        img: "https://images.unsplash.com/photo-1495360019602-e001922271aa?auto=format&fit=crop&w=150&q=80", 
        active: false 
    },
    { 
        id: 5, 
        user: "Tom", 
        img: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=150&q=80", 
        active: false 
    },
];

export const feedData = [
    {
        id: 1,
        user: { name: "Aline & Paçoca", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" },
        image: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=800&q=80",
        content: "Alguém mais tem um gato que acha que é planta? 🌱😂 #GatoJardineiro",
        likes: 124,
        comments: 18,
        time: "2h atrás",
        tag: { label: "Humor", color: "bg-yellow-100 text-yellow-700" },
        isVerified: false
    },
    {
        id: 2,
        user: { name: "Ricardo Vet", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80" },
        content: "Dica rápida: Lembrem-se de hidratar seus gatinhos no calor! Sachê com água é uma ótima pedida. 💧",
        likes: 856,
        comments: 42,
        time: "5h atrás",
        tag: { label: "Dica de Saúde", color: "bg-green-100 text-green-700" },
        isVerified: true
    },
    {
        id: 3,
        user: { name: "Clube do Persa", avatar: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=100&q=80" },
        image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80",
        content: "Encontro de Persas em Porto Alegre neste domingo! Quem vai? 😻",
        likes: 230,
        comments: 56,
        time: "1d atrás",
        tag: { label: "Evento", color: "bg-[#6158ca] text-white" },
        isVerified: false
    }
];