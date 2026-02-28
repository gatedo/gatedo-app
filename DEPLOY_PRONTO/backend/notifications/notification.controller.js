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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const notification_service_1 = require("./notification.service");
let NotificationController = class NotificationController {
    constructor(notifService) {
        this.notifService = notifService;
    }
    async getAll(userId, limit) {
        return this.notifService.getNotifications(userId, limit ? parseInt(limit) : 30);
    }
    async markAsRead(id) {
        return this.notifService.markAsRead(id);
    }
    async markAllAsRead(body) {
        return this.notifService.markAllAsRead(body.userId);
    }
    async delete(id) {
        return this.notifService.delete(id);
    }
    async vaccineCheck() {
        return this.notifService.generateVaccineReminders();
    }
    async getPoints(userId) {
        return this.notifService.getPoints(userId);
    }
    async addPoints(body) {
        return this.notifService.addPoints(body.userId, body.action, body.context);
    }
    async predictiveAlert(body) {
        return this.notifService.sendPredictiveAlert(body);
    }
    async getStats(userId) {
        return this.notifService.getStats(userId);
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getAll", null);
__decorate([
    (0, common_1.Patch)('notifications/:id/read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('notifications/read-all'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Delete)('notifications/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('notifications/vaccine-check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "vaccineCheck", null);
__decorate([
    (0, common_1.Get)('gamification/points/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getPoints", null);
__decorate([
    (0, common_1.Post)('gamification/points'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "addPoints", null);
__decorate([
    (0, common_1.Post)('notifications/predictive-alert'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "predictiveAlert", null);
__decorate([
    (0, common_1.Get)('gamification/stats/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getStats", null);
exports.NotificationController = NotificationController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map