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
exports.TreatmentController = void 0;
const common_1 = require("@nestjs/common");
const treatment_service_1 = require("./treatment.service");
const notification_service_1 = require("../notifications/notification.service");
let TreatmentController = class TreatmentController {
    constructor(treatmentService, notifService) {
        this.treatmentService = treatmentService;
        this.notifService = notifService;
    }
    async create(body) {
        const schedule = await this.treatmentService.createSchedule(body);
        if (body?.userId && schedule) {
            this.notifService.create({
                userId: body?.userId,
                type: 'MED_REMINDER',
                petId: body.petId,
                message: `💊 Tratamento iniciado: ${body.title} — ${body.intervalHours}h de intervalo`,
                cta: 'Ver tratamento',
                metadata: { scheduleId: schedule.id },
            }).catch(() => { });
        }
        return schedule;
    }
    async findByPet(petId) {
        return this.treatmentService.getByPet(petId);
    }
    async getDoses(id) {
        return this.treatmentService.getDoseHistory(id);
    }
    async takeDose(doseId, body) {
        const dose = await this.treatmentService.takeDose(doseId, body?.notes);
        if (body?.userId) {
            this.notifService.create({
                userId: body?.userId,
                type: 'MED_REMINDER',
                petId: dose.schedule?.petId || body?.petId || null,
                catName: body?.catName,
                message: `✅ Dose de ${dose.schedule.title} registrada para ${body?.catName || 'seu gato'}`,
                cta: 'Ver tratamento',
                metadata: { doseId, takenAt: dose.takenAt, petId: dose.schedule?.petId },
            }).catch(() => { });
        }
        return dose;
    }
    async skipDose(doseId, body) {
        return this.treatmentService.skipDose(doseId, body?.notes);
    }
    async deactivate(id) {
        return this.treatmentService.deactivate(id);
    }
    async getPending() {
        return this.treatmentService.getPendingDoses();
    }
};
exports.TreatmentController = TreatmentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('petId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "findByPet", null);
__decorate([
    (0, common_1.Get)(':id/doses'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "getDoses", null);
__decorate([
    (0, common_1.Post)('doses/:doseId/take'),
    __param(0, (0, common_1.Param)('doseId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "takeDose", null);
__decorate([
    (0, common_1.Post)('doses/:doseId/skip'),
    __param(0, (0, common_1.Param)('doseId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "skipDose", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Get)('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "getPending", null);
exports.TreatmentController = TreatmentController = __decorate([
    (0, common_1.Controller)('treatments'),
    __metadata("design:paramtypes", [treatment_service_1.TreatmentService,
        notification_service_1.NotificationService])
], TreatmentController);
//# sourceMappingURL=treatment.controller.js.map