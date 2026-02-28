import { 
  Utensils, Brain, Home, Heart, Sparkles, AlertCircle, 
  Scissors, Gift, Activity, HelpCircle, BookOpen 
} from 'lucide-react';

export const wikiCategories = [
  {
    id: 'nutricao',
    title: "Nutrição & Alimentação",
    color: "bg-green-100 text-green-700",
    icon: Utensils,
    topics: ["Melhores Rações", "Nutrição Natural", "Sachê vs Seca", "O que gato não pode comer"]
  },
  {
    id: 'comportamento',
    title: "Mente & Comportamento",
    color: "bg-purple-100 text-purple-700",
    icon: Brain,
    topics: ["Linguagem Corporal", "Xixi fora do lugar", "Socialização", "Adestramento Básico"]
  },
  {
    id: 'ambiente',
    title: "Ambiente & Diversão",
    color: "bg-orange-100 text-orange-700",
    icon: Home,
    topics: ["Gatificação", "Brinquedos Caseiros", "Caixa de Areia Ideal", "Arranhadores"]
  },
  {
    id: 'saude',
    title: "Saúde & Cuidados",
    color: "bg-red-100 text-red-700",
    icon: Activity,
    topics: ["Vacinas Essenciais", "Sinais de Dor", "Deficiências Físicas", "Primeiros Socorros"]
  },
  {
    id: 'higiene',
    title: "Higiene & Tosa",
    color: "bg-blue-100 text-blue-700",
    icon: Scissors,
    topics: ["Como cortar unhas", "Banho: Sim ou Não?", "Escovação", "Limpeza de Ouvidos"]
  },
  {
    id: 'curiosidades',
    title: "Mitos & Curiosidades",
    color: "bg-yellow-100 text-yellow-700",
    icon: Sparkles,
    topics: ["Mitos Populares", "História dos Gatos", "Raças Exóticas", "Por que ronronam?"]
  },
  {
    id: 'adocao',
    title: "Adoção Responsável",
    color: "bg-pink-100 text-pink-700",
    icon: Heart,
    topics: ["Enxoval do Gato", "Adaptação Novo Gato", "Gatos Adultos", "FIV/FeLV"]
  }
];