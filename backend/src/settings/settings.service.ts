import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Únicas chaves que este endpoint público pode expor/gravar — evita virar
// um key/value arbitrário exposto na internet.
const PUBLIC_KEYS = [
  'DONATION_PIX_KEY',
  'WHATSAPP_ACHADINHOS_LINK',
  'WHATSAPP_ACHADINHOS_TEXT',
  'CLUBE_MONTHLY_PRICE_CENTAVOS',
  'CLUBE_ANNUAL_PRICE_CENTAVOS',
  'CLUBE_MONTHLY_KIWIFY_URL',
  'CLUBE_ANNUAL_KIWIFY_URL',
  'CLUBE_COMMUNITY_LINK',
] as const;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublic() {
    const rows = await this.prisma.appSettings.findMany({ where: { key: { in: [...PUBLIC_KEYS] } } });
    const map: Record<string, string | null> = {};
    for (const key of PUBLIC_KEYS) map[key] = null;
    rows.forEach((r) => { map[r.key] = r.value; });
    return map;
  }

  async adminSet(key: string, value: string) {
    if (!PUBLIC_KEYS.includes(key as any)) throw new BadRequestException('Chave de configuração inválida.');
    return this.prisma.appSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
