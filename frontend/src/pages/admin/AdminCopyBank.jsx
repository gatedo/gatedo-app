import React, { useState, useCallback } from 'react';
import {
  Copy, CheckCircle2, Star, Search, Filter,
  Tag, Instagram, Video, Mail, Smartphone,
  MessageCircle, BarChart2, Hash, Megaphone,
  BookOpen, Zap, TrendingUp, Heart, Target,
  ChevronDown
} from 'lucide-react';

const P = '#8B4AFF';
const A = '#ebfc66';

// ─── localStorage hook ───────────────────────────────────────────────────────
function useLS(key, init) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  const set = useCallback(fn => setV(prev => {
    const next = typeof fn === 'function' ? fn(prev) : fn;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    return next;
  }), [key]);
  return [v, set];
}

// ─── THE 50 COPIES — GATEDO ADAPTED ─────────────────────────────────────────
const COPIES = [
  // ══════════════════════════════════════════════════════════════════════════
  // BLOCO 01 — AQUISIÇÃO & DESCOBERTA (1–10)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 1,
    title: 'Perfil Gatedo — Os 3 Passos',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Produto', '3 passos', 'Simples'],
    hook: 'Uma das maiores oportunidades para tutores de gatos no Brasil...',
    copy: `Uma das maiores oportunidades para tutores de gatos no Brasil é o que eu chamo de Perfil Gatedo.

É uma estratégia extremamente simples e poderosa — mas poucas pessoas aproveitam ainda.

Mais de 23.000 tutores já criaram o perfil do gato deles no app. De lá pra cá, nunca mais esqueceram uma vacina, nunca mais chegaram na clínica sem o histórico, nunca mais perderam um momento importante da vida do gato.

Basicamente o Gatedo funciona em 3 passos:

1️⃣ Cadastra o perfil do seu gato (raça, idade, foto)
2️⃣ Registra o histórico de saúde em segundos
3️⃣ Recebe alertas automáticos antes de cada vacina

Essa é a sua chance de começar isso do zero. Crie o perfil do seu gato grátis agora.

🔗 Link na bio.`,
  },
  {
    id: 2,
    title: '2026 é diferente para tutores',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Contexto', 'Tendência', 'Urgência'],
    hook: 'Se você colocou como meta para 2026 cuidar melhor do seu gato...',
    copy: `Se você colocou como meta para 2026 cuidar melhor do seu gato, preste muita atenção.

O jeito de acompanhar a saúde felina em 2026 precisa de uma atenção muito especial.

Sabe por quê?

2026 é o ano em que os tutores mais conscientes do Brasil vão sair à frente — não adianta continuar no modelo antigo: vacinas anotadas no celular, histórico em papel, consultas sem nenhum dado histórico para mostrar ao vet.

Você precisa fazer a leitura correta do que está acontecendo com o mercado pet e com a saúde felina.

É exatamente por isso que criamos o Gatedo.

O primeiro app brasileiro 100% pensado para gatos.

Nele você registra, acompanha e celebra cada momento da vida do seu gato de um jeito que nunca foi possível antes.

Mesmo que você nunca tenha usado nenhum app de saúde pet — em 5 minutos o perfil do seu gato já está completo.

🔗 Crie grátis agora. Link na bio.`,
  },
  {
    id: 3,
    title: 'Cuidar do gato não precisa ser difícil',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Objeção', 'Simplicidade', 'Produto'],
    hook: 'Cuidar do seu gato não precisa ser algo complexo, cansativo...',
    copy: `Cuidar do seu gato não precisa ser algo complexo, cansativo ou cheio de planilha.

Você não precisa se tornar refém de cadernetas de papel, lembretes no WhatsApp e fotos de receita espalhadas pelo celular.

Não precisa ficar preocupado com "onde anotei a última vacina" ou "quando foi a última consulta".

Você precisa apenas de um lugar inteligente para o gato do seu coração.

O problema é que muitas pessoas ainda não entenderam o poder de ter o histórico completo do gato na palma da mão.

A verdade é a seguinte:

Se você quer gato saudável por muitos anos, você PRECISA de um sistema de acompanhamento — não de mais papelada.

E é exatamente isso que o Gatedo é. O sistema de saúde felina mais simples e completo do Brasil.

Clique no link da bio e crie o perfil do seu gato. Grátis.`,
  },
  {
    id: 4,
    title: 'A estratégia exata para gato sempre saudável',
    objetivo: 'Aquisição',
    formato: 'Feed / Meta Ads',
    canal: 'Instagram / Facebook',
    tipo: 'Pago',
    tags: ['Direto', 'Conversão', 'Benefício'],
    hook: 'A exata estratégia que uso para nunca perder uma vacina do meu gato',
    copy: `A exata estratégia que eu uso para nunca perder uma vacina do meu gato — e que me faz dormir tranquilo sabendo que ele está em dia.

Se você não gosta da ideia de chegar na clínica sem saber quando foi a última vacina...

Preste bem atenção no que vou compartilhar agora.

Imagine a oportunidade de abrir o celular e ver todo o histórico de saúde do seu gato em segundos — e ter certeza de que o próximo alerta já está programado.

Imagine o veterinário olhar para você e dizer: "Esse gato tem o tutor mais organizado que já vi."

É exatamente isso que o Gatedo faz pela relação entre você e o seu gato.

Como funciona?

✅ Cadastro completo em minutos
✅ Alertas automáticos de vacinas e consultas
✅ Histórico de saúde sempre à mão
✅ Diário de vida do seu gato para nunca esquecer nada

Comece grátis agora. 👇`,
  },
  {
    id: 5,
    title: 'Quem quer gato saudável precisa de mais que boa vontade',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Educacional', 'Produto', 'Diferencial'],
    hook: 'Quem quer gato saudável precisa aprender a monitorar. Mas não qualquer monitoramento...',
    copy: `Quem quer gato saudável precisa aprender a monitorar a saúde do animal com consistência.

Mas eu não falo de qualquer monitoramento.

Eu falo do monitoramento que detecta problemas antes de virarem crise, que lembra você de cada vacina antes do prazo, que constrói um histórico real para o veterinário trabalhar com precisão.

Nos últimos 12 meses o Gatedo acompanhou mais de 23.000 gatos no Brasil.

E algo incrível acontece quando os tutores usam o app com consistência:

Eles chegam na clínica com mais confiança. O vet tem dados reais para trabalhar. O gato tem diagnósticos mais precisos. E o tutor dorme tranquilo sabendo que não esqueceu nada.

É o que eu chamo de efeito Tutor Consciente.

Mesmo que você nunca tenha se preocupado com isso antes, se você começar a usar o Gatedo hoje, o próximo ano do seu gato vai ser radicalmente diferente.

🔗 Link na bio para criar o perfil do seu gato grátis.`,
  },
  {
    id: 6,
    title: 'Não é qualquer app que cuida de gato',
    objetivo: 'Aquisição',
    formato: 'Feed / Meta Ads',
    canal: 'Instagram / Facebook',
    tipo: 'Pago',
    tags: ['Diferencial', 'Posicionamento', '3 pilares'],
    hook: 'Não é qualquer app que vai ajudar você a cuidar do seu gato de verdade',
    copy: `Não é qualquer app que vai realmente ajudar você a cuidar do seu gato.

Muitos sabem que precisam de algo para organizar a saúde do pet. Mas pouquíssimos sabem o que realmente funciona.

Se você quer resultados reais — gato saudável, consultas organizadas, histórico completo — você precisa de 3 pilares:

01: Registro contínuo de saúde (não só quando lembra)
02: Alertas inteligentes ANTES do prazo vencer
03: Histórico organizado que o veterinário consegue usar

Para dominar esses 3 pilares no cuidado do seu gato, experimente o Gatedo grátis.

O app que foi criado especificamente para gatos — não para "pets em geral".

🔗 Comece agora. Link na bio.`,
  },
  {
    id: 7,
    title: 'As 4 regras do tutor consciente',
    objetivo: 'Aquisição',
    formato: 'Feed / Carrossel',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Educacional', 'Regras', 'Carrossel'],
    hook: 'Como transformar o cuidado do seu gato em hábito automático',
    copy: `Como transformar o cuidado do seu gato em hábito automático — sem depender de memória.

Existem 4 regras para transformar a sua preocupação com o gato em um sistema que funciona sozinho:

Regra nº 01: Registre cada evento de saúde no momento — não depois
Regra nº 02: Deixe os alertas trabalharem por você — não confie na memória
Regra nº 03: Construa o histórico antes de precisar dele — não espere a crise
Regra nº 04: Compartilhe o perfil com o veterinário — não leve caderneta

A boa notícia é que eu criei um app onde cada uma dessas regras já está embutida no produto.

Para começar a aplicar essas 4 regras com o seu gato, crie o perfil dele gratuitamente.

🔗 Link na bio.`,
  },
  {
    id: 8,
    title: 'Cuidar de gato é arte que poucos dominam',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram / Facebook',
    tipo: 'Orgânico',
    tags: ['Engajamento', 'Reflexão', 'Produto'],
    hook: 'Ser tutor de gato é uma arte que poucos dominam de verdade',
    copy: `Ser tutor de gato de verdade é uma arte que poucos dominam. A maioria erra no elemento mais importante de todos.

Que é…

O histórico de saúde.

O foco maior deve estar em construir um registro contínuo, não apenas reagir quando o gato fica doente.

A grande questão: muitas pessoas sabem que precisam cuidar melhor do gato. Mas pouquíssimas realmente criam um sistema para isso.

Dominar o histórico de saúde é o que vai fazer você:

🔹 Chegar na consulta com dados reais
🔹 Detectar problemas antes de virarem emergência
🔹 Dar ao seu gato os anos que ele merece

Eu montei o exato passo a passo, completo e simples, para você dominar isso — e coloquei dentro do Gatedo. De graça.

🔗 Link na bio para criar o perfil do seu gato.`,
  },
  {
    id: 9,
    title: 'O que falta para seu gato ser saudável de verdade?',
    objetivo: 'Aquisição',
    formato: 'Feed / Stories',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Reflexão', 'Enquete', 'Engajamento'],
    hook: 'Sua sincera opinião, por favor: você sabe o que falta para seu gato ser realmente saudável?',
    copy: `Sua sincera opinião, por favor:

Você sabe o que realmente falta para o seu gato ter a saúde que merece?

Muitas pessoas acreditam que basta dar boa ração e vacinar em dia...

E por isso acabam num ciclo:

→ Gato parece bem
→ Consulta adiada
→ Sintoma aparece
→ Emergência no vet
→ Gato parece bem de novo

A verdade é que ou você constrói um acompanhamento contínuo — ou vai sempre estar um passo atrás da saúde do seu gato.

A boa notícia é que existe um app criado exatamente para isso.

Com alertas automáticos, histórico completo e comunidade de tutores que entendem o que você passa.

🔗 Clique no link da bio para saber mais sobre o Gatedo.`,
  },
  {
    id: 10,
    title: 'E se cuidar do seu gato não fosse algo difícil?',
    objetivo: 'Aquisição',
    formato: 'Feed / Meta Ads',
    canal: 'Instagram / Facebook',
    tipo: 'Pago',
    tags: ['Imaginação', 'Benefício', 'DM'],
    hook: 'E se acompanhar a saúde do seu gato não fosse algo difícil pra você?',
    copy: `E se acompanhar a saúde do seu gato não fosse algo difícil para você?

Isso faria você se sentir mais tranquilo? Faria você ter mais certeza de que o seu gato está sendo cuidado do jeito certo?

A verdade é que existem estratégias comprovadas para isso.

Talvez você já saiba que é preciso vacinar em dia, ir ao vet regularmente... Todo mundo sabe.

Mas ao mesmo tempo, apenas uma pequena minoria de tutores mantém um histórico real, organizado e acessível de saúde do gato.

E o que esse grupo de pessoas tem de diferente?

Deixa eu te dizer... Não tem nada a ver com ter mais tempo ou mais dinheiro.

O que você precisa é simplesmente de um sistema que torne muito mais fácil cuidar do seu gato com consistência.

E esse é o Método Gatedo.

Um app criado especificamente para tutores que levam a saúde do gato a sério.

Manda "eu quero" no DM para receber o link de acesso grátis.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCO 02 — MISSÃO, MÉTODO E COMUNIDADE (11–20)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 11,
    title: 'A missão do Gatedo (Manifesto)',
    objetivo: 'Branding',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Manifesto', 'Missão', 'Emocional'],
    hook: 'Esta é a missão mais importante que já colocamos em prática...',
    copy: `Esta é a missão mais importante que já colocamos em prática aqui no Gatedo.

Algo que eu não imaginei que faríamos tão cedo. Mas eu sei que esse é o momento certo.

A missão é te ajudar a ser o tutor que o seu gato merece ter.

Eu confesso que escrever essas palavras na internet é algo que faço com muito cuidado. Sou muito cauteloso com grandes promessas.

Mas algo aconteceu que me fez mudar de ideia...

O que me fez mudar foi ver a quantidade de tutores com um amor gigantesco pelo gato, mas sem nenhuma ferramenta à altura dessa relação.

É mais ou menos assim: o tutor ama o gato profundamente, mas não tem onde registrar o histórico, não recebe alerta de vacina, não tem comunidade para compartilhar essa jornada.

Por isso criamos o Gatedo. O único app brasileiro 100% dedicado aos gatos e às pessoas que os amam.

Nele você vai encontrar saúde, comunidade, criatividade e muito afeto — tudo em um lugar.

🔗 Crie o perfil do seu gato grátis. Link na bio.`,
  },
  {
    id: 12,
    title: 'Como um app simples virou a maior comunidade felina do Brasil',
    objetivo: 'Branding',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Origem', 'Storytelling', 'Comunidade'],
    hook: 'Como um app simples se transformou na maior plataforma para tutores de gatos do Brasil',
    copy: `Como um app simples se transformou na maior plataforma para tutores de gatos do Brasil.

Eu não conheço nada mais poderoso que uma comunidade de pessoas que amam gatos da mesma forma.

Começou como um registro de saúde. Uma caderneta digital. Algo para não esquecer vacinas.

E isso aqui começou a acontecer:

Tutores começaram a criar perfis para os gatos. A contar histórias. A compartilhar fotos. A ajudar uns aos outros em momentos difíceis.

Veterinários começaram a pedir o Gatedo para os clientes. Influencers felinas começaram a usar. A comunidade cresceu.

E percebemos que tínhamos criado algo muito maior do que um app de saúde.

Tínhamos criado o lar digital dos gatos brasileiros.

Quer fazer parte disso?

🔗 Crie o perfil do seu gato grátis. Link na bio.`,
  },
  {
    id: 13,
    title: 'O Método Gatedo para tutor consciente',
    objetivo: 'Aquisição',
    formato: 'Feed / Carrossel',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Método', '3 pilares', 'Educacional'],
    hook: 'O Método Gatedo é perfeito para quem quer ter um gato saudável e feliz por muitos anos',
    copy: `O Método Gatedo é perfeito para quem quer ter um gato saudável e feliz por muitos anos.

Esse será seu novo sistema para nunca mais perder um momento importante da saúde do seu gato.

O motivo é simples:

Não adianta tentar cuidar do gato no improviso — anotar vacinas no WhatsApp, lembrar consultas de cabeça, chegar no vet sem histórico.

Você precisa de um sistema contínuo, simples e automático.

É isso que vai possibilitar que você:

✅ Chegue em toda consulta preparado
✅ Receba alertas antes de qualquer vacina vencer
✅ Tenha o histórico completo do gato em segundos
✅ Detecte mudanças de comportamento antes de virarem problema
✅ Celebre cada momento importante da vida do seu gato

É exatamente isso que o Gatedo faz.

🔗 Comece grátis agora. Link na bio.`,
  },
  {
    id: 14,
    title: 'Nunca mais esqueça uma vacina (Story direto)',
    objetivo: 'Aquisição',
    formato: 'Stories',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Story', 'Direto', 'Vacinas'],
    hook: 'Nunca mais esqueça a vacina do seu gato',
    copy: `Nunca mais esqueça a vacina do seu gato.

O Gatedo te avisa antes do prazo.

Crie o perfil do seu gato grátis agora.

Desliza para o link ➡️`,
  },
  {
    id: 15,
    title: 'A estratégia que garante gato saudável por anos',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram / Facebook',
    tipo: 'Orgânico',
    tags: ['3 pilares', 'Resultado', 'Autoridade'],
    hook: 'A única estratégia que garante gato saudável por muitos anos',
    copy: `A única estratégia que realmente garante um gato saudável por muitos anos.

A verdade é que a maioria dos tutores cometem o mesmo erro:

Tratam a saúde do gato de forma reativa — só vão ao vet quando algo está errado.

Recentemente acompanhamos um caso impressionante:

Uma tutora detectou sinais precoces de doença renal no gato dela porque registrava o peso toda semana no Gatedo. O diagnóstico precoce literalmente salvou a vida do animal.

E aqui existe um detalhe importante:

O que fez a diferença foi a consistência do registro. E aqui está o grande segredo.

Para ter esse resultado, você precisa dominar os três pilares:

a) Registro contínuo de saúde (não só em crises)
b) Alertas antecipados que funcionam como seu segundo cérebro
c) Comunidade de tutores para trocar experiências reais

