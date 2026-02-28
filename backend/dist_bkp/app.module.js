"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const media_module_1 = require("./media/media.module");
const pets_module_1 = require("./pets/pets.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const articles_module_1 = require("./articles/articles.module");
const health_controller_1 = require("./health.controller");
const health_record_controller_1 = require("./controllers/health-record.controller");
const diary_controller_1 = require("./controllers/diary.controller");
const igent_controller_1 = require("./igent/igent.controller");
const prisma_service_1 = require("./prisma.service");
const cloudflare_service_1 = require("./cloudflare.service");
const igent_service_1 = require("./igent/igent.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'client'),
                exclude: ['/api/{*splat}'],
            }),
            media_module_1.MediaModule,
            pets_module_1.PetsModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            articles_module_1.ArticlesModule,
        ],
        controllers: [
            health_controller_1.HealthController,
            health_record_controller_1.HealthRecordController,
            diary_controller_1.DiaryController,
            igent_controller_1.IgentController,
        ],
        providers: [
            prisma_service_1.PrismaService,
            cloudflare_service_1.CloudflareService,
            igent_service_1.IgentService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map