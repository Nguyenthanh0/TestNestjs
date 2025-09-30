import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { PostModule } from '../post/post.module';
import { PostService } from '../post/post.service';
import { Like, LikeSchema } from './entities/like.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    PostModule,
    MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }]),
  ],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