Quer dominar esses pilares?

É exatamente o que o Gatedo oferece — gratuitamente.

🔗 Crie o perfil do seu gato. Link na bio.`,
  },
  {
    id: 16,
    title: 'Quer ajuda para cuidar do seu gato?',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Oferta', 'Guia', 'Próximo passo'],
    hook: 'Você quer ajuda para cuidar do seu gato do zero?',
    copy: `Você quer ajuda para cuidar do seu gato do zero — e parar de se sentir perdido quando o assunto é saúde felina?

Essa é a proposta do Gatedo.

Eu vou pessoalmente guiar você na construção do perfil de saúde do seu gato, com:

🐱 Cadastro completo de raça, idade e histórico
💉 Registro de todas as vacinas com alertas automáticos
🏥 Histórico de consultas organizado para o veterinário
📸 Diário de memórias e momentos especiais
🤖 IA para tirar dúvidas sobre comportamento e saúde

Para receber o link de acesso grátis e mais informações, basta clicar no link da bio.`,
  },
  {
    id: 17,
    title: 'Os 2 bloqueios de todo tutor',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Problema', 'Dor', 'Solução'],
    hook: 'Existem dois tipos de bloqueio que impedem todo tutor de cuidar bem do gato',
    copy: `Existem dois tipos de bloqueio que impedem a maioria dos tutores de cuidar bem do gato.

