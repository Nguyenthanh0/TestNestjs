import { forwardRef, Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PostModule } from '../post/post.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './entities/comment.schema';
import { UsersModule } from '../users/users.module';
import { AdminCommentsController } from './admin.controller';
import { CommentRepository } from './comments.repository';

@Module({
  exports: [CommentsService, MongooseModule],
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => PostModule),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
  ],
  controllers: [CommentsController, AdminCommentsController],
  providers: [CommentsService, CommentRepository],
})
export class CommentsModule {}
