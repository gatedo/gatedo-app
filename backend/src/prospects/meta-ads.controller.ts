import { Controller, Get, Query } from '@nestjs/common';
import { MetaAdsService } from './meta-ads.service';

@Controller('prospects/meta-ads')
export class MetaAdsController {
  constructor(private readonly metaAds: MetaAdsService) {}

  @Get('config')
  getConfig() {
    return this.metaAds.getConfig();
  }

  @Get('test')
  testConnection(@Query('accountId') accountId?: string) {
    return this.metaAds.testConnection(accountId);
  }

  @Get('campaigns')
  getCampaigns(@Query() query: any) {
    return this.metaAds.getCampaigns(query);
  }

  @Get('audiences')
  getAudiences(@Query() query: any) {
    return this.metaAds.getAudiences(query);
  }

  @Get('advisor')
  getAdvisor(@Query() query: any) {
    return this.metaAds.getAdvisor(query);
  }
}
