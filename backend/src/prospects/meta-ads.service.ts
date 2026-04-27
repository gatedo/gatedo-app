import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import OpenAI from 'openai';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0';
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || process.env.FB_MARKETING_ACCESS_TOKEN || '';
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || process.env.FB_AD_ACCOUNT_ID || '';
const META_TIMEOUT = 15000;
const META_AI_MODEL = process.env.META_AI_MODEL || process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';

const VALID_PERIODS = new Set([
  'today',
  'yesterday',
  'last_3d',
  'last_7d',
  'last_14d',
  'last_28d',
  'last_30d',
  'this_month',
  'last_month',
  'maximum',
]);

const VALID_STATUSES = new Set(['ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED', 'IN_PROCESS', 'WITH_ISSUES']);

function normalizeAccountId(accountId?: string) {
  const raw = String(accountId || META_AD_ACCOUNT_ID || '').trim();
  if (!raw) return '';
  return raw.startsWith('act_') ? raw : `act_${raw.replace(/[^\d]/g, '')}`;
}

function safePeriod(period?: string) {
  const value = String(period || 'last_7d');
  return VALID_PERIODS.has(value) ? value : 'last_7d';
}

function safeStatus(status?: string) {
  const value = String(status || 'ACTIVE').toUpperCase();
  return value === 'ALL' || VALID_STATUSES.has(value) ? value : 'ACTIVE';
}

