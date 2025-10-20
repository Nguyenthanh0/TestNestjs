import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';

export enum Mode {
  day = 'day',
  week = 'week',
  month = 'month',
}

@Controller('newfeed')
export class NewFeedController {
  constructor(private readonly postService: PostService) {}

  // sort by new posts
  @Get('latest-posts')
  getLatest(@Query('page') page: number) {
    return this.postService.getLatest(page);
  }

  @Get('most-like')
  getMostLiked(@Query('page') page: number) {
    return this.postService.getMostLikedPost(page);
  }

  @Get('recent-interaction')
  getRecentInteraction(@Query('page') page: number) {
    return this.postService.getRecentInteractions(page);
  }

  @Get('most-interaction')
  getMostInteraction(@Query('page') page: number) {
    return this.postService.getMostInteractions(page);
  }

  @Get('')
  newfeed(@Query('mode') mode: Mode, @Query('page') page: number) {
    return this.postService.newFeed(mode, page);
  }
}
