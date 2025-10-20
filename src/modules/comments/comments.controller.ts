import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtUser } from '../authen/auth.service';
import { RolesGuard } from 'src/common/passport/role.guard';
import { Roles } from 'src/common/decorator/roleGuard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  //tạo cmt
  @Post(':postId')
  create(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: { user: JwtUser },
    @Param('postId') postId: string,
  ) {
    const userId = req.user._id;
    return this.commentsService.create(userId, postId, createCommentDto);
  }

  // get comments theo bài post
  @Get(':id')
  findAllCommnetsOfPost(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.commentsService.findByPost(id, page, limit);
  }

  @Delete('user/:id')
  remove(@Param('id') id: string, @Req() req: { user: JwtUser }) {
    const userId = req.user._id;
    return this.commentsService.remove(userId, id);
  }
}
