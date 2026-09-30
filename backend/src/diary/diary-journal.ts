import { PrismaService } from '../prisma/prisma.service';
import { signalForProtocol, summarizeSignals } from './diary-signals';

// Diário unificado do gato — só leitura. Junta o que mora em tabelas
// diferentes (DiaryEntry, ProtocolDayLog, ProtocolDayEntry) numa linha do
// tempo única. Cada tabela continua sendo a fonte de verdade do seu dado;
// nada aqui escreve.

export type JournalItem =
  | { id: string; kind: 'checkin'; date: Date; mood: string | null; occurrences: string[]; content: string | null }
  | { id: string; kind: 'protocol-day'; date: Date; protocolTitle: string; slug: string; dayNumber: number; totalDays: number; dayTitle: string | null; note: string | null }
  | { id: string; kind: 'protocol-event'; date: Date; protocolTitle: string; slug: string; label: string; detail: string | null; signalKey: string | null }
  | { id: string; kind: 'protocol-start'; date: Date; protocolTitle: string; slug: string }
  | { id: string; kind: 'protocol-end'; date: Date; protocolTitle: string; slug: string; status: string; resolved: boolean | null };

export type ActiveProtocol = {
  enrollmentId: string;
  slug: string;
  title: string;
  dayNumber: number;
  totalDays: number;
  action: string;
  unlocked: boolean;
  // true quando o dia de hoje já foi feito e o próximo só abre amanhã.
  doneToday: boolean;
  avulsoLabel: string | null;
  // Só o pedaço do spec que o RegistroAvulsoModal usa — evita mandar o JSON inteiro.
  avulsoSpec: { registro_avulso: any } | null;
};

// Texto da ação do dia: protocolos "ricos" têm spec.dias; os antigos só têm
// ProtocolStep. Sem esse fallback o card ficava sem texto nenhum.
export function protocolDayAction(
  spec: any,
  steps: { dayNumber: number; title: string; taskShort: string | null }[] | undefined,
  dayNumber: number,
): string {
  if (dayNumber === 0) return 'Responda a triagem para começar.';
  const dia = (spec?.dias || []).find((d: any) => d.numero === dayNumber);
  if (dia?.acao_do_dia || dia?.tarefa) return dia.acao_do_dia || dia.tarefa;
  const step = (steps || []).find((s) => s.dayNumber === dayNumber);
  return step?.taskShort || step?.title || '';
}

function protocolDayTitle(spec: any, steps: { dayNumber: number; title: string }[], dayNumber: number): string | null {
  const dia = (spec?.dias || []).find((d: any) => d.numero === dayNumber);
  return dia?.titulo_curto || steps.find((s) => s.dayNumber === dayNumber)?.title || null;
}

function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

async function loadPetProtocols(prisma: PrismaService, petId: string, since: Date) {
  return prisma.protocolEnrollment.findMany({
    where: { petId, OR: [{ status: 'EM_ANDAMENTO' }, { startedAt: { gte: since } }, { completedAt: { gte: since } }] },
    include: {
      protocol: {
        select: {
          slug: true,
          title: true,
          totalDays: true,
          spec: true,
          steps: { select: { dayNumber: true, title: true, taskShort: true } },
        },
      },
      logs: {
        select: {
          id: true,
          dayNumber: true,
          unlockedAt: true,
          completedAt: true,
          note: true,
          entries: { select: { id: true, data: true, createdAt: true } },
        },
        orderBy: { dayNumber: 'asc' },
      },
    },
    orderBy: { startedAt: 'desc' },
  });
}

type LoadedEnrollment = Awaited<ReturnType<typeof loadPetProtocols>>[number];

function totalDaysOf(enr: LoadedEnrollment) {
  const spec: any = enr.protocol.spec;
  return spec?.duracao_dias || (spec?.dias || []).length || enr.protocol.totalDays;
}

// "Aconteceu de novo" de cada protocolo, já com a chave de sinal que ele
// representa (xixi → URINARY_ACCIDENT etc.). Usado pelo diário e pelo iGentVet.
function avulsoEvents(enrollments: LoadedEnrollment[], since: Date) {
  const out: { id: string; date: Date; enr: LoadedEnrollment; data: any; signalKey: string | null }[] = [];
  for (const enr of enrollments) {
    const signalKey = signalForProtocol(enr.protocol)?.key || null;
    for (const log of enr.logs) {
      for (const e of log.entries) {
        const data: any = e.data;
        if (data?.tipo !== 'registro_avulso' || e.createdAt < since) continue;
        out.push({ id: e.id, date: e.createdAt, enr, data, signalKey });
      }
    }
  }
  return out;
}

