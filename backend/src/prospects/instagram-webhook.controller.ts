import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { InstagramOutreachService } from './instagram-outreach.service';

@Controller('webhooks/instagram')
export class InstagramWebhookController {
  constructor(private readonly instagram: InstagramOutreachService) {}

  @Get()
  verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    return this.instagram.verifyWebhook(mode, token, challenge);
  }

  @Post()
  @HttpCode(200)
  receive(@Body() body: any) {
    return this.instagram.handleWebhook(body);
  }
}
