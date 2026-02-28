import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Ajuste o caminho se necessário
import OpenAI from 'openai';

@Injectable()
export class IgentService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    // A chave deve estar no seu arquivo .env como OPENAI_API_KEY
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async analyzeSymptom(petId: string, symptom: string) {
    // 1. Busca dados do gato no banco
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: {
        healthRecords: { orderBy: { date: 'desc' }, take: 5 },
        owner: true
      }
    });

    if (!pet) throw new HttpException('Gato não encontrado', HttpStatus.NOT_FOUND);

    // 2. Prepara os dados para a IA
    const gender = pet.gender === 'FEMALE' ? 'Fêmea' : 'Macho';
    const vaccines = pet.healthRecords
      .filter(h => h.type === 'VACCINE')
      .map(v => v.title)
      .join(', ') || "Sem vacinas registradas";
    const history = pet.healthSummary || "Sem histórico prévio.";

    // 3. O Prompt (O comando para o cérebro da IA)
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
        model: "gpt-4o-mini", // ou gpt-3.5-turbo se preferir economizar
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("Erro OpenAI:", error);
      // Retorna algo seguro caso a IA falhe
      return {
        isUrgent: false,
        analysisText: "Não consegui conectar à rede neural, mas monitore os sintomas.",
        probabilities: [],
        care: ["Procure um veterinário se persistir."]
      };
    }
  }
}