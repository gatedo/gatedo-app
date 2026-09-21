export const FOUNDER_LAUNCH_PHASES = [
  {
    n: 1,
    phase: 1,
    label: 'Tutor Genese',
    displayLabel: 'Tutor Genese',
    name: 'Tutor Genese',
    badgeKey: 'TUTOR_GENESIS',
    badge: '/assets/badges/TUTOR_GENESIS.png',
    price: 47,
    totalVagas: 50,
    spots: 50,
    color: '#00C896',
    tag: '50 primeiros',
    kiwifyUrl: 'https://pay.kiwify.com.br/VjePvmn',
    desc: 'O menor valor que o Gatedo vai ter, em qualquer momento, para sempre. Voce entra primeiro, molda o produto com feedback real.',
    urgency: 'Depois desta fase, este valor nao volta mais.',
    ob: { name: 'Pack 100 GPTS Bonus', price: 9.9, conv: '35-45%' },
    us: { name: 'Upgrade Tutor Master +R$80', price: 80, conv: '20-28%' },
    ds: { name: 'Pack 50 GPTS por R$4,90', price: 4.9, conv: '22%' },
  },
  {
    n: 2,
    phase: 2,
    label: 'Tutor Raiz',
    displayLabel: 'Tutor Raiz',
    name: 'Tutor Raiz',
    badgeKey: 'TUTOR_RAIZ',
    badge: '/assets/badges/TUTOR_RAIZ.png',
    price: 67,
    totalVagas: 100,
    spots: 100,
    color: '#00AAFF',
    tag: 'Base fundadora',
    kiwifyUrl: 'https://pay.kiwify.com.br/TlfQJm5',
    desc: 'Ainda dentro da janela de fundador, com vantagem real sobre o preco definitivo. Ultima chance de entrar com condicao de lancamento.',
    urgency: 'Depois desta fase, o valor sobe para R$127.',
    ob: { name: 'Guia PDF do Tutor Consciente', price: 14.9, conv: '30-40%' },
    us: { name: 'Pack 300 GPTS por R$37', price: 37, conv: '22-30%' },
    ds: { name: '100 GPTS por R$14,90', price: 14.9, conv: '25%' },
  },
  {
    n: 3,
    phase: 3,
    label: 'Tutor Cerne',
    displayLabel: 'Tutor Cerne',
    name: 'Tutor Cerne',
    badgeKey: 'TUTOR_CERNE',
    badge: '/assets/badges/TUTOR_CERNE.png',
    price: 97,
    totalVagas: 150,
    spots: 150,
    color: '#FF6B2B',
    tag: 'Nucleo fundador',
    kiwifyUrl: 'https://pay.kiwify.com.br/tcbqqVl',
    desc: 'Etapa final antes da abertura publica. Voce entra como fundador, mas ja no valor mais proximo do definitivo.',
    urgency: 'Depois desta fase, preco previsto: R$199+/ano.',
    ob: { name: 'Consultoria IA de Saude Felina', price: 19.9, conv: '28-38%' },
    us: { name: 'Pack 500 GPTS por R$49,90', price: 49.9, conv: '20-25%' },
    ds: { name: '100 GPTS por R$14,90', price: 14.9, conv: '22%' },
  },
];

export const TOTAL_FOUNDER_SLOTS = FOUNDER_LAUNCH_PHASES.reduce((acc, phase) => acc + phase.totalVagas, 0);

export const FOUNDER_REVENUE_MAX = FOUNDER_LAUNCH_PHASES.reduce(
  (acc, phase) => acc + phase.totalVagas * phase.price,
  0
);

export function getFounderLaunchPhase(phase) {
  return FOUNDER_LAUNCH_PHASES.find((item) => item.n === Number(phase)) || FOUNDER_LAUNCH_PHASES[0];
}

