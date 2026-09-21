type FelineAlmanacInput = {
  symptomId?: string;
  symptomLabel?: string;
  pet?: any;
  clinicalContext?: any;
};

type KnowledgeCluster = {
  title: string;
  watch: string[];
  differentials: string[];
  tutorGuidance: string[];
  escalation: string[];
};

const universalEmergencySignals = [
  'respiracao pela boca, esforco respiratorio, gengiva azulada/palida ou postura de ar',
  'macho tentando urinar sem produzir urina, dor vocalizando na caixa ou urina em gotas',
  'colapso, convulsao, desmaio, fraqueza extrema ou perda de consciencia',
  'paralisia subita, principalmente membros posteriores frios/doloridos',
  'trauma, queda, atropelamento, sangramento persistente ou ferida profunda',
  'vomitos repetidos com prostracao, sangue, barriga distendida ou gato sem comer por 24h',
  'suspeita de toxico: paracetamol, ibuprofeno, permetrina, lirios, venenos, produtos de limpeza',
  'olho fechado com dor, cornea opaca/azulada, pupila muito diferente ou mancha escura na cornea',
];

const coreDoctrine = [
  'O iGentVet faz triagem educativa e pre-orientacao. Nunca confirmar diagnostico definitivo.',
  'Nao prescrever dose, receita, antibiotico, corticoide, analgesico ou ajuste de medicacao.',
  'Nunca sugerir medicamento humano como solucao caseira. Paracetamol, ibuprofeno e permetrina sao perigosos para gatos.',
  'Sempre separar: sinais observados, hipoteses possiveis, sinais de urgencia e proximos passos seguros.',
  'Se houver qualquer red flag, orientar atendimento veterinario presencial imediatamente ou em janela curta.',
  'Quando nao houver urgencia, orientar monitoramento objetivo: apetite, agua, urina, fezes, dor, energia, respiracao e evolucao em horas/dias.',
  'Cruzar idade, raca, sexo, castracao, peso, ambiente, dieta, vacinas, medicacoes, documentos e historico.',
  'Considerar que gatos escondem dor: mudanca discreta de comportamento pode ser sinal clinico relevante.',
  'Sempre fazer pelo menos uma pergunta de triagem que reduza incerteza do quadro atual.',
];

const felineContextInterpreter = [
  'Filhote: pensar mais em parasitas, viroses, hipoglicemia, ingestao inadequada, calendario vacinal incompleto e risco rapido de desidratacao.',
  'Adulto jovem: cruzar ambiente, acesso a rua, estresse, brigas, dieta, parasitas, saude urinaria e comportamento.',
  'Maduro/senior: elevar suspeita para doenca renal cronica, hipertireoidismo, diabetes, hipertensao, neoplasias, osteoartrite, doenca dentaria e perda muscular.',
  'Macho: qualquer esforco urinario e potencialmente mais urgente por risco de obstrucao uretral.',
  'Obeso: falta de apetite por 24-48h aumenta preocupacao com lipidose hepatica; tambem aumenta risco metabolico e articular.',
  'Acesso a rua: elevar risco de trauma, briga/abscesso, parasitas, retroviroses, intoxicacao e doencas infecciosas.',
  'Vacinas vencidas/ausentes: considerar risco infeccioso sem afirmar causalidade; recomendar revisao preventiva com veterinario.',
  'Medicacao ativa: pode mascarar dor/febre, causar efeitos adversos ou interagir com sintomas; orientar revisar com vet antes de mudar algo.',
];

