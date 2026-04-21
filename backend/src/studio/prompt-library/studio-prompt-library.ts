import { Injectable } from '@nestjs/common';

@Injectable()
export class StudioPromptLibrary {
  build(params: {
    moduleKey: string;
    petName?: string | null;
    preset?: string | null;
    prompt?: string | null;
  }) {
    const petName = params.petName || 'o gato';
    const preset = params.preset || 'cinematico';
    const userPrompt = (params.prompt || '').trim();

    const presetMap: Record<string, string> = {
      cinematico: 'cinematic lighting, premium composition, dramatic but elegant look',
      magico: 'magical atmosphere, fantasy particles, dreamy cinematic light',
      lifestyle: 'editorial lifestyle photography, natural premium scene',
      divertido: 'playful energetic scene, vibrant colors, expressive tone',
    };

    const presetText = presetMap[preset] || preset;

    if (params.moduleKey === 'tutor-cat') {
      return `
Create a high quality image using the provided tutor photo and cat photo as identity references.
The tutor and the cat must remain recognizable and visually faithful to the uploaded images.
Show emotional connection and a believable interaction between both.
Style: ${presetText}.
Pet name reference: ${petName}.
Avoid duplicated subjects, anatomy distortion, extra paws, extra fingers, cropped faces, text, watermark, logo, or frame.
${userPrompt ? `Extra direction: ${userPrompt}` : ''}
`.trim();
    }

    if (params.moduleKey === 'portrait') {
      return `
Create a premium portrait of the cat using the uploaded cat photo as identity reference.
The cat must remain recognizable and faithful to the uploaded image.
Style: ${presetText}.
Pet name reference: ${petName}.
Avoid anatomy distortion, duplicated ears, duplicated eyes, text, watermark, logo, or frame.
${userPrompt ? `Extra direction: ${userPrompt}` : ''}
`.trim();
    }

    if (params.moduleKey === 'sticker') {
      return `
Create a sticker-style illustration based on the uploaded cat photo as identity reference.
Keep the cat recognizable and expressive.
Style: ${presetText}, clean sticker look, polished edges.
Avoid anatomy distortion, duplicated parts, text, watermark, logo, or frame.
${userPrompt ? `Extra direction: ${userPrompt}` : ''}
`.trim();
    }

    return `
Create a high quality image using the uploaded references.
Style: ${presetText}.
${userPrompt ? `Extra direction: ${userPrompt}` : ''}
`.trim();
  }
}