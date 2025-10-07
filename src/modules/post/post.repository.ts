import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Post } from './entities/post.schema';
import { postInterface } from './post.service';
import { User } from '../users/entities/user.schema';
import { UsersService } from '../users/users.service';
import dayjs from 'dayjs';

@Injectable()
export class PostRepository {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    private readonly userService: UsersService,
  ) {}

  async GetPost(id: string) {
    const post = await this.postModel.findOne({ _id: id, isDeleted: false });
    if (!post) throw new NotFoundException('Post not found');
    return await this.postModel.aggregate<postInterface>([
      { $match: { _id: new mongoose.Types.ObjectId(id), isDeleted: false } },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments',
          pipeline: [
            { $limit: 2 },
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
                auth: '$userInfo.name',
                content: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          author: 1,
          totalLike: 1,
          recentComment: '$comments',
        },
      },
    ]);
  }

  // get my posts
  async meFindAll(_id: string, page: number) {
    const user = await this.userService.findOne(_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const limit = 10;
    const skip = (page - 1) * limit;

    return await this.postModel.aggregate<postInterface>([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user._id),
          isDeleted: false,
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      { $skip: skip },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments',
          pipeline: [
            { $limit: 2 },
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
                auth: '$userInfo.name',
                content: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          postId: 1,
          title: 1,
          content: 1,
          totalLike: 1,
          recentComment: '$comments',
        },
      },
    ]);
  }

  async getAllSoftDelete(page: number) {
    const limit = 10;
    const skip = (page - 1) * limit;
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: true } },
      { $sort: { deletedAt: -1 } },
      { $limit: limit },
      { $skip: skip },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments',
          pipeline: [
            { $limit: 2 },
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
                auth: '$userInfo.name',
                content: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          author: 1,
          totalLike: 1,
          recentComment: '$comments',
        },
      },
    ]);

    return posts;
  }

  async newFeed(mode: 'day' | 'week' | 'month', page: number ) {
    let startDate: Date;
    let label = '';
    const limit = 10;
    const skip = (page - 1) * limit;

    if (mode === 'day') {
      startDate = dayjs().startOf('day').toDate();
      label = 'day';
    } else if (mode === 'week') {
      startDate = dayjs().startOf('week').toDate();
      label = 'week';
    } else {
      startDate = dayjs().startOf('month').toDate();
      label = 'month';
    }

    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: false } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes',
        },
      },

      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments',
          pipeline: [
            { $sort: { createdAt: -1 } },
            { $limit: 2 },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userInfo',
              },
            },
            {
              $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                auth: '$userInfo.name',
              },
            },
          ],
        },
      },

      {
        $addFields: {
          likes: {
            $filter: {
              input: '$likes',
              as: 'like',
              cond: { $gte: ['$$like.createdAt', startDate] },
            },
          },
        },
      },
      {
        $addFields: {
          comments: {
            $filter: {
              input: '$comments',
              as: 'comment',
              cond: { $gte: ['$$comment.createdAt', startDate] },
            },
          },
        },
      },
      {
        $addFields: {
          likeCount: { $size: '$likes' },
          commentCount: { $size: '$comments' },
        },
      },
      {
        $addFields: {
          mostInteraction: {
            $add: ['$likeCount', '$commentCount'],
          },
        },
      },

      { $sort: { mostInteraction: -1 } },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          author: 1,
          likeCount: '$likeCount',
          comments: '$commentCount',
          recentComments: '$comments',
        },
      },
    ]);

    return { message: `newfeed get by ${label}`, posts };
  }

  async getLatest(page: number ) {
    const limit = 10;
    const skip = (page - 1) * limit;
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: false } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      { $skip: skip },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments',
          pipeline: [
            { $limit: 2 },
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
                auth: '$userInfo.name',
                content: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          author: 1,
          createdAt: 1,
          recentComment: '$comments',
          totalLike: 1,
        },
      },
    ]);

    return posts.map((e) => ({
      ...e,
      createdAt: dayjs(e.createdAt).format('DD/MM/YYYY HH:mm:ss'),
    }));
  }

  async getMostLikedPost(page: number) {
    const limit = 10;
    const skip = (page - 1) * limit;
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: false } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments',
          pipeline: [
            { $limit: 2 },
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
                auth: '$userInfo.name',
                content: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },

      { $sort: { totalLike: -1 } },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          author: 1,
          totalLike: 1,
          recentComent: '$comments',
        },
      },
    ]);

    return posts.map((e) => ({
      ...e,
      createdAt: dayjs(e.createdAt).format('DD/MM/YYYY HH:mm:ss'),
    }));
  }

  async getRecentInteractions(page: number) {
    const limit = 10;
    const skip = (page - 1) * limit;
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: false } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes',
        },
      },

      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments',
          pipeline: [
            { $limit: 2 },
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
                auth: '$userInfo.name',
                content: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },

      {
        $addFields: {
          lastLikeAt: { $max: '$likes.createdAt' },
          lastCommentAt: { $max: '$comments.createdAt' },
        }, // lấy ra thời gian lớn nhât (gần nhất)
      },

      {
        $addFields: {
          lastInteractionAt: {
            $max: ['$lastLikeAt', '$lastCommentAt'],
          },
        },
      },
      { $sort: { lastInteractionAt: -1 } },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          author: 1,
          time_recenInteraction: '$lastInteractionAt',
          totalLike: 1,
          recentComment: '$comments',
        },
      },
    ]);

    return posts.map((e) => ({
      ...e,
      time_recenInteraction: dayjs(e.time_recenInteraction).format(
        'DD/MM/YYYY HH:mm:ss',
      ),
    }));
  }

  async getMostInteractions(page: number) {
    const limit = 10;
    const skip = (page - 1) * limit;
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: false } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes',
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments',
          pipeline: [
            { $sort: { createdAt: -1 } },
            { $limit: 2 },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userInfo',
              },
            },
            {
              $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                auth: '$userInfo.name',
              },
            },
          ],
        },
      },

      {
        $addFields: {
          likeCount: { $size: '$likes' },
          commentCount: { $size: '$comments' },
        },
      },
      {
        $addFields: {
          mostInteractionAt: { $add: ['$likeCount', '$commentCount'] },
        },
      },

      { $sort: { mostInteractionAt: -1 } },
      {
        $project: {
          _id: 1,
          title: 1,
          author: 1,
          likes: '$likeCount',
          comments: '$commentCount',
          recentComment: '$comments',
        },
      },
    ]);

    return posts;
  }
}
