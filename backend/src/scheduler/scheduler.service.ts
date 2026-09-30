import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { RemindersService } from '../reminders/reminders.service';
import { NotificationService } from '../notifications/notification.service';

// Agendador interno — dispara as tarefas que antes dependiam de um cron
// externo (que nunca apareceu configurado em lugar nenhum). Sem dependência
// nova: um setTimeout por tarefa até o próximo horário, e reagenda.
//
// SÓ LIGA NO RENDER (RENDER=true é definido pelo próprio Render) ou com
// INTERNAL_CRON=true. Rodando local, o backend aponta pro banco de produção —
// ligar aqui mandaria push/e-mail de verdade pros tutores, em dobro.
// DISABLE_INTERNAL_CRON=true desliga em qualquer ambiente.
//
// As rotas POST de cron continuam existindo (protegidas por CRON_SECRET) pra
// disparo manual.

type Job = {
  name: string;
  // Horários de Brasília (UTC-3 fixo, sem horário de verão desde 2019).
  times: { hour: number; minute: number }[];
  // 0 = domingo … 6 = sábado. Ausente = todo dia.
  weekday?: number;
  run: () => Promise<unknown>;
};

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

function nextRun(job: Job, from = new Date()): Date {
  let best: Date | null = null;
  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    for (const t of job.times) {
      // Meia-noite de Brasília do dia (hoje + offset), expressa em UTC.
      const brt = new Date(from.getTime() - BRT_OFFSET_MS);
      const candidate = new Date(
        Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate() + dayOffset, t.hour, t.minute) + BRT_OFFSET_MS,
      );
      if (candidate <= from) continue;
      if (job.weekday !== undefined && new Date(candidate.getTime() - BRT_OFFSET_MS).getUTCDay() !== job.weekday) continue;
      if (!best || candidate < best) best = candidate;
    }
    if (best) return best;
  }
  throw new Error(`Sem próximo horário para ${job.name}`);
}

@Injectable()
export class SchedulerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(SchedulerService.name);
  private timers: NodeJS.Timeout[] = [];

  constructor(
    private readonly reminders: RemindersService,
    private readonly notifications: NotificationService,
  ) {}

  private get enabled() {
    if (process.env.DISABLE_INTERNAL_CRON === 'true') return false;
    return process.env.RENDER === 'true' || process.env.INTERNAL_CRON === 'true';
  }

  private jobs(): Job[] {
    return [
      { name: 'protocol-check', times: [{ hour: 8, minute: 0 }], run: () => this.notifications.generateProtocolReminders() },
      { name: 'vaccine-check', times: [{ hour: 9, minute: 0 }], run: () => this.notifications.generateVaccineReminders() },
      // Várias vezes ao dia pra cobrir quem prefere manhã (<13h) e tarde;
      // o serviço garante no máximo 1 aviso por lembrete por dia.
      {
        name: 'daily-push',
        times: [
          { hour: 9, minute: 30 },
          { hour: 13, minute: 30 },
          { hour: 18, minute: 0 },
        ],
        run: () => this.reminders.runDailyPush(),
      },
      // Sem deduplicação no serviço — exatamente 1x por semana (segunda 9h).
      { name: 'weekly-email', times: [{ hour: 9, minute: 0 }], weekday: 1, run: () => this.reminders.runWeeklyEmail() },
    ];
  }

  onApplicationBootstrap() {
    if (!this.enabled) {
      this.logger.log('Agendador interno desligado (fora do Render). Defina INTERNAL_CRON=true para ligar.');
      return;
    }
    for (const job of this.jobs()) this.schedule(job);
  }

  onApplicationShutdown() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private schedule(job: Job) {
    const at = nextRun(job);
    this.logger.log(`${job.name}: próximo disparo ${at.toISOString()}`);
    // setTimeout aceita no máximo ~24,8 dias — o intervalo aqui é de até 7.
    const timer = setTimeout(async () => {
      try {
        const result = await job.run();
        this.logger.log(`${job.name}: ok ${JSON.stringify(result ?? {}).slice(0, 200)}`);
      } catch (err: any) {
        this.logger.error(`${job.name}: falhou — ${err?.message || err}`);
      } finally {
        this.schedule(job);
      }
    }, at.getTime() - Date.now());
    this.timers.push(timer);
  }
}

export const __test = { nextRun };
