import { Controller, Get, Post, Param, Req } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtUser } from '../authen/auth.service';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}
  @Post(':postId')
  likePost(@Req() req: { user: JwtUser }, @Param('postId') postId: string) {
    const userId = req.user._id;
    return this.likesService.toggleLike(userId, postId);
  }

  @Get(':postId')
  getUsersLiked(@Param('postId') postId: string) {
    return this.likesService.getLikes(postId);
  }
}
