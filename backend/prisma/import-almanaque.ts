/**
 * Importa o conteúdo do Guia (almanaque) a partir de almanaque.json.
 * Idempotente: upsert por id (categorias) e por slug=id (verbetes) — rodar
 * de novo atualiza o conteúdo existente, nunca duplica. Não apaga verbetes
 * que sumirem do JSON — só avisa no log.
 *
 * Uso: npx ts-node prisma/import-almanaque.ts [caminho/para/almanaque.json]
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

type Categoria = { id: string; nome: string; descricao?: string }
type Verbete = {
  id: string
  categoria: string
  titulo: string
  resumo?: string
  urgencia: 'rotina' | 'atencao' | 'emergencia'
  tags?: string[]
  corpo: string
  veja_tambem?: string[]
  pergunta_igentvet?: string
}
type Almanaque = {
  versao?: string
  atualizado_em?: string
  aviso_global?: string
  categorias: Categoria[]
  verbetes: Verbete[]
}

const URGENCY_MAP: Record<string, 'ROTINA' | 'ATENCAO' | 'EMERGENCIA'> = {
  rotina: 'ROTINA',
  atencao: 'ATENCAO',
  emergencia: 'EMERGENCIA',
}

async function main() {
  const filePath = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'almanaque.json'))
  console.log(`Lendo ${filePath}`)

  const raw = fs.readFileSync(filePath, 'utf8')
  const data: Almanaque = JSON.parse(raw)

  if (!Array.isArray(data.categorias) || !Array.isArray(data.verbetes)) {
    throw new Error('Arquivo inválido: esperava "categorias" e "verbetes".')
  }

  // ── Categorias ──────────────────────────────────────────────────────────
  for (const cat of data.categorias) {
    await prisma.guideCategory.upsert({
      where: { id: cat.id },
      update: { nome: cat.nome, descricao: cat.descricao ?? null },
      create: { id: cat.id, nome: cat.nome, descricao: cat.descricao ?? null },
    })
  }
  console.log(`✅ ${data.categorias.length} categoria(s) importada(s)`)

  const categoriaNomeById = new Map(data.categorias.map((c) => [c.id, c.nome]))
  const validSlugs = new Set(data.verbetes.map((v) => v.id))

  // ── Verbetes ────────────────────────────────────────────────────────────
  let created = 0
  let updated = 0

  for (const v of data.verbetes) {
    const vejaTambem = (v.veja_tambem || []).filter((id) => {
      const ok = validSlugs.has(id)
      if (!ok) console.warn(`⚠️ ${v.id}: veja_tambem aponta pra id inexistente "${id}" — ignorado`)
      return ok
    })

    const payload = {
      title: v.titulo,
      theme: categoriaNomeById.get(v.categoria) || v.categoria,
      categoryId: v.categoria,
      excerpt: v.resumo ?? null,
      body: v.corpo,
      tags: v.tags || [],
      urgency: URGENCY_MAP[v.urgencia] || null,
      vejaTambem,
      perguntaIgentvet: v.pergunta_igentvet ?? null,
      status: 'PUBLISHED' as const,
    }

    const existing = await prisma.guideEntry.findUnique({ where: { slug: v.id } })

    await prisma.guideEntry.upsert({
      where: { slug: v.id },
      update: payload,
      create: { slug: v.id, ...payload },
    })

    if (existing) updated++
    else created++
  }

  console.log(`✅ Verbetes: ${created} criado(s), ${updated} atualizado(s)`)

  // ── Verbetes que existem no banco mas sumiram do JSON (não apaga, só avisa) ──
  const existingSlugs = await prisma.guideEntry.findMany({ select: { slug: true } })
  const missing = existingSlugs.map((e) => e.slug).filter((slug) => !validSlugs.has(slug))
  if (missing.length) {
    console.warn(`⚠️ ${missing.length} verbete(s) no banco não estão mais no JSON (não foram apagados): ${missing.join(', ')}`)
  }

  // ── Aviso global ────────────────────────────────────────────────────────
  if (data.aviso_global) {
    await prisma.appSettings.upsert({
      where: { key: 'almanaque_aviso_global' },
      update: { value: data.aviso_global },
      create: { key: 'almanaque_aviso_global', value: data.aviso_global },
    })
    console.log('✅ Aviso global atualizado')
  }
}

main()
  .catch((e) => {
    console.error('❌ Import falhou:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
