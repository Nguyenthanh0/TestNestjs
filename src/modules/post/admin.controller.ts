import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { RolesGuard } from 'src/common/passport/role.guard';
import { Roles } from 'src/common/decorator/roleGuard';

@UseGuards(RolesGuard)
@Roles('ADMIN')
@Controller('post')
export class AdminPostController {
  constructor(private readonly postService: PostService) {}

  // @Get()
  // findAll() {
  //   return this.postService.findAll();
  // }

  @Delete(':postId')
  delete(@Param('postId') postId: string) {
    return this.postService.delete(postId);
  }

  @Get('soft-deleted')
  getAllSoftDeleted(@Query('page') page: number) {
    return this.postService.getAllSoftDelete(page);
  }
}
