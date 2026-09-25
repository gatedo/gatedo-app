import { Controller, Get, Query, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';

// Proxy somente-leitura pras imagens públicas do R2 — usado pelo html2canvas
// (opção `proxy`) na geração dos cards compartilháveis, já que o bucket não
// envia cabeçalhos CORS e o navegador bloqueia a leitura de pixels cross-origin
// sem eles. As imagens já são públicas no R2; isso só permite que JS de outra
// origem leia os bytes via canvas.
@Controller('media')
export class MediaProxyController {
  @Get('proxy')
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    const publicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    if (!url || !publicBase || !url.startsWith(`${publicBase}/`)) {
      throw new BadRequestException('URL inválida.');
    }

    const upstream = await fetch(url);
    if (!upstream.ok) {
      throw new NotFoundException('Imagem não encontrada.');
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/webp');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.send(buffer);
  }
}
