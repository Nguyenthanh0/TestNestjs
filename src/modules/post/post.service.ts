import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Post } from './entities/post.schema';
import dayjs from 'dayjs';
import { LikesService } from '../likes/likes.service';
import { CommentsService } from '../comments/comments.service';

export interface postInterface {
  _id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  time_recenInteraction: Date;
}

@Injectable()
export class PostService {
  constructor(
    private readonly userService: UsersService,
    private readonly likeService: LikesService,
    private readonly commentService: CommentsService,
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) {}

  // tạo post
  async create(_id: string, createPostDto: CreatePostDto) {
    const user = await this.userService.findOne(_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const createPost = await this.postModel.create({
      ...createPostDto,
      userId: _id,
      createdAt: dayjs().toDate(),
    });

    return { message: 'create Post successfully', post: createPost };
  }

  //find one
  async findOne(id: string) {
    const post = await this.postModel.aggregate<postInterface>([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes',
        },
      },
      {
        $addFields: { likeCount: { $size: '$likes' } },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          auth: '$userInfo.name',
          likeCount: '$likeCount',
          recentComment: '$comments',
        },
      },
    ]);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  // get my posts
  async meFindAll(_id: string) {
    const user = await this.userService.findOne(_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const getMyPosts = await this.postModel.aggregate<postInterface>([
      { $match: { userId: new mongoose.Types.ObjectId(user._id) } },
      { $sort: { createdAt: -1 } },
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
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes',
        },
      },
      {
        $addFields: { likeCount: { $size: '$likes' } },
      },
      {
        $project: {
          postId: 1,
          title: 1,
          content: 1,
          likeCount: '$likeCount',
          recentComment: '$comments',
        },
      },
    ]);

    return { message: `all posts of ${user.name} `, getMyPosts };
  }

  // get posts is softDelete
  async getSoftDelete(_id: string) {
    const user = await this.userService.findOne(_id);
    if (!user) throw new NotFoundException('User not found');
    const posts = await this.postModel.find({
      userId: user._id,
      isDeleted: true,
    });
    return { message: 'get softDelete posts successfully ', posts };
  }

  async getAllSoftDelete() {
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: true } },
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
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes',
        },
      },
      {
        $addFields: { likeCount: { $size: '$likes' } },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          auth: '$userInfo.name',
          likeCount: '$likeCount',
          recentComment: '$comments',
        },
      },
    ]);
    return posts;
  }

  async findAll() {
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: false } },
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
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes',
        },
      },
      {
        $addFields: { likeCount: { $size: '$likes' } },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          auth: '$userInfo.name',
          likeCount: '$likeCount',
          recentComment: '$comments',
        },
      },
    ]);
    return posts;
  }

  // update post
  async update(_id: string, id: string, updatePostDto: UpdatePostDto) {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId.toString() !== _id) {
      throw new ForbiddenException('You can not edit this post');
    }
    Object.assign(post, updatePostDto);
    await post.save();
    return { message: 'update successfully', post };
  }

  // soft delete
  async softDelete(_id: string, id: string) {
    const user = await this.userService.findOne(_id);
    if (!user) throw new NotFoundException('User not found');
    await this.postModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deleteAt: new Date(),
    });

    return `soft delete post successfully`;
  }
  // restore post
  async restore(userId: string, postId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId.toString() !== userId)
      throw new ForbiddenException('You cant not restore this post');
    if (!post.isDeleted)
      throw new BadRequestException('This post is not in trash');
    await this.postModel.findByIdAndUpdate(postId, {
      isDeleted: false,
      deleteAt: null,
    });
    return { message: 'restore post successfully' };
  }

  // delete
  async delete(postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    await this.postModel.deleteOne({ _id: post._id });
    return {
      message: 'delete post successsully',
      post: post._id,
    };
  }

  // ------ sort posts ----- ///
  async newFeed(mode: 'day' | 'week' | 'month') {
    let startDate: Date;
    let label = '';

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
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo',
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
        $unwind: '$userInfo',
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
          auth: '$userInfo.name',
          likes: '$likeCount',
          comments: '$commentCount',
          recentComments: '$comments',
        },
      },
    ]);

    return { message: `newfeed get by ${label}`, posts };
  }
  async getLatest() {
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: false } },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
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
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes',
        },
      },
      {
        $addFields: { likeCount: { $size: '$likes' } },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          auth: '$userInfo.name',
          createdAt: 1,
          recentComment: '$comments',
          likes: '$likeCount',
        },
      },
    ]);

    return posts.map((e) => ({
      ...e,
      createdAt: dayjs(e.createdAt).format('DD/MM/YYYY HH:mm:ss'),
    }));
  }

  // post có nhiều like nhất
  async getMostLikedPost() {
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: false } },

      { $limit: 5 },
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
        $addFields: { likeCount: { $size: '$likes' } },
      },
      { $sort: { likeCount: -1 } },
      {
        $project: {
          _id: 1,
          title: 1,
          auth: '$userInfo.name',
          likes: '$likeCount',
          recentComent: '$comments',
        },
      },
    ]);

    return posts.map((e) => ({
      ...e,
      createdAt: dayjs(e.createdAt).format('DD/MM/YYYY HH:mm:ss'),
    }));
  }

  async getRecentInteractions() {
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: false } },

      { $limit: 5 },
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
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo',
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
        $unwind: '$userInfo',
      },
      {
        $addFields: { likeCount: { $size: '$likes' } },
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
          auth: '$userInfo.name',
          time_recenInteraction: '$lastInteractionAt',
          likes: '$likeCount',
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

  async getMostInteractions() {
    const posts = await this.postModel.aggregate<postInterface>([
      { $match: { isDeleted: false } },

      { $limit: 5 },
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
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo',
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
        $unwind: '$userInfo',
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
          auth: '$userInfo.name',
          likes: '$likeCount',
          comments: '$commentCount',
          recentComment: '$comments',
        },
      },
    ]);

    return posts;
  }

  // -----  user get posts that liked or commented
  async getPostLiked(userId: string) {
    return this.likeService.getLikedPosts(userId);
  }
  async getPostCommented(userId: string) {
    return this.commentService.getCommentedPosts(userId);
  }
}
