import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtUser } from '../authen/auth.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('')
  create(@Body() createPostDto: CreatePostDto, @Req() req: { user: JwtUser }) {
    const _id = req.user._id;
    return this.postService.create(_id, createPostDto);
  }

  @Get('find/:id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  // Role User
  @Get('me')
  getAllPosts(@Req() req: { user: JwtUser }) {
    const _id = req.user._id;
    return this.postService.meFindAll(_id);
  }

  @Get('me/trash')
  getTrash(@Req() req: { user: JwtUser }) {
    const _id = req.user._id;
    return this.postService.getSoftDelete(_id);
  }

  @Patch('me/:id')
  updatePost(
    @Req() req: { user: JwtUser },
    @Body() postUpdate: UpdatePostDto,
    @Param('id') id: string,
  ) {
    const _id = req.user._id;
    return this.postService.update(_id, id, postUpdate);
  }

  @Delete('me/:id')
  deletePOst(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    const _id = req.user._id;
    return this.postService.softDelete(_id, id);
  }

  @Post('me/:id')
  restorePost(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    const userID = req.user._id;
    return this.postService.restore(userID, id);
  }

  // user get liked / commented post
  @Get('me/liked-posts')
  getPostLikedByMe(@Req() req: { user: JwtUser }) {
    return this.postService.getPostLiked(req.user._id);
  }
  @Get('me/commented-posts')
  getPostCommentedByMe(@Req() req: { user: JwtUser }) {
    return this.postService.getPostCommented(req.user._id);
  }
}
