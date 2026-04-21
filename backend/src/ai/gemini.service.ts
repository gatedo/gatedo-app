import { Injectable, Logger } from '@nestjs/common';

// Sem SDK — usa fetch nativo do Node 18+ direto na REST API do Google
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY || '';

private readonly baseUrl =
  process.env.GEMINI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta";

  // Texto / JSON (iGentVet)
  private readonly textModel =
    process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash';

  // Imagem (Studio IA / Nano Banana)
  // Prioriza env. Se não houver, usa um modelo atual compatível.
  private readonly imageModel =
    process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

  async generateAnalysis(prompt: string, context: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

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

    const endpoint =
  `${this.baseUrl}/models/${this.imageModel}:generateContent`;

    const res = await fetch(`${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Gemini REST ${res.status}: ${err.slice(0, 500)}`);
      throw new Error(`Gemini falhou: ${res.status}`);
    }

    const data = (await res.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    const clean = text
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/```$/, '')
      .trim();

    return JSON.parse(clean);
  }

  async generateStudioImage(params: {
    prompt: string;
    originalPhotoUrl?: string;
    tutorPhotoUrl?: string;
  }): Promise<{
    provider: 'gemini';
    model: string;
    mimeType: string;
    base64: string;
    dataUrl: string;
    text?: string;
    raw?: any;
  }> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    if (!this.imageModel) {
      throw new Error('GEMINI_IMAGE_MODEL não configurado');
    }

   const endpoint = `${this.baseUrl}/models/${this.imageModel}:generateContent`;

    const parts: any[] = [];

    if (params.prompt?.trim()) {
      parts.push({ text: params.prompt.trim() });
    }

    if (params.originalPhotoUrl) {
      const petImage = await this.fetchAsInlineData(params.originalPhotoUrl);
      parts.push({
        inlineData: {
          mimeType: petImage.mimeType,
          data: petImage.base64,
        },
      });
    }

    if (params.tutorPhotoUrl) {
      const tutorImage = await this.fetchAsInlineData(params.tutorPhotoUrl);
      parts.push({
        inlineData: {
          mimeType: tutorImage.mimeType,
          data: tutorImage.base64,
        },
      });
    }

    if (!parts.length) {
      throw new Error('Nenhum conteúdo enviado para geração de imagem no Gemini');
    }

  const payload = {
  contents: [
    {
      role: 'user',
      parts,
    },
  ],
};

    const res = await fetch(`${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`[Gemini Studio] ${res.status}: ${err.slice(0, 1200)}`);
      throw new Error(`Gemini image falhou: ${res.status}`);
    }

    const data = (await res.json()) as any;
    const candidate = data?.candidates?.[0];
    const outputParts = candidate?.content?.parts || [];

    const imagePart = outputParts.find(
      (p: any) => p?.inlineData?.data || p?.inline_data?.data,
    );

    const textPart = outputParts.find(
      (p: any) => typeof p?.text === 'string',
    );

    const inline = imagePart?.inlineData || imagePart?.inline_data;

    if (!inline?.data) {
      this.logger.error(
        `[Gemini Studio] resposta sem imagem: ${JSON.stringify(data).slice(0, 2000)}`,
      );
      throw new Error('Gemini não retornou imagem');
    }

    const mimeType = inline.mimeType || inline.mime_type || 'image/png';
    const base64 = inline.data;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return {
      provider: 'gemini',
      model: this.imageModel,
      mimeType,
      base64,
      dataUrl,
      text: textPart?.text || '',
      raw: data,
    };
  }

  private async fetchAsInlineData(
    url: string,
  ): Promise<{ mimeType: string; base64: string }> {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Falha ao baixar imagem de referência: ${res.status}`);
    }

    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());

    return {
      mimeType,
      base64: buffer.toString('base64'),
    };
  }
}