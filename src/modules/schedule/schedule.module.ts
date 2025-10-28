import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PostCleanupService } from './post-clean.service';
import { PostModule } from '../post/post.module';

@Module({
  imports: [ScheduleModule.forRoot(), PostModule],
  providers: [PostCleanupService],
})
export class scheduleModule {}
