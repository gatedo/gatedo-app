// Importa um JSON de produtos com as mesmas regras do POST /products/import.
// Uso:  npx tsx scripts/store-import.ts ../gatedo-products-import.json          → só a prévia
//       npx tsx scripts/store-import.ts ../gatedo-products-import.json --apply  → grava
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { normalizeImportItem } from '../src/store/product-rules';

const file = process.argv[2];
const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();

(async () => {
  if (!file) throw new Error('Informe o arquivo JSON.');
  const list = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(list)) throw new Error('Formato inválido — esperado array.');

  const categories = await prisma.category.findMany();
  const items = list.map((raw: any, i: number) => normalizeImportItem(raw, i, categories));
  const ok = items.filter((i) => i.ok) as Extract<(typeof items)[number], { ok: true }>[];
  const failed = items.filter((i) => !i.ok) as Extract<(typeof items)[number], { ok: false }>[];

  console.log(`Entram: ${ok.length} (rascunho: ${ok.filter((i) => i.status === 'draft').length}, publicados: ${ok.filter((i) => i.status === 'published').length})`);
  console.log(`Falharam: ${failed.length}`);
  failed.forEach((f) => console.log(`  #${f.index + 1} ${f.name} — ${f.error}`));
  ok.forEach((i) => i.warnings.forEach((w) => console.log(`  ⚠ ${i.name}: ${w}`)));

  const existing = await prisma.product.count();
  if (existing) console.log(`Atenção: já existem ${existing} produtos no banco; o import não substitui, só cria.`);
  if (!apply) return console.log('Nada gravado. Rode com --apply para importar.');

  await prisma.$transaction(ok.map((i) => prisma.product.create({ data: i.data as any })));
  console.log(`Feito: ${ok.length} criados.`);
})()
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