Primeiro: falta de sistema — não existe um lugar único para registrar tudo sobre o gato.

Segundo: falta de lembretes — a vida agitada faz a gente esquecer vacinas, consultas e vermífugos.

Basicamente esses são os dois grandes problemas que o Gatedo resolve.

Primeiro eu entendo exatamente o que você já tem registrado (ou não) sobre o seu gato, vou te mostrar como preencher o perfil e te apresentar o sistema completo de alertas.

Em seguida, você recebe um lembrete antes de cada vacina, consulta e medicação do seu gato — sem precisar se lembrar de nada.

Tudo o que o Gatedo quer é garantir que o seu gato tenha o acompanhamento de saúde que ele merece.

Faz sentido para você? Manda uma mensagem no DM para saber mais.`,
  },
  {
    id: 18,
    title: 'Se alguém perguntasse agora sobre a saúde do seu gato...',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Reflexão', 'Urgência', 'Engajamento'],
    hook: 'Se o veterinário te perguntasse agora: quando foi a última vacina do seu gato?',
    copy: `Se o veterinário te perguntasse agora:

"Quando foi a última vacina do seu gato? Qual foi o peso dele na última consulta? Ele tomou vermífugo esse semestre?"

Você saberia responder com precisão?

Muitas pessoas têm dificuldade com isso — não por falta de amor pelo gato, mas por não dominarem 3 pilares:

a) Registro organizado de saúde
b) Histórico acessível na palma da mão
c) Alertas automáticos antes do prazo vencer

São esses 3 pilares que separam o tutor que reage quando o gato já está doente do tutor que previne porque está sempre informado.

Foi pensando nisso que nós criamos o Gatedo.

Nele você terá acesso a:
→ Cadastro completo do gato
→ Histórico de vacinas e consultas
→ Alertas automáticos inteligentes
→ Diário de saúde e memórias
→ Comunidade de tutores felinos

Em outras palavras, tudo o que você precisa para nunca mais ser pego de surpresa.

🔗 Clique no link da bio para saber mais.`,
  },
  {
    id: 19,
    title: 'O erro de quem tenta cuidar do gato sem sistema',
    objetivo: 'Aquisição',
    formato: 'Feed / Meta Ads',
    canal: 'Instagram / Facebook',
    tipo: 'Pago',
    tags: ['Erro comum', 'Alternativa', 'Conversão'],
    hook: 'Se você quer gato saudável por muitos anos, preste muita atenção nisso',
    copy: `Se você quer gato saudável por muitos anos... Preste muita atenção nisso.

A maioria dos tutores que desejam isso tentam fazer tudo de cabeça — anotar vacinas no WhatsApp, lembrar consultas pela memória, guardar receitas na câmera do celular.

Mas de longe essa não é a melhor opção. Informação espalhada em 5 lugares diferentes não é sistema — é bagunça organizada.

Alguns tentam cadernetas físicas. Mas o que acontece é que a caderneta some, fica em casa quando você precisa dela no vet, ou simplesmente para de ser preenchida depois de 2 semanas.

Então qual a melhor estratégia para ter um gato realmente saudável e um histórico que realmente funciona?

É o que o Gatedo faz por mais de 23.000 tutores todo dia.

Um app 100% focado em gatos. Criado no Brasil, para o tutor brasileiro.

Comece grátis agora. 👇`,
  },
  {
    id: 20,
    title: 'O que atrasa a saúde do seu gato (sem você perceber)',
    objetivo: 'Aquisição',
    formato: 'Feed / Carrossel',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Educacional', 'Problema', '4 passos'],
    hook: 'Você sabe o que mais atrasa a saúde do seu gato?',
    copy: `Você sabe o que mais atrasa a saúde do seu gato — e você provavelmente está fazendo isso agora?

a) Tratar saúde de forma reativa (só vai ao vet quando já está ruim)
b) Não ter histórico organizado (cada consulta começa do zero)

Quando você cuida do gato sem registro contínuo, o resultado não acontece.

