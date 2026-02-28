"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const serverless_1 = require("@neondatabase/serverless");
const client_1 = require("@prisma/client");
const ws_1 = __importDefault(require("ws"));
async function bootstrap() {
    serverless_1.neonConfig.webSocketConstructor = ws_1.default;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: '*',
        credentials: true,
    });
    const prisma = new client_1.PrismaClient();
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/api/health', async (req, res) => {
        try {
            await prisma.$queryRaw `SELECT 1`;
            res.status(200).json({
                status: 'online',
                database: 'connected',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(200).json({
                status: 'online',
                database: 'disconnected',
                error: 'Falha na conexão com o Banco Neon'
            });
        }
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Backend rodando em: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map