/**
 * Avaliador mínimo e seguro (sem eval) para as expressões "quando" do spec
 * de protocolo. Gramática suportada: cláusulas "campo OP valor" combinadas
 * com AND/OR (sem parênteses, sem precedência mista — não precisa mais que
 * isso pro que os protocolos usam).
 *
 * Exemplos reais do JSON:
 *   resultado == 'Parou completamente'
 *   gato.idade_meses <= 12 OR gato.cadastrado_ha_dias <= 60
 */

function getPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function parseLiteral(raw: string): any {
  const trimmed = raw.trim();
  if (/^'.*'$/.test(trimmed) || /^".*"$/.test(trimmed)) return trimmed.slice(1, -1);
  if (!Number.isNaN(Number(trimmed))) return Number(trimmed);
  return trimmed;
}

function evaluateClause(clause: string, context: Record<string, any>): boolean {
  const match = clause.trim().match(/^([\w.]+)\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
  if (!match) return false;

  const [, path, op, rawValue] = match;
  const left = getPath(context, path);
  const right = parseLiteral(rawValue);

  switch (op) {
    case '==':
      return String(left) === String(right);
    case '!=':
      return String(left) !== String(right);
    case '<=':
      return Number(left) <= Number(right);
    case '>=':
      return Number(left) >= Number(right);
    case '<':
      return Number(left) < Number(right);
    case '>':
      return Number(left) > Number(right);
    default:
      return false;
  }
}

export function evaluateCondition(expr: string | undefined | null, context: Record<string, any>): boolean {
  if (!expr) return false;
  return expr
    .split(/\s+OR\s+/i)
    .some((orPart) => orPart.split(/\s+AND\s+/i).every((clause) => evaluateClause(clause, context)));
}
