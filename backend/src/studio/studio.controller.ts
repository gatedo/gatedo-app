import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StudioService } from './studio.service';

@Controller('studio')
@UseGuards(JwtAuthGuard)
export class StudioController {
  constructor(private readonly studioService: StudioService) {}

  @Post('generate')
async generate(
  @Req() req: any,
  @Body()
  body: {
    module?: string;
    moduleKey?: string;
    prompt?: string;
    petId?: string | null;
    originalPhotoUrl?: string | null;
    tutorPhotoUrl?: string | null;
    sourceImageUrls?: string[];
    preset?: string | null;
    metadata?: Record<string, any>;
  },
) {
  return this.studioService.generate({
    userId: req.user.id || req.user.sub,
    role: req.user.role,
    module: body.module,
    moduleKey: body.moduleKey,
    prompt: body.prompt,
    petId: body.petId ?? null,
    originalPhotoUrl: body.originalPhotoUrl ?? null,
    tutorPhotoUrl: body.tutorPhotoUrl ?? null,
    sourceImageUrls: body.sourceImageUrls ?? [],
    preset: body.preset ?? null,
    metadata: body.metadata ?? {},
  });
}
  @Get('creations')
  async getCreations(@Req() req: any) {
    return this.studioService.findAllByUser(req.user.id || req.user.sub);
  }

  @Get('creations/:id')
  async getCreation(@Req() req: any, @Param('id') id: string) {
    return this.studioService.findOneById(req.user.id || req.user.sub, id);
  }

  @Post('creations/:id/attach-to-pet')
  async attachToPet(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { petId: string },
  ) {
    return this.studioService.attachCreationToPetGallery({
      userId: req.user.id || req.user.sub,
      studioCreationId: id,
      petId: body.petId,
    });
  }

  @Post('creations/:id/mark-published')
  async markPublished(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { socialPostId: string },
  ) {
    return this.studioService.markPublished({
      userId: req.user.id || req.user.sub,
      studioCreationId: id,
      socialPostId: body.socialPostId,
    });
  }
}