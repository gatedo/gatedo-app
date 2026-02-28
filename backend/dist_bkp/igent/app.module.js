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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const openai_1 = __importDefault(require("openai"));
let IgentService = class IgentService {
    constructor(prisma) {
        this.prisma = prisma;
        this.openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
    }
    async analyzeSymptom(petId, symptom) {
        const pet = await this.prisma.pet.findUnique({
            where: { id: petId },
            include: {
                healthRecords: { orderBy: { date: 'desc' }, take: 5 },
                owner: true
            }
        });
        if (!pet)
            throw new common_1.HttpException('Gato não encontrado', common_1.HttpStatus.NOT_FOUND);
        const gender = pet.gender === 'FEMALE' ? 'Fêmea' : 'Macho';
        const vaccines = pet.healthRecords
            .filter(h => h.type === 'VACCINE')
            .map(v => v.title)
            .join(', ') || "Sem vacinas registradas";
        const history = pet.healthSummary || "Sem histórico prévio.";
        const prompt = `
      Atue como um veterinário experiente.
      Paciente: ${pet.name}, Raça: ${pet.breed || 'SRD'}, ${pet.ageYears} anos, ${gender}.
      Histórico: ${history}. Vacinas: ${vaccines}.
      Sintoma Atual: "${symptom}".

      Responda EXATAMENTE neste formato JSON (sem markdown):
      {
        "isUrgent": boolean (true se for grave/emergência),
        "analysisText": "Texto curto (max 20 palavras) conectando o sintoma ao histórico ou raça.",
        "probabilities": [{"name": "Causa A", "percent": 60}, {"name": "Causa B", "percent": 40}],
        "care": ["Dica 1", "Dica 2", "Dica 3"]
      }
    `;
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            });
            return JSON.parse(response.choices[0].message.content);
        }
        catch (error) {
            console.error("Erro OpenAI:", error);
            return {
                isUrgent: false,
                analysisText: "Não consegui conectar à rede neural, mas monitore os sintomas.",
                probabilities: [],
                care: ["Procure um veterinário se persistir."]
            };
        }
    }
};
exports.IgentService = IgentService;
exports.IgentService = IgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IgentService);
//# sourceMappingURL=app.module.js.map