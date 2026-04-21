import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';

@Injectable()
export class StudioAiService {
  private readonly logger = new Logger(StudioAiService.name);

  constructor(private readonly gemini: GeminiService) {}

  private readonly openaiBaseUrl =
    (process.env.IGENT_OPENAI_BASE_URL || '').replace(/\/+$/, '');

  private readonly openaiKey =
    process.env.IGENT_OPENAI_API_KEY || '';

  private readonly openaiImageModel =
    process.env.IGENT_OPENAI_IMAGE_MODEL || 'gpt-image-1';

  async expandPrompt(prompt: string): Promise<string> {
    return (prompt || '').trim();
  }

  async generateTutorCatImage(params: {
    prompt: string;
    originalPhotoUrl?: string;
    tutorPhotoUrl?: string;
  }): Promise<{
    provider: 'gemini' | 'openai';
    previewUrl: string;
    resultUrl: string;
    base64?: string;
    mimeType?: string;
    model?: string;
    raw?: any;
  }> {
    const result = await this.generate({
      moduleKey: 'tutor-cat',
      prompt: params.prompt,
      originalPhotoUrl: params.originalPhotoUrl,
      tutorPhotoUrl: params.tutorPhotoUrl,
    });

    return {
      ...result,
      resultUrl: result.previewUrl,
    };
  }

  async generate(params: {
    moduleKey: string;
    prompt: string;
    originalPhotoUrl?: string;
    tutorPhotoUrl?: string;
  }): Promise<{
    provider: 'gemini' | 'openai';
    previewUrl: string;
    base64?: string;
    mimeType?: string;
    model?: string;
    raw?: any;
  }> {
    try {
      this.logger.log(
        `[StudioAI] tentando Gemini provider (${params.moduleKey})`,
      );

      const geminiResult = await this.gemini.generateStudioImage({
        prompt: this.buildPrompt(params),
        originalPhotoUrl: params.originalPhotoUrl,
        tutorPhotoUrl: params.tutorPhotoUrl,
      });

      return {
        provider: 'gemini',
        previewUrl: geminiResult.dataUrl,
        base64: geminiResult.base64,
        mimeType: geminiResult.mimeType,
        model: geminiResult.model,
        raw: geminiResult.raw,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'erro desconhecido';

      this.logger.warn(
        `[StudioAI] Gemini falhou → fallback OpenAI (${message})`,
      );

      return this.generateOpenAI(params);
    }
  }

  private async generateOpenAI(params: {
    moduleKey: string;
    prompt: string;
    originalPhotoUrl?: string;
    tutorPhotoUrl?: string;
  }): Promise<{
    provider: 'openai';
    previewUrl: string;
    base64?: string;
    mimeType?: string;
    model?: string;
    raw?: any;
  }> {
    if (!this.openaiBaseUrl || !this.openaiKey) {
      throw new Error(
        'Fallback OpenAI indisponível — variáveis IGENT_OPENAI_* ausentes',
      );
    }

    const endpoint = `${this.openaiBaseUrl}/images/generations`;

const body = {
  model: this.openaiImageModel || "gpt-image-1",
  prompt: this.buildPrompt(params),
  size: "1024x1024",
};

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();

      this.logger.error(
        `[StudioAI] OpenAI fallback falhou ${res.status}: ${err}`,
      );

      throw new Error('Fallback OpenAI falhou');
    }

    const json = (await res.json()) as any;

    const base64 = json?.data?.[0]?.b64_json;
    const remoteUrl = json?.data?.[0]?.url;

    if (base64) {
      const previewUrl = `data:image/png;base64,${base64}`;

      return {
        provider: 'openai',
        previewUrl,
        base64,
        mimeType: 'image/png',
        model: this.openaiImageModel,
        raw: json,
      };
    }

    if (remoteUrl) {
      return {
        provider: 'openai',
        previewUrl: remoteUrl,
        mimeType: 'image/png',
        model: this.openaiImageModel,
        raw: json,
      };
    }

    throw new Error('OpenAI fallback retornou sem imagem');
  }

  private buildPrompt(params: {
    moduleKey: string;
    prompt: string;
    originalPhotoUrl?: string;
    tutorPhotoUrl?: string;
  }): string {
    const basePrompt = params.prompt?.trim() || '';

    switch (params.moduleKey) {
      case 'tutor-cat':
        return `
Create a high quality stylized image of a cat and its tutor together.
Maintain realistic facial identity for both subjects.
Use the uploaded cat photo and tutor photo as visual identity references.
Cinematic lighting.
Warm emotional tone.
No duplicated faces, no extra limbs, no distorted anatomy, no text, no watermark.
${basePrompt}
`.trim();

      case 'portrait':
        return `
Create a professional artistic portrait of the cat.
Use the uploaded cat photo as identity reference.
Studio lighting.
High detail fur texture.
Soft depth of field.
No distortion, no duplicated features, no text, no watermark.
${basePrompt}
`.trim();

      case 'sticker':
        return `
Create a transparent background sticker style illustration of the cat.
Use the uploaded cat photo as identity reference.
Clean contour.
Rounded friendly style.
No distortion, no duplicated features, no text, no watermark.
${basePrompt}
`.trim();

      default:
        return basePrompt;
    }
  }
}