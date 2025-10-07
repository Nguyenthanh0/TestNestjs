import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../post/entities/post.schema';
import mongoose, { Model } from 'mongoose';
import { Comment } from './entities/comment.schema';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
  ) {}

  // get post that user commented
  async getCommentedPosts(userId: string, page: number) {
    const limit = 10;
    const skip = (page - 1) * limit;
    const posts = await this.commentModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'posts',
          localField: 'postId',
          foreignField: '_id',
          as: 'posts',
          pipeline: [
            { $match: { isDeleted: false } },

            {
              $project: {
                _id: 1,
                title: 1,
                content: 1,
                author: 1,
                totalLike: 1,
              },
            },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      { $limit: limit },
      { $skip: skip },
      {
        $project: {
          createdAt: 1,
          content: 1,
          posts: '$posts',
        },
      },
    ]);
    return { message: 'get posts that user commented successfully', posts };
  }
}
