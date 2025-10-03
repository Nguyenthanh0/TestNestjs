import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { UsersModule } from '../users/users.module';
import { Post, PostSchema } from './entities/post.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminPostController } from './admin.controller';
import { NewFeedController } from './newfeed.controller';
import { LikesModule } from '../likes/likes.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    CommentsModule,
    UsersModule,
    LikesModule,
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  controllers: [PostController, AdminPostController, NewFeedController],
  providers: [PostService],
  exports: [PostService, MongooseModule],
})
export class PostModule {}
