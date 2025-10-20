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
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { RolesGuard } from 'src/common/passport/role.guard';
import { Roles } from 'src/common/decorator/roleGuard';

@UseGuards(RolesGuard)
@Roles('ADMIN')
@Controller('comments')
export class AdminCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  //Admin

  @Delete(':id')
  removeCmt(@Param('id') id: string) {
    return this.commentsService.delete(id);
  }

  @Post('restore/:id')
  restore(@Param('id') id: string) {
    return this.commentsService.restore(id);
  }
}
