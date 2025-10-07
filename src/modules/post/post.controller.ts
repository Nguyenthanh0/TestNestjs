import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
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
  getPost(@Param('id') id: string) {
    return this.postService.getPost(id);
  }

  // Role User
  @Get('user')
  getAllPosts(@Req() req: { user: JwtUser }, @Query('page') page: number) {
    const _id = req.user._id;
    return this.postService.meFindAll(_id, page);
  }

  @Get('user/trash')
  getTrash(@Req() req: { user: JwtUser }) {
    const _id = req.user._id;
    return this.postService.getSoftDelete(_id);
  }

  @Patch('user/:id')
  updatePost(
    @Req() req: { user: JwtUser },
    @Body() postUpdate: UpdatePostDto,
    @Param('id') id: string,
  ) {
    const _id = req.user._id;
    return this.postService.update(_id, id, postUpdate);
  }

  @Delete('user/:id')
  deletePOst(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    const _id = req.user._id;
    return this.postService.softDelete(_id, id);
  }

  @Post('user/:id')
  restorePost(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    const userID = req.user._id;
    return this.postService.restore(userID, id);
  }

  // user get liked / commented post
  @Get('user/liked-posts')
  getPostLikedByMe(@Req() req: { user: JwtUser }, @Query('page') page: number) {
    return this.postService.getPostLiked(req.user._id, page);
  }
  @Get('user/commented-posts')
  getPostCommentedByMe(
    @Req() req: { user: JwtUser },
    @Query('page') page: number,
  ) {
    return this.postService.getPostCommented(req.user._id, page);
  }
}
