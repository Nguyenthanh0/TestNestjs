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
  getLatest() {
    return this.postService.getLatest();
  }

  @Get('most-like')
  getMostLiked() {
    return this.postService.getMostLikedPost();
  }

  @Get('recent-interaction')
  getRecentInteraction() {
    return this.postService.getRecentInteractions();
  }

  @Get('most-interaction')
  getMostInteraction() {
    return this.postService.getMostInteractions();
  }

  @Get('')
  newfeed(@Query('mode') mode: Mode) {
    return this.postService.newFeed(mode);
  }
}