function numberParam(value: any, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function maskToken(token: string) {
  if (!token) return null;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);
  private readonly openai: OpenAI | null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.IGENT_OPENAI_API_KEY || '';
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;
  }

  private assertConfigured(accountId?: string) {
    const normalizedAccountId = normalizeAccountId(accountId);

    if (!META_ACCESS_TOKEN) {
      throw new HttpException(
        { error: 'META_ACCESS_TOKEN nao configurado', code: 'META_TOKEN_MISSING' },
        HttpStatus.PRECONDITION_REQUIRED,
      );
    }

    if (!normalizedAccountId) {
      throw new HttpException(
        { error: 'META_AD_ACCOUNT_ID nao configurado', code: 'META_ACCOUNT_MISSING' },
        HttpStatus.PRECONDITION_REQUIRED,
      );
    }

    return normalizedAccountId;
  }

  private async graphGet(path: string, params: Record<string, any> = {}) {
    try {
      const response = await axios.get(`${GRAPH_URL}/${path.replace(/^\/+/, '')}`, {
        timeout: META_TIMEOUT,
        params: {
          ...params,
          access_token: META_ACCESS_TOKEN,
        },
      });
      return response.data;
    } catch (err) {
      const e = err as AxiosError<any>;
      const metaError = e.response?.data?.error;
      this.logger.warn(
        {
          path,
          status: e.response?.status,
          type: metaError?.type,
          code: metaError?.code,
          message: metaError?.message || e.message,
        },
        'Meta Marketing API falhou',
      );

      throw new HttpException(
        {
          error: metaError?.message || e.message,
          code: metaError?.code || 'META_API_ERROR',
          type: metaError?.type,
        },
        e.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  getConfig() {
    const accountId = normalizeAccountId();
    return {
      configured: Boolean(META_ACCESS_TOKEN && accountId),
      hasToken: Boolean(META_ACCESS_TOKEN),
      tokenPreview: maskToken(META_ACCESS_TOKEN),
      accountId,
      graphVersion: GRAPH_VERSION,
    };
  }

  async getCampaigns(query: any) {
    const accountId = this.assertConfigured(query?.accountId);
    const period = safePeriod(query?.period);
    const status = safeStatus(query?.status);
    const limit = numberParam(query?.limit, 50, 200);
    const effectiveStatus = status === 'ALL' ? ['ACTIVE', 'PAUSED', 'ARCHIVED', 'WITH_ISSUES'] : [status];

    const insightFields = [
      'spend',
      'impressions',
      'clicks',
      'cpc',
      'cpm',
      'ctr',
      'reach',
      'purchase_roas',
      'actions',
      'action_values',
      'frequency',
    ].join(',');

    const fields = [
      'id',
      'name',
      'status',
      'effective_status',
      'objective',
      'daily_budget',
      'lifetime_budget',
      'start_time',
      'stop_time',
      `insights.date_preset(${period}){${insightFields}}`,
    ].join(',');

    const data = await this.graphGet(`${accountId}/campaigns`, {
      fields,
      effective_status: JSON.stringify(effectiveStatus),
      limit,
    });

    const campaigns = Array.isArray(data?.data) ? data.data : [];
    return {
      data: campaigns,
      paging: data?.paging || null,
      meta: {
        accountId,
        period,
        status,
        graphVersion: GRAPH_VERSION,
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  async getAudiences(query: any) {
    const accountId = this.assertConfigured(query?.accountId);
    const limit = numberParam(query?.limit, 50, 200);
    const data = await this.graphGet(`${accountId}/customaudiences`, {
      fields: 'id,name,subtype,approximate_count,delivery_status,operation_status,lookalike_spec,time_created,time_updated',
      limit,
    });

    return {
      data: (data?.data || []).map((audience) => ({
        id: audience.id,
        name: audience.name,
        type: audience.lookalike_spec ? 'LOOKALIKE' : 'CUSTOM',
        subtype: audience.subtype || (audience.lookalike_spec ? 'LOOKALIKE' : 'CUSTOM'),
        size: audience.approximate_count ? String(audience.approximate_count) : 'Indisponivel',
        status: audience.delivery_status?.code || audience.operation_status?.code || 'unknown',
        raw: audience,
      })),
      paging: data?.paging || null,
      meta: {
        accountId,
        graphVersion: GRAPH_VERSION,
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  async testConnection(accountId?: string) {
    const normalizedAccountId = this.assertConfigured(accountId);
    const data = await this.graphGet(normalizedAccountId, {
      fields: 'id,name,account_status,currency,timezone_name,business_name',
    });

    return {
      ok: true,
      account: data,
      graphVersion: GRAPH_VERSION,
      fetchedAt: new Date().toISOString(),
    };
  }

  private getActionValue(insights: any, actionType: string) {
    return Number(
      insights?.actions?.find((item) => item.action_type === actionType)?.value || 0,
    );
  }

  private getRevenue(insights: any) {
    return Number(insights?.action_values?.find((item) => item.action_type === 'purchase')?.value || 0);
  }

  private getRoas(insights: any) {
    const direct = Number(insights?.purchase_roas?.[0]?.value || 0);
    if (direct > 0) return direct;
    const spend = Number(insights?.spend || 0);
    const revenue = this.getRevenue(insights);
    return spend > 0 && revenue > 0 ? revenue / spend : 0;
  }

  private campaignMetric(campaign: any) {
    const insights = campaign?.insights?.data?.[0] || {};
    const spend = Number(insights.spend || 0);
    const clicks = Number(insights.clicks || 0);
    const impressions = Number(insights.impressions || 0);
    const reach = Number(insights.reach || 0);
    const conversions = this.getActionValue(insights, 'purchase');
    const revenue = this.getRevenue(insights);
    const roas = this.getRoas(insights);

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.effective_status || campaign.status,
      objective: campaign.objective,
      spend,
      impressions,
      reach,
      clicks,
      ctr: Number(insights.ctr || 0),
      cpc: Number(insights.cpc || 0),
      cpm: Number(insights.cpm || 0),
      frequency: Number(insights.frequency || 0),
      conversions,
      revenue,
      roas,
      cpa: conversions > 0 ? spend / conversions : 0,
    };
  }

  private buildRulesAdvisor(campaigns: any[], meta: any) {
    const items = campaigns.map((campaign) => this.campaignMetric(campaign));
    const active = items.filter((item) => item.status === 'ACTIVE');
    const totals = items.reduce(
      (acc, item) => {
        acc.spend += item.spend;
        acc.clicks += item.clicks;
        acc.impressions += item.impressions;
        acc.conversions += item.conversions;
        acc.revenue += item.revenue;
        return acc;
      },
      { spend: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 },
    );

    const summary = {
      period: meta?.period || 'last_7d',
      totalCampaigns: items.length,
      activeCampaigns: active.length,
      spend: Number(totals.spend.toFixed(2)),
      clicks: totals.clicks,
      impressions: totals.impressions,
      conversions: totals.conversions,
      revenue: Number(totals.revenue.toFixed(2)),
      ctr: totals.impressions > 0 ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
      cpc: totals.clicks > 0 ? Number((totals.spend / totals.clicks).toFixed(2)) : 0,
      roas: totals.spend > 0 ? Number((totals.revenue / totals.spend).toFixed(2)) : 0,
    };

    const priorities: any[] = [];
    const campaignActions: any[] = [];
    const experiments: any[] = [];

    if (summary.spend < 30) {
      priorities.push({
        title: 'Coletar mais dados antes de decisões agressivas',
        reason: 'O investimento do periodo ainda e baixo para conclusoes estatisticas fortes.',
        action: 'Mantenha campanhas principais rodando ate ter volume minimo de cliques e eventos.',
        impact: 'Evita pausar anuncios promissores cedo demais.',
        urgency: 'media',
      });
    }

    const noConversion = active.filter((item) => item.spend >= 20 && item.conversions === 0);
    if (noConversion.length) {
      priorities.push({
        title: 'Investigar campanhas com gasto e zero conversoes',
        reason: `${noConversion.length} campanha(s) ativa(s) ja gastaram sem registrar compra/conversao.`,
        action: 'Revise evento de conversao, pagina de destino, oferta e etapa de checkout antes de aumentar orcamento.',
        impact: 'Protege caixa e reduz desperdicio de midia.',
        urgency: 'alta',
      });
    }

    const lowCtr = active.filter((item) => item.impressions >= 1000 && item.ctr < 1);
    if (lowCtr.length) {
      priorities.push({
        title: 'Melhorar criativos com CTR baixo',
        reason: `${lowCtr.length} campanha(s) estao abaixo de 1% de CTR.`,
        action: 'Teste ganchos mais diretos: dor de saude preventiva, organizacao da vida do gato e fundador por tempo limitado.',
        impact: 'Pode reduzir CPC e aumentar entrada de leads qualificados.',
        urgency: 'alta',
      });
    }

    const fatigue = active.filter((item) => item.frequency >= 3.5);
    if (fatigue.length) {
      priorities.push({
        title: 'Checar fadiga de publico',
        reason: `${fatigue.length} campanha(s) com frequencia acima de 3.5.`,
        action: 'Renove criativos, amplie publico ou crie uma variacao de mensagem para evitar saturacao.',
        impact: 'Ajuda a segurar CTR e CPM.',
        urgency: 'media',
      });
    }

    const best = [...active].filter((item) => item.spend > 0).sort((a, b) => (b.roas || b.ctr) - (a.roas || a.ctr))[0];
    if (best) {
      priorities.push({
        title: `Escalar com cautela: ${best.name}`,
        reason: best.roas > 0 ? `Melhor ROAS do periodo: ${best.roas.toFixed(2)}x.` : `Melhor combinacao de CTR/CPC entre campanhas ativas.`,
        action: 'Aumente orcamento em 15% a 25% e acompanhe CPA/CTR nas proximas 24h.',
        impact: 'Escala o que ja esta mostrando sinal positivo sem desorganizar o aprendizado.',
        urgency: 'media',
      });
    }

    for (const item of active) {
      const notes: string[] = [];
      if (item.spend >= 20 && item.conversions === 0) notes.push('revisar conversao/oferta antes de escalar');
      if (item.ctr < 1 && item.impressions >= 1000) notes.push('trocar gancho criativo');
      if (item.cpc > 2.5) notes.push('testar publico/posicionamento para reduzir CPC');
      if (item.frequency >= 3.5) notes.push('renovar criativo por fadiga');
      if (item.roas >= 2) notes.push('candidata a aumento gradual de verba');
      campaignActions.push({
        campaignId: item.id,
        campaignName: item.name,
        status: item.status,
        spend: item.spend,
        ctr: item.ctr,
        cpc: item.cpc,
        roas: item.roas,
        recommendation: notes.length ? notes.join('; ') : 'manter monitoramento e acumular mais dados',
      });
    }

    experiments.push(
      {
        title: 'Criativo dor concreta',
        hypothesis: 'Tutors respondem melhor a dor de esquecer vacinas/consultas do que a promessa generica de app.',
        setup: 'Criar 2 anuncios com antes/depois: ficha baguncada vs historico organizado no Gatedo.',
        successMetric: 'CTR acima de 1.5% e CPC abaixo da media atual.',
      },
      {
        title: 'Oferta Fundador com urgencia limpa',
        hypothesis: 'A clareza de menor preco vitalicio aumenta conversao.',
        setup: 'Testar headline com "Fundador Gatedo" e beneficio financeiro sem exageros.',
        successMetric: 'CPA menor que a campanha atual vencedora.',
      },
    );

    return {
      provider: 'rules',
      generatedAt: new Date().toISOString(),
      summary,
      priorities,
      campaignActions,
      experiments,
      nextQuestions: [
        'Qual e o CPA maximo aceitavel para um fundador?',
        'Qual evento esta sendo otimizado: compra, lead ou clique no WhatsApp?',
        'Existe criativo novo pronto para testar esta semana?',
      ],
    };
  }

  private async buildAiAdvisor(base: any) {
    if (!this.openai) return base;

    const payload = {
      summary: base.summary,
      campaigns: base.campaignActions.slice(0, 20),
      rulePriorities: base.priorities,
    };

    const prompt = `
Voce e uma assistente senior de trafego pago para o Gatedo, um app brasileiro para tutores de gatos.
Analise os dados de Meta Ads abaixo e responda APENAS em JSON valido.
Seja pratica, conservadora com verba e orientada a acao. Nao invente dados ausentes.

Formato:
{
  "summary": { "diagnosis": "...", "mainRisk": "...", "bestOpportunity": "..." },
  "priorities": [{ "title": "...", "reason": "...", "action": "...", "impact": "...", "urgency": "alta|media|baixa" }],
  "campaignActions": [{ "campaignName": "...", "recommendation": "...", "budgetAction": "manter|aumentar|reduzir|pausar|testar", "why": "..." }],
  "experiments": [{ "title": "...", "hypothesis": "...", "setup": "...", "successMetric": "..." }],
  "nextQuestions": ["..."]
}

Dados:
${JSON.stringify(payload)}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: META_AI_MODEL,
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.25,
        response_format: { type: 'json_object' },
      });
      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      return {
        ...base,
        provider: 'openai',
        aiModel: META_AI_MODEL,
        ai: parsed,
      };
    } catch (error: any) {
      this.logger.warn(`Assistente Meta Ads caiu para regras: ${error?.message || error}`);
      return base;
    }
  }

  async getAdvisor(query: any) {
    const campaigns = await this.getCampaigns(query);
    const base = this.buildRulesAdvisor(campaigns.data || [], campaigns.meta);
    return this.buildAiAdvisor(base);
  }
}
