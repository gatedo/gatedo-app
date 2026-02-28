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
exports.HealthRecordController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let HealthRecordController = class HealthRecordController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        try {
            return await this.prisma.healthRecord.create({
                data: {
                    petId: data.petId,
                    type: data.type,
                    title: data.title,
                    date: new Date(data.date),
                    nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
                    veterinarian: data.veterinarian,
                    notes: data.notes,
                    batchNumber: data.batchNumber,
                    attachmentUrl: data.attachmentUrl
                },
            });
        }
        catch (error) {
            console.error("Erro ao salvar saúde:", error);
            throw new common_1.HttpException('Erro ao salvar registro', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll(petId) {
        if (!petId)
            throw new common_1.HttpException('Pet ID obrigatório', common_1.HttpStatus.BAD_REQUEST);
        return await this.prisma.healthRecord.findMany({
            where: { petId },
            orderBy: { date: 'desc' }
        });
    }
};
exports.HealthRecordController = HealthRecordController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthRecordController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('petId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HealthRecordController.prototype, "findAll", null);
exports.HealthRecordController = HealthRecordController = __decorate([
    (0, common_1.Controller)('health-records'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthRecordController);
//# sourceMappingURL=health-record.controller.js.map