O veterinário não tem dados para trabalhar. Você não percebe mudanças graduais de peso ou comportamento. E quando algo aparece, a doença já evoluiu.

A verdade é que ou você cria um sistema de acompanhamento — ou vai sempre estar correndo atrás quando deveria estar prevenindo.

Mas como fazer isso?

Você precisa seguir esses 4 passos:

1️⃣ Criar um perfil completo com os dados do gato
2️⃣ Registrar cada vacina e consulta imediatamente
3️⃣ Ativar alertas automáticos para cada vencimento
4️⃣ Compartilhar o histórico com o veterinário antes da consulta

Felizmente, você pode colocar esses 4 passos em prática agora com o Gatedo — gratuitamente.

🔗 Link na bio para começar.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCO 03 — BENEFÍCIOS, PROVA SOCIAL E CONVERSÃO (21–30)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 21,
    title: 'Por que tutores usam o Gatedo (2 motivos reais)',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Motivação', 'Prova social', 'Produto'],
    hook: 'Tutores usam o Gatedo por dois motivos',
    copy: `Tutores usam o Gatedo por dois motivos.

a) Paz de espírito — saber que não vão esquecer nada importante
b) Conexão — ter um lugar real para celebrar o gato que amam

Então o que você precisa pensar é o seguinte:

Qual dessas dores ressoa mais com você agora?

Isso te ajuda a entender exatamente o que o Gatedo pode fazer pelo seu gato — e pela sua tranquilidade como tutor.

Ou você domina os dois motivadores do cuidado felino consciente, ou a chance de realmente transformar a saúde do seu gato é muito pequena.

É por isso que eu criei o Gatedo — endereçando os dois ao mesmo tempo: o sistema inteligente de saúde E a comunidade que celebra cada momento.

🔗 Comece grátis agora. Link na bio.`,
  },
  {
    id: 22,
    title: 'Gatedo Premium — Quero te ajudar por 30 dias',
    objetivo: 'Monetização',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Premium', 'Oferta', 'Mentoria'],
    hook: 'Você quer minha ajuda para transformar o cuidado do seu gato nos próximos 30 dias?',
    copy: `Você quer minha ajuda para transformar o cuidado do seu gato nos próximos 30 dias?

Se você não quer continuar se sentindo perdido sobre quando é a próxima vacina, o próximo vermífugo, a próxima consulta de rotina — esse é o seu próximo passo.

Com o Gatedo Premium você terá:

→ IA veterinária para tirar dúvidas quando precisar
→ Alertas avançados de saúde personalizados por raça e idade
→ Studio ilimitado para criar conteúdo do seu gato
→ Histórico de saúde exportável para o veterinário
→ Acesso antecipado a todas as novas funcionalidades

E mais do que isso: você vai fazer parte do grupo que está redefinindo como tutores cuidam dos seus gatos no Brasil.

Comece o período gratuito agora. Link na bio.`,
  },
  {
    id: 23,
    title: 'Objeção: meu gato não gosta de vet',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Objeção', 'Educacional', 'DM'],
    hook: '"Mas meu gato odeia ir ao veterinário" — sobre isso...',
    copy: `"Mas meu gato odeia ir ao veterinário."

Você acha que só consegue cuidar bem do gato quem tem um animal dócil e comportado nas consultas? Isso definitivamente é um mito.

Você cuida bem do gato quando tem informação organizada — quando chega na consulta com histórico completo e o veterinário trabalha com dados reais ao invés de adivinhar.

Um gato estressado no vet vai muito melhor quando a consulta é objetiva, rápida e baseada em dados — não em "acho que foi uns 6 meses atrás".

E é exatamente isso que o Gatedo resolve.

Mas como registrar tudo isso de forma simples?

Quanto tempo leva para cadastrar o perfil?
Como programar alertas de vacina?
Dá para compartilhar com o veterinário?
Como usar a IA veterinária do app?

Você vai aprender absolutamente tudo isso usando o Gatedo.

Manda "eu quero" no DM e te envio o link de acesso grátis.`,
  },
  {
    id: 24,
    title: 'O grande erro do perfil incompleto',
    objetivo: 'Ativação',
    formato: 'Feed / Push',
    canal: 'Instagram / Push',
    tipo: 'Orgânico',
    tags: ['Ativação', 'Erro', 'Perfil'],
    hook: 'Um grande erro que muitos cometem ao cadastrar o gato no Gatedo',
    copy: `Um grande erro que muitos cometem ao cadastrar o gato no Gatedo.

Isso torna o app muito menos poderoso.

A maioria começa pensando:

"Vou adicionar só o básico agora e completar depois."

Você precisa mudar essa maneira de pensar.

O ideal é fazer o seguinte:

Preencha o perfil completo na primeira sessão — raça, data de nascimento, peso atual, todas as vacinas que você já tem anotadas em algum lugar.

Em outras palavras:

Ao invés de ter um app pela metade, comece a ter um sistema de saúde completo desde o primeiro acesso.

Além desse, existem outros pontos que fazem toda a diferença no uso do Gatedo.

É exatamente eles que compartilho com todos os novos tutores que se cadastram.

🔗 Crie o perfil completo do seu gato agora. Link na bio.`,
  },
  {
    id: 25,
    title: 'Os próximos 15 dias do gato do seu coração',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Urgência', 'Janela', 'Ação imediata'],
    hook: 'Os próximos 15 dias podem impactar a saúde do seu gato pelo resto do ano',
    copy: `Os próximos 15 dias podem impactar a saúde do seu gato pelo resto do ano.

Existe uma janela que a grande maioria dos tutores deixa passar todo começo de semestre.

Você pode começar agora a construir um histórico real de saúde — que vai fazer a diferença em toda consulta do ano.

Existe uma estratégia muito específica para seguir nesse início:

Se você aproveitar essa janela, o primeiro mês usando o Gatedo vai te colocar em uma posição de grande vantagem como tutor.

Que estratégia é essa?
Qual o histórico que precisa ser preenchido primeiro?
O que não pode ficar de fora do perfil?

Eu preparei um guia completo para os 15 primeiros dias no Gatedo.

Acesso grátis ao criar o perfil do seu gato. Link na bio.`,
  },
  {
    id: 26,
    title: '3 vantagens de quem usa o Gatedo',
    objetivo: 'Branding',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Vantagens', 'Autoridade', 'DM'],
    hook: 'Quem usa o Gatedo tem 3 grandes vantagens sobre outros tutores',
    copy: `A verdade é a seguinte:

Quem usa o Gatedo tem 3 grandes vantagens sobre outros tutores.

Vantagem nº 1: Nunca chega desinformado em uma consulta veterinária — o histórico completo fica sempre disponível no celular.

Vantagem nº 2: Detecta mudanças na saúde do gato antes de virar emergência — porque está registrando peso e comportamento de forma contínua.

Vantagem nº 3: Vive a relação com o gato de um jeito mais leve — porque o sistema cuida dos lembretes enquanto você cuida do amor.

O problema é que muitas pessoas ainda não sabem que esse app existe.

É por isso que eu compartilho isso hoje com você.

Se você quer ter acesso, crie o perfil do seu gato grátis agora.

🔗 Link na bio.`,
  },
  {
    id: 27,
    title: 'Os bastidores do Gatedo (Story/Reels)',
    objetivo: 'Branding',
    formato: 'Reels / Stories',
    canal: 'Instagram / TikTok',
    tipo: 'Orgânico',
    tags: ['Bastidores', 'Curiosidade', 'DM'],
    hook: 'O que você acha de conhecer os bastidores de como o Gatedo cuida de 23.000 gatos?',
    copy: `O que você acha de conhecer os bastidores de como o Gatedo acompanha mais de 23.000 gatos no Brasil?

Acabamos de liberar uma aula mostrando exatamente como funciona por dentro.

Você vai ter a chance de ver os bastidores do sistema mais completo de saúde felina do país — alertas automáticos, IA veterinária, Comunigato e Studio.

Não existe nada mais poderoso que ter tudo sobre o gato do seu coração em um único lugar.

Pega o link pelo DM.`,
  },
  {
    id: 28,
    title: 'Feature nova: IA Veterinária no Gatedo',
    objetivo: 'Ativação / Retenção',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Feature', 'IA', 'Novidade'],
    hook: 'Acabamos de lançar algo que vai mudar como você cuida do seu gato',
    copy: `Acabamos de lançar algo que vai mudar como você cuida do seu gato.

Se você ainda não sabe do que estou falando, recomendo fortemente que você veja o que acabou de entrar no Gatedo.

Nesta atualização eu liberei a IA Veterinária — que responde suas dúvidas sobre saúde, comportamento e alimentação do gato a qualquer hora do dia.

Você vai poder perguntar:

"Meu Bengal de 3 anos está comendo menos. O que pode ser?"
"Quando devo dar o próximo vermífugo para minha gata de 2 kg?"
"Esses sintomas indicam algo grave?"

E receber orientação baseada em medicina felina — de graça, no mesmo app onde você já acompanha a saúde do gato.

🔗 Clique no link do perfil para atualizar o app e acessar a IA.`,
  },
  {
    id: 29,
    title: 'Lançamento Oficial — Gatedo Premium com Desconto',
    objetivo: 'Monetização',
    formato: 'Feed',
    canal: 'Instagram / Facebook',
    tipo: 'Pago',
    tags: ['Lançamento', 'Desconto', 'Urgência'],
    hook: 'Agora é OFICIAL — liberamos o Gatedo Premium com 40% de desconto',
    copy: `Agora é OFICIAL...

Acabamos de liberar o Gatedo Premium com 40% de desconto por tempo limitado.

Nele você vai ter acesso a:

Uma experiência completa e poderosa de cuidado felino — saúde, criatividade e comunidade em um único app.

A verdade é que não existe nada tão poderoso quanto acompanhar a saúde do gato de forma contínua e inteligente para quem quer que o animal viva muito e com qualidade.

Além disso, no Premium você vai ter:

✅ IA Veterinária ilimitada
✅ Studio sem marca d'água + templates exclusivos
✅ Alertas avançados por raça e idade
✅ Histórico exportável para o vet
✅ Insígnias exclusivas no Comunigato

Garanta agora com desconto clicando no link do perfil. O desconto vai até [DATA].`,
  },
  {
    id: 30,
    title: 'Aula: como manter gato saudável por anos',
    objetivo: 'Aquisição',
    formato: 'Feed / Reels',
    canal: 'Instagram / TikTok',
    tipo: 'Orgânico',
    tags: ['Conteúdo', 'Bastidores', 'Educacional'],
    hook: 'AULA NOVA: os bastidores de como manter um gato saudável por 15 anos ou mais',
    copy: `AULA NOVA com os bastidores de como manter um gato saudável e feliz por 15 anos ou mais.

Esse é o EXATO processo para construir um histórico de saúde felina que o veterinário consegue usar de verdade.

Esta é a aula 01 do que ensinamos dentro do Gatedo — e liberamos gratuitamente por tempo limitado.

Nela eu explico toda a jornada do zero: como cadastrar o primeiro gato, como configurar os alertas, como usar o histórico na consulta.

De uma maneira didática e dividida em etapas claras e práticas.

Vamos remover a aula em breve — sugiro que você assista o quanto antes.

🔗 Clique no link do perfil agora e assista gratuitamente.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCO 04 — ENGAJAMENTO, COMUNIDADE E STUDIO (31–40)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 31,
    title: 'O processo exato do Comunigato',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Comunigato', 'Social', 'Processo'],
    hook: 'O que você acha de conhecer o processo exato que usamos para conectar 23k tutores?',
    copy: `O que você acha de conhecer o processo exato que usamos para conectar mais de 23.000 tutores de gatos no Brasil?

Acabamos de liberar uma aula mostrando o Comunigato por dentro.

Você vai conhecer os bastidores da estratégia mais poderosa para tutores felinos — que é criar um perfil social real para o seu gato.

O gato tem nome, foto, raça, histórico e uma comunidade inteira torcendo por ele.

Se você quer que o seu gato tenha um lugar só dele na internet — não existe nada mais completo que o Comunigato.

🔗 Clique no link do perfil para conhecer mais.`,
  },
  {
    id: 32,
    title: 'Lançamento: Gatedo Studio agora disponível',
    objetivo: 'Ativação',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Studio', 'Lançamento', 'Criativo'],
    hook: 'Agora é OFICIAL! O Gatedo Studio está disponível para todos os tutores',
    copy: `Agora é OFICIAL!

O Gatedo Studio está disponível para todos os tutores brasileiros.

Você pode criar agora o conteúdo mais bonito que já fez sobre o seu gato — de graça.

O Studio é um gerador de conteúdo criativo 100% focado em felinos. Com ele você vai criar:

→ Stickers personalizados com o rosto do seu gato
→ Retratos artísticos em diferentes estilos
→ Carteirinha digital oficial do seu gato
→ Dança e animação com o seu felino

O grande desafio para muitos tutores é criar conteúdo bonito sem saber design. E é exatamente isso que o Studio resolve — em segundos.

Faça seu primeiro criativo agora. Link na bio.`,
  },
  {
    id: 33,
    title: 'Última chance — Gatedo Premium antes do reajuste',
    objetivo: 'Monetização',
    formato: 'Feed',
    canal: 'Instagram / Facebook',
    tipo: 'Pago',
    tags: ['Urgência', 'Reajuste', 'Premium'],
    hook: 'Essa pode ser a última chance para ter o Gatedo Premium com todos os bônus e valor atual',
    copy: `Essa pode ser a última chance para você ter acesso ao Gatedo Premium com todos os benefícios e valor atual antes do próximo reajuste.

Eu gosto de dizer que: tutor consciente não espera a doença aparecer para agir.

É por isso que criamos o Gatedo Premium — para o tutor que quer ir um passo à frente.

No Premium você vai ter:

✅ IA Veterinária ilimitada (disponível 24h)
✅ Studio sem marca d'água e templates exclusivos
✅ Alertas personalizados por raça e faixa etária
✅ Exportação de histórico para o veterinário
✅ Badge de Tutor Consciente no Comunigato

Se você dominar esses recursos e construir o hábito de cuidar do gato com o Gatedo, os próximos anos do seu felino vão ser radicalmente diferentes.

A hora é agora.

🔗 Clique no link do perfil e garanta sua vaga.`,
  },
  {
    id: 34,
    title: 'Gravei uma aula sobre saúde felina preventiva',
    objetivo: 'Aquisição',
    formato: 'Feed / Stories',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Aula', 'Conteúdo', 'DM'],
    hook: 'Gravei uma aula de 12 minutos sobre saúde felina preventiva',
    copy: `Recentemente gravei uma aula de 12 minutos sobre saúde felina preventiva.

Esse é o vídeo que vai literalmente mudar como você cuida do seu gato.

Nessa aula eu explico os detalhes sobre:

→ Os 3 sinais silenciosos de doença renal que todo tutor precisa conhecer
→ Como o peso do gato é o primeiro indicador de saúde que muda
→ Por que a frequência urinária é mais importante que o veterinário pergunta
→ O que registrar (e quando) para a consulta ser mais eficiente

Essa é a chance de você conhecer por dentro o que o Gatedo acompanha em 23.000 gatos todo dia.

Pega o link para assistir pelo DM, enquanto está grátis.`,
  },
  {
    id: 35,
    title: 'E se você tivesse templates prontos de cuidado felino?',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Template', 'Solução', 'DM'],
    hook: 'O que você acha de ter todo o sistema de cuidado do seu gato já pronto?',
    copy: `O que você acha de ter todo o sistema de cuidado do seu gato já pronto — sem precisar criar nada do zero?

Ainda dá tempo de você aproveitar e ter:

📋 Perfil completo de saúde do gato já estruturado
💉 Calendário de vacinas já configurado
🔔 Alertas automáticos já programados
🏥 Modelo de compartilhamento com veterinário pronto

De uma dor constante de "preciso me organizar com o gato" por um sistema que funciona sozinho.

TODO o material já está disponível no Gatedo para você começar imediatamente.

Crie o perfil do seu gato grátis agora. 🔗 Link na bio.`,
  },
  {
    id: 36,
    title: 'A raiz do problema da saúde felina',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Educacional', 'Problema', 'Solução'],
    hook: 'A principal dificuldade de muitos tutores não é o que parece',
    copy: `Uma das principais dificuldades de muitos tutores para manter o gato saudável é: falta de tempo.

Mas o problema não é esse. O erro é não ter um sistema que funcione sem depender de memória ou motivação.

Sim, existe uma estratégia muito específica para manter o gato em dia mesmo com uma rotina agitada.

Essa estratégia é poderosa para qualquer tutor — de quem tem um único SRD a quem cuida de múltiplos gatos de raça.

Eu escrevi um guia completo compartilhando os detalhes dessa estratégia, e você pode ter acesso grátis ao criar o perfil do seu gato no Gatedo.

🔗 Comece agora. Link na bio.`,
  },
  {
    id: 37,
    title: 'Mais saúde + mais memórias + mais tranquilidade',
    objetivo: 'Aquisição',
    formato: 'Feed / Meta Ads',
    canal: 'Instagram / Facebook',
    tipo: 'Pago',
    tags: ['Benefício', 'Simples', 'Conversão'],
    hook: 'Mais saúde. Mais memórias. Mais tranquilidade.',
    copy: `Mais saúde para o seu gato.
Mais memórias para você guardar.
Mais tranquilidade no dia a dia.

Tudo ao mesmo tempo. Com um único app.

É exatamente isso que o Gatedo oferece para tutores de gatos no Brasil.

Acabamos de abrir o acesso grátis para novos tutores.

Se você não está conseguindo manter o histórico de saúde organizado, não sabe quando é a próxima vacina, ou sente que poderia cuidar melhor do seu gato — experimente o Gatedo agora.

Crie o perfil do seu gato e veja a diferença em 10 minutos.

🔗 Link na bio.`,
  },
  {
    id: 38,
    title: 'Programa seleto: bastidores do Gatedo',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Exclusivo', 'Bastidores', 'Curiosidade'],
    hook: 'Acabamos de liberar algo muito especial para tutores que levam o gato a sério',
    copy: `Acabamos de liberar uma oportunidade muito especial. Preciso compartilhar isso com vocês.

Um dos nossos materiais de maior impacto para tutores felinos é o Guia do Tutor Consciente.

É um guia seleto — muitos tutores ainda não sabem que ele existe.

Nele eu ensino como construir um sistema completo de acompanhamento de saúde do gato, que inclui:

→ Os dados mais importantes para registrar (e quando)
→ Como usar o histórico para melhorar cada consulta
→ Como detectar os sinais precoces das 5 doenças mais comuns em gatos

E a verdade é que os tutores que aplicam esse guia chegam nas consultas com muito mais confiança e dados.

Então decidi: vou liberar o guia completo gratuitamente para quem criar o perfil do gato no Gatedo essa semana.

🔗 Clique no link da bio. Liberado por tempo limitado.`,
  },
  {
    id: 39,
    title: 'Se tornar o tutor que seu gato merece',
    objetivo: 'Branding',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Sonho', 'Emocional', 'Identidade'],
    hook: 'O que você acha da ideia de se tornar o tutor que seu gato merece ter?',
    copy: `O que você acha da ideia de se tornar o tutor que o seu gato merece ter?

Eu não falo apenas de dar boa ração e vacinar em dia — isso qualquer um faz.

Mas de ser o tutor que conhece cada detalhe da saúde do gato, que tem histórico completo pronto para o vet, que detecta problemas antes de virarem emergência, que celebra cada momento da vida do felino com carinho e intenção.

É exatamente isso que o Gatedo te ajuda a ser.

Mesmo que você nunca tenha usado nenhum app de saúde pet, seguindo o sistema do Gatedo você vai se tornar um tutor completamente diferente em 30 dias.

A oferta de acesso grátis está disponível agora.

🔗 Clique no link do perfil para começar.`,
  },
  {
    id: 40,
    title: 'PDF Gratuito: Guia do Tutor Consciente',
    objetivo: 'Aquisição / Lead',
    formato: 'Feed / Stories',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Lead magnet', 'PDF', 'Gratuito'],
    hook: 'Acabei de liberar o PDF gratuito — Guia do Tutor Consciente',
    copy: `Acabei de liberar o download do PDF: Guia do Tutor Consciente.

Esse é um material exclusivo que compartilho com os tutores mais engajados do Gatedo.

Mas você pode ter acesso a ele agora. Gratuitamente.

Nele você vai ter acesso a:

→ Como montar um calendário de saúde felina em 10 minutos
→ Como identificar os 5 sinais de alerta mais ignorados pelos tutores
→ Como preparar o gato e você mesmo para uma consulta de rotina mais eficiente
→ Como usar a tecnologia a favor da saúde do seu felino
→ Como construir um histórico que o veterinário consegue usar de verdade

🔗 Clique no link da bio para liberar o PDF completo e gratuitamente.

PS: Disponível por pouco tempo.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCO 05 — URGÊNCIA, OFERTAS E CONVERSÃO FINAL (41–50)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 41,
    title: 'Faça isso HOJE pelo seu gato',
    objetivo: 'Aquisição',
    formato: 'Feed / Stories',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Urgência', 'Ação imediata', 'Direto'],
    hook: 'Faça isso HOJE se quiser um gato verdadeiramente saudável',
    copy: `Faça isso HOJE se quiser um gato verdadeiramente saudável nos próximos anos.

Uma das regras mais poderosas do mundo dos tutores felinos é: o acompanhamento preventivo salva vidas.

MAS...

O que deve estar passando na sua cabeça é:

Como criar o sistema sem gastar horas?
Como manter o hábito de registrar sem esquecer?

É exatamente isso que o Gatedo resolve — alertas automáticos que funcionam enquanto você vive sua vida.

Não importa se você tem dificuldade em se organizar ou se nunca usou nenhum app de saúde pet.

Se você criar o perfil do gato agora e ativar os alertas, você já está no caminho certo.

🔗 Comece agora. Link na bio.`,
  },
  {
    id: 42,
    title: 'O que diferencia você de outros tutores?',
    objetivo: 'Engajamento',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Reflexão', 'Diferencial', 'Consultoria'],
    hook: 'O que você tem de diferente de outros tutores de gatos?',
    copy: `O que você tem de diferente de outros tutores de gatos?

Pense um pouco sobre isso: você está conseguindo acompanhar a saúde do gato com consistência?

Você está conseguindo chegar em toda consulta com o histórico completo na mão?

Esse é um dos grandes desafios de tutores que amam o gato mas ainda não têm um sistema.

Como ter um gato saudável sem depender só da memória e da boa vontade?

Essa é uma das primeiras coisas que o Gatedo resolve. Nós começamos pelo cadastro completo do gato e concluímos com um sistema de acompanhamento que funciona automaticamente.

Uma única sessão no app é suficiente para transformar completamente como você cuida do seu felino.

🔗 Comece grátis. Link na bio.`,
  },
  {
    id: 43,
    title: 'Uma proposta única para tutores que amam gatos',
    objetivo: 'Aquisição',
    formato: 'Feed / Meta Ads',
    canal: 'Facebook / Instagram',
    tipo: 'Pago',
    tags: ['Proposta', 'Urgência', 'Conversão'],
    hook: 'Uma proposta única para tutores que levam a saúde do gato a sério',
    copy: `Uma proposta única. Algo que pode, de uma vez por todas, transformar como você cuida do seu gato.

Estou falando da oportunidade de nunca mais esquecer uma vacina, nunca mais chegar no vet sem histórico, nunca mais perder um sinal precoce de doença.

Estou falando sobre ter um sistema completo de saúde felina no celular — gratuito, em português, criado especificamente para gatos.

Essas são as promessas do Gatedo:

✅ Alertas automáticos de vacinas e consultas
✅ Histórico completo sempre disponível
✅ IA para tirar dúvidas sobre o gato
✅ Comunidade de tutores que entendem você
✅ Studio criativo para celebrar seu felino

Se você quer ser o tutor que o seu gato merece — essa é uma excelente oportunidade.

Mas você precisa agir: o acesso grátis está disponível agora.

🔗 Link na bio.`,
  },
  {
    id: 44,
    title: 'Super projeto — O Gatedo cresce com você',
    objetivo: 'Branding',
    formato: 'Feed / Stories (Enquete)',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Engajamento', 'Enquete', 'Bastidores'],
    hook: 'Quero compartilhar um super projeto que vai mudar o cuidado de gatos no Brasil',
    copy: `Quero compartilhar com você um super projeto que vai transformar como tutores cuidam dos seus gatos no Brasil.

Esse é o tipo de novidade que você não vai querer perder.

Preste atenção.

Estamos construindo a maior plataforma de saúde felina da América Latina — e você vai fazer parte disso desde o início.

Vai funcionar mais ou menos assim:

✅ Mais alertas inteligentes por raça e faixa etária
✅ Aumento de recursos de IA veterinária
✅ Mais chances de detectar problemas antes do vet
✅ Melhora completa do sistema de memórias e diário
✅ Menos chance de ser pego de surpresa por uma doença

Nós estamos criando do zero tudo o que um tutor precisa para cuidar bem do gato nos próximos anos.

Quer acompanhar os bastidores desse projeto?

[ENQUETE: SIM / CLARO QUE SIM]`,
  },
  {
    id: 45,
    title: 'O pensamento que trava tutores',
    objetivo: 'Aquisição',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Mentalidade', 'Educacional', 'Cupom'],
    hook: 'A maioria dos tutores dedica tempo pensando na ração certa — mas ignora o registro',
    copy: `A maioria dos tutores de gatos dedica horas pesquisando a ração perfeita.

Mas na verdade o que transforma a saúde do gato a longo prazo é o acompanhamento contínuo — não apenas a dieta.

Focar apenas na ração na maioria das vezes dificulta a detecção precoce de doenças.

Perceba que estou falando sobre duas coisas diferentes:

01 - Ração (o que entra)
02 - Monitoramento (o que acontece depois)

É essa diferença de foco que normalmente separa os tutores que detectam problemas cedo dos que só descobrem quando já é emergência.

É por isso que eu criei o Gatedo — específico para o tutor que quer dominar o monitoramento contínuo.

A boa notícia é que você pode ter acesso agora com o código TUTOR20 e ganhar 20% de desconto no Gatedo Premium.

Solicite o link de acesso pelo DM.`,
  },
  {
    id: 46,
    title: 'Todo mundo fala de ração. Ninguém fala de dados.',
    objetivo: 'Branding',
    formato: 'Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Posicionamento', 'Diferente', 'Live'],
    hook: 'O mercado pet fala muito sobre ração. Mas e que tal falar sobre dados de saúde felina?',
    copy: `O mercado pet brasileiro ainda fala muito sobre ração, brinquedo e acessório.

Mas e que tal pensar em dados de saúde — o que realmente determina quanto tempo e com que qualidade o seu gato vai viver?

Que tal conseguir detectar uma doença renal antes de ela virar crise? Que tal chegar no vet com histórico completo e sair com diagnóstico mais preciso?

Parece uma boa ideia para você?

Amanhã eu vou apresentar como o Gatedo usa tecnologia para fazer exatamente isso — em uma aula gratuita ao vivo.

Se você tem interesse em participar ao vivo, clique no link do perfil.`,
  },
  {
    id: 47,
    title: 'Todo mundo sabe. Poucos fazem.',
    objetivo: 'Aquisição',
    formato: 'Stories / Feed',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['Contraste', 'Live', 'Inscrição'],
    hook: 'Todo mundo sabe que para gato saudável precisa de acompanhamento',
    copy: `Todo mundo sabe que para ter um gato saudável você precisa de acompanhamento veterinário regular e registro consistente.

O grande desafio para a maioria dos tutores é:

Como fazer isso de um jeito simples e automático — sem depender de memória, caderneta ou alarme no celular?

Pois bem. Você precisa de:

→ Um sistema que registre e alerte por você
→ Um app que fale a língua do tutor felino
→ Uma comunidade que entende o que você sente

Interessante né?

É exatamente isso que vou te mostrar AMANHÃ, numa aula gratuita.

"Gatedo: o sistema de saúde felina que funciona sozinho"

Solicite sua inscrição pelo DM e garanta sua vaga.`,
  },
  {
    id: 48,
    title: 'A grande promessa do Gatedo',
    objetivo: 'Branding',
    formato: 'Feed',
    canal: 'Instagram / Facebook',
    tipo: 'Pago',
    tags: ['Promessa', 'Emocional', 'Desconto'],
    hook: 'Ter um gato saudável, feliz e bem cuidado por muitos anos',
    copy: `Ter um gato saudável, feliz e bem cuidado por muitos anos.

Essa é a meta que a maioria dos tutores me apresenta quando começa a usar o Gatedo.

Foi por isso que eu decidi criar um app com exatamente essa missão.

Nele eu apresento um plano detalhado para alcançar isso:

O sistema de alertas automáticos, o histórico de saúde contínuo, a IA veterinária, o Comunigato e o Studio — absolutamente tudo o que você precisa se quiser ser o tutor que o seu gato merece.

A boa notícia?

Ainda dá tempo de garantir com 40% OFF. Clique no link do perfil e garanta o Gatedo Premium com super desconto agora.`,
  },
  {
    id: 49,
    title: 'Inscrições abertas — Gatedo Premium',
    objetivo: 'Monetização',
    formato: 'Feed',
    canal: 'Instagram / Facebook',
    tipo: 'Pago',
    tags: ['Lançamento', 'Premium', 'Conversão'],
    hook: 'Acabamos de liberar oficialmente as inscrições para o Gatedo Premium',
    copy: `Acabamos de liberar oficialmente as inscrições para o Gatedo Premium.

Esse é um plano COMPLETO para o tutor que quer ir além do básico no cuidado do gato.

Nós vamos te ajudar a construir o sistema de saúde felina mais completo e organizado que você já teve.

Você nunca viu nada tão prático e certeiro para quem leva o gato a sério — sem precisar ser veterinário ou especialista.

Você como tutor vai conseguir dominar completamente o acompanhamento de saúde do gato.

Mas não se deixe enganar pela simplicidade — o sistema é extremamente poderoso.

Por que um valor tão acessível?

É simples: queremos massificar o cuidado felino de qualidade no Brasil e te mostrar tudo o que o Gatedo pode fazer antes de você ir para próximos passos conosco.

🔗 Clique no link do perfil e faça sua inscrição.`,
  },
  {
    id: 50,
    title: 'O próximo passo do tutor que seu gato merece',
    objetivo: 'Aquisição',
    formato: 'Feed / Reels',
    canal: 'Instagram',
    tipo: 'Orgânico',
    tags: ['CTA Final', 'Identidade', 'Emocional'],
    hook: 'Se você deseja ser o tutor que seu gato merece, o Gatedo é o seu próximo passo',
    copy: `Se você deseja se tornar o tutor que o seu gato merece ter, seguir esse sistema é o seu próximo passo ideal.

Deixa eu te dizer o que todo tutor consciente precisa fazer:

Construir um histórico real de saúde felina. Ativar alertas automáticos antes de cada vencimento. Criar um perfil que celebra a vida do gato — não só registra doenças.

A boa notícia é que:

Criamos o Gatedo para você ler, entender e usar tudo o que precisa para se tornar um tutor completamente diferente — e colocar em prática imediatamente.

Para tornar ainda mais fácil o começo, estamos com acesso grátis liberado agora.

Então, a partir de hoje:

Crie o perfil do seu gato em 5 minutos e comece a construir o histórico que ele merece.

🔗 Link na bio. Grátis para começar.`,
  },
];

