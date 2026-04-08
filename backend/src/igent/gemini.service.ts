import { Injectable, Logger } from '@nestjs/common';

// Sem SDK — usa fetch nativo do Node 18+ direto na REST API do Google
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  private readonly endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'; // ← corrigido

  async generateAnalysis(prompt: string, context: any): Promise<any> {
    const fullPrompt = `
Você é o iGentVet, um assistente veterinário especializado em gatos.
Contexto do Gato: ${JSON.stringify(context)}
Pergunta do Tutor: ${prompt}

Responda APENAS com JSON válido (sem markdown, sem texto extra):
{
  "analysisText": "...",
  "triageQuestions": ["..."],
  "isUrgent": false,
  "redFlags": ["..."]
}`.trim();

    const res = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Gemini REST ${res.status}: ${err.slice(0, 200)}`);
      throw new Error(`Gemini falhou: ${res.status}`);
    }

    const data = await res.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/```$/, '').trim();
    return JSON.parse(clean);
  }
}