const breedPredispositions: Record<string, string[]> = {
  persa: [
    'doenca renal policistica, epifora, sequestro corneal, dermatofitose, doencas respiratorias por braquicefalia',
  ],
  himalaio: ['riscos braquicefalicos e oculares semelhantes ao Persa', 'doenca renal policistica'],
  'maine coon': [
    'cardiomiopatia hipertrofica, displasia de quadril, osteoartrite, tromboembolismo aortico secundario a cardiopatia',
  ],
  ragdoll: ['cardiomiopatia hipertrofica', 'doenca renal policistica reportada', 'sensibilidade gastrointestinal individual'],
  siames: [
    'asma felina, doenca inflamatoria intestinal/linfoma intestinal em idosos, vocalizacao/ansiedade, estrabismo/nistagmo congenito',
  ],
  bengal: ['maior demanda ambiental', 'comportamentos compulsivos por baixa estimulacao', 'luxacao patelar/displasia reportadas'],
  'scottish fold': ['osteocondrodisplasia, dor articular cronica, rigidez e artrite precoce'],
  sphynx: ['dermatite seborreica, acne felina, cardiomiopatia hipertrofica, sensibilidade termica'],
  abissinio: ['amiloidose renal', 'doenca periodontal', 'luxacao patelar reportada'],
  birmanes: ['risco ocular hereditario reportado', 'cardiopatias em algumas linhagens'],
};

