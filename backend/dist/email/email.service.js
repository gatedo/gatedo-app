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
        this.from = process.env.EMAIL_FROM || 'Gatedo <noreply@gatedo.com>';
        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    }
    async sendWelcome(to, name, plan) {
        const isFounder = plan === 'FOUNDER';
        const subject = isFounder
            ? '🐾 Seja bem-vindo, Fundador Gatedo!'
            : '🐾 Bem-vindo ao Gatedo!';
        const html = this.baseTemplate(`
      <div style="text-align:center; padding: 0 0 32px;">
        <div style="width:80px;height:80px;background:#DFFF40;border-radius:50%;
                    display:inline-flex;align-items:center;justify-content:center;
                    font-size:40px;margin-bottom:24px;">🐾</div>
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:#1C1C2E;letter-spacing:-0.5px;">
          Fala, ${name}! 👋
        </h1>
        <p style="margin:0;color:#6B7280;font-size:15px;">
          ${isFounder
            ? 'Você faz parte do grupo que está <strong>definindo o futuro</strong> do cuidado felino.'
            : 'Sua conta Gatedo foi criada com sucesso.'}
        </p>
      </div>

      ${isFounder ? `
        <div style="background:linear-gradient(135deg,#6158ca,#8B5CF6);
                    border-radius:20px;padding:24px;margin-bottom:24px;text-align:center;">
          <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:10px;
                    font-weight:800;text-transform:uppercase;letter-spacing:3px;">Seu Selo</p>
          <p style="margin:0;color:#DFFF40;font-size:22px;font-weight:900;">⭐ Fundador Gatedo</p>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">
            Badge vitalícia · IA Premium ilimitada · Early access
          </p>
        </div>
      ` : ''}

      <div style="background:#F4F3FF;border-radius:16px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:800;color:#6158ca;
                  text-transform:uppercase;letter-spacing:2px;">Por onde começar</p>
        ${[
            ['🐱', 'Cadastrar seu gato', 'Adicione o perfil completo do seu felino'],
            ['🧠', 'iGent Vet', 'Converse com nossa IA especialista em felinos'],
            ['📸', 'Perfil Social', 'Compartilhe momentos com a comunidade'],
        ].map(([emoji, title, desc]) => `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
            <div style="width:36px;height:36px;background:white;border-radius:10px;
                        display:flex;align-items:center;justify-content:center;
                        font-size:18px;flex-shrink:0;">${emoji}</div>
            <div>
              <p style="margin:0;font-size:13px;font-weight:700;color:#1C1C2E;">${title}</p>
              <p style="margin:0;font-size:11px;color:#9CA3AF;">${desc}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="text-align:center;">
        <a href="${this.frontendUrl}/home"
           style="display:inline-block;background:linear-gradient(135deg,#6158ca,#8B5CF6);
                  color:white;text-decoration:none;padding:16px 40px;border-radius:50px;
                  font-weight:900;font-size:14px;letter-spacing:1px;
                  box-shadow:0 8px 24px rgba(97,88,202,0.4);">
          ACESSAR O GATEDO →
        </a>
      </div>
    `);
        await this.send(to, subject, html);
    }
    async sendEmailVerification(to, name, token) {
        const link = `${this.frontendUrl}/verify-email?token=${token}`;
        const html = this.baseTemplate(`
      <div style="text-align:center; padding: 0 0 32px;">
        <div style="width:80px;height:80px;background:#F0FDF4;border-radius:50%;
                    display:inline-flex;align-items:center;justify-content:center;
                    font-size:40px;margin-bottom:24px;border:2px solid #86EFAC;">✉️</div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#1C1C2E;">
          Confirme seu email
        </h1>
        <p style="margin:0;color:#6B7280;font-size:15px;">
          Olá, <strong>${name}</strong>! Clique no botão abaixo para verificar seu endereço de email.
        </p>
      </div>

      <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:16px;
                  padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#16A34A;font-weight:700;">
          🔒 Este link expira em <strong>24 horas</strong>
        </p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${link}"
           style="display:inline-block;background:linear-gradient(135deg,#16A34A,#22C55E);
                  color:white;text-decoration:none;padding:18px 48px;border-radius:50px;
                  font-weight:900;font-size:15px;letter-spacing:1px;
                  box-shadow:0 8px 24px rgba(22,163,74,0.35);">
          ✓ VERIFICAR MEU EMAIL
        </a>
      </div>

      <p style="text-align:center;color:#9CA3AF;font-size:11px;margin:0;">
        Se não foi você quem criou essa conta, ignore este email.
      </p>
    `);
        await this.send(to, '✉️ Confirme seu email — Gatedo', html);
    }
    async sendPasswordReset(to, name, token) {
        const link = `${this.frontendUrl}/reset-password?token=${token}`;
        const html = this.baseTemplate(`
      <div style="text-align:center; padding: 0 0 32px;">
        <div style="width:80px;height:80px;background:#FFF7ED;border-radius:50%;
                    display:inline-flex;align-items:center;justify-content:center;
                    font-size:40px;margin-bottom:24px;border:2px solid #FED7AA;">🔑</div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#1C1C2E;">
          Redefinir senha
        </h1>
        <p style="margin:0;color:#6B7280;font-size:15px;">
          Olá, <strong>${name}</strong>! Recebemos uma solicitação para redefinir sua senha.
        </p>
      </div>

      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:16px;
                  padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#D97706;font-weight:700;">
          ⏱ Este link expira em <strong>1 hora</strong>. Se não foi você, ignore este email.
        </p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${link}"
           style="display:inline-block;background:linear-gradient(135deg,#F97316,#FB923C);
                  color:white;text-decoration:none;padding:18px 48px;border-radius:50px;
                  font-weight:900;font-size:15px;letter-spacing:1px;
                  box-shadow:0 8px 24px rgba(249,115,22,0.35);">
          🔑 REDEFINIR MINHA SENHA
        </a>
      </div>

      <p style="text-align:center;color:#9CA3AF;font-size:11px;margin:0 0 6px;">
        Ou copie e cole o link abaixo no seu navegador:
      </p>
      <p style="text-align:center;font-size:10px;color:#6158ca;word-break:break-all;margin:0;">
        ${link}
      </p>
    `);
        await this.send(to, '🔑 Redefinição de senha — Gatedo', html);
    }
    baseTemplate(content) {
        return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      </head>
      <body style="margin:0;padding:0;background:#F4F3FF;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3FF;padding:40px 16px;">
          <tr><td align="center">
            <table width="100%" style="max-width:520px;">

              <!-- Logo header -->
              <tr><td style="text-align:center;padding-bottom:24px;">
                <div style="display:inline-flex;align-items:center;gap:8px;">
                  <div style="width:36px;height:36px;background:#DFFF40;border-radius:10px;
                              display:inline-flex;align-items:center;justify-content:center;font-size:18px;">
                    🐾
                  </div>
                  <span style="font-size:20px;font-weight:900;color:#1C1C2E;letter-spacing:-0.5px;">gatedo</span>
                </div>
              </td></tr>

              <!-- Card -->
              <tr><td style="background:white;border-radius:28px;padding:40px 36px;
                             box-shadow:0 4px 40px rgba(97,88,202,0.08);">
                ${content}
              </td></tr>

              <!-- Footer -->
              <tr><td style="text-align:center;padding:24px 0 0;">
                <p style="margin:0;font-size:11px;color:#9CA3AF;">
                  © ${new Date().getFullYear()} Gatedo · Plataforma para Tutores Felinos
                </p>
                <p style="margin:4px 0 0;font-size:10px;color:#D1D5DB;">
                  Você recebeu este email porque possui uma conta no Gatedo.
                </p>
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
            await this.resend.emails.send({ from: this.from, to, subject, html });
            this.logger.log(`Email enviado: "${subject}" → ${to}`);
        }
        catch (err) {
            this.logger.error(`Falha ao enviar email para ${to}: ${err.message}`);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map