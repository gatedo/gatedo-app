import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly appUrl: string;
  private readonly assetsUrl: string;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.from = process.env.EMAIL_FROM || 'Gatedo <noreply@gatedo.com>';
    this.frontendUrl = (process.env.FRONTEND_URL || process.env.APP_URL || 'https://app.gatedo.com').replace(/\/+$/, '');
    this.appUrl = (process.env.APP_URL || this.frontendUrl || 'https://app.gatedo.com').replace(/\/+$/, '');
    this.assetsUrl = (process.env.PUBLIC_ASSETS_URL || `${this.appUrl}/assets`).replace(/\/+$/, '');
  }

  async sendActivationInvite(
    to: string,
    name: string,
    token: string,
    type: 'founder' | 'purchase',
    badgeLabel?: string | null,
  ) {
    const link = `${this.frontendUrl}/register?token=${token}&type=${type}`;
    const isFounder = type === 'founder';
    const label = badgeLabel || (isFounder ? 'Tutor Fundador' : 'Plano Gatedo');
    const safeName = this.escapeHtml(name || 'Tutor');
    const safeLabel = this.escapeHtml(label);
    const badgeUrl = this.getBadgeImage(label, type);

    const html = this.baseTemplate(`
      <div style="text-align:center; margin-top:-62px; padding-bottom:22px;">
        <img src="${badgeUrl}" width="132" height="132" alt="${safeLabel}" style="display:block; width:132px; height:132px; object-fit:contain; margin:0 auto 8px;" />
        <div style="display:inline-block; border:1px solid #F6B23A; color:#D97706; border-radius:999px; padding:7px 14px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; background:#FFF8E7;">
          ${isFounder ? 'Fundador vitalicio' : 'Acesso Gatedo'}
        </div>
        <h1 style="margin:18px 0 8px; font-size:30px; line-height:1.12; font-weight:900; color:#202036;">
          ${safeName}, seu acesso esta pronto.
        </h1>
        <p style="margin:0 auto; max-width:370px; color:#72748A; font-size:15px; line-height:1.55;">
          ${isFounder
            ? `Voce garantiu sua vaga como <strong>${safeLabel}</strong>. Clique abaixo para criar sua conta e ativar seu selo no app.`
            : `Sua compra do <strong>${safeLabel}</strong> foi aprovada. Clique abaixo para criar sua conta e liberar os beneficios.`}
        </p>
      </div>

      ${this.featureRow('Plano aplicado', safeLabel, '#FFF7E6', '#F59E0B')}
      ${this.featureRow('Cadastro com token seguro', 'Seu link de ativacao e unico para este e-mail.', '#F5F0FF', '#8B4AFF')}
      ${this.featureRow('Perfil com selo especial', 'A condecoracao aparece no app conforme sua hierarquia.', '#ECFDF5', '#10B981')}

      <div style="text-align:center; padding-top:10px;">
        <a href="${link}" style="display:inline-block; background:#F59E0B; color:#ffffff; text-decoration:none; padding:18px 42px; border-radius:50px; font-weight:900; font-size:14px; box-shadow:0 12px 28px rgba(245,158,11,0.28);">
          CRIAR MINHA CONTA
        </a>
        <p style="margin:16px auto 0; max-width:380px; color:#9CA3AF; font-size:11px; line-height:1.5;">
          Se o botao nao abrir, copie este link:<br />
          <span style="word-break:break-all; color:#8B4AFF;">${link}</span>
        </p>
      </div>
    `);

    await this.send(
      to,
      isFounder ? `Seu selo ${label} esta pronto - Gatedo` : 'Ative seu acesso Gatedo',
      html,
    );
  }

  async sendWelcome(to: string, name: string, plan: string) {
    const isFounder = plan === 'FOUNDER' || plan === 'FOUNDER_EARLY';
    const safeName = this.escapeHtml(name || 'Tutor');
    const badgeUrl = this.getBadgeImage(isFounder ? 'Tutor Genese' : 'Gatedo', isFounder ? 'founder' : 'purchase');

    const html = this.baseTemplate(`
      <div style="text-align:center; margin-top:-54px; padding-bottom:24px;">
        <img src="${badgeUrl}" width="116" height="116" alt="Gatedo" style="display:block; width:116px; height:116px; object-fit:contain; margin:0 auto 12px;" />
        <h1 style="margin:0 0 8px; font-size:30px; line-height:1.15; font-weight:900; color:#202036;">
          Fala, ${safeName}!
        </h1>
        <p style="margin:0 auto; max-width:360px; color:#72748A; font-size:15px; line-height:1.55;">
          ${isFounder
            ? 'Voce acaba de desbloquear um acesso especial ao futuro do cuidado felino.'
            : 'Sua conta foi criada com sucesso. Prepare-se para uma nova experiencia com seu gato.'}
        </p>
      </div>

      ${
        isFounder
          ? this.featureRow('Selo vitalicio', 'Fundador Gatedo ativo', '#F5F0FF', '#8B4AFF')
          : this.featureRow('Conta ativa', 'Seu perfil Gatedo esta pronto para uso.', '#ECFDF5', '#10B981')
      }

      <div style="text-align:center; padding-top:14px;">
        <a href="${this.frontendUrl}/home" style="display:inline-block; background:#8B4AFF; color:#ffffff; text-decoration:none; padding:18px 48px; border-radius:50px; font-weight:900; font-size:15px; box-shadow:0 10px 26px rgba(139,74,255,0.28);">
          ACESSAR O GATEDO
        </a>
      </div>
    `);

    await this.send(to, isFounder ? 'Seja bem-vindo, Fundador Gatedo!' : 'Bem-vindo ao Gatedo!', html);
  }

  async sendEmailVerification(to: string, name: string, token: string) {
    const link = `${this.frontendUrl}/verify-email?token=${token}`;
    const safeName = this.escapeHtml(name || 'Tutor');

    const html = this.baseTemplate(`
      <div style="text-align:center; padding-bottom:24px;">
        <img src="${this.asset('App_gatedo_logo1.webp')}" width="88" height="88" alt="Gatedo" style="display:block; width:88px; height:88px; object-fit:contain; margin:0 auto 18px;" />
        <h1 style="margin:0 0 8px; font-size:28px; font-weight:900; color:#202036;">
          Confirme seu e-mail
        </h1>
        <p style="margin:0 auto; max-width:360px; color:#72748A; font-size:15px; line-height:1.55;">
          Ola, ${safeName}. Clique no botao abaixo para validar seu acesso.
        </p>
      </div>

      <div style="text-align:center;">
        <a href="${link}" style="display:inline-block; background:#202036; color:#ffffff; text-decoration:none; padding:18px 48px; border-radius:50px; font-weight:900; font-size:14px;">
          VERIFICAR AGORA
        </a>
      </div>
    `);

    await this.send(to, 'Confirme seu e-mail - Gatedo', html);
  }

  async sendPasswordReset(to: string, name: string, token: string) {
    const link = `${this.frontendUrl}/reset-password?token=${token}`;
    const safeName = this.escapeHtml(name || 'Tutor');

    const html = this.baseTemplate(`
      <div style="text-align:center; padding-bottom:24px;">
        <img src="${this.asset('App_gatedo_logo1.webp')}" width="88" height="88" alt="Gatedo" style="display:block; width:88px; height:88px; object-fit:contain; margin:0 auto 18px;" />
        <h1 style="margin:0 0 8px; font-size:28px; font-weight:900; color:#202036;">
          Nova senha
        </h1>
        <p style="margin:0 auto; max-width:360px; color:#72748A; font-size:15px; line-height:1.55;">
          Tudo bem, ${safeName}. Clique abaixo para redefinir sua senha.
        </p>
      </div>

      <div style="text-align:center;">
        <a href="${link}" style="display:inline-block; background:#8B4AFF; color:#ffffff; text-decoration:none; padding:18px 48px; border-radius:50px; font-weight:900; font-size:14px;">
          REDEFINIR SENHA
        </a>
      </div>
    `);

    await this.send(to, 'Redefinir sua senha - Gatedo', html);
  }

  async sendReminderDigest(to: string, name: string, items: { label: string; overdue: boolean }[]) {
    const safeName = this.escapeHtml(name || 'Tutor');
    const first = items[0]?.label || 'um cuidado';
    const subject = items.length === 1 ? `Esta semana: ${first}` : `Esta semana: ${first} e mais ${items.length - 1}`;

    const rows = items
      .map(
        (item) => `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:18px; margin:0 0 10px; box-shadow:0 6px 18px rgba(32,32,54,0.05);">
        <tr>
          <td style="padding:14px 18px;">
            <p style="margin:0; color:#202036; font-size:13px; font-weight:800;">${this.escapeHtml(item.label)}</p>
            ${item.overdue ? '<p style="margin:4px 0 0; color:#B45309; font-size:11px; font-weight:700;">Já passou da data — sem pressa, é só pra não esquecer.</p>' : ''}
          </td>
        </tr>
      </table>`,
      )
      .join('');

    const html = this.baseTemplate(`
      <div style="text-align:center; padding-bottom:20px;">
        <h1 style="margin:0 0 8px; font-size:26px; font-weight:900; color:#202036;">Oi, ${safeName}</h1>
        <p style="margin:0 auto; max-width:360px; color:#72748A; font-size:14px; line-height:1.5;">
          Esses cuidados estão chegando (ou já passaram da data):
        </p>
      </div>
      ${rows}
      <div style="text-align:center; padding-top:14px;">
        <a href="${this.frontendUrl}/health?src=email_reminder" style="display:inline-block; background:#8B4AFF; color:#ffffff; text-decoration:none; padding:16px 40px; border-radius:50px; font-weight:900; font-size:14px;">
          VER NO APP
        </a>
        <p style="margin:18px auto 0; max-width:380px; color:#B0B3C5; font-size:10px; line-height:1.5;">
          <a href="${this.frontendUrl}/settings" style="color:#B0B3C5;">Não quero mais receber este e-mail</a>
        </p>
      </div>
    `);

    await this.send(to, subject, html);
  }

  async sendAiBudgetAlert(to: string, params: { spend: number; budget: number; ratio: number; paused: boolean }) {
    const percent = Math.round(params.ratio * 100);
    const subject = params.paused
      ? `iGentVet pausado — 100% do orçamento de IA do mês`
      : `Aviso: iGentVet em ${percent}% do orçamento de IA do mês`;

    const html = this.baseTemplate(`
      <div style="text-align:center; padding-bottom:20px;">
        <h1 style="margin:0 0 8px; font-size:26px; font-weight:900; color:#202036;">${subject}</h1>
        <p style="margin:0 auto; max-width:380px; color:#72748A; font-size:14px; line-height:1.5;">
          Gasto estimado do mês: <strong>US$ ${params.spend.toFixed(2)}</strong> de US$ ${params.budget.toFixed(2)} (${percent}%).
        </p>
        ${
          params.paused
            ? '<p style="margin:12px auto 0; max-width:380px; color:#B45309; font-size:13px; font-weight:800;">O iGentVet do plano free foi pausado até o próximo ciclo. Clube e pacote avulso continuam funcionando normalmente.</p>'
            : ''
        }
      </div>
    `);

    await this.send(to, subject, html);
  }

  private featureRow(title: string, text: string, bg: string, color: string) {
    return `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:22px; margin:0 0 16px; box-shadow:0 8px 24px rgba(32,32,54,0.06);">
        <tr>
          <td width="58" style="padding:16px 0 16px 18px;">
            <div style="width:44px; height:44px; border-radius:15px; background:${bg}; color:${color}; text-align:center; line-height:44px; font-size:20px; font-weight:900;">g</div>
          </td>
          <td style="padding:16px 18px 16px 12px;">
            <p style="margin:0 0 4px; color:#202036; font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:.4px;">${title}</p>
            <p style="margin:0; color:#5F6475; font-size:12px; line-height:1.45; font-weight:700;">${text}</p>
          </td>
        </tr>
      </table>
    `;
  }

  private baseTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0; padding:0; background-color:#F2F0FF;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#F2F0FF; padding:42px 18px; font-family:Arial, Helvetica, sans-serif;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;">
                  <tr>
                    <td style="text-align:center; padding-bottom:28px;">
                      <img src="${this.asset('logo_gatedo_full.webp')}" height="34" alt="Gatedo" style="display:inline-block; height:34px; width:auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#EBFC46; border-radius:36px 36px 0 0; height:76px; line-height:76px; font-size:1px;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="background:#F7F6FF; border-radius:0 0 36px 36px; padding:40px 30px 34px; box-shadow:0 18px 45px rgba(32,32,54,0.12);">
                      ${content}
                    </td>
                  </tr>
                  <tr>
                    <td style="text-align:center; padding-top:28px;">
                      <p style="margin:0; font-size:12px; color:#9CA3AF; font-weight:700;">
                        &copy; ${new Date().getFullYear()} GATEDO
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private asset(path: string) {
    return `${this.assetsUrl}/${path.replace(/^\/+/, '')}`;
  }

  private getBadgeImage(label?: string | null, type?: 'founder' | 'purchase') {
    const value = String(label || '').toLowerCase();
    if (value.includes('raiz')) return this.asset('badges/badge-raiz.webp');
    if (value.includes('cerne')) return this.asset('badges/badge-cerne.webp');
    if (value.includes('prime')) return this.asset('badges/badge-prime.webp');
    if (value.includes('vip') || value.includes('tester')) return this.asset('badges/badge-vip.webp');
    if (value.includes('gen') || type === 'founder') return this.asset('badges/badge-genese.webp');
    return this.asset('App_gatedo_logo1.webp');
  }

  private escapeHtml(value: string) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async send(to: string, subject: string, html: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Resend rejeitou email para ${to}: ${JSON.stringify(error)}`);
        return;
      }

      this.logger.log(`Email enviado: "${subject}" -> ${to} (id: ${data?.id})`);
    } catch (err: any) {
      this.logger.error(`Erro inesperado ao enviar email para ${to}: ${err?.message}`);
    }
  }
}
