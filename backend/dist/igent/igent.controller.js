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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IgentController = void 0;
const common_1 = require("@nestjs/common");
const igent_service_1 = require("./igent.service");
const prisma_service_1 = require("../prisma.service");
const gamification_integration_1 = require("../notifications/gamification.integration");
let IgentController = class IgentController {
    constructor(igentService, prisma, gamif) {
        this.igentService = igentService;
        this.prisma = prisma;
        this.gamif = gamif;
    }
    async analyze(body) {
        return this.igentService.analyzeSymptom(body.petId, body.symptom, body.symptomId, body.clinicalContext);
    }
    async chat(body) {
        return this.igentService.chatWithVet(body.petId, body.message, body.symptom, body.symptomId, body.clinicalContext);
    }
    async report(body) {
        return this.igentService.generateReport(body.petId, body.symptomLabel, body.analysisText, body.care, body.isUrgent, body.ownerResponse || '');
    }
    async createSession(body) {
        const session = await this.igentService.createSession(body);
        const totalSessions = await this.prisma.igentSession.count({
            where: { petId: body.petId },
        });
        const pet = await this.prisma.pet.findUnique({
            where: { id: body.petId },
            select: { ownerId: true },
        });
        if (pet?.ownerId) {
            this.gamif
                .onIgentConsult(pet.ownerId, body.petId, totalSessions === 1)
                .catch(() => { });
        }
        return session;
    }
    async getSessions(petId) {
        return this.igentService.getSessions(petId);
    }
    async recordUpdate(body) {
        return this.igentService.recordUpdate(body);
    }
};
exports.IgentController = IgentController;
__decorate([
    (0, common_1.Post)('analyze'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IgentController.prototype, "analyze", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IgentController.prototype, "chat", null);
__decorate([
    (0, common_1.Post)('report'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IgentController.prototype, "report", null);
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IgentController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, common_1.Query)('petId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IgentController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Post)('record-update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IgentController.prototype, "recordUpdate", null);
exports.IgentController = IgentController = __decorate([
    (0, common_1.Controller)('igent'),
    __metadata("design:paramtypes", [igent_service_1.IgentService,
        prisma_service_1.PrismaService,
        gamification_integration_1.GamificationIntegration])
], IgentController);
//# sourceMappingURL=igent.controller.js.map