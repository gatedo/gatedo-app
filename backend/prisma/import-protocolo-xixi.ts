/**
 * Importa o Protocolo Xixi Fora da Caixa a partir de protocolo-xixi.json.
 * Idempotente: upsert do Protocol por slug = json.id — reimportar substitui
 * o "spec" (conteúdo) inteiro, sem tocar nas tabelas de progresso
 * (ProtocolEnrollment/ProtocolDayLog/ProtocolDayEntry), que vivem à parte
 * ligadas só por protocolId. Ninguém perde progresso ao reimportar.
 *
 * Uso: npx ts-node prisma/import-protocolo-xixi.ts [caminho/para/protocolo-xixi.json]
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const filePath = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'protocolo-xixi.json'))
  console.log(`Lendo ${filePath}`)

  const raw = fs.readFileSync(filePath, 'utf8')
  const spec = JSON.parse(raw)

  if (spec.tipo !== 'protocolo' || !spec.id) {
    throw new Error('Arquivo inválido: esperava tipo "protocolo" com campo "id".')
  }

  const totalDays = Number(spec.duracao_dias || (spec.dias || []).length || 0)

  const protocol = await prisma.protocol.upsert({
    where: { slug: spec.id },
    update: {
      title: spec.titulo,
      summary: spec.subtitulo || spec.promessa || null,
      totalDays,
      requiresFounder: false,
      entitlementProductId: spec.produto_externo_id || null,
      spec,
      status: 'PUBLISHED',
    },
    create: {
      slug: spec.id,
      title: spec.titulo,
      summary: spec.subtitulo || spec.promessa || null,
      totalDays,
      requiresFounder: false,
      entitlementProductId: spec.produto_externo_id || null,
      spec,
      status: 'PUBLISHED',
    },
  })

  console.log(`✅ Protocolo "${protocol.title}" importado (slug: ${protocol.slug}, ${totalDays} dias)`)
  console.log(`   entitlementProductId: ${protocol.entitlementProductId}`)
  if (protocol.entitlementProductId === 'DEFINIR_ID_KIWIFY') {
    console.warn('⚠️ produto_externo_id ainda é um placeholder — atualize o JSON com o ID real da Kiwify e reimporte quando o produto existir lá.')
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
