"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const openai_1 = __importDefault(require("openai"));
let IgentService = class IgentService {
    constructor(prisma) {
        this.prisma = prisma;
        this.SYMPTOM_RELATED_TYPES = {
            skin: ['SKIN', 'ALLERGY', 'DERMATOLOGY', 'CHRONIC'],
            eyes: ['EYE', 'OPHTHALMOLOGY', 'HERPES', 'CONJUNCTIVITIS', 'CHRONIC'],
            ears: ['EAR', 'OTOLOGY', 'CHRONIC'],
            behavior: ['BEHAVIOR', 'NEURO', 'ANXIETY', 'CHRONIC'],
            digestion: ['DIGESTION', 'GASTRO', 'VOMIT', 'DIET', 'NUTRITION', 'FOOD'],
            urinary: ['URINARY', 'RENAL', 'KIDNEY', 'BLADDER'],
            mobility: ['MOBILITY', 'ORTHO', 'TRAUMA', 'FRACTURE', 'PAIN'],
            other: ['EMERGENCY', 'GENERAL', 'CHRONIC'],
        };
        this.SYMPTOM_PROMPTS = {
            skin: {
                persona: `Especialista em dermatologia felina. Conhece profundamente:
- Dermatite alérgica (atopia, alergia alimentar, flea allergy dermatitis)
- Dermatofitose (microsporum canis — ZOONOSE, alertar tutor)
- Pênfigo foliáceo, alopecia psicogênica, acne felina
- Distinção entre prurido alérgico x parasitário x infeccioso`,
                focus: `Localização exata da lesão, padrão (focal/multifocal/generalizado), 
presença de prurido, descamação, crostas, alopecia, vermelhidão, pápulas.
SEMPRE checar: pulgas/carrapatos, mudança de ração recente, novo produto no ambiente.`,
                redFlags: [
                    'Lesões em rosto/mucosas em expansão rápida',
                    'Alopecia generalizada com crostas extensas',
                    'Sangramento espontâneo na pele',
                    'Tutor com lesões similares (suspeita de dermatofitose zoonótica)',
                ],
                breedRisks: {
                    'Persa': 'Alto risco de dermatofitose e dobras cutâneas infectadas',
                    'Sphynx': 'Acne felina e dermatite seborreica frequentes pela ausência de pelo',
                    'Maine Coon': 'Propenso a alopecia alérgica e distúrbios de queratinização',
                    'Siamês': 'Alopecia psicogênica (lambedura compulsiva) mais comum',
                    'Ragdoll': 'Sensibilidade cutânea e alergia alimentar reportadas',
                },
                triageQuestions: [
                    'Onde estão as lesões? (pescoço, barriga, costas, patas, rosto)',
                    'O gato está coçando, lambendo ou mordendo o local?',
                    'Houve mudança de ração, areia, produto de limpeza ou novos animais em casa nos últimos 30 dias?',
                ],
                whenToVet: 'Consulta presencial em até 48h se houver lesões com crostas, sangramento ou expansão rápida. Em 7 dias se for apenas prurido leve sem lesão visível.',
            },
            eyes: {
                persona: `Especialista em oftalmologia felina. Conhece:
- Herpesvírus felino tipo 1 (FHV-1) — causa mais comum de conjuntivite recorrente
- Clamidofilose felina (Chlamydophila felis) — conjuntivite unilateral inicial
- Úlcera de córnea, uveíte, glaucoma, síndrome de Horner
- Sequestro corneal (mancha marrom escura — mais em Persa e Himalaia)
- Epífora crônica x bloqueio do ducto nasolacrimal`,
                focus: `Unilateral ou bilateral? Secreção (serosa/mucopurulenta/amarela/verde)?
Olho fechado (blefarospasmo)? Vermelhidão da conjuntiva? Opacidade da córnea?
Terceira pálpebra visível? Estado vacinal (raiva, cálicivírus, herpes incluídos na polivalente)?`,
                redFlags: [
                    'Olho totalmente fechado com blefarospasmo intenso (úlcera)',
                    'Opacidade branca ou azulada na córnea (ceratite, glaucoma)',
                    'Olho vermelho intenso com secreção amarelo-verde abundante',
                    'Mancha marrom escura na córnea (sequestro — Persa)',
                    'Pupila dilatada fixamente com dor aparente (glaucoma)',
                ],
                breedRisks: {
                    'Persa': 'Alto risco de sequestro corneal e epífora por braquicefalia',
                    'Himalaio': 'Mesmo risco que Persa — anatomia braquicefálica',
                    'Siamês': 'Nistagmo congênito e estrabismo comuns — não confundir com doença aguda',
                    'Birmanês': 'Síndrome de Chediak-Higashi (diluição de cor + problemas oculares)',
                    'Maine Coon': 'Cardiomiopatia hipertrófica pode causar hipertensão e descolamento de retina',
                },
                triageQuestions: [
                    'É um olho ou os dois? O olho está fechado ou semicerrado?',
                    'Qual é a cor da secreção? (transparente, amarela, esverdeada)',
                    'O gato está coçando o olho ou esfregando o rosto em superfícies?',
                ],
                whenToVet: 'URGENTE (24h) se olho fechado com blefarospasmo, opacidade na córnea ou secreção intensa. Eletivo (48-72h) para secreção leve ou epífora sem outros sinais.',
            },
            ears: {
                persona: `Especialista em otologia felina. Conhece:
- Otodectes cynotis (otocariose) — escuro granuloso como "borra de café"
- Otite bacteriana, por Malassezia, mista
- Otohematoma (acúmulo de sangue no pavilhão por coceira)
- Pólipo nasofaríngeo (voz alterada + cabeça inclinada + otite recorrente)
- Otite média e interna (ataxia, nistagmo, inclinação de cabeça persistente)`,
                focus: `Secreção (cor, odor, consistência)? Coceira intensa? Cabeça inclinada (head tilt)?
Chacoalha a cabeça? Pavilhão auricular inchado (otohematoma)?
Histórico de otites? Outros animais em casa (Otodectes é altamente contagioso)?`,
                redFlags: [
                    'Inclinação persistente da cabeça + andar em círculos (otite interna)',
                    'Ataxia e nistagmo associados a otite (neurológico)',
                    'Pavilhão auricular muito inchado e amolecido (otohematoma grave)',
                    'Secreção com odor intenso + dor à manipulação (bacteriana grave)',
                ],
                breedRisks: {
                    'Persa': 'Otites crônicas por excesso de pelos no canal auditivo',
                    'Scottish Fold': 'Predisposição a otite por conformação da orelha dobrada',
                    'Rex': 'Canal auditivo estreito — otites recorrentes',
                },
                triageQuestions: [
                    'O gato está sacudindo a cabeça ou arranhando a orelha frequentemente?',
                    'Tem secreção visível? Se sim, qual a cor — marrom escuro, amarelo, preto?',
                    'A cabeça está inclinada para um lado ou o gato está perdendo equilíbrio?',
                ],
                whenToVet: 'URGENTE se inclinação de cabeça com perda de equilíbrio. Em 48h se houver secreção abundante com odor ou otohematoma. Eletivo (7 dias) para coceira leve sem secreção.',
            },
            behavior: {
                persona: `Especialista em comportamento e neurologia felina. Conhece:
- Síndrome de hiperestesia felina (ondulação da pele + automutilação)
- Cystitis idiopática felina (FIC) — fortemente ligada ao estresse
- Cistite/FLUTD precipitada por mudanças ambientais
- Ansiedade de separação, redirected aggression, compulsões
- Epilepsia felina, toxoplasmose (alterações neurológicas)
- Dor crônica oculta como causa de agressividade súbita`,
                focus: `QUANDO começou? O que mudou no ambiente? (mudança, novo animal, bebê, obra)
O comportamento é novo ou piora gradual? Há dor (vocalização ao toque)?
Agressão redirected ou à pessoa/animal específico?
Mudanças no padrão de sono, alimentação, uso da caixa de areia?`,
                redFlags: [
                    'Convulsão ou episódio semelhante (tremores, perda de consciência)',
                    'Agressividade súbita extrema sem causa aparente em gato previamente dócil',
                    'Automutilação intensa (lambedura até sangrar)',
                    'Incoordenação motora progressiva',
                    'Vocalização noturna intensa em gato idoso (hipertireoidismo, hipertensão)',
                ],
                breedRisks: {
                    'Siamês': 'Ansiedade e vocalização excessiva por natureza — mas piora indica problema',
                    'Abissínio': 'Hiperestesia felina mais reportada',
                    'Bengal': 'Comportamentos compulsivos e redirected aggression frequentes',
                    'Persa': 'Dificuldade de adaptação a mudanças ambientais',
                },
                triageQuestions: [
                    'O que mudou em casa nos últimos 30 dias? (mudança, novo animal, pessoa, rotina)',
                    'O comportamento é contínuo ou em episódios? Quando acontece?',
                    'O gato está comendo, bebendo e usando a caixa de areia normalmente?',
                ],
                whenToVet: 'URGENTE se convulsão, ataxia ou agressividade extrema súbita. Em 48-72h se automutilação ou parada total de alimentação. Eletivo para ansiedade/comportamento sem sinais físicos.',
            },
            digestion: {
                persona: `Especialista em gastroenterologia felina. Conhece:
- Gastroenterite aguda vs doença inflamatória intestinal (IBD)
- Pancreatite felina (tríade felina: pancreatite + IBD + colangite)
- Corpo estranho GI, obstrução intestinal
- Parasitoses (giárdia, isospora, toxocara) — relevante em gatos jovens
- Hepatite, lipidose hepática (perigo em gatos obesos que param de comer)
- Linfoma intestinal (mais comum em felinos idosos)`,
                focus: `Frequência dos episódios? Há sangue (vermelho ou "borra de café")?
Vômito e diarreia juntos? O gato está comendo? Bebendo água?
Peso: obeso que parou de comer tem risco de lipidose em 48-72h.
Gato jovem com diarreia → pensar parasitas. Idoso → IBD/linfoma.`,
                redFlags: [
                    'Vômito com sangue (hematemese)',
                    'Diarreia com sangue vivo abundante',
                    'Distensão abdominal + dor (toque)',
                    'Prostração intensa + parada de alimentação > 24h',
                    'Gato obeso que não come há mais de 24h (risco lipidose)',
                    'Vômito em projétil recorrente (possível obstrução)',
                ],
                breedRisks: {
                    'Persa': 'Predisposição a problemas hepáticos e dieta sensível',
                    'Siamês': 'IBD e linfoma de células pequenas mais reportados',
                    'Devon Rex': 'Miastenia gravis — regurgitação crônica',
                    'Ragdoll': 'Sensibilidade gastrointestinal a troca de dieta',
                },
                triageQuestions: [
                    'Quantas vezes vomitou/teve diarreia nas últimas 24h? Há sangue?',
                    'O gato está comendo e bebendo? Está prostrado ou ainda ativo?',
                    'Houve mudança de ração, ingestão de planta, objeto ou alimento inadequado?',
                ],
                whenToVet: 'URGENTE (imediato) se sangue, distensão abdominal, prostração intensa ou gato obeso sem comer. Em 24h se vômitos/diarreia > 4x sem sangue. Eletivo se 1-2 episódios isolados com gato ativo.',
            },
            urinary: {
                persona: `Especialista em urologia e nefrologia felina. Conhece:
- FLUTD (Feline Lower Urinary Tract Disease) — cistite idiopática, urólitos, tampão uretral
- Obstrução uretral — EMERGÊNCIA ABSOLUTA em machos
- Doença renal crônica (DRC) — poliúria/polidipsia em gatos idosos
- Infecção urinária (menos comum em felinos que em cães)
- Cálculos de estruvita (dieta seca sem água) vs oxalato de cálcio (idosos)
- Hipertireoidismo causando poliúria em felinos > 8 anos`,
                focus: `SEXO DO GATO — macho com obstrução é EMERGÊNCIA IMEDIATA.
Frequência de tentativas? Produz urina? Há sangue?
Quanto tempo está assim? Fez xixi fora da caixa?
Bebe mais água que o habitual? Histórico de cálculos?`,
                redFlags: [
                    'MACHO entrando e saindo da caixa SEM urinar — EMERGÊNCIA',
                    'Vocalização de dor ao urinar',
                    'Lambedura excessiva do pênis/vulva',
                    'Hematúria (urina vermelha/rosa) + prostração',
                    'Xixi em gota, postura de esforço sem resultado',
                ],
                breedRisks: {
                    'Persa': 'Doença renal policística (PKD) — testar com ultrassom',
                    'Maine Coon': 'Cardiomiopatia + hipertensão causando DRC secundária',
                    'Ragdoll': 'PKD e DRC reportados',
                    'Abissínio': 'Amiloidose renal — DRC progressiva em adultos',
                    'Siamês': 'Linfoma renal pode mimetizar DRC',
                },
                triageQuestions: [
                    'O gato é macho ou fêmea? Está conseguindo urinar ou tentando sem sair nada?',
                    'A urina tem cor normal ou está rosada/avermelhada?',
                    'Está bebendo mais água que o normal? Isso começou quando?',
                ],
                whenToVet: 'EMERGÊNCIA IMEDIATA se macho sem urinar. URGENTE (6h) se hematúria + prostração. Em 24h para qualquer alteração urinária em macho. Eletivo (48-72h) para fêmea com xixi fora da caixa sem outros sinais.',
            },
            mobility: {
                persona: `Especialista em ortopedia e medicina da dor felina. Conhece:
- Trauma (queda, atropelamento, briga)
- Artrite/osteoartrite — subdiagnosticada em felinos (escondem dor)
- Tromboembolismo aórtico (TEA) — paralisia súbita de membros posteriores
- Luxação patelar, displasia de quadril (Maine Coon, Bengal)
- Fratura de pelve pós-trauma
- Mielopatia degenerativa em felinos idosos`,
                focus: `Qual membro? Apoia o peso ou não toca no chão?
Houve trauma recente? Caiu de altura? Saiu e voltou machucado?
Início súbito (emergência — TEA?) ou gradual (artrite)?
Em gato idoso: rigidez matinal, dificuldade de pular?`,
                redFlags: [
                    'Paralisia súbita de membros posteriores com dor intensa e patas frias (TEA — EMERGÊNCIA)',
                    'Coxeamento após trauma com crepitação palpável (fratura)',
                    'Não apoia o membro após queda de altura',
                    'Incontinência urinária + coxeamento (lesão medular)',
                    'Pata arrastada + ataxia (neuropatia)',
                ],
                breedRisks: {
                    'Maine Coon': 'Displasia de quadril, artrite precoce e HCM com TEA',
                    'Bengal': 'Displasia de quadril e luxação patelar',
                    'Devon Rex': 'Miastenia gravis — fraqueza muscular progressiva',
                    'Abissínio': 'Luxação patelar hereditária',
                    'Scottish Fold': 'Osteocondrodisplasia — artrite grave e dolorosa em toda a espinha',
                },
                triageQuestions: [
                    'Houve algum trauma, queda ou acidente? Quando começou o problema?',
                    'O gato apoia a pata no chão ou fica completamente levantada?',
                    'A dificuldade começou de repente ou foi piorando gradualmente?',
                ],
                whenToVet: 'EMERGÊNCIA IMEDIATA se paralisia súbita de posteriores (suspeita de TEA). URGENTE (2h) pós-trauma com membro não apoiado. Em 24h para coxeamento leve sem trauma. Eletivo para rigidez gradual em idosos.',
            },
            other: {
                persona: `Veterinário de emergência felina. Avalia com protocolo de triagem rápida:
- Dificuldade respiratória (dispneia, respiração pela boca)
- Colapso ou síncope
- Convulsão ou status epilepticus
- Intoxicação (plantas, medicamentos humanos, produtos de limpeza)
- Trauma grave (atropelamento, queda)
- Abcesso por briga ou ferida penetrante`,
                focus: `ESTABILIZAR PRIMEIRO — identificar se é emergência real.
Respiração? Cor das mucosas (gengivas) — rosa = OK, pálido/azul = emergência.
Nível de consciência? Responde ao nome? Se move?
Histórico de exposição a toxinas?`,
                redFlags: [
                    'Respiração pela boca (felinos só fazem isso em emergência)',
                    'Gengivas pálidas, azuladas ou brancas',
                    'Colapso ou inconsciência',
                    'Convulsão ativa',
                    'Sangramento sem controle',
                    'Distensão abdominal aguda + prostração',
                    'Exposição confirmada a toxina (paracetamol, lily, permethrina)',
                ],
                breedRisks: {
                    'Maine Coon': 'HCM — colapso súbito por arritmia ou TEA',
                    'Ragdoll': 'HCM — mesmo risco',
                    'Persa': 'Braquicefalia — qualquer dificuldade respiratória é mais grave',
                    'Siamês': 'Asma felina — dispneia recorrente',
                },
                triageQuestions: [
                    'O que está acontecendo exatamente? (descreva o sinal principal)',
                    'O gato está consciente e respondendo? As gengivas estão rosadas?',
                    'Pode ter ingerido alguma substância, planta ou medicamento humano?',
                ],
                whenToVet: 'EMERGÊNCIA IMEDIATA na grande maioria dos casos nesta categoria. Vá ao veterinário ou emergência 24h AGORA se houver qualquer sinal dos red flags acima.',
            },
        };
        this.openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
    }
    buildSymptomPrompt(symptomId, pet, symptomLabel) {
        const sp = this.SYMPTOM_PROMPTS[symptomId] || this.SYMPTOM_PROMPTS['other'];
        const breed = pet.breed || 'SRD';
        const breedNote = sp.breedRisks[breed]
            ? `NOTA DE RACA (${breed}): ${sp.breedRisks[breed]}`
            : (breed !== 'SRD' ? `Raça ${breed} — verificar predisposições específicas.` : '');
        return `
ESPECIALIDADE ATIVA: ${sp.persona}

FOCO CLINICO PARA "${symptomLabel}":
${sp.focus}

${breedNote ? breedNote + '\n' : ''}RED FLAGS (isUrgent = true se presente qualquer um):
${sp.redFlags.map(f => `- ${f}`).join('\n')}

ORIENTACAO PRESENCIAL: ${sp.whenToVet}

PERGUNTAS DE TRIAGEM (incluir no campo triageQuestions, adaptadas ao paciente especifico):
${sp.triageQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
`.trim();
    }
    buildFocusedContext(pet, clinicalContext, symptomId, symptomLabel) {
        const gender = pet.gender === 'FEMALE' ? 'Fêmea' : 'Macho';
        const neutered = pet.neutered
            ? 'castrad' + (pet.gender === 'FEMALE' ? 'a' : 'o')
            : 'inteiro(a)';
        const weight = clinicalContext?.weight || pet.weight;
        const allRecords = clinicalContext?.healthRecords || pet.healthRecords || [];
        const now = new Date();
        const vaccines = allRecords
            .filter((r) => r.type === 'VACCINE')
            .slice(0, 5)
            .map((r) => {
            const next = r.nextDueDate ? ` | Proxima: ${new Date(r.nextDueDate).toLocaleDateString('pt-BR')}` : '';
            const overdue = r.nextDueDate && new Date(r.nextDueDate) < now ? ' [VENCIDA]' : '';
            return `  - ${r.title} (aplicada: ${new Date(r.date).toLocaleDateString('pt-BR')})${next}${overdue}`;
        }).join('\n') || '  - Nenhuma vacina registrada';
        const medTypes = ['MEDICATION', 'MEDICINE', 'VERMIFUGE', 'PARASITE'];
        const activeMeds = allRecords
            .filter((r) => {
            const ismedType = medTypes.includes((r.type || '').toUpperCase());
            const isOngoing = r.ongoing === true || r.active === true;
            const isRecent = new Date(r.date) > new Date(now.getTime() - 90 * 86400000);
            return ismedType && (isOngoing || isRecent);
        })
            .slice(0, 6)
            .map((r) => {
            const ctrl = r.isControlled ? ' [CONTROLADA]' : '';
            const status = r.ongoing ? ' (uso continuo)' : '';
            return `  - ${r.title}${ctrl}${status}${r.notes ? ' / ' + r.notes.substring(0, 50) : ''}`;
        }).join('\n') || '  - Nenhuma medicacao ativa nos ultimos 90 dias';
        const docs = (pet.documents || []).slice(0, 3)
            .map((d) => `  - ${d.name} (${new Date(d.date).toLocaleDateString('pt-BR')})`)
            .join('\n') || null;
        const dietParts = [
            pet.foodBrand ? `marca: ${pet.foodBrand}` : null,
            pet.foodFreq ? `freq: ${pet.foodFreq}` : null,
            pet.foodAmount ? `qtd: ${pet.foodAmount}` : null,
            pet.foodType?.length ? `tipo: ${pet.foodType.join('/')}` : null,
        ].filter(Boolean);
        const diet = dietParts.length ? dietParts.join(' | ') : null;
        const envParts = [
            pet.streetAccess ? 'acesso a rua' : 'ambiente interno',
            pet.riskAreaAccess ? 'area de risco' : null,
            pet.housingType ? pet.housingType : null,
        ].filter(Boolean);
        const env = envParts.join(', ');
        const personality = pet.personality?.length
            ? pet.personality.join(', ') : null;
        const relatedTypes = this.SYMPTOM_RELATED_TYPES[symptomId] || ['GENERAL'];
        const clinicalHistory = allRecords
            .filter((r) => {
            const type = (r.type || '').toUpperCase();
            if (['VACCINE', 'MEDICATION', 'MEDICINE', 'VERMIFUGE', 'PARASITE'].includes(type))
                return false;
            return relatedTypes.some((rt) => type.includes(rt));
        })
            .slice(0, 4)
            .map((r) => `  - ${r.title || (r.notes || '').substring(0, 70)} (${new Date(r.date).toLocaleDateString('pt-BR')})`)
            .join('\n') || `  - Sem registros anteriores relacionados a "${symptomLabel}"`;
        const memorialNote = clinicalContext?.deathCause
            ? `[DADO PREDITIVO] Este gato faleceu de ${clinicalContext.deathCause}. Cruzar com pacientes da raca ${pet.breed}.`
            : null;
        const breedRisk = clinicalContext?.breedRiskData
            ? `[RISCO DE RACA - ${pet.breed}] Padrao detectado: ${clinicalContext.breedRiskData}`
            : null;
        return [
            `=== PACIENTE ===`,
            `${pet.name} | ${pet.breed || 'SRD'} | ${pet.ageYears || '?'}a | ${gender} | ${neutered}${weight ? ` | ${weight}kg` : ''}`,
            diet ? `Dieta: ${diet}` : null,
            `Ambiente: ${env}`,
            personality ? `Perfil comportamental: ${personality}` : null,
            `\n=== IMUNIZACAO ===`,
            vaccines,
            `\n=== MEDICACOES ATIVAS (ultimos 90 dias) ===`,
            activeMeds,
            docs ? `\n=== EXAMES E DOCUMENTOS ===\n${docs}` : null,
            `\n=== HISTORICO CLINICO RELACIONADO A "${symptomLabel}" ===`,
            clinicalHistory,
            memorialNote ? `\n${memorialNote}` : null,
            breedRisk ? `\n${breedRisk}` : null,
        ].filter(Boolean).join('\n');
    }
    async analyzeSymptom(petId, symptom, symptomId, clinicalContext) {
        const pet = await this.prisma.pet.findUnique({
            where: { id: petId },
            include: {
                healthRecords: { orderBy: { date: 'desc' }, take: 50 },
                owner: true,
                documents: { orderBy: { date: 'desc' }, take: 5 },
            },
        });
        if (!pet)
            throw new common_1.HttpException('Gato não encontrado', common_1.HttpStatus.NOT_FOUND);
        const sid = symptomId || 'other';
        const focusedCtx = this.buildFocusedContext(pet, clinicalContext, sid, symptom);
        const symptomInstruction = this.buildSymptomPrompt(sid, pet, symptom);
        const prompt = `
Voce e o iGentVet, agente veterinario especializado em felinos da Gatedo.
Tom: empatico, direto, clinicamente preciso. Trate pelo nome: ${pet.name}.

${focusedCtx}

${symptomInstruction}

SINTOMA RELATADO: "${symptom}"

INSTRUCOES CRITICAS:
- Use o contexto clinico completo (imunizacao, medicacoes, dieta, ambiente, raca)
- Vacinas vencidas ou ausentes podem ser causas do problema — cite se relevante
- Medicacoes ativas podem mascarar ou causar sintomas — analise cruzando
- isUrgent = true SOMENTE se houver RED FLAG real — nao exagere
- analysisText: seja especifico ao paciente. Cite raca, medicacoes, vacinas quando relevante.
- triageQuestions: adapte as perguntas ao paciente especifico (nome, raca, historico)
- care: orientacoes PERSONALIZADAS (mencione o nome do gato, considere o historico)
- whenToVet: copy exato do ORIENTACAO PRESENCIAL acima, adapte se necessario

Responda APENAS com este JSON valido:
{
  "isUrgent": false,
  "urgentReason": null,
  "analysisText": "Analise personalizada para ${pet.name}. Maxímo 45 palavras. Cita raca/meds/vacinas se relevante.",
  "probabilities": [
    {"name": "Causa especifica mais provavel (nao generica)", "percent": 60},
    {"name": "Segunda causa diferencial", "percent": 30},
    {"name": "Terceira hipotese", "percent": 10}
  ],
  "care": [
    "Orientacao especifica para ${pet.name} considerando historico",
    "Segunda orientacao personalizada",
    "Terceira orientacao",
    "Quando ir ao vet (baseado em ORIENTACAO PRESENCIAL)"
  ],
  "triageQuestions": [
    "Primeira pergunta adaptada para ${pet.name} e historico",
    "Segunda pergunta contextual",
    "Terceira pergunta clinica"
  ],
  "redFlags": ["Sinal de alerta 1 relevante para este caso", "Sinal 2"],
  "breedNote": "Nota especifica da raca ${pet.breed || 'SRD'} se houver risco — ou null",
  "whenToVet": "Orientacao de urgencia presencial especifica"
}`.trim();
        try {
            const res = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.3,
            });
            return JSON.parse(res.choices[0].message.content);
        }
        catch (err) {
            console.error('Erro analyzeSymptom:', err);
            return { isUrgent: false, analysisText: 'Erro na análise.', probabilities: [], care: [] };
        }
    }
    async chatWithVet(petId, message, symptom, symptomId, clinicalContext) {
        const pet = await this.prisma.pet.findUnique({
            where: { id: petId },
            include: {
                healthRecords: { orderBy: { date: 'desc' }, take: 50 },
                documents: { orderBy: { date: 'desc' }, take: 5 },
            },
        });
        if (!pet)
            throw new common_1.HttpException('Gato não encontrado', common_1.HttpStatus.NOT_FOUND);
        const sid = symptomId || 'other';
        const symptomLabel = symptom || 'dúvida geral';
        const focusedCtx = this.buildFocusedContext(pet, clinicalContext, sid, symptomLabel);
        const symptomInstruction = this.buildSymptomPrompt(sid, pet, symptomLabel);
        const systemPrompt = `
Voce e o iGentVet, agente veterinario especializado em felinos da Gatedo.
Tom: empatico, preciso, como um bom veterinario que conhece o paciente pelo nome.
NUNCA prescreva doses especificas ou receitas — oriente a buscar consulta presencial.

${focusedCtx}

${symptomInstruction}

CONSULTA EM ANDAMENTO — SINTOMA: "${symptomLabel}"

REGRAS DE OURO:
1. Trate o gato pelo nome: ${pet.name}. Personalize SEMPRE.
2. Voce TEM ACESSO ao historico completo — use-o ativamente nas respostas
3. Vacinas: consulte IMUNIZACAO — cite status real e alerte se [VENCIDA]
4. Medicacoes: consulte MEDICACOES ATIVAS — analise interacao com o sintoma atual
5. Se o tutor descrever um RED FLAG desta consulta, eleve urgencia e oriente ir ao vet
6. Maximo 3 paragrafos curtos — seja direto e util
7. Se pergunta fora do escopo: responda 1 frase e oferea nova consulta
8. Ao final de respostas complexas, faca 1 pergunta de acompanhamento clinico relevante`.trim();
        try {
            const res = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message },
                ],
                temperature: 0.4,
            });
            return { text: res.choices[0].message.content, sender: 'bot' };
        }
        catch (err) {
            console.error('Erro chatWithVet:', err);
            return { text: 'Conexão instável. Pode repetir?', sender: 'bot' };
        }
    }
    async generateReport(petId, symptomLabel, analysisText, care, isUrgent, ownerResponse) {
        const pet = await this.prisma.pet.findUnique({
            where: { id: petId },
            include: {
                owner: true,
                healthRecords: { orderBy: { date: 'desc' }, take: 3 },
            },
        });
        const now = new Date();
        return {
            generatedAt: now.toISOString(),
            reportId: `IGV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`,
            pet: {
                name: pet?.name,
                breed: pet?.breed || 'SRD',
                gender: pet?.gender,
                ageYears: pet?.ageYears,
                weight: pet?.weight,
                neutered: pet?.neutered,
                photoUrl: pet?.photoUrl,
            },
            owner: { name: pet?.owner?.name },
            consultation: {
                date: now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
                time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                symptom: symptomLabel,
                isUrgent,
                analysisText,
                care,
                ownerResponse,
                source: 'iGentVet IA — Gatedo',
            },
        };
    }
    async createSession(data) {
        return this.prisma.igentSession.create({
            data: {
                petId: data.petId,
                symptomId: data.symptomId,
                symptomLabel: data.symptomLabel,
                isUrgent: data.isUrgent,
                analysisText: data.analysisText,
                recommendations: data.recommendations,
                ownerResponse: data.ownerResponse || null,
                severity: data.severity || 'LOW',
                clinicalSnapshot: data.clinicalSnapshot || {},
            },
        });
    }
    async getSessions(petId) {
        return this.prisma.igentSession.findMany({
            where: { petId },
            orderBy: { date: 'desc' },
        });
    }
    async recordUpdate(data) {
        const pet = await this.prisma.pet.findUnique({
            where: { id: data.petId },
            select: { name: true, healthSummary: true },
        });
        console.log(`[iGentVet] Novo registro para ${pet?.name}: ${data.recordType} — ${data.title}${data.ongoing ? ' (contínuo)' : ''}${data.isControlled ? ' [CONTROLADO]' : ''}`);
        return {
            received: true,
            petName: pet?.name,
            recordType: data.recordType,
            title: data.title,
            ongoing: data.ongoing || false,
            isControlled: data.isControlled || false,
        };
    }
};
exports.IgentService = IgentService;
exports.IgentService = IgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IgentService);
//# sourceMappingURL=igent.service.js.map