import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../post/entities/post.schema';
import mongoose, { Model, Mongoose } from 'mongoose';
import { Like } from './entities/like.schema';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Post.name) private readonly postModule: Model<Post>,
    @InjectModel(Like.name) private readonly likeModule: Model<Like>,
  ) {}
  async toggleLike(userId: string, postId: string) {
    const post = await this.postModule.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const existingLike = await this.likeModule.findOne({ userId, postId });
    if (existingLike) {
      await this.likeModule.deleteOne({ _id: existingLike._id });
      const totalLike = await this.likeModule.countDocuments({ postId });
      return { message: 'Unlike post successfully', totalLike };
    } else {
      await this.likeModule.create({ userId, postId });
      const totalLike = await this.likeModule.countDocuments({ postId });
      return { message: 'Like successfully', totalLike };
    }
  }

  async getLikes(postId: string) {
    const getUsersLiked = await this.likeModule.aggregate([
      {
        $match: { postId: new mongoose.Types.ObjectId(postId) },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $project: {
          id: '$userInfo._id',
          name: '$userInfo.name',
        },
      },
    ]);
    return { message: 'get users liked post successfully', getUsersLiked };
  }

  // user get post that user liked
  getLikedPosts(userId: string) {
    const posts = this.likeModule.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'posts',
          localField: 'postId',
          foreignField: '_id',
          as: 'posts',
          pipeline: [
            { $sort: { createdAt: -1 } },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userInfo',
              },
            },
            { $unwind: '$userInfo' },
            {
              $project: {
                _id: 1,
                title: 1,
                content: 1,
                auth: '$userInfo.name',
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
