import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../post/entities/post.schema';
import mongoose, { Model, Mongoose } from 'mongoose';
import { Like } from './entities/like.schema';
import { LikeRepository } from './like.repository';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { PostGateway } from '../WebSocket/post.gateway';
import { User } from '../users/entities/user.schema';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Post.name) private readonly postModule: Model<Post>,
    @InjectModel(Like.name) private readonly likeModule: Model<Like>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly likeRepo: LikeRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly postGateWay: PostGateway,
  ) {}

  //del cache khi like/unlike post
  private async clearLikedPostsCache(userId: string) {
    // const stores = (this.cacheManager as unknown as { stores?: RedisStore[] })
    //   .stores;
    // const store = stores?.[0];

    const pattern1 = `melikedposts_${userId}_page_1`;
    await this.cacheManager.del(pattern1);
  }

  async toggleLike(userId: string, postId: string) {
    const post = await this.postModule.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const existingLike = await this.likeModule.findOne({ userId, postId });
    if (existingLike) {
      await this.likeModule.deleteOne({ _id: existingLike._id });
      const totalLike = await this.likeModule.countDocuments({ postId });
      post.totalLike = totalLike;
      await post.save();
      // del cache
      await this.clearLikedPostsCache(userId);
      return { message: 'Unlike post successfully', totalLike };
    } else {
      await this.likeModule.create({ userId, postId });
      const totalLike = await this.likeModule.countDocuments({ postId });
      post.totalLike = totalLike;
      await post.save();
      // del cache
      await this.clearLikedPostsCache(userId);
      const user = await this.userModel.findById(userId);
      await this.postGateWay.notifyWhenUserLikePost(post.userId.toString(), {
        title: post.title,
        postId,
        username: user?.name,
        userId,
      });

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
  async getLikedPosts(userId: string, page: number) {
    const limit = 10;
    const totalPosts = await this.likeModule.countDocuments({ userId: userId });
    const totalPage = Math.ceil(totalPosts / limit);
    const posts = await this.likeRepo.getLikedPosts(userId, page);
    return {
      message: 'get posts liked by me successfully',
      currentPage: page,
      totalPage,
      totalPosts,
      posts,
    };
  }
}
