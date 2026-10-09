// Limpeza única da loja antes de reimportar o catálogo "Achados do Gatedo".
// Uso:  node scripts/store-reset.cjs            → só mostra o que faria
//       node scripts/store-reset.cjs --apply    → apaga de verdade
//
// Apaga todos os produtos (e os ProductShare deles, por cascade) e remove
// categorias duplicadas, mantendo os IDs de Saúde e Conforto e o primeiro de
// cada nome. Backup feito antes em .backups/store-backup-2026-10-08.json.
const { PrismaClient } = require('@prisma/client');

const KEEP = new Set([
  '23d06bb9-2591-4e56-989c-e4f2df1e8d8a', // Saúde
  '1d838247-f7e7-4785-b382-cf52f1e02d47', // Conforto
]);
const apply = process.argv.includes('--apply');
const p = new PrismaClient();

(async () => {
  if (await p.orderItem.count()) throw new Error('Há OrderItems apontando para produtos; abortado.');

  const cats = await p.category.findMany();
  const seen = new Set();
  const dupIds = [];
  for (const c of [...cats.filter((c) => KEEP.has(c.id)), ...cats.filter((c) => !KEEP.has(c.id))]) {
    if (seen.has(c.name)) dupIds.push(c.id);
    else seen.add(c.name);
  }

  console.log({
    produtos: await p.product.count(),
    compartilhamentos: await p.productShare.count(),
    categoriasDuplicadas: dupIds.length,
    categoriasQueFicam: [...seen],
  });
  if (!apply) return console.log('Nada apagado. Rode com --apply para executar.');

  await p.$transaction([
    p.productShare.deleteMany({}),
    p.product.deleteMany({}),
    p.category.deleteMany({ where: { id: { in: dupIds } } }),
  ]);
  console.log('Feito.');
})()
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => p.$disconnect());