const knowledgeClusters: Record<string, KnowledgeCluster> = {
  urinary: {
    title: 'Urologia e nefrologia felina',
    watch: [
      'frequencia de ida a caixa, volume real de urina, esforco, dor, sangue, lambedura genital',
      'sede/aumento de urina, perda de peso, halito uremico, vomito, apetite e hidratacao',
      'sexo, castracao, dieta seca/umida, estresse ambiental, historico de cristais ou DRC',
    ],
    differentials: [
      'obstrucao uretral em macho, cistite idiopatica felina, FLUTD, urolitos, plug uretral',
      'doenca renal cronica, pielonefrite, hipertireoidismo, diabetes, hipertensao, dor/estresse',
    ],
    tutorGuidance: [
      'confirmar se sai urina de verdade ou apenas tentativa',
      'nao apertar bexiga e nao medicar em casa',
      'estimular agua e alimento umido como prevencao geral, se o gato aceita e nao houver restricao medica',
    ],
    escalation: [
      'macho sem urinar: emergencia imediata',
      'sangue com dor/prostracao: atendimento no mesmo dia',
      'aumento de sede/urina em senior: consulta e exames preventivos',
    ],
  },
  digestion: {
    title: 'Gastroenterologia, figado e pancreas',
    watch: [
      'numero de vomitos/diarreias em 24h, sangue, dor abdominal, ingestao de corpo estranho/planta',
      'apetite, peso, energia, hidratacao, troca de racao, petiscos, acesso a lixo ou alimento humano',
      'filhote, idoso, obeso ou gato com medicacao ativa tem margem de seguranca menor',
    ],
    differentials: [
      'gastroenterite, parasitas, intolerancia alimentar, bola de pelo, corpo estranho/obstrucao',
      'pancreatite, triade felina, doenca inflamatoria intestinal, linfoma intestinal, lipidose hepatica',
    ],
    tutorGuidance: [
      'registrar frequencia, aspecto e horario dos episodios',
      'nao fazer jejum prolongado em gato; orientar vet se nao comer',
      'evitar troca brusca de dieta e remedios humanos para nausea/dor',
    ],
    escalation: [
      'vomito repetido, sangue, barriga dolorida/distendida ou prostracao: urgencia',
      'obeso sem comer por 24h: risco hepatobiliar, avaliar rapidamente',
      'diarreia persistente ou perda de peso: consulta e exames',
    ],
  },
  respiratory: {
    title: 'Respiratorio e cardiopulmonar',
    watch: [
      'respiracao pela boca, esforco, chiado, tosse, secrecao nasal, espirros, febre e apetite',
      'frequencia respiratoria em repouso, postura, cor de gengiva e tolerancia a movimento',
      'historico de asma, cardiopatia, braquicefalia, estresse ou contato com outros gatos',
    ],
    differentials: [
      'asma felina, bronquite, pneumonia, infeccao respiratoria viral/bacteriana',
      'edema pulmonar, cardiopatia, efusao pleural, corpo estranho, polipo nasofaringeo',
    ],
    tutorGuidance: [
      'manter o gato calmo, em ambiente ventilado, sem forcar manipulacao',
      'nao nebulizar/medicar sem orientacao se houver esforco respiratorio',
      'distinguir espirro leve de dificuldade real para respirar',
    ],
    escalation: [
      'respiracao pela boca ou esforco: emergencia',
      'gengiva azulada/palida ou colapso: emergencia',
      'tosse recorrente/chiado sem crise: consulta programada',
    ],
  },
  endocrine: {
    title: 'Endocrinologia e metabolismo',
    watch: [
      'perda de peso com apetite alto, sede/urina aumentadas, hiperatividade, pelo ruim, vomito/diarreia',
      'sobrepeso, fraqueza, apetite alterado, historico de corticoide ou pancreatite',
      'idade madura/senior e exames anteriores de rim, glicose, T4, pressao e urina',
    ],
    differentials: [
      'hipertireoidismo, diabetes mellitus, doenca renal cronica, hipertensao, pancreatite',
      'doenca hepatica, neoplasia, dor cronica com perda muscular',
    ],
    tutorGuidance: [
      'orientar check-up com sangue, urina, pressao e T4 quando o padrao for cronico',
      'nao interpretar sede isolada sem volume urinario e peso',
      'enfatizar que sinais metabolicos costumam ser graduais',
    ],
    escalation: [
      'fraqueza extrema, vomitos, nao comer ou desidratacao: urgencia',
      'perda de peso progressiva em senior: consulta prioritaria',
    ],
  },
  dermatology: {
    title: 'Dermatologia, parasitas e zoonoses',
    watch: [
      'coceira, lambedura, alopecia, crostas, feridas, secrecao, localizacao e simetria',
      'pulgas, carrapatos, contato com animais, produtos novos, areia, racao e limpeza da casa',
      'lesoes em humanos da casa quando houver suspeita de dermatofitose',
    ],
    differentials: [
      'alergia a pulga, alergia alimentar/ambiental, dermatofitose, acne felina, piodermite',
      'oto/ectoparasitas, alopecia psicogenica, doencas autoimunes, ferida por briga',
    ],
    tutorGuidance: [
      'evitar pomadas humanas e oleos essenciais',
      'manter registro fotografico da evolucao e separar contato se houver suspeita contagiosa',
      'controle antiparasitario deve respeitar especie, peso e produto seguro para gatos',
    ],
    escalation: [
      'ferida profunda, pus, dor, febre ou expansao rapida: consulta rapida',
      'suspeita de micose zoonotica: vet e higiene ambiental',
    ],
  },
  eyes: {
    title: 'Oftalmologia felina',
    watch: [
      'unilateral/bilateral, olho fechado, dor, secrecao, opacidade, terceira palpebra, trauma',
      'vacinas, contato com gatos, espirros e historico de herpesvirus',
      'racas braquicefalicas e sinais de ulcera/sequestro corneal',
    ],
    differentials: [
      'conjuntivite viral/bacteriana, FHV-1, clamidiose, ulcera de cornea, uveite',
      'glaucoma, trauma, corpo estranho, sequestro corneal, hipertensao com retina',
    ],
    tutorGuidance: [
      'nao pingar colirio humano e nao usar colirio com corticoide sem exame',
      'impedir coceira intensa e procurar vet se houver dor',
      'limpar secrecao externa apenas com gaze e solucao fisiologica, sem esfregar cornea',
    ],
    escalation: [
      'olho fechado, dor, opacidade ou trauma: urgencia oftalmica',
      'secrecao leve sem dor: consulta em curto prazo se persistir',
    ],
  },
  ears: {
    title: 'Otologia felina',
    watch: [
      'coceira, sacudir cabeca, odor, secrecao escura/amarela, dor ao toque, head tilt',
      'outros animais em casa, otites repetidas, sinais respiratorios ou neurologicos',
    ],
    differentials: [
      'Otodectes, otite bacteriana/fungica, polipo nasofaringeo, otohematoma',
      'otite media/interna, corpo estranho, alergia ou trauma por coceira',
    ],
    tutorGuidance: [
      'nao introduzir cotonete no canal auditivo',
      'nao aplicar produto sem confirmar se e seguro para gato e para timpano',
      'observar equilibrio e inclinacao de cabeca',
    ],
    escalation: [
      'head tilt, ataxia ou nistagmo: urgencia',
      'dor intensa, odor forte ou otohematoma: consulta em 24-48h',
    ],
  },
  mobility: {
    title: 'Dor, ortopedia e neurologia',
    watch: [
      'apoia ou nao a pata, inicio subito/gradual, trauma, dor ao toque, salto reduzido',
      'patas frias, vocalizacao, arrastar membro, incontinencia ou perda de equilibrio',
      'idade, obesidade, cardiopatia, raca com predisposicao articular',
    ],
    differentials: [
      'trauma, fratura/luxacao, osteoartrite, dor dental refletindo comportamento',
      'tromboembolismo aortico, lesao medular, neuropatia, abscesso por briga',
    ],
    tutorGuidance: [
      'restringir pulos e movimento ate avaliacao se houver dor',
      'nao usar anti-inflamatorio humano',
      'em idosos, perguntar sobre subir escada, pular sofa, higiene e caixa de areia',
    ],
    escalation: [
      'paralisia subita/dor intensa/patas frias: emergencia',
      'nao apoiar membro apos trauma: urgencia',
      'rigidez gradual: consulta para dor cronica',
    ],
  },
  behavior: {
    title: 'Comportamento, dor oculta e bem-estar',
    watch: [
      'mudanca de rotina, novo animal/pessoa, obra, caixa de areia, enriquecimento ambiental',
      'agressividade subita, vocalizacao, isolamento, excesso de lambedura, apetite e eliminacao',
      'dor cronica, hipertireoidismo/hipertensao em senior, cistite idiopatica por estresse',
    ],
    differentials: [
      'estresse ambiental, ansiedade, agressao redirecionada, dor, FIC/FLUTD',
      'hiperestesia felina, disturbio neurologico, hipertireoidismo, demencia felina',
    ],
    tutorGuidance: [
      'validar o tutor e evitar punicao; gato nao faz por vinganca',
      'revisar recursos: caixas, agua, comida, arranhadores, esconderijos, rotas altas e previsibilidade',
      'se eliminar fora da caixa, primeiro excluir dor/urinario antes de chamar de comportamento',
    ],
    escalation: [
      'convulsao, ataxia ou agressividade subita extrema: urgencia',
      'automutilacao ou parar de comer: atendimento rapido',
    ],
  },
  dental: {
    title: 'Odontologia e dor oral',
    watch: [
      'halito, salivacao, queda de alimento, mastigar de um lado, gengiva vermelha, perda de peso',
      'dor ao tocar boca, sangramento, dentes quebrados, inflamacao cronica',
    ],
    differentials: [
      'doenca periodontal, reabsorcao dentaria, gengivoestomatite, abscesso dentario',
      'ulcera oral, corpo estranho, calicivirus, doenca renal com ulceras uremicas',
    ],
    tutorGuidance: [
      'nao forcar abertura da boca se houver dor',
      'dor oral pode aparecer como irritabilidade, esconderijo ou perda de apetite',
      'orientar avaliacao odontologica veterinaria quando recorrente',
    ],
    escalation: [
      'nao comer, sangramento importante ou pus: consulta rapida',
      'salivacao intensa com suspeita de toxico: emergencia',
    ],
  },
  infectious: {
    title: 'Infecciosas, vacinas e retroviroses',
    watch: [
      'vacinas, FeLV/FIV, contato com gatos, abrigo, acesso a rua, febre, secrecoes e apetite',
      'filhotes e idosos tem menor reserva clinica',
    ],
    differentials: [
      'complexo respiratorio felino, calicivirus, panleucopenia, FeLV, FIV',
      'FIP como diferencial em sinais sistemicos persistentes, efusao, febre recorrente ou perda de peso',
    ],
    tutorGuidance: [
      'nao afirmar infeccao sem exame; orientar isolamento relativo se secrecao/diarreia e varios gatos',
      'vacina reduz risco, mas nao elimina todas as possibilidades',
      'testes laboratoriais e exame fisico definem conduta',
    ],
    escalation: [
      'filhote com vomito/diarreia/prostracao: urgencia',
      'febre persistente, ictericia ou dificuldade respiratoria: atendimento rapido',
    ],
  },
};

