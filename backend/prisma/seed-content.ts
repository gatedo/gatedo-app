/**
 * Seed do módulo de conteúdo (Guia + Protocolo).
 * Roda separado do seed.ts principal (que mexe em usuário admin) —
 * este script só faz upsert de conteúdo, por slug, então é seguro rodar
 * de novo quantas vezes precisar.
 *
 * Uso: npx ts-node prisma/seed-content.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedGuideEntries() {
  const entries = [
    {
      slug: 'coceira-em-gatos',
      title: 'Coceira em gatos: quando é normal e quando é sinal de algo',
      theme: 'Pele e pelagem',
      excerpt: 'Coçar de vez em quando é normal — coçar sem parar não é.',
      body: '[CONTEÚDO DE EXEMPLO — substituir depois]\n\nGatos se coçam e se lambem como parte da higiene normal. Fique atento quando a coceira é frequente, concentrada numa região, ou vem acompanhada de queda de pelo, feridas ou vermelhidão.',
      tags: ['pele', 'coceira', 'alergia'],
      status: 'PUBLISHED' as const,
    },
    {
      slug: 'vomito-ocasional-x-frequente',
      title: 'Vômito ocasional x frequente: qual a diferença que importa',
      theme: 'Digestão',
      excerpt: 'Um vômito isolado raramente é motivo de alarme. Recorrente, é.',
      body: '[CONTEÚDO DE EXEMPLO — substituir depois]\n\nGatos podem vomitar bolas de pelo ocasionalmente sem problema. Vômitos frequentes, com sangue, ou associados a perda de apetite pedem atenção maior.',
      tags: ['digestao', 'vomito'],
      status: 'PUBLISHED' as const,
    },
    {
      slug: 'calendario-de-vacinas',
      title: 'Calendário de vacinas: o que cada uma protege',
      theme: 'Prevenção',
      excerpt: 'V4/V5, antirrábica e os reforços — o que realmente significam.',
      body: '[CONTEÚDO DE EXEMPLO — substituir depois]\n\nAs vacinas polivalentes (V4/V5) protegem contra doenças respiratórias e a panleucopenia felina. A antirrábica é obrigatória em muitas regiões e tem reforço anual.',
      tags: ['vacina', 'prevencao'],
      status: 'PUBLISHED' as const,
    },
  ]

  for (const entry of entries) {
    await prisma.guideEntry.upsert({
      where: { slug: entry.slug },
      update: entry,
      create: entry,
    })
    console.log(`✅ Guia: ${entry.title}`)
  }
}

async function seedExampleProtocol() {
  const protocol = await prisma.protocol.upsert({
    where: { slug: 'coceira-persistente-5-dias' },
    update: {
      title: 'Coceira persistente — acompanhamento de 5 dias',
      summary: '[EXEMPLO] Um protocolo curto para observar coceira que não passa, com registro diário guiado.',
      requiresFounder: true,
      totalDays: 5,
      status: 'PUBLISHED',
    },
    create: {
      slug: 'coceira-persistente-5-dias',
      title: 'Coceira persistente — acompanhamento de 5 dias',
      summary: '[EXEMPLO] Um protocolo curto para observar coceira que não passa, com registro diário guiado.',
      requiresFounder: true,
      totalDays: 5,
      status: 'PUBLISHED',
    },
  })

  const steps = [
    {
      dayNumber: 0,
      kind: 'TRIAGE' as const,
      title: 'Triagem inicial',
      taskShort: '[EXEMPLO] Descreva onde o gato mais se coça e há quanto tempo.',
      whyText: '[EXEMPLO] Isso vira o "antes" do seu comparativo — sem essa nota inicial não dá pra medir progresso depois.',
      asksRating: true,
    },
    {
      dayNumber: 1,
      kind: 'DAY' as const,
      title: 'Dia 1',
      taskShort: '[EXEMPLO] Observe se a coceira piora em algum horário do dia.',
      whyText: '[EXEMPLO] Padrões de horário ajudam a diferenciar causa ambiental de causa alimentar.',
      asksRating: false,
    },
    {
      dayNumber: 2,
      kind: 'DAY' as const,
      title: 'Dia 2',
      taskShort: '[EXEMPLO] Verifique se há vermelhidão ou feridas nas áreas coçadas.',
      whyText: '[EXEMPLO] Pele rompida muda a urgência do caso.',
      asksRating: false,
    },
    {
      dayNumber: 3,
      kind: 'DAY' as const,
      title: 'Dia 3',
      taskShort: '[EXEMPLO] Note se algo novo entrou na rotina (ração, areia, produto de limpeza).',
      whyText: '[EXEMPLO] Mudanças recentes são a causa mais comum de coceira nova.',
      asksRating: false,
    },
    {
      dayNumber: 4,
      kind: 'DAY' as const,
      title: 'Dia 4',
      taskShort: '[EXEMPLO] Avalie se o comportamento geral do gato mudou (apetite, sono, humor).',
      whyText: '[EXEMPLO] Coceira que afeta o bem-estar geral pesa mais que coceira isolada.',
      asksRating: false,
    },
    {
      dayNumber: 5,
      kind: 'CLOSING' as const,
      title: 'Fechamento',
      taskShort: '[EXEMPLO] Avalie de novo a gravidade da coceira e compare com o dia 0.',
      whyText: '[EXEMPLO] Este é o "depois" — de onde sai o comparativo e a decisão de procurar o vet.',
      asksRating: true,
    },
  ]

  for (const step of steps) {
    await prisma.protocolStep.upsert({
      where: { protocolId_dayNumber: { protocolId: protocol.id, dayNumber: step.dayNumber } },
      update: step,
      create: { ...step, protocolId: protocol.id },
    })
  }

  console.log(`✅ Protocolo de exemplo: ${protocol.title} (${steps.length} etapas)`)
}

async function main() {
  await seedGuideEntries()
  await seedExampleProtocol()
}

main()
  .catch((e) => {
    console.error('❌ Seed de conteúdo falhou:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