function toActiveProtocol(enr: LoadedEnrollment): ActiveProtocol {
  const spec: any = enr.protocol.spec;
  const now = new Date();
  const log = enr.logs.find((l) => l.dayNumber === enr.currentDay) || null;
  const prev = enr.logs.find((l) => l.dayNumber === enr.currentDay - 1) || null;
  const unlocked = !!log && log.unlockedAt.getTime() <= now.getTime();
  const doneToday = !unlocked && !!prev?.completedAt && isSameLocalDay(prev.completedAt, now);

  return {
    enrollmentId: enr.id,
    slug: enr.protocol.slug,
    title: spec?.titulo_curto || enr.protocol.title,
    dayNumber: enr.currentDay,
    totalDays: totalDaysOf(enr),
    action: protocolDayAction(spec, enr.protocol.steps, enr.currentDay),
    unlocked,
    doneToday,
    avulsoLabel: spec?.registro_avulso && enr.currentDay >= 1 ? spec.registro_avulso.nome || 'Aconteceu de novo' : null,
    avulsoSpec: spec?.registro_avulso ? { registro_avulso: spec.registro_avulso } : null,
  };
}

export async function buildPetJournal(prisma: PrismaService, petId: string, days = 90) {
  const since = new Date(Date.now() - days * 86400000);
  const since30 = new Date(Date.now() - 30 * 86400000);

  const [checkins, enrollments] = await Promise.all([
    prisma.diaryEntry.findMany({
      where: { petId, date: { gte: since } },
      orderBy: { date: 'desc' },
      select: { id: true, date: true, type: true, occurrences: true, content: true },
    }),
    loadPetProtocols(prisma, petId, since),
  ]);

  const items: JournalItem[] = [];

  for (const c of checkins) {
    items.push({
      id: c.id,
      kind: 'checkin',
      date: c.date,
      // 'checkin' = registro sem humor (humor virou opcional).
      mood: c.type && c.type !== 'checkin' ? c.type : null,
      occurrences: c.occurrences || [],
      content: c.content,
    });
  }

  for (const enr of enrollments) {
    const spec: any = enr.protocol.spec;
    const total = totalDaysOf(enr);
    const base = { protocolTitle: spec?.titulo_curto || enr.protocol.title, slug: enr.protocol.slug };

    if (enr.startedAt >= since) {
      items.push({ id: `start-${enr.id}`, kind: 'protocol-start', date: enr.startedAt, ...base });
    }
    for (const log of enr.logs) {
      if (!log.completedAt || log.completedAt < since) continue;
      if (log.dayNumber < 1 || log.dayNumber > total) continue; // triagem/fechamento viram start/end
      items.push({
        id: log.id,
        kind: 'protocol-day',
        date: log.completedAt,
        dayNumber: log.dayNumber,
        totalDays: total,
        dayTitle: protocolDayTitle(spec, enr.protocol.steps, log.dayNumber),
        note: log.note,
        ...base,
      });
    }
    if (enr.status !== 'EM_ANDAMENTO') {
      const endDate = enr.completedAt || enr.logs.reduce<Date | null>((acc, l) => (l.completedAt && (!acc || l.completedAt > acc) ? l.completedAt : acc), null);
      if (endDate && endDate >= since) {
        items.push({ id: `end-${enr.id}`, kind: 'protocol-end', date: endDate, status: enr.status, resolved: enr.resolved, ...base });
      }
    }
  }

  const avulsos = avulsoEvents(enrollments, since);
  for (const a of avulsos) {
    const spec: any = a.enr.protocol.spec;
    const detail = [a.data.onde, a.data.como].filter(Boolean).join(' · ') || null;
    items.push({
      id: a.id,
      kind: 'protocol-event',
      date: a.date,
      protocolTitle: spec?.titulo_curto || a.enr.protocol.title,
      slug: a.enr.protocol.slug,
      label: a.data.__marco || spec?.registro_avulso?.nome || 'Aconteceu de novo',
      detail,
      signalKey: a.signalKey,
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const signals30d = summarizeSignals(
    checkins.filter((c) => c.date >= since30),
    avulsos.filter((a) => a.signalKey && a.date >= since30).map((a) => ({ key: a.signalKey as string, date: a.date })),
  );

  return {
    items,
    signals30d,
    checkins30d: checkins.filter((c) => c.date >= since30).length,
    activeProtocols: enrollments.filter((e) => e.status === 'EM_ANDAMENTO').map(toActiveProtocol),
  };
}

// Versão enxuta pro prompt do iGentVet — sinais + protocolos, sem a timeline.
export async function loadPetSignalContext(prisma: PrismaService, petId: string, days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const [checkins, enrollments] = await Promise.all([
    prisma.diaryEntry.findMany({ where: { petId, date: { gte: since } }, select: { date: true, occurrences: true } }),
    loadPetProtocols(prisma, petId, since),
  ]);
  const avulsos = avulsoEvents(enrollments, since);
  const summary = summarizeSignals(
    checkins,
    avulsos.filter((a) => a.signalKey).map((a) => ({ key: a.signalKey as string, date: a.date })),
  );
  const protocols = enrollments.map((e) => {
    const status =
      e.status === 'EM_ANDAMENTO'
        ? `em andamento, dia ${e.currentDay} de ${totalDaysOf(e)}`
        : e.status === 'CONCLUIDO'
          ? `concluido${e.resolved === true ? ' (resolveu)' : e.resolved === false ? ' (nao resolveu)' : ''}`
          : e.status === 'INTERROMPIDO_EMERGENCIA'
            ? 'interrompido por sinal de emergencia'
            : e.status.toLowerCase();
    return `  - ${e.protocol.title}: ${status}`;
  });
  return { summary, checkinCount: checkins.length, protocols };
}
