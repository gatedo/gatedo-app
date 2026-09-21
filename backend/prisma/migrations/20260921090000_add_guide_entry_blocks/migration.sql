-- Conteúdo rico opcional para verbetes do almanaque (seções coloridas,
-- imagem, checklist, callout, slot de oferta). Nullable, aditivo — verbetes
-- existentes continuam funcionando via `body` (markdown simples) enquanto
-- `blocks` estiver vazio.
ALTER TABLE "GuideEntry" ADD COLUMN "blocks" JSONB;
