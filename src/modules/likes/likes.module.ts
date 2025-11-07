import { forwardRef, Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { PostModule } from '../post/post.module';
import { Like, LikeSchema } from './entities/like.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { LikeRepository } from './like.repository';
import { WebSocketModule } from '../WebSocket/websocket.module';
import { UsersModule } from '../users/users.module';

@Module({
  exports: [LikesService, MongooseModule],
  imports: [
    forwardRef(() => PostModule),
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }]),
    WebSocketModule,
  ],
  controllers: [LikesController],
  providers: [LikesService, LikeRepository],
})
export class LikesModule {}
