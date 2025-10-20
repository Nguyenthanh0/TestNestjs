import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../post/entities/post.schema';
import mongoose, { Model, Mongoose } from 'mongoose';
import { Like } from './entities/like.schema';
import { postInterface } from '../post/post.service';

@Injectable()
export class LikeRepository {
  constructor(
    @InjectModel(Like.name) private readonly likeModule: Model<Like>,
  ) {}

  // user get post that user liked
  getLikedPosts(userId: string, page: number) {
    const limit = 10;
    const skip = (page - 1) * limit;
    const posts = this.likeModule.aggregate<postInterface>([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $skip: skip },
      { $limit: limit },
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
      {
        $project: {
          createdAt: 1,
          post: '$posts',
        },
      },
    ]);
    return posts;
  }
}
