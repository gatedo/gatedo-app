"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const email_service_1 = require("../email/email.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(data) {
        const userExists = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (userExists) {
            throw new common_1.ConflictException('E-mail já cadastrado.');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        let userPlan = 'FREE';
        let userBadges = [];
        let initialXP = 0;
        if (data.origin === 'founder') {
            userPlan = 'FOUNDER';
            userBadges = ['FOUNDER'];
            initialXP = 100;
        }
        else if (data.origin === 'vip') {
            userPlan = 'PREMIUM';
            userBadges = ['VIP'];
            initialXP = 50;
        }
        const user = await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                phone: data.phone,
                role: 'USER',
                plan: userPlan,
                badges: userBadges,
                xp: initialXP,
            },
        });
        const token = this.generateToken(user);
        setImmediate(async () => {
            try {
                const verifyToken = crypto.randomBytes(32).toString('hex');
                await this.prisma.$executeRawUnsafe(`UPDATE "User" SET "emailVerifyToken" = $1 WHERE id = $2`, verifyToken, user.id);
                await this.emailService.sendWelcome(user.email, user.name || 'Tutor', userPlan);
                await this.emailService.sendEmailVerification(user.email, user.name || 'Tutor', verifyToken);
                this.logger.log(`Fluxo de onboarding completo para ${user.email}`);
            }
            catch (e) {
                this.logger.warn(`Falha no processo de e-mail: ${e.message}`);
            }
        });
        return token;
    }
    async login(data) {
        const user = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user || !(await bcrypt.compare(data.password, user.password))) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        return this.generateToken(user);
    }
    async verifyEmail(token) {
        const users = await this.prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE "emailVerifyToken" = $1 LIMIT 1`, token);
        if (!users || users.length === 0)
            throw new common_1.BadRequestException('Token inválido.');
        await this.prisma.$executeRawUnsafe(`UPDATE "User" SET "emailVerified" = true, "emailVerifyToken" = null, xp = xp + 50 WHERE id = $1`, users[0].id);
        return { success: true, message: 'Email verificado!' };
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return { success: true, message: 'Instruções enviadas se o e-mail existir.' };
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000);
        await this.prisma.$executeRawUnsafe(`UPDATE "User" SET "resetPasswordToken" = $1, "resetPasswordExpires" = $2 WHERE id = $3`, token, expires, user.id);
        await this.emailService.sendPasswordReset(user.email, user.name || 'Tutor', token);
        return { success: true, message: 'Instruções enviadas.' };
    }
    async resetPassword(token, newPassword) {
        const users = await this.prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE "resetPasswordToken" = $1 AND "resetPasswordExpires" > NOW() LIMIT 1`, token);
        if (!users || users.length === 0)
            throw new common_1.BadRequestException('Token expirado ou inválido.');
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.$executeRawUnsafe(`UPDATE "User" SET password = $1, "resetPasswordToken" = null, "resetPasswordExpires" = null WHERE id = $2`, hashed, users[0].id);
        return { success: true, message: 'Senha redefinida!' };
    }
    generateToken(user) {
        const payload = { sub: user.id, email: user.email, plan: user.plan };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                badges: user.badges,
                xp: user.xp || 0,
                emailVerified: user.emailVerified ?? false,
            }
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map