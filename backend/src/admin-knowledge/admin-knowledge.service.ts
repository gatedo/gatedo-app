import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const DEFAULT_SCOPE = 'IGENT_FELINE_ALMANAC';
const VISUAL_SCOPE = 'IGENT_VISUAL_ATLAS';

const VISUAL_ATLAS_SEED = [
  {
    slug: 'visual-olho-opacidade-secrecao',
    title: 'Olhos: opacidade, secrecao e alteracao de cornea',
    tags: ['visual', 'olho', 'cornea', 'opacidade', 'secrecao', 'ulcera', 'herpesvirus', 'persa'],
    content: `
Use quando a foto mostrar olho opaco, azulado, esbranquicado, amarelado, lacrimejamento, secrecao, olho semicerrado ou assimetria ocular.
Achados visuais relevantes: opacidade de cornea, brilho reduzido, secrecao transparente/amarela/esverdeada, hiperemia conjuntival, edema, terceira palpebra, pupila irregular, olho fechado ou dor ao toque.
Padroes diferenciais possiveis: irritacao conjuntival, conjuntivite infecciosa, ceratite, ulcera de cornea, sequestro corneal em predispostos, trauma, glaucoma/uveite quando houver dor intensa ou pupila alterada.
Red flags: olho fechado ou semicerrado, dor evidente, opacidade corneana, secrecao purulenta, trauma, sangue, piora rapida, perda de visao aparente. Orientar consulta presencial rapida/urgente.
Perguntas de afunilamento: ha quanto tempo comecou, e um olho ou dois, ha secrecao e qual cor, o gato esta esfregando o rosto, ha historico de herpes/conjuntivite, esta comendo e usando a caixinha.
Limite: foto nao confirma diagnostico ocular; pode exigir fluoresceina, tonometria, avaliacao de cornea e lampada de fenda.
    `.trim(),
  },
  {
    slug: 'visual-pele-alergia-coceira',
    title: 'Pele: alergia, vermelhidao, lambedura e coceira',
    tags: ['visual', 'pele', 'alergia', 'dermatite', 'coceira', 'lambedura', 'vermelhidao', 'pulga'],
    content: `
Use quando a foto mostrar pele avermelhada, placas, descamacao, lambedura, pelos quebrados, escoriacoes ou lesoes superficiais.
Achados visuais relevantes: vermelhidao, crostas, descamacao, falhas de pelo, umidade por lambedura, pontos escuros sugestivos de sujidade de pulga, lesoes simetricas ou localizadas.
Padroes diferenciais possiveis: dermatite alergica a pulgas, alergia alimentar/ambiental, dermatofitose, acne felina, dermatite por contato, automutilacao por prurido ou dor local.
Red flags: ferida aberta extensa, pus, mau cheiro, dor intensa, febre, apatia, lesao proxima aos olhos, crescimento rapido ou necrose. Orientar avaliacao presencial.
Perguntas de afunilamento: coça ou lambe com frequencia, mudou racao/areia/produtos, ha pulgas, outros animais ou humanos com lesoes, local exato da lesao, evolucao em dias.
Limite: foto nao diferencia alergia, fungo e parasitas com seguranca; pode precisar citologia, raspado, cultura fungica ou teste terapeutico.
    `.trim(),
  },
  {
    slug: 'visual-alopecia-falha-pelo',
    title: 'Pelo: alopecia, falhas e queda localizada',
    tags: ['visual', 'pelo', 'alopecia', 'falha', 'queda', 'lambedura', 'fungo', 'estresse'],
    content: `
Use quando a imagem mostrar falhas de pelo, pelagem rala, areas circulares sem pelo, excesso de queda ou pelos quebrados.
Achados visuais relevantes: alopecia circular, borda descamativa, pele normal sem inflamacao, pelo quebrado por lambedura, distribuicao simetrica em barriga/flancos ou localizada.
Padroes diferenciais possiveis: dermatofitose, alopecia por lambedura, alergia, ectoparasitas, dor local, estresse ambiental, alteracao endocrina menos comum em gatos.
Red flags: lesao circular contagiosa em casa, ferida aberta, pus, dor, perda de peso, apatia, multipla progressao rapida. Orientar consulta.
Perguntas de afunilamento: ele lambe a area, coça, ha descamacao, outros animais/pessoas com manchas, mudou rotina, local da falha, ha dor ao tocar.
Limite: imagem sugere padrao, mas nao confirma fungo/parasita sem exames.
    `.trim(),
  },
  {
    slug: 'visual-ferida-crosta-pus',
    title: 'Feridas: crostas, pus, abscesso e trauma',
    tags: ['visual', 'ferida', 'crosta', 'pus', 'abscesso', 'trauma', 'mordida', 'sangramento'],
    content: `
Use quando a foto mostrar corte, crosta, secrecao, inchaco, abscesso, ponto de mordida, sangramento ou tecido inflamado.
Achados visuais relevantes: tamanho, profundidade, bordas, secrecao, pus, mau aspecto, necrose, edema, calor, sangramento, local anatomico.
Padroes diferenciais possiveis: trauma, mordida/briga, abscesso, corpo estranho, infeccao secundaria, dermatite ulcerada.
Red flags: pus, mau cheiro, tecido escuro/necrotico, ferida profunda, sangramento ativo, dor forte, febre, apatia, proximo a olho/boca/genital, gato nao come. Encaminhar presencial rapido.
Perguntas de afunilamento: saiu para rua, brigou, lambe/morde a ferida, esta dolorido, secrecao tem cor/cheiro, quando comecou, vacinas em dia.
Limite: nao orientar uso de pomadas/antibioticos sem exame; feridas podem precisar limpeza profissional, drenagem e analgesia prescrita.
    `.trim(),
  },
  {
    slug: 'visual-boca-gengiva-dente',
    title: 'Boca: gengiva, dentes, salivacao e lesoes orais',
    tags: ['visual', 'boca', 'gengiva', 'dente', 'salivacao', 'ulcera', 'estomatite'],
    content: `
Use quando a imagem mostrar boca, gengiva, dentes, lingua, salivacao, ulcera, sangramento oral ou dificuldade para comer.
Achados visuais relevantes: gengiva muito vermelha, placa/tartaro, dente fraturado, ulcera, massa, sangramento, saliva espessa, assimetria facial.
Padroes diferenciais possiveis: gengivite/periodontite, estomatite felina, ulcera oral, trauma, corpo estranho, lesao reabsortiva dentaria.
Red flags: nao consegue comer, salivacao intensa, sangramento, mau cheiro forte, dor, massa, apatia. Orientar vet presencial.
Perguntas de afunilamento: come racao seca, deixa cair comida, baba, esfrega a boca, perda de peso, halito forte, vacinas/retroviroses.
Limite: foto da boca costuma ser incompleta; precisa exame oral e, muitas vezes, avaliacao odontologica.
    `.trim(),
  },
  {
    slug: 'visual-ouvido-cera-inflamacao',
    title: 'Ouvidos: cera escura, vermelhidao e prurido',
    tags: ['visual', 'ouvido', 'orelha', 'cera', 'otite', 'acaro', 'coceira'],
    content: `
Use quando a foto mostrar ouvido/orelha com cera escura, vermelhidao, crostas, secrecao, odor ou feridas por coceira.
Achados visuais relevantes: quantidade/cor da cera, vermelhidao do conduto, crostas na borda, feridas por arranhadura, inclinacao da cabeca.
Padroes diferenciais possiveis: acaros, otite externa, alergia, corpo estranho, trauma por coceira.
Red flags: dor intensa, cabeca inclinada, perda de equilibrio, pus, mau cheiro, sangramento, apatia. Consulta presencial.
Perguntas de afunilamento: sacode a cabeca, coça, tem odor, cera e preta ou amarela, um ouvido ou dois, outros gatos com coceira.
Limite: nao indicar limpeza profunda ou gotas sem otoscopia; pode haver timpano comprometido.
    `.trim(),
  },
];

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function slugify(value = '') {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseMarkdownSections(markdown = '', scope = DEFAULT_SCOPE) {
  const lines = String(markdown || '').split(/\r?\n/);
  const sections: any[] = [];
  let current: any = null;

  for (const line of lines) {
    const match = /^(#{1,4})\s+(.+)$/.exec(line);
    if (match) {
      if (current?.content?.trim()) sections.push(current);
      const title = cleanText(match[2].replace(/[#*_`]/g, ''));
      current = {
        slug: slugify(title),
        title,
        level: match[1].length,
        content: '',
      };
      continue;
    }
    if (current) current.content += `${line}\n`;
  }
  if (current?.content?.trim()) sections.push(current);

  return sections
    .filter((section) => section.level <= 3 && section.content.trim().length > 80)
    .map((section) => ({
      ...section,
      scope,
      tags: slugify(section.title).split('-').filter(Boolean),
      excerpt: cleanText(section.content).slice(0, 420),
      active: true,
      status: 'PUBLISHED',
      source: 'SEED_MARKDOWN',
    }));
}

@Injectable()
export class AdminKnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeScope(scope?: string) {
    const raw = cleanText(scope || DEFAULT_SCOPE).toUpperCase();
    if (raw === VISUAL_SCOPE) return VISUAL_SCOPE;
    return DEFAULT_SCOPE;
  }

  private async ensureTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminKnowledgeSection" (
        "id" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "scope" TEXT NOT NULL DEFAULT 'IGENT_FELINE_ALMANAC',
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "excerpt" TEXT,
        "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        "metadata" JSONB,
        "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
        "version" INTEGER NOT NULL DEFAULT 1,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "source" TEXT NOT NULL DEFAULT 'ADMIN',
        "reviewedBy" TEXT,
        "reviewedAt" TIMESTAMP(3),
        "publishedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AdminKnowledgeSection_pkey" PRIMARY KEY ("id")
      );
    `);
    await this.prisma.$executeRawUnsafe(`ALTER TABLE "AdminKnowledgeSection" ADD COLUMN IF NOT EXISTS "metadata" JSONB;`);
    await this.prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AdminKnowledgeSection_slug_key" ON "AdminKnowledgeSection"("slug");`);
    await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AdminKnowledgeSection_scope_idx" ON "AdminKnowledgeSection"("scope");`);
  }

  private async readSeedMarkdown() {
    const candidates = [
      join(process.cwd(), 'src', 'igent', 'knowledge', 'ALMANAQUE_FELINO_COMPLETO.md'),
      join(process.cwd(), 'backend', 'src', 'igent', 'knowledge', 'ALMANAQUE_FELINO_COMPLETO.md'),
    ];
    for (const path of candidates) {
      try {
        return await readFile(path, 'utf8');
      } catch {}
    }
    return '';
  }

  async seedIfEmpty(scope = DEFAULT_SCOPE) {
    await this.ensureTable();
    const targetScope = this.normalizeScope(scope);
    const countRows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int AS count FROM "AdminKnowledgeSection" WHERE "scope" = $1`,
      targetScope,
    );
    if ((countRows?.[0]?.count || 0) > 0) return;

    const sections =
      targetScope === VISUAL_SCOPE
        ? VISUAL_ATLAS_SEED.map((section) => ({
            ...section,
            scope: VISUAL_SCOPE,
            excerpt: cleanText(section.content).slice(0, 420),
            metadata: { referenceImages: [] },
            active: true,
            status: 'PUBLISHED',
            source: 'SEED_VISUAL_ATLAS',
          }))
        : parseMarkdownSections(await this.readSeedMarkdown(), DEFAULT_SCOPE);

    for (const section of sections) {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "AdminKnowledgeSection" ("id","slug","scope","title","content","excerpt","tags","metadata","status","version","active","source","publishedAt","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7::text[],$8::jsonb,$9,1,true,$10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
         ON CONFLICT ("slug") DO NOTHING`,
        randomUUID(),
        section.slug,
        section.scope,
        section.title,
        section.content,
        section.excerpt,
        section.tags,
        JSON.stringify(section.metadata || {}),
        section.status,
        section.source,
      );
    }
  }

  async list(scope = DEFAULT_SCOPE) {
    const targetScope = this.normalizeScope(scope);
    await this.seedIfEmpty(targetScope);
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "AdminKnowledgeSection" WHERE "scope" = $1 ORDER BY "createdAt" ASC`,
      targetScope,
    );
  }

  async saveAll(sections: any[] = [], actor?: string, scope = DEFAULT_SCOPE) {
    await this.ensureTable();
    const targetScope = this.normalizeScope(scope);
    for (const section of sections) {
      const title = cleanText(section.title);
      if (!title) continue;
      const baseSlug = section.slug || section.id || slugify(title);
      const slug = targetScope === VISUAL_SCOPE && !String(baseSlug).startsWith('visual-')
        ? `visual-${baseSlug}`
        : baseSlug;
      const tags = Array.isArray(section.tags)
        ? section.tags
        : String(section.tags || '').split(/[,;\s]+/).filter(Boolean);
      const content = String(section.content || '');
      const metadata = {
        ...(section.metadata && typeof section.metadata === 'object' ? section.metadata : {}),
        referenceImages: Array.isArray(section.referenceImages)
          ? section.referenceImages.slice(0, 8)
          : Array.isArray(section.metadata?.referenceImages)
            ? section.metadata.referenceImages.slice(0, 8)
            : [],
      };
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "AdminKnowledgeSection" ("id","slug","scope","title","content","excerpt","tags","metadata","status","version","active","source","reviewedBy","reviewedAt","publishedAt","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7::text[],$8::jsonb,$9,1,$10,'ADMIN',$11,CURRENT_TIMESTAMP,CASE WHEN $9 = 'PUBLISHED' THEN CURRENT_TIMESTAMP ELSE NULL END,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
         ON CONFLICT ("slug") DO UPDATE SET
          "title" = EXCLUDED."title",
          "scope" = EXCLUDED."scope",
          "content" = EXCLUDED."content",
          "excerpt" = EXCLUDED."excerpt",
          "tags" = EXCLUDED."tags",
          "metadata" = EXCLUDED."metadata",
          "status" = EXCLUDED."status",
          "active" = EXCLUDED."active",
          "reviewedBy" = EXCLUDED."reviewedBy",
          "reviewedAt" = CURRENT_TIMESTAMP,
          "publishedAt" = CASE WHEN EXCLUDED."status" = 'PUBLISHED' THEN CURRENT_TIMESTAMP ELSE "AdminKnowledgeSection"."publishedAt" END,
          "version" = "AdminKnowledgeSection"."version" + 1,
          "updatedAt" = CURRENT_TIMESTAMP`,
        randomUUID(),
        slug,
        targetScope,
        title,
        content,
        cleanText(section.excerpt || content).slice(0, 420),
        tags,
        JSON.stringify(metadata),
        section.status || 'PUBLISHED',
        section.active !== false,
        actor || null,
      );
    }
    return this.list(targetScope);
  }

  async reset(actor?: string, scope = DEFAULT_SCOPE) {
    await this.ensureTable();
    const targetScope = this.normalizeScope(scope);
    await this.prisma.$executeRawUnsafe(`DELETE FROM "AdminKnowledgeSection" WHERE "scope" = $1`, targetScope);
    await this.seedIfEmpty(targetScope);
    if (actor) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "AdminKnowledgeSection" SET "reviewedBy" = $1, "reviewedAt" = CURRENT_TIMESTAMP WHERE "scope" = $2`,
        actor,
        targetScope,
      );
    }
    return this.list(targetScope);
  }

  async relevant(query: { symptom?: string; breed?: string; limit?: number; scope?: string; visualFindings?: string }) {
    const targetScope = this.normalizeScope(query.scope);
    await this.seedIfEmpty(targetScope);
    const limit = Math.min(Number(query.limit) || 5, 10);
    const terms = `${query.symptom || ''} ${query.breed || ''} ${query.visualFindings || ''}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4);

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "AdminKnowledgeSection" WHERE "scope" = $1 AND "active" = true AND "status" = 'PUBLISHED'`,
      targetScope,
    );
    return rows
      .map((row) => {
        const haystack = `${row.title} ${(row.tags || []).join(' ')} ${row.content}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
        return { ...row, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
