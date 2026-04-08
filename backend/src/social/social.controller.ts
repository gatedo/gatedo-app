import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('posts')
  getPosts(@Req() req: any, @Query() query: any) {
    return this.socialService.getPosts(req.user, query);
  }

  @Get('posts/pet/:petId')
  getPetPosts(@Req() req: any, @Param('petId') petId: string) {
    return this.socialService.getPetPosts(req.user, petId);
  }

  @Get('posts/:postId/comments')
  getPostComments(@Req() req: any, @Param('postId') postId: string) {
    return this.socialService.getPostComments(req.user, postId);
  }

  @Post('posts/:postId/comments')
  addComment(@Req() req: any, @Param('postId') postId: string, @Body() body: any) {
    return this.socialService.addComment(req.user, postId, body);
  }

  @Get('pets/:petId/profile')
  getPetProfile(@Req() req: any, @Param('petId') petId: string) {
    return this.socialService.getPetProfile(req.user, petId);
  }

  @Get('pets/:petId/assets')
  getPetAssets(@Req() req: any, @Param('petId') petId: string) {
    return this.socialService.getPetAssets(req.user, petId);
  }

  @Post('posts')
  createPost(@Req() req: any, @Body() body: any) {
    console.log('SOCIAL AUTH HEADER =>', req.headers?.authorization);
    console.log('SOCIAL REQ USER =>', req.user);
    return this.socialService.createPost(req.user, body);
  }

  @Post('posts/:postId/like')
  likePost(@Req() req: any, @Param('postId') postId: string) {
    return this.socialService.likePost(req.user, postId);
  }

  @Delete('posts/:postId/like')
  unlikePost(@Req() req: any, @Param('postId') postId: string) {
    return this.socialService.unlikePost(req.user, postId);
  }

  @Post('posts/:postId/save')
  savePost(@Req() req: any, @Param('postId') postId: string) {
    return this.socialService.savePost(req.user, postId);
  }

  @Delete('posts/:postId/save')
  unsavePost(@Req() req: any, @Param('postId') postId: string) {
    return this.socialService.unsavePost(req.user, postId);
  }

  @Get('admin/users/search')
  searchUsers(@Req() req: any, @Query('q') q: string) {
    return this.socialService.searchUsers(req.user, q);
  }

  @Post('admin/balance/adjust')
  adjustBalance(@Req() req: any, @Body() body: any) {
    return this.socialService.adjustBalance(req.user, body);
  }
}