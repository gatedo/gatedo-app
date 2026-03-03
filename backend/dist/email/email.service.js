"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const resend_1 = require("resend");
let EmailService = EmailService_1 = class EmailService {
    constructor() {
        this.logger = new common_1.Logger(EmailService_1.name);
        this.resend = new resend_1.Resend(process.env.RESEND_API_KEY);
        this.from = 'Gatedo <noreply@gatedo.com>';
        this.frontendUrl = process.env.FRONTEND_URL || 'https://gatedo.com';
    }
    async sendWelcome(to, name, plan) {
        const isFounder = plan === 'FOUNDER';
        const subject = isFounder ? '🐾 Seja bem-vindo, Fundador Gatedo!' : '🐾 Bem-vindo ao Gatedo!';
        const html = this.baseTemplate(`
      <div style="text-align:center; padding-bottom: 32px;">
        <img src="https://app.gatedo.com/icone-login.png" width="80" height="80" style="margin-bottom:24px; border-radius:22px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" alt="Gatedo">
        <h1 style="margin:0 0 8px; font-size:28px; font-weight:900; color:#1C1C2E; letter-spacing:-0.5px;">Fala, ${name}! 👋</h1>
        <p style="margin:0; color:#6B7280; font-size:16px; line-height:1.5;">
          ${isFounder
            ? 'Você acaba de desbloquear o acesso de elite ao futuro do cuidado felino.'
            : 'Sua conta foi criada com sucesso. Prepare-se para uma nova experiência com seu gato.'}
        </p>
      </div>

      ${isFounder ? `
      <div style="background:#F4F3FF; border-radius:24px; padding:24px; margin-bottom:24px; text-align:center;">
        <p style="margin:0; font-size:11px; font-weight:800; color:#6158ca; text-transform:uppercase; letter-spacing:2px;">Selo Vitalício</p>
        <p style="margin:4px 0 0; color:#1C1C2E; font-size:18px; font-weight:900;">⭐ Fundador Gatedo Ativo</p>
      </div>
      ` : ''}

      <div style="text-align:center;">
        <a href="${this.frontendUrl}/home" style="display:inline-block; background:#6158ca; color:white; text-decoration:none; padding:18px 48px; border-radius:50px; font-weight:900; font-size:15px; box-shadow:0 8px 24px rgba(97,88,202,0.3);">ACESSAR O GATEDO</a>
      </div>
    `);
        await this.send(to, subject, html);
    }
    async sendEmailVerification(to, name, token) {
        const link = `${this.frontendUrl}/verify-email?token=${token}`;
        const html = this.baseTemplate(`
      <div style="text-align:center; padding-bottom: 32px;">
        <div style="width:64px; height:64px; background:#DFFF40; border-radius:18px; display:inline-flex; align-items:center; justify-content:center; font-size:32px; margin-bottom:24px;">✉️</div>
        <h1 style="margin:0 0 8px; font-size:26px; font-weight:900; color:#1C1C2E;">Confirme seu e-mail</h1>
        <p style="margin:0; color:#6B7280; font-size:15px;">Olá, ${name}. Clique no botão abaixo para validar seu acesso.</p>
      </div>
      <div style="text-align:center;">
        <a href="${link}" style="display:inline-block; background:#1C1C2E; color:white; text-decoration:none; padding:18px 48px; border-radius:50px; font-weight:900; font-size:14px;">VERIFICAR AGORA</a>
      </div>
    `);
        await this.send(to, '✉️ Confirme seu e-mail — Gatedo', html);
    }
    async sendPasswordReset(to, name, token) {
        const link = `${this.frontendUrl}/reset-password?token=${token}`;
        const html = this.baseTemplate(`
      <div style="text-align:center; padding-bottom: 32px;">
        <div style="width:64px; height:64px; background:#F4F3FF; border-radius:18px; display:inline-flex; align-items:center; justify-content:center; font-size:32px; margin-bottom:24px;">🔑</div>
        <h1 style="margin:0 0 8px; font-size:26px; font-weight:900; color:#1C1C2E;">Nova senha</h1>
        <p style="margin:0; color:#6B7280; font-size:15px;">Tudo bem, ${name}. Clique abaixo para redefinir sua senha.</p>
      </div>
      <div style="text-align:center;">
        <a href="${link}" style="display:inline-block; background:#6158ca; color:white; text-decoration:none; padding:18px 48px; border-radius:50px; font-weight:900; font-size:14px;">REDEFINIR SENHA</a>
      </div>
    `);
        await this.send(to, '🔑 Redefinir sua senha — Gatedo', html);
    }
    baseTemplate(content) {
        return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Nunito', sans-serif !important; -webkit-font-smoothing: antialiased; }
        </style>
      </head>
      <body style="margin:0; padding:0; background-color:#F4F3FF;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F4F3FF; padding:40px 20px;">
          <tr><td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;">
              <tr><td style="text-align:center; padding-bottom:32px;">
                <img src="https://app.gatedo.com/logo-login.png" height="32" alt="Gatedo">
              </td></tr>
              <tr><td style="background-color:#ffffff; border-radius:32px; padding:48px 40px; box-shadow:0 10px 40px rgba(97,88,202,0.1);">
                ${content}
              </td></tr>
              <tr><td style="text-align:center; padding-top:32px;">
                <p style="margin:0; font-size:12px; color:#9CA3AF; font-weight:700;">© ${new Date().getFullYear()} GATEDO</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;
    }
    async send(to, subject, html) {
        try {
            const { data, error } = await this.resend.emails.send({
                from: this.from, to, subject, html
            });
            if (error) {
                this.logger.error(`Resend rejeitou email para ${to}: ${JSON.stringify(error)}`);
                return;
            }
            this.logger.log(`Email enviado: "${subject}" → ${to} (id: ${data?.id})`);
        }
        catch (err) {
            this.logger.error(`Erro inesperado ao enviar email para ${to}: ${err.message}`);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map