const symptomClusterMap: Record<string, string[]> = {
  urinary: ['urinary', 'endocrine'],
  digestion: ['digestion', 'endocrine', 'infectious', 'dental'],
  eyes: ['eyes', 'infectious'],
  ears: ['ears', 'dermatology'],
  skin: ['dermatology', 'infectious', 'behavior'],
  mobility: ['mobility', 'endocrine'],
  behavior: ['behavior', 'urinary', 'endocrine', 'mobility'],
  respiratory: ['respiratory', 'infectious'],
  other: ['respiratory', 'urinary', 'digestion', 'mobility', 'infectious'],
};

function normalize(value: string = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getLifeStage(age?: number | string) {
  const parsed = typeof age === 'number' ? age : Number(age);
  if (!Number.isFinite(parsed)) return 'idade nao informada';
  if (parsed < 1) return 'filhote';
  if (parsed < 7) return 'adulto jovem/adulto';
  if (parsed < 11) return 'maduro';
  return 'senior/geriatrico';
}

function findBreedNotes(breed?: string) {
  const key = normalize(breed || 'SRD');
  if (!key || key === 'srd' || key.includes('sem raca')) return [];
  const exact = breedPredispositions[key];
  if (exact) return exact;
  const fuzzy = Object.entries(breedPredispositions).find(([name]) => key.includes(name) || name.includes(key));
  return fuzzy?.[1] || [`Raca ${breed}: considerar predisposicoes conhecidas da linhagem, mas priorizar sinais atuais e historico individual.`];
}

function formatCluster(cluster: KnowledgeCluster) {
  return [
    `### ${cluster.title}`,
    `Observar: ${cluster.watch.join(' | ')}`,
    `Diferenciais no radar: ${cluster.differentials.join(' | ')}`,
    `Orientacao pratica segura: ${cluster.tutorGuidance.join(' | ')}`,
    `Escalonamento: ${cluster.escalation.join(' | ')}`,
  ].join('\n');
}

export function buildFelineClinicalAlmanacPrompt(input: FelineAlmanacInput = {}) {
  const symptomId = input.symptomId || 'other';
  const symptomLabel = input.symptomLabel || 'duvida geral';
  const pet = input.pet || {};
  const context = input.clinicalContext || {};
  const clusters = symptomClusterMap[symptomId] || symptomClusterMap.other;
  const breedNotes = findBreedNotes(pet.breed);
  const lifeStage = getLifeStage(context.ageYears || pet.ageYears || pet.age);

  return `
=== ALMANAQUE FELINO IGENTVET - BASE DE RACIOCINIO ===
Use este bloco como repositorio clinico interno. Ele orienta triagem e educacao do tutor, nao substitui consulta.

Doutrina de seguranca:
${coreDoctrine.map((item) => `- ${item}`).join('\n')}

Interpretador de contexto do paciente:
- Paciente atual: ${pet.name || 'gato'} | ${pet.breed || 'SRD'} | fase: ${lifeStage}
${felineContextInterpreter.map((item) => `- ${item}`).join('\n')}

Red flags universais que superam qualquer outro contexto:
${universalEmergencySignals.map((item) => `- ${item}`).join('\n')}

Predisposicoes de raca/genetica a considerar sem afirmar diagnostico:
${breedNotes.length ? breedNotes.map((item) => `- ${item}`).join('\n') : '- SRD: priorizar historico individual, ambiente, idade, sexo e sinais objetivos.'}

Topicos clinicos ativados para "${symptomLabel}":
${clusters.map((key) => formatCluster(knowledgeClusters[key])).join('\n\n')}

Como responder:
- Comece pelo risco: emergencia, consulta rapida ou monitoramento.
- Explique o "por que" em linguagem de tutor inteligente.
- Cite historico, documentos, vacinas, medicacoes, dieta, ambiente e raca apenas quando relevantes.
- Distingua hipotese provavel de diagnostico confirmado.
- Pergunte o detalhe que mais muda a conduta.
`.trim();
}