// ─── Config ──────────────────────────────────────────────────────────────────
const OBJETIVOS = ['Todos','Aquisição','Ativação','Retenção','Monetização','Branding','Engajamento'];
const FORMATOS  = ['Todos','Feed','Stories','Reels','Carrossel','Meta Ads','Push'];
const TIPOS     = ['Todos','Orgânico','Pago'];

const OBJ_COLORS = {
  'Aquisição':'#10b981','Ativação':'#3b82f6','Retenção':'#f59e0b',
  'Monetização':P,'Branding':'#ec4899','Engajamento':'#6366f1','Lead':'#f97316',
};

// ─── Card ─────────────────────────────────────────────────────────────────────
function CopyCard({ item, starred, onStar }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(item.copy).catch(()=>{});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md
      ${open ? 'border-purple-200' : 'border-gray-100 hover:border-purple-100'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: OBJ_COLORS[item.objetivo] || P }}>{item.objetivo}</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{item.formato}</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                style={item.tipo === 'Pago' ? { backgroundColor: '#fef3c7', color: '#d97706', borderColor:'#fde68a' } : { backgroundColor: '#f0fdf4', color: '#15803d', borderColor:'#bbf7d0' }}>
                {item.tipo}
              </span>
            </div>
            <p className="text-sm font-black text-gray-900 leading-tight">{item.title}</p>
            <p className="text-[11px] text-gray-400 mt-1 italic leading-snug line-clamp-2">"{item.hook}"</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => onStar(item.id)}
              className={`p-1.5 rounded-lg transition-colors ${starred ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}>
              <Star size={14} fill={starred ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100">{t}</span>
          ))}
        </div>

        {open && (
          <div className="mt-3 mb-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{item.copy}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            {open ? <><ChevronDown size={12} className="rotate-180" /> Recolher</> : <><BookOpen size={12} /> Ver copy</>}
          </button>
          <button onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-xl text-white transition-all active:scale-95"
            style={{ backgroundColor: copied ? '#10b981' : P }}>
            {copied ? <><CheckCircle2 size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminCopyBank() {
  const [starred, setStarred] = useLS('gatedo_copybank_stars', {});
  const [search, setSearch]   = useState('');
  const [obj, setObj]         = useState('Todos');
  const [fmt, setFmt]         = useState('Todos');
  const [tipo, setTipo]       = useState('Todos');
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [view, setView]       = useState('grid');

  const toggleStar = id => setStarred(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = COPIES.filter(c => {
    if (onlyStarred && !starred[c.id]) return false;
    if (obj  !== 'Todos' && c.objetivo !== obj) return false;
    if (fmt  !== 'Todos' && !c.formato.includes(fmt)) return false;
    if (tipo !== 'Todos' && c.tipo !== tipo) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.hook.toLowerCase().includes(q) || c.copy.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const starredCopies = COPIES.filter(c => starred[c.id]);

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-7"
        style={{ background: `linear-gradient(135deg, #0f0a1e, #1e0a38)` }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(ellipse at 8% 50%, ${P} 0%, transparent 50%), radial-gradient(ellipse at 90% 30%, ${A}80 0%, transparent 50%)` }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: A }}>
                <BookOpen size={14} style={{ color: P }} />
              </div>
              <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: A }}>
                Gatedo · Banco de Copy
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              50 Copies Prontos — Voz Gatedo
            </h1>
            <p className="text-white/50 text-xs mt-1 max-w-lg">
              Todos os 50 templates adaptados à linguagem e posicionamento do Gatedo.
              Orgânico, pago, stories, feed, reels — prontos para copiar e usar agora.
            </p>
          </div>
          <div className="flex gap-3">
            {[
              { label: 'Copies prontos', value: COPIES.length },
              { label: 'Salvos', value: starredCopies.length },
              { label: 'Tipos', value: '7 objetivos' },
            ].map(k => (
              <div key={k.label} className="rounded-2xl px-4 py-2.5 border border-white/10 text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-xl font-black text-white">{k.value}</p>
                <p className="text-[9px] text-white/40 font-medium mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título, hook, tag..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-purple-300" />
          </div>
          <button onClick={() => setOnlyStarred(!onlyStarred)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all border
              ${onlyStarred ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50'}`}>
            <Star size={12} fill={onlyStarred ? 'currentColor' : 'none'} />
            Salvos ({starredCopies.length})
          </button>
          <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
            {['grid','list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${view === v ? 'text-white shadow-sm' : 'text-gray-400'}`}
                style={view === v ? { backgroundColor: P } : {}}>
                {v === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Objetivo', val: obj, set: setObj, opts: OBJETIVOS },
            { label: 'Formato', val: fmt, set: setFmt, opts: FORMATOS },
            { label: 'Tipo', val: tipo, set: setTipo, opts: TIPOS },
          ].map(f => (
            <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)}
              className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-300">
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
          <button onClick={() => { setObj('Todos'); setFmt('Todos'); setTipo('Todos'); setSearch(''); setOnlyStarred(false); }}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
            Limpar filtros
          </button>
          <span className="ml-auto text-[10px] text-gray-400 self-center font-medium">
            {filtered.length} copies
          </span>
        </div>
      </div>

      {/* Objective quick filters */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(OBJ_COLORS).map(([key, color]) => (
          <button key={key} onClick={() => setObj(obj === key ? 'Todos' : key)}
            className="text-[10px] font-black px-3 py-1.5 rounded-full transition-all border"
            style={obj === key
              ? { backgroundColor: color, color: '#fff', borderColor: color }
              : { backgroundColor: `${color}12`, color, borderColor: `${color}30` }}>
            {key} ({COPIES.filter(c => c.objetivo === key).length})
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className={view === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
          : 'space-y-3'}>
          {filtered.map(item => (
            <CopyCard key={item.id} item={item}
              starred={!!starred[item.id]}
              onStar={toggleStar} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-300">
          <Search size={32} className="mx-auto mb-3" />
          <p className="text-sm font-bold">Nenhum copy encontrado</p>
          <p className="text-xs mt-1">Tente outros filtros</p>
        </div>
      )}

    </div>
  );
}
