import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MemorialService } from './memorial.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('memorial')
export class MemorialController {
  constructor(private readonly memorialService: MemorialService) {}

  @Get('tributes')
  async listTributes() {
    return this.memorialService.listTributes();
  }

  @Get('tributes/:petId')
  async getTributeByPetId(@Param('petId') petId: string) {
    return this.memorialService.getTributeByPetId(petId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tributes/:petId')
  async upsertTribute(
    @Param('petId') petId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.memorialService.upsertTribute(req.user, petId, body);
  }
}