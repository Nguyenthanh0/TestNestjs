import { forwardRef, Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { PostModule } from '../post/post.module';
import { Like, LikeSchema } from './entities/like.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { LikeRepository } from './like.repository';

@Module({
  exports: [LikesService, MongooseModule],
  imports: [
    forwardRef(() => PostModule),
    MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }]),
  ],
  controllers: [LikesController],
  providers: [LikesService, LikeRepository],
})
export class LikesModule